// The attendance policy catalog, mirrored for the UI.
//
// The backend keeps this list closed on purpose (see `RuleType` and
// docs/design/attendance-policy-engine.md): a rule is a named type with a small,
// typed, validated parameter set - never a formula in a database column -
// because attendance policy decides salary and a formula cannot be tested,
// migrated, or explained back to an employee disputing a deduction.
//
// This file is the human half of that contract. Every bound below matches a
// bean-validation annotation in `AttendancePolicyParams`, so a form built from
// it cannot compose a rule the server will reject on a technicality. What it
// adds is the part the enum cannot carry: what each rule means in a sentence,
// what it costs somebody when it fires, and which ones are worth a second look
// before saving.

// Declaration order is the backend's evaluation order within a day, and is
// meaningful - MISSING_PUNCH works on the one-punch branch the others never
// see; SHORT_HOURS runs before LATE_ARRIVAL because lateness modifies a status
// that hours have already decided. Listing them in the same order keeps the
// screen and the engine telling the same story.
export const RULE_TYPES = [
  'MISSING_PUNCH',
  'SHORT_HOURS',
  'LATE_ARRIVAL',
  'DAY_OFF_WORK',
  'OVERTIME',
  'EARLY_EXIT_BUDGET',
  'LATE_MARK_ACCUMULATION',
];

// Who a rule applies to, most specific first. The order is the backend's
// `RuleScope` ordinal order, which *is* the precedence chain: the most specific
// rule that matches an employee wins outright, and scopes are never merged.
//
// GLOBAL is deliberately absent from this list. It exists on the backend as a
// hook for a future shared catalog that ships empty; a company creating one
// would only get a lowest-priority company rule under a confusing name.
export const RULE_SCOPES = [
  {
    value: 'EMPLOYEE',
    label: 'One employee',
    refLabel: 'Employee',
    refKind: 'EMPLOYEE',
    help: 'Applies to a single named person, and beats every other rule of the same type.',
  },
  {
    value: 'DESIGNATION',
    label: 'A designation',
    refLabel: 'Designation',
    refKind: 'DESIGNATION',
    help: 'Everyone holding this job title - Fitter, Team Lead, and so on.',
  },
  {
    value: 'CATEGORY',
    label: 'A category (grade)',
    refLabel: 'Category',
    refKind: 'CATEGORY',
    help: 'Everyone in this employee grade - Worker, Supervisor, Manager, Director.',
  },
  {
    value: 'DEPARTMENT',
    label: 'A department',
    refLabel: 'Department',
    refKind: 'DEPARTMENT',
    help: 'Everyone in this department.',
  },
  {
    value: 'EMPLOYMENT_TYPE',
    label: 'An employment status',
    refLabel: 'Employment status',
    refKind: 'EMPLOYEE_STATUS',
    // Worth being exact about: the backend validates this against the built-in
    // EmployeeStatus enum, not against the configurable Employment Types master.
    help: 'Everyone on this built-in status - Permanent, Day wise, Contract or Intern. '
      + 'This is the status on the employee record, not the Employment Type master under Masters.',
  },
  {
    value: 'COMPANY',
    label: 'Everyone in the company',
    refKind: 'NONE',
    help: 'The fallback for anyone no more specific rule covers.',
  },
];

export const SCOPE_LABEL = RULE_SCOPES.reduce((acc, s) => {
  acc[s.value] = s.label;
  return acc;
}, { GLOBAL: 'Shared catalog (all companies)' });

// The four statuses `EMPLOYMENT_TYPE` scope accepts - the backend's
// `EmployeeStatus`, which is what `assertScopeRefExists` checks against.
export const EMPLOYEE_STATUS_SCOPE_REFS = ['PERMANENT', 'DAY_WISE', 'CONTRACT', 'INTERN'];

const HALF_OR_ABSENT = [
  { value: 'HALF_DAY', label: 'Half day' },
  { value: 'ABSENT', label: 'Absent (a whole unpaid day)' },
];

