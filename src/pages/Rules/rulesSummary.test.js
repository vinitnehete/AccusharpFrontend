import dayjs from 'dayjs';
import {
  inForce,
  summariseAttendanceRule,
  summariseHolidays,
  summariseLeaveRules,
  summariseSalaryRule,
} from './rulesSummary';

const salaryRule = {
  basicDaPercent: 50,
  basicDaMinimumThreshold: 0,
  hraPercent: 40,
  conveyancePercent: 10,
  educationPercent: 10,
  pfPercent: 12,
  esicPercent: 0.75,
  esicWageCeiling: 21000,
  ptUpperThreshold: 10001,
  ptUpperAmount: 200,
  ptLowerThreshold: 7501,
  ptLowerAmount: 175,
  dayWiseDaysInMonth: 26,
  standardHoursPerDay: 8,
  overtimeRateMultiplier: 1,
  mlwfAmount: 0,
};

const valueOf = (lines, label) => lines.find((line) => line.label === label)?.value;

describe('salary rule summary', () => {
  it('says in words how a gross salary is split and what comes off it', () => {
    const lines = summariseSalaryRule(salaryRule);

    expect(valueOf(lines, 'Basic + DA')).toBe('50% of gross');
    expect(valueOf(lines, 'Allowances')).toBe('HRA 40%, conveyance 10%, education 10% of basic');
    expect(valueOf(lines, 'PF and ESIC')).toBe('PF 12%; ESIC 0.75% while earned basic is up to ₹21,000');
    expect(valueOf(lines, 'Professional tax')).toBe('₹200 above ₹10,001; ₹175 from ₹7,501');
    expect(valueOf(lines, 'Overtime')).toBe('1× the hourly rate, 8 h a day');
    expect(valueOf(lines, 'Day-wise staff')).toBe('Paid over 26 days');
    expect(valueOf(lines, 'MLWF')).toBe('Off');
  });

  it('mentions the minimum wage floor and MLWF only when they are set', () => {
    const lines = summariseSalaryRule({ ...salaryRule, basicDaMinimumThreshold: 12000, mlwfAmount: 25 });

    expect(valueOf(lines, 'Basic + DA')).toBe('50% of gross, never below ₹12,000');
    expect(valueOf(lines, 'MLWF')).toBe('₹25 in June and December');
  });
});

describe('attendance rule summary', () => {
  it('says when a day is full, half or absent', () => {
    const lines = summariseAttendanceRule({
      entryWindowBufferMinutes: 60,
      fullDayThresholdPercent: 75,
      halfDayThresholdPercent: 40,
    });

    expect(valueOf(lines, 'Full day')).toBe('75% of the shift or more');
    expect(valueOf(lines, 'Half day')).toBe('40% to 75% of the shift');
    expect(valueOf(lines, 'Punch window')).toBe('Opens 60 min before the shift starts');
  });
});

describe('versioned rules in force', () => {
  const today = dayjs('2026-09-19');
  const chain = (rule) => `${rule.scope}|${rule.scopeRef}`;

  it('keeps the version of each rule that applies today, and only while it is on', () => {
    const rules = [
      { id: 1, scope: 'CATEGORY', scopeRef: 'DIRECTOR', version: 1, enabled: true, effectiveFrom: '2026-01-01' },
      { id: 2, scope: 'CATEGORY', scopeRef: 'DIRECTOR', version: 2, enabled: true, effectiveFrom: '2026-04-01' },
      { id: 3, scope: 'EMPLOYEE', scopeRef: 'EMP007', version: 1, enabled: true, effectiveFrom: '2026-01-01' },
      { id: 4, scope: 'EMPLOYEE', scopeRef: 'EMP007', version: 2, enabled: false, effectiveFrom: '2026-06-01' },
      { id: 5, scope: 'COMPANY', scopeRef: null, version: 1, enabled: true, effectiveFrom: '2026-12-01' },
    ];

    expect(inForce(rules, chain, today).map((rule) => rule.id)).toEqual([2]);
  });

  it('keeps applying the current version until a later one starts', () => {
    const rules = [
      { id: 6, scope: 'DEPARTMENT', scopeRef: 'PROD', version: 1, enabled: true, effectiveFrom: '2026-01-01' },
      { id: 7, scope: 'DEPARTMENT', scopeRef: 'PROD', version: 2, enabled: false, effectiveFrom: '2026-12-01' },
    ];

    expect(inForce(rules, chain, today).map((rule) => rule.id)).toEqual([6]);
  });

  it('copes with nothing configured', () => {
    expect(inForce([], chain, today)).toEqual([]);
    expect(inForce(undefined, chain, today)).toEqual([]);
  });
});

describe('leave rules summary', () => {
  it('falls back to the built-in quotas when no rule is on', () => {
    expect(summariseLeaveRules([])).toEqual({
      configured: false,
      text: 'No rules yet - everyone gets CL 12 and SL 8 a year, and earns no EL',
    });
    expect(summariseLeaveRules([{ enabled: false, leaveType: 'CASUAL_LEAVE' }]).configured).toBe(false);
  });

  it('counts the rules that are on, by leave type', () => {
    const rules = [
      { enabled: true, leaveType: 'CASUAL_LEAVE' },
      { enabled: true, leaveType: 'EARNED_LEAVE' },
      { enabled: true, leaveType: 'EARNED_LEAVE' },
      { enabled: false, leaveType: 'SICK_LEAVE' },
    ];

    expect(summariseLeaveRules(rules)).toEqual({
      configured: true,
      text: '3 rules on: Casual Leave 1, Earned Leave 2',
    });
  });
});

describe('holiday summary', () => {
  const today = dayjs('2026-09-19');

  it('counts the year and names the next one', () => {
    const holidays = [
      { holidayName: 'Republic Day', holidayDate: '2026-01-26', optionalHoliday: false },
      { holidayName: 'Diwali', holidayDate: '2026-11-08', optionalHoliday: false },
      { holidayName: 'Gandhi Jayanti', holidayDate: '2026-10-02', optionalHoliday: false },
      { holidayName: 'Onam', holidayDate: '2026-09-25', optionalHoliday: true },
    ];

    expect(summariseHolidays(holidays, today)).toEqual({
      configured: true,
      text: '3 mandatory and 1 optional this year',
      next: 'Next: Onam, 25 Sep (optional)',
    });
  });

  it('warns when the calendar is empty', () => {
    expect(summariseHolidays([], today)).toEqual({
      configured: false,
      text: 'No holidays for 2026 - every rostered day is a working day',
      next: null,
    });
  });
});
