export const EMPLOYEE_STATUS = ['PERMANENT', 'DAY_WISE', 'CONTRACT', 'INTERN'];

export const GENDER = ['MALE', 'FEMALE'];

export const ROLE = ['ADMIN', 'HR', 'SUPERVISOR', 'EMPLOYEE'];

export const RECORD_STATUS = ['ACTIVE', 'INACTIVE'];

export const LEAVE_TYPE = ['CASUAL_LEAVE', 'SICK_LEAVE', 'EARNED_LEAVE', 'LEAVE_WITHOUT_PAY'];

export const LEAVE_DURATION = ['FULL_DAY', 'FIRST_HALF', 'SECOND_HALF'];

export const LEAVE_STATUS = ['PENDING', 'SUPERVISOR_APPROVED', 'APPROVED', 'REJECTED', 'CANCELLED'];

export const ATTENDANCE_STATUS = [
  'PRESENT',
  'HALF_DAY',
  'ABSENT',
  'ON_LEAVE',
  'WEEKLY_OFF',
  'HOLIDAY',
  'INVALID_PUNCH',
];

// --- Employment types (backend `PayBasis` / `OvertimeBasis`) -----------------
// Mirrors the two enums the backend deliberately keeps closed: a company adds
// as many employment types as it likes, but each one picks one of these two
// ways of being paid and one of these two ways of earning overtime. See
// docs/design/dynamic-configuration.md section 5.
export const PAY_BASIS = ['PER_ATTENDED_DAY', 'PER_CALENDAR_DAY_LESS_LOP'];

export const OVERTIME_BASIS = ['PER_DAY_SHIFT_EXCESS', 'MONTHLY_TOTAL_HOURS'];

// Plain-English labels. `labelize` would render PER_CALENDAR_DAY_LESS_LOP as
// "Per calendar day less lop", which is accurate and says nothing to the
// payroll clerk who has to choose between the two.
export const PAY_BASIS_LABEL = {
  PER_ATTENDED_DAY: 'Paid per day attended',
  PER_CALENDAR_DAY_LESS_LOP: 'Monthly salary, less unpaid days',
};

export const PAY_BASIS_HELP = {
  PER_ATTENDED_DAY:
    'Paid only for the days actually worked, against a fixed monthly base (26 days by default). '
    + 'Being absent simply means not being paid for that day - there is no loss-of-pay deduction on top. '
    + 'This is how DAY_WISE workers are paid today.',
  PER_CALENDAR_DAY_LESS_LOP:
    'Paid the full month - weekly offs included - reduced only by the unpaid (LOP) days attendance found. '
    + 'This is how PERMANENT, CONTRACT and INTERN staff are paid today.',
};

export const OVERTIME_BASIS_LABEL = {
  PER_DAY_SHIFT_EXCESS: 'Extra hours beyond each day\'s shift',
  MONTHLY_TOTAL_HOURS: 'Extra hours beyond the month\'s expected total',
};

export const OVERTIME_BASIS_HELP = {
  PER_DAY_SHIFT_EXCESS:
    'Each day is measured against that day\'s own shift length, and the daily excesses are added up. '
    + 'What everyone except DAY_WISE uses today.',
  MONTHLY_TOTAL_HOURS:
    'The month\'s total hours are measured against one monthly expectation (days present x standard hours per day). '
    + 'Use this for day-wise workers, who have no fixed daily shift to measure against.',
};

export const PAYROLL_STATUS = ['GENERATED', 'SUPERSEDED'];

export const SALARY_REVISION_REASON = ['ANNUAL_INCREMENT', 'PROMOTION', 'MARKET_CORRECTION', 'OTHER'];

export const DAYS_OF_WEEK = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

export const labelize = (value) => {
  if (!value && value !== 0) return '';
  return String(value)
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
};

export const LEAVE_STATUS_COLOR = {
  PENDING: 'warning',
  SUPERVISOR_APPROVED: 'info',
  APPROVED: 'success',
  REJECTED: 'error',
  CANCELLED: 'default',
};

export const ATTENDANCE_STATUS_COLOR = {
  PRESENT: 'success',
  HALF_DAY: 'warning',
  ABSENT: 'error',
  ON_LEAVE: 'info',
  WEEKLY_OFF: 'default',
  HOLIDAY: 'default',
  INVALID_PUNCH: 'error',
};

export const RECORD_STATUS_COLOR = {
  ACTIVE: 'success',
  INACTIVE: 'default',
};

export const PAYROLL_STATUS_COLOR = {
  GENERATED: 'success',
  SUPERSEDED: 'default',
};

export const ROLE_COLOR = {
  ADMIN: 'error',
  HR: 'secondary',
  SUPERVISOR: 'info',
  EMPLOYEE: 'default',
};