// Every bound here matches an annotation in AttendancePolicyParams.
export const RULE_CATALOG = {
  MISSING_PUNCH: {
    label: 'Rescue a missed punch',
    evaluationScope: 'DAY',
    summary: 'Turns a day with only one punch into a half day instead of writing it off.',
    detail:
      'Today a day holding exactly one punch is marked Invalid punch, which pays nothing. '
      + 'With this rule, if that lone punch looks like an arrival - it is inside the shift start window - '
      + 'the day is worth what you set below instead. The day still shows as an invalid punch so you can '
      + 'chase the faulty device, but the employee is not left unpaid for a day they worked.',
    effect: 'Changes the day’s status. It does not credit any hours, because there is no evidence of hours worked.',
    defaults: { fallbackStatus: 'HALF_DAY', onTimeGraceMinutes: 30 },
    fields: [
      {
        name: 'fallbackStatus',
        label: 'The day is worth',
        type: 'choice',
        options: HALF_OR_ABSENT,
        help: 'A full day is not offered: one punch is no evidence the employee stayed.',
      },
      {
        name: 'onTimeGraceMinutes',
        label: 'Punch counts as an arrival if within',
        type: 'number',
        unit: 'minutes of shift start',
        min: 0,
        max: 720,
        help: 'A punch later than this is not treated as an arrival, and the day stays an invalid punch.',
      },
    ],
    describe: (p) =>
      `A single punch within ${p.onTimeGraceMinutes} min of shift start counts as ${
        p.fallbackStatus === 'HALF_DAY' ? 'a half day' : 'absent'}`,
  },

  SHORT_HOURS: {
    label: 'Full-day / half-day cut-offs',
    evaluationScope: 'DAY',
    summary: 'Sets how many hours earn a full day and a half day, for this group only.',
    detail:
      'Replaces the company-wide percentages under Masters → Attendance Rule for the people this rule '
      + 'covers. You can express the cut-offs as a share of the shift, or as plain minutes - '
      + '"under 4 hours is a half day" is not a percentage of anything, and would quietly mean different '
      + 'things on an 8-hour and a 12-hour shift.',
    effect: 'Changes the day’s status: worked time at or above the full cut-off is a full day, at or above the half cut-off is a half day, below that is absent.',
    defaults: { basis: 'PERCENT_OF_SHIFT', fullDayValue: '0.75', halfDayValue: '0.5' },
    fields: [
      {
        name: 'basis',
        label: 'Measure the cut-offs as',
        type: 'choice',
        options: [
          { value: 'PERCENT_OF_SHIFT', label: 'A share of the shift (0.75 = 75%)' },
          { value: 'ABSOLUTE_MINUTES', label: 'Plain minutes (240 = 4 hours)' },
        ],
      },
      {
        name: 'fullDayValue',
        label: 'Full day at or above',
        type: 'decimal',
        min: 0,
        help: 'On the share basis, 0.75 means 75% of the shift’s paid minutes.',
      },
      {
        name: 'halfDayValue',
        label: 'Half day at or above',
        type: 'decimal',
        min: 0,
        help: 'Must be lower than the full-day value, or the half day can never be reached.',
      },
    ],
    // The server binds and bounds each field but does not compare the two, so
    // this is checked here - an inverted pair makes the half-day branch
    // unreachable and silently marks short days absent.
    validate: (p) =>
      Number(p.halfDayValue) >= Number(p.fullDayValue)
        ? 'The half-day cut-off must be lower than the full-day cut-off, otherwise nobody can ever earn a half day.'
        : null,
    describe: (p) =>
      p.basis === 'ABSOLUTE_MINUTES'
        ? `Full day from ${p.fullDayValue} min worked, half day from ${p.halfDayValue} min`
        : `Full day from ${Math.round(Number(p.fullDayValue) * 100)}% of the shift, half day from ${
            Math.round(Number(p.halfDayValue) * 100)}%`,
  },

  LATE_ARRIVAL: {
    label: 'Late arrival penalty',
    evaluationScope: 'DAY',
    summary: 'Gives lateness a consequence - today it is recorded and then ignored.',
    detail:
      'Lateness is re-measured against the grace you set here rather than the grace on the shift, '
      + 'and a late day is downgraded. The grace is inclusive: arriving at exactly shift start plus the '
      + 'grace is not late. One minute later is.',
    effect: 'Changes the day’s status downward. It can only ever lower a day’s value, never raise it.',
    // The design document's single most damaging misconfiguration.
    danger: {
      when: (p) => p.penaltyStatus === 'ABSENT',
      text:
        'An Absent penalty turns everybody who arrives a minute late into a full unpaid day - on a day '
        + 'they worked in full. It is hard to spot afterwards, because an absent day looks exactly like a '
        + 'genuine absence in every report. Test it on a past month before saving, and prefer Half day '
        + 'unless somebody senior has decided otherwise.',
    },
    defaults: { graceMinutes: 15, penaltyStatus: 'HALF_DAY' },
    fields: [
      {
        name: 'graceMinutes',
        label: 'Grace before a day counts as late',
        type: 'number',
        unit: 'minutes',
        min: 0,
        max: 720,
        help: 'This replaces the shift’s own grace for these employees. The shift setting stops protecting them.',
      },
      {
        name: 'penaltyStatus',
        label: 'A late day becomes',
        type: 'choice',
        options: HALF_OR_ABSENT,
      },
    ],
    describe: (p) =>
      `More than ${p.graceMinutes} min late makes the day ${
        p.penaltyStatus === 'HALF_DAY' ? 'a half day' : 'absent'}`,
  },

  DAY_OFF_WORK: {
    label: 'Working a weekly off or holiday',
    evaluationScope: 'DAY',
    summary: 'Chooses what a worked day off earns: overtime pay, a compensatory-off credit, or a paid day.',
    detail:
      'Be aware of what the alternative is actually worth. Overtime on any day is only the excess over '
      + 'the shift’s paid hours, so a full 8-hour shift worked on a Sunday books about five minutes of '
      + 'overtime today. A comp-off credit is not being traded against a day’s pay - it is being traded '
      + 'against those few minutes.',
    effect:
      'Where you pick comp-off, the day’s overtime is zeroed and a comp-off credit is recorded on the '
      + 'monthly summary instead. Where you pick a paid day, the day counts toward present days but never '
      + 'toward working days - a day-wise worker is paid for it, and anyone else has an absence offset.',
    note:
      'Comp-off is recorded, not yet bookable: there is no comp-off leave type to accrue into yet, so the '
      + 'credit shows on the monthly attendance summary for HR to act on.',
    defaults: {
      onWeeklyOff: 'COMP_OFF_CREDIT',
      onHoliday: 'COMP_OFF_CREDIT',
      fullCreditMinutes: 480,
      halfCreditMinutes: 240,
    },
    fields: [
      {
        name: 'onWeeklyOff',
        label: 'A worked weekly off earns',
        type: 'choice',
        options: [
          { value: 'OVERTIME_PAY', label: 'Overtime pay (today’s behaviour)' },
          { value: 'COMP_OFF_CREDIT', label: 'A compensatory-off credit' },
          { value: 'PAID_DAY', label: 'A paid day (counts toward present days)' },
        ],
      },
      {
        name: 'onHoliday',
        label: 'A worked holiday earns',
        type: 'choice',
        options: [
          { value: 'OVERTIME_PAY', label: 'Overtime pay (today’s behaviour)' },
          { value: 'COMP_OFF_CREDIT', label: 'A compensatory-off credit' },
          { value: 'PAID_DAY', label: 'A paid day (counts toward present days)' },
        ],
      },
      {
        name: 'fullCreditMinutes',
        label: 'A whole day’s credit needs',
        type: 'number',
        unit: 'minutes worked',
        min: 0,
      },
      {
        name: 'halfCreditMinutes',
        label: 'Half a day’s credit needs',
        type: 'number',
        unit: 'minutes worked',
        min: 0,
        help: 'Below this, nothing is credited.',
      },
    ],
    validate: (p) =>
      Number(p.halfCreditMinutes) > Number(p.fullCreditMinutes)
        ? 'Half a day’s credit cannot need more minutes than a whole one.'
        : null,
    describe: (p) => {
      const earns = (treatment) => ({
        COMP_OFF_CREDIT: 'comp-off',
        PAID_DAY: 'a paid day',
      }[treatment] || 'overtime pay');
      const credited = [p.onWeeklyOff, p.onHoliday].some((t) => t === 'COMP_OFF_CREDIT' || t === 'PAID_DAY');
      const tiers = credited
        ? ` (${p.fullCreditMinutes} min = 1 day, ${p.halfCreditMinutes} min = half a day)`
        : '';
      return `A worked weekly off earns ${earns(p.onWeeklyOff)}; a worked holiday earns ${
        earns(p.onHoliday)}${tiers}`;
    },
  },

  OVERTIME: {
    label: 'Overtime eligibility and rounding',
    evaluationScope: 'DAY',
    summary: 'Decides who earns overtime, after how long, and in what blocks.',
    detail:
      '"Overtime for workers only" is this rule twice: switched off for everyone at company level, '
      + 'and switched on for the category that gets it. Overtime money still additionally requires the '
      + '"Overtime eligible" tick on the employee record, so a rule can never grant overtime to someone '
      + 'the employee master says is not eligible.',
    effect: 'Adjusts the day’s overtime hours. It can only ever reduce the hours the punches earned, never add to them. No effect on the day’s status.',
    defaults: { payable: true, minimumMinutes: 30, roundingBlockMinutes: 30, rounding: 'DOWN' },
    fields: [
      {
        name: 'payable',
        label: 'These employees earn overtime',
        type: 'boolean',
        help: 'Switch off to zero the overtime hours of everyone this rule covers.',
      },
      {
        name: 'minimumMinutes',
        label: 'Ignore overtime below',
        type: 'number',
        unit: 'minutes',
        min: 0,
        max: 1440,
        dependsOn: 'payable',
      },
      {
        name: 'roundingBlockMinutes',
        label: 'Round overtime down to blocks of',
        type: 'number',
        unit: 'minutes',
        min: 1,
        max: 480,
        dependsOn: 'payable',
        help: 'Use 1 for no rounding. Rounding is always downward.',
      },
    ],
    describe: (p) =>
      p.payable
        ? `Overtime paid above ${p.minimumMinutes} min, rounded down to ${p.roundingBlockMinutes} min blocks`
        : 'No overtime for these employees',
  },

  EARLY_EXIT_BUDGET: {
    label: 'Monthly early-exit budget',
    evaluationScope: 'MONTH',
    summary: 'Allows a pool of early-leaving minutes each month, then charges per occurrence.',
    detail:
      'The budget is spent in date order. The early exit that uses up the last of the budget is still '
      + 'covered by it; the next one starts costing. The charge is per occurrence, not per minute - '
      + 'leaving five minutes early and ninety minutes early cost the same once the budget is gone.',
    effect: 'Adds unpaid (LOP) days to the monthly summary. No effect on any individual day’s status.',
    defaults: { monthlyBudgetMinutes: 60, penaltyDaysPerOccurrence: '0.5' },
    fields: [
      {
        name: 'monthlyBudgetMinutes',
        label: 'Early-exit minutes allowed per month',
        type: 'number',
        unit: 'minutes',
        min: 0,
        max: 100000,
      },
      {
        name: 'penaltyDaysPerOccurrence',
        label: 'Each early exit after that costs',
        type: 'decimal',
        unit: 'unpaid days',
        min: 0,
        max: 1,
        help: '0.5 is half a day. The most one occurrence can cost is 1 whole day.',
      },
    ],
    describe: (p) =>
      `${p.monthlyBudgetMinutes} min of early exits a month are free; each one after that costs ${
        p.penaltyDaysPerOccurrence} unpaid day(s)`,
  },

  LATE_MARK_ACCUMULATION: {
    label: 'Late marks add up',
    evaluationScope: 'MONTH',
    summary: 'Charges a fraction of a day for every Nth late mark in a month.',
    detail:
      'A day that a Late arrival rule has already downgraded is left out of the count, so nobody is '
      + 'charged twice for one late arrival: once as a half day on the day itself, and again as a mark '
      + 'towards this penalty.',
    effect: 'Adds unpaid (LOP) days to the monthly summary. No effect on any individual day’s status.',
    defaults: { minimumLateMinutes: 1, occurrencesPerPenalty: 3, penaltyLopDays: '0.5' },
    fields: [
      {
        name: 'minimumLateMinutes',
        label: 'A day scores a late mark from',
        type: 'number',
        unit: 'minutes late',
        min: 1,
        max: 1440,
        help: '1 means any lateness at all counts as a mark.',
      },
      {
        name: 'occurrencesPerPenalty',
        label: 'Charge once every',
        type: 'number',
        unit: 'late marks',
        min: 1,
        max: 365,
      },
      {
        name: 'penaltyLopDays',
        label: 'Each charge costs',
        type: 'decimal',
        unit: 'unpaid days',
        min: 0,
        max: 1,
      },
    ],
    describe: (p) =>
      `Every ${p.occurrencesPerPenalty} days late by ${p.minimumLateMinutes}+ min costs ${
        p.penaltyLopDays} unpaid day(s)`,
  },
};

