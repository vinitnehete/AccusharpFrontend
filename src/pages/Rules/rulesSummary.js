import dayjs from 'dayjs';
import { labelize } from '../../constants/enums';

// Turns each rule the server returns into a few lines a person can read on the
// Rules overview - what the rule says today, without opening its screen.

const plain = (value) => String(Number(value));
const inr = (value) => `₹${Number(value).toLocaleString('en-IN')}`;

/** Each line is { label, value }. */
export const summariseSalaryRule = (rule) => [
  {
    label: 'Basic + DA',
    value: `${plain(rule.basicDaPercent)}% of gross${
      Number(rule.basicDaMinimumThreshold) > 0 ? `, never below ${inr(rule.basicDaMinimumThreshold)}` : ''
    }`,
  },
  {
    label: 'Allowances',
    value: `HRA ${plain(rule.hraPercent)}%, conveyance ${plain(rule.conveyancePercent)}%, education ${plain(
      rule.educationPercent
    )}% of basic`,
  },
  {
    label: 'PF and ESIC',
    value: `PF ${plain(rule.pfPercent)}%; ESIC ${plain(rule.esicPercent)}% while earned basic is up to ${inr(
      rule.esicWageCeiling
    )}`,
  },
  {
    // The server charges the upper amount strictly above its threshold and the
    // lower amount from its threshold - DeductionCalculationService.
    label: 'Professional tax',
    value: `${inr(rule.ptUpperAmount)} above ${inr(rule.ptUpperThreshold)}; ${inr(rule.ptLowerAmount)} from ${inr(
      rule.ptLowerThreshold
    )}`,
  },
  {
    label: 'Overtime',
    value: `${plain(rule.overtimeRateMultiplier)}× the hourly rate, ${plain(rule.standardHoursPerDay)} h a day`,
  },
  { label: 'Day-wise staff', value: `Paid over ${rule.dayWiseDaysInMonth} days` },
  {
    label: 'MLWF',
    value: Number(rule.mlwfAmount) > 0 ? `${inr(rule.mlwfAmount)} in June and December` : 'Off',
  },
];

export const summariseAttendanceRule = (rule) => [
  { label: 'Full day', value: `${plain(rule.fullDayThresholdPercent)}% of the shift or more` },
  {
    label: 'Half day',
    value: `${plain(rule.halfDayThresholdPercent)}% to ${plain(rule.fullDayThresholdPercent)}% of the shift`,
  },
  { label: 'Punch window', value: `Opens ${rule.entryWindowBufferMinutes} min before the shift starts` },
];

/**
 * The rules actually in force today, for the engines that keep every version
 * (attendance policy, work policies). Within one rule - one `chainOf` key -
 * the version with the latest start on or before today applies, the higher
 * version breaking a tie, exactly as the server resolves it. A rule whose
 * applying version is switched off is not in force.
 */
export const inForce = (rules, chainOf, today = dayjs()) => {
  const applying = new Map();
  (rules || [])
    .filter((rule) => !dayjs(rule.effectiveFrom).isAfter(today, 'day'))
    .forEach((rule) => {
      const key = chainOf(rule);
      const current = applying.get(key);
      const later =
        !current
        || dayjs(rule.effectiveFrom).isAfter(current.effectiveFrom, 'day')
        || (dayjs(rule.effectiveFrom).isSame(current.effectiveFrom, 'day') && rule.version > current.version);
      if (later) applying.set(key, rule);
    });
  return [...applying.values()].filter((rule) => rule.enabled);
};

/** Leave rules are edited in place, so "on" is the whole story. */
export const summariseLeaveRules = (rules) => {
  const on = (rules || []).filter((rule) => rule.enabled);
  if (on.length === 0) {
    return {
      configured: false,
      text: 'No rules yet - everyone gets CL 12 and SL 8 a year, and earns no EL',
    };
  }
  const byType = on.reduce((counts, rule) => ({ ...counts, [rule.leaveType]: (counts[rule.leaveType] || 0) + 1 }), {});
  const parts = Object.entries(byType).map(([type, count]) => `${labelize(type)} ${count}`);
  return { configured: true, text: `${on.length} rule${on.length === 1 ? '' : 's'} on: ${parts.join(', ')}` };
};

/** `holidays` is this calendar year's list. */
export const summariseHolidays = (holidays, today = dayjs()) => {
  const list = holidays || [];
  if (list.length === 0) {
    return {
      configured: false,
      text: `No holidays for ${today.year()} - every rostered day is a working day`,
      next: null,
    };
  }
  const optional = list.filter((h) => h.optionalHoliday).length;
  const mandatory = list.length - optional;
  const upcoming = [...list]
    .filter((h) => !dayjs(h.holidayDate).isBefore(today, 'day'))
    .sort((a, b) => dayjs(a.holidayDate).diff(dayjs(b.holidayDate)))[0];
  return {
    configured: true,
    text: `${mandatory} mandatory and ${optional} optional this year`,
    next: upcoming
      ? `Next: ${upcoming.holidayName}, ${dayjs(upcoming.holidayDate).format('D MMM')}${
        upcoming.optionalHoliday ? ' (optional)' : ''}`
      : null,
  };
};
