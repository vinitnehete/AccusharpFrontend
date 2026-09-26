import { ACCESS, isAllowed } from '../../constants/access';

// Every rule the company runs on, in the order a new company should set them
// up: pay first, then who is paid how, when people work, how a day is judged,
// who is outside the process, and finally leave. Each area opens the same
// screen it has always had - this list only gives them one home.
const AREAS = [
  {
    key: 'salary',
    label: 'Salary',
    path: '/rules/salary',
    access: ACCESS.salaryRule,
    question: 'How a gross salary is split, and what comes off it',
  },
  {
    key: 'employment-types',
    label: 'Employment types',
    path: '/rules/employment-types',
    access: ACCESS.employmentTypes,
    question: 'How each group is paid - per day attended, or a monthly salary less unpaid days',
  },
  {
    key: 'shifts',
    label: 'Shifts',
    path: '/rules/shifts',
    access: ACCESS.shifts,
    question: 'Shift timings, break, grace and how late an exit still counts',
  },
  {
    key: 'holidays',
    label: 'Holidays',
    path: '/rules/holidays',
    access: ACCESS.holidays,
    question: 'Days nobody is expected to work',
  },
  {
    key: 'attendance',
    label: 'Attendance thresholds',
    path: '/rules/attendance',
    access: ACCESS.attendanceRule,
    question: 'When worked time makes a full day, a half day or an absence',
  },
  {
    key: 'attendance-policy',
    label: 'Attendance policy',
    path: '/rules/attendance-policy',
    access: ACCESS.attendancePolicy,
    question: 'Late marks, short hours, missed punches and overtime - per group',
  },
  {
    key: 'work-policies',
    label: 'Work policies',
    path: '/rules/work-policies',
    access: ACCESS.workPolicies,
    question: 'Who is not tracked, who is paid a fixed salary, and who approves their leave',
  },
  {
    key: 'leave',
    label: 'Leave',
    path: '/rules/leave',
    access: ACCESS.leaveRules,
    question: 'Who gets which leave, how it accrues and what carries into next year',
  },
];

// The step number is the area's place in the setup order above.
export const RULE_AREAS = AREAS.map((area, index) => ({ ...area, step: index + 1 }));

/** The areas a session holding these permissions may open, in setup order. */
export const visibleRuleAreas = (permissions = []) =>
  RULE_AREAS.filter((area) => isAllowed(area.access, { permissions }));