export const ruleLabel = (ruleType) => RULE_CATALOG[ruleType]?.label || ruleType;

/** Fresh, valid parameters for a rule type - what the Add rule form starts from. */
export const defaultParamsFor = (ruleType) => ({ ...(RULE_CATALOG[ruleType]?.defaults || {}) });

/**
 * The stored `params` column comes back as the raw JSON string it was written
 * as. Parsing can only fail on a row somebody hand-edited in the database, and
 * a broken row must still render as a row rather than blanking the screen.
 */
export const parseParams = (params) => {
  if (!params) return {};
  if (typeof params === 'object') return params;
  try {
    return JSON.parse(params);
  } catch {
    return {};
  }
};

/** One plain sentence saying what a stored rule does. */
export const describeRule = (ruleType, params) => {
  const entry = RULE_CATALOG[ruleType];
  const parsed = parseParams(params);
  if (!entry || !Object.keys(parsed).length) return '';
  try {
    return entry.describe(parsed);
  } catch {
    return '';
  }
};

/**
 * Shapes a form's values into the JSON the server's typed record expects.
 *
 * Numbers must go over as numbers, not as the strings a text field produces -
 * Jackson binds `"15"` to an int fine but `""` fails the whole rule with a
 * message naming the class it was building. Fields the rule does not currently
 * need (an overtime block size while overtime is switched off) still go: the
 * record has them either way, and a missing one binds to 0, which is out of
 * bounds for `roundingBlockMinutes`.
 */
