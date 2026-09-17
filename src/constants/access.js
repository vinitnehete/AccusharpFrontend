// Who may open each area of the app - read by the sidebar (navConfig) and the
// route guards (App.js) alike, so the two can never disagree.
//
// Almost every rule is "any one of these permissions", checked against the
// permission list the server sent at login - the fixed role's grants plus any
// custom roles - so a custom role opens exactly the screens its permissions
// allow. The one exception is team access, which stays with the fixed role:
// seeing a team comes from being a SUPERVISOR (or HR/ADMIN), not from a
// permission a custom role could hand to anyone.

const anyOf = (...permissions) => ({ permissions });

export const ACCESS = {
  dashboard: anyOf('DASHBOARD_READ'),
  team: { roles: ['SUPERVISOR', 'HR', 'ADMIN'] },
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
    'EMPLOYMENT_TYPE_READ', 'SALARY_RULE_READ', 'ATTENDANCE_RULE_READ'
  ),
  // Reports are scoped server-side: HR/ADMIN see the company, a supervisor their team.
  reports: anyOf('REPORT_READ'),
  roles: anyOf('ROLE_READ', 'ROLE_MANAGE'),
  auditLog: anyOf('AUDIT_READ'),
  platform: anyOf('COMPANY_CREATE'),
};

// No rule means open to every signed-in user.
export const isAllowed = (rule, { role, permissions = [] } = {}) => {
  if (!rule) return true;
  if (rule.roles) return !!role && rule.roles.includes(role);
  return rule.permissions.some((code) => permissions.includes(code));
};
