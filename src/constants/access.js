// Who may open each area of the app - read by the sidebar (navConfig) and the
// route guards (App.js) alike, so the two can never disagree.
//
// Every rule is "any one of these permissions", checked against the permission
// list the server sent at login - the fixed role's grants plus any custom roles
// - so a custom role opens exactly the screens its permissions allow. Team
// screens ask for a scope permission rather than a capability: reaching other
// people's records is SCOPE_DIRECT_REPORTS (a supervisor), SCOPE_ALL_REPORTS (a
// director, every team below them) or SCOPE_COMPANY (HR/ADMIN).

const anyOf = (...permissions) => ({ permissions });

export const ACCESS = {
  dashboard: anyOf('DASHBOARD_READ'),
  team: anyOf('SCOPE_DIRECT_REPORTS', 'SCOPE_ALL_REPORTS', 'SCOPE_COMPANY'),
  leaveApprovals: anyOf('LEAVE_SUPERVISOR_APPROVE', 'LEAVE_APPROVE'),
  leaveAll: anyOf('LEAVE_APPROVE'),
  leaveRules: anyOf('LEAVE_BALANCE_MANAGE'),
  leaveBulkImport: anyOf('LEAVE_APPROVE'),
  roster: anyOf('SHIFT_SCHEDULE_MANAGE'),
  contractors: anyOf('CONTRACTOR_READ', 'CONTRACTOR_MANAGE'),
  employees: anyOf('EMPLOYEE_CREATE', 'EMPLOYEE_UPDATE', 'EMPLOYEE_DELETE'),
  shifts: anyOf('SHIFT_MANAGE'),
  holidays: anyOf('HOLIDAY_MANAGE'),
  attendanceConsole: anyOf(
    'ATTENDANCE_GENERATE', 'ATTENDANCE_CORRECT', 'ATTENDANCE_UNLOCK',
    'ATTENDANCE_POLICY_READ', 'ATTENDANCE_POLICY_MANAGE'
  ),
  payroll: anyOf('PAYROLL_PROCESS'),
  salarySlips: anyOf('PAYROLL_PROCESS'),
  // The read codes here are the HR-only ones; supervisors and employees hold
  // DEPARTMENT_READ and friends just to label records, not to administer them.
  masters: anyOf(
    'DEPARTMENT_MANAGE', 'DESIGNATION_MANAGE', 'CATEGORY_MANAGE',
    'EMPLOYMENT_TYPE_READ', 'SALARY_RULE_READ', 'ATTENDANCE_RULE_READ', 'WORK_POLICY_READ'
  ),
  // One home for every rule the company runs on. Each tab on it has its own
  // rule below, so the page opens on any one of them and shows only those.
  salaryRule: anyOf('SALARY_RULE_READ'),
  attendanceRule: anyOf('ATTENDANCE_RULE_READ'),
  attendancePolicy: anyOf('ATTENDANCE_POLICY_READ', 'ATTENDANCE_POLICY_MANAGE'),
  workPolicies: anyOf('WORK_POLICY_READ'),
  employmentTypes: anyOf('EMPLOYMENT_TYPE_READ'),
  rules: anyOf(
    'SALARY_RULE_READ', 'EMPLOYMENT_TYPE_READ', 'SHIFT_MANAGE', 'HOLIDAY_MANAGE',
    'ATTENDANCE_RULE_READ', 'ATTENDANCE_POLICY_READ', 'ATTENDANCE_POLICY_MANAGE',
    'WORK_POLICY_READ', 'LEAVE_BALANCE_MANAGE'
  ),
  // Reports are scoped server-side: HR/ADMIN see the company, a supervisor their team.
  reports: anyOf('REPORT_READ'),
  roles: anyOf('ROLE_READ', 'ROLE_MANAGE'),
  auditLog: anyOf('AUDIT_READ'),
  platform: anyOf('COMPANY_CREATE'),
};

// No rule means open to every signed-in user.
export const isAllowed = (rule, { permissions = [] } = {}) =>
  !rule || rule.permissions.some((code) => permissions.includes(code));