export const toParamsPayload = (ruleType, values) => {
  const entry = RULE_CATALOG[ruleType];
  const payload = {};
  entry.fields.forEach((field) => {
    const raw = values[field.name];
    if (field.type === 'boolean') {
      payload[field.name] = !!raw;
    } else if (field.type === 'number' || field.type === 'decimal') {
      payload[field.name] = Number(raw);
    } else {
      payload[field.name] = raw;
    }
  });
  // Only `DOWN` exists today, and the record requires it to be present.
  if (ruleType === 'OVERTIME') payload.rounding = 'DOWN';
  return payload;
};

/** Field-level bounds first, then the rule's own cross-field check. */
export const validateParams = (ruleType, values) => {
  const entry = RULE_CATALOG[ruleType];
  if (!entry) return 'Unknown rule type.';

  for (const field of entry.fields) {
    if (field.type === 'boolean') continue;
    if (field.dependsOn && !values[field.dependsOn]) continue;

    const raw = values[field.name];
    if (raw === '' || raw === null || raw === undefined) {
      return `${field.label} is required.`;
    }
    if (field.type === 'number' || field.type === 'decimal') {
      const num = Number(raw);
      if (Number.isNaN(num)) return `${field.label} must be a number.`;
      if (field.min !== undefined && num < field.min) {
        return `${field.label} cannot be below ${field.min}.`;
      }
      if (field.max !== undefined && num > field.max) {
        return `${field.label} cannot be above ${field.max}.`;
      }
      if (field.type === 'number' && !Number.isInteger(num)) {
        return `${field.label} must be a whole number.`;
      }
    }
  }

  return entry.validate ? entry.validate(values) : null;
};

/** The warning a rule shows while its parameters are in a shape worth a second look. */
export const dangerFor = (ruleType, values) => {
  const danger = RULE_CATALOG[ruleType]?.danger;
  return danger && danger.when(values) ? danger.text : null;
};

/**
 * Turns a stored rule back into the request shape, so the "test on a past
 * month" preview can be run over everything currently in force plus the draft.
 * The preview endpoint replaces the whole rule set rather than merging with what
 * is stored, so sending only the draft would answer a question nobody asked.
 */
export const toPreviewRule = (rule) => ({
  scope: rule.scope,
  scopeRef: rule.scopeRef,
  ruleType: rule.ruleType,
  effectiveFrom: rule.effectiveFrom,
  enabled: rule.enabled,
  params: parseParams(rule.params),
});
