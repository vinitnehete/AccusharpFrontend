// Mirrors backend PermissionSeeder.java's role -> permission grants by hand.
// Keep in sync the same way constants/enums.js already is. Only a fallback now:
// the server sends each session's real permissions (see resolvePermissions).

const HR_ADMIN_PERMISSIONS = [
  'COMPANY_READ',
  'DEPARTMENT_MANAGE', 'DEPARTMENT_READ',
  'DESIGNATION_MANAGE', 'DESIGNATION_READ',
  'CATEGORY_MANAGE', 'CATEGORY_READ',
  'EMPLOYMENT_TYPE_READ', 'EMPLOYMENT_TYPE_MANAGE',
  'EMPLOYEE_CREATE', 'EMPLOYEE_READ', 'EMPLOYEE_UPDATE', 'EMPLOYEE_DELETE',
  'CONTRACTOR_READ', 'CONTRACTOR_MANAGE',
  'SHIFT_MANAGE', 'SHIFT_READ',
  'SHIFT_SCHEDULE_MANAGE', 'SHIFT_SCHEDULE_READ',
  'ATTENDANCE_READ', 'ATTENDANCE_GENERATE', 'ATTENDANCE_CORRECT', 'ATTENDANCE_UNLOCK',
  'ATTENDANCE_RULE_READ', 'ATTENDANCE_RULE_MANAGE',
  'ATTENDANCE_POLICY_READ', 'ATTENDANCE_POLICY_MANAGE',
  'HOLIDAY_MANAGE', 'HOLIDAY_READ',
  'LEAVE_APPLY', 'LEAVE_READ', 'LEAVE_SUPERVISOR_APPROVE', 'LEAVE_APPROVE',
  'LEAVE_BALANCE_READ', 'LEAVE_BALANCE_MANAGE',
  'SALARY_RULE_READ', 'SALARY_RULE_MANAGE',
  'PAYROLL_PROCESS', 'PAYROLL_READ',
  'SALARY_SLIP_READ',
  'REPORT_READ',
  'DASHBOARD_READ',
];

export const ROLE_PERMISSIONS = {
  HR: HR_ADMIN_PERMISSIONS,
  ADMIN: [...HR_ADMIN_PERMISSIONS, 'AUDIT_READ', 'ROLE_MANAGE', 'ROLE_READ'],
  SUPERVISOR: [
    'COMPANY_READ',
    'DEPARTMENT_READ',
    'DESIGNATION_READ',
    'CATEGORY_READ',
    'EMPLOYEE_READ',
    // Read, not manage - a supervisor rosters and reviews the contractor
    // workers assigned to them, but onboarding a contractor is HR/ADMIN.
    'CONTRACTOR_READ',
    'SHIFT_READ',
    'SHIFT_SCHEDULE_MANAGE', 'SHIFT_SCHEDULE_READ',
    'ATTENDANCE_READ',
    'HOLIDAY_READ',
    'LEAVE_APPLY', 'LEAVE_READ',
    'LEAVE_SUPERVISOR_APPROVE',
    'LEAVE_BALANCE_READ',
    'PAYROLL_READ',
    'SALARY_SLIP_READ',
    'REPORT_READ',
    'DASHBOARD_READ',
  ],
  EMPLOYEE: [
    'COMPANY_READ',
    'DEPARTMENT_READ',
    'DESIGNATION_READ',
    'CATEGORY_READ',
    'EMPLOYEE_READ',
    'SHIFT_READ',
    'SHIFT_SCHEDULE_READ',
    'ATTENDANCE_READ',
    'HOLIDAY_READ',
    'LEAVE_APPLY', 'LEAVE_READ',
    'LEAVE_BALANCE_READ',
    'SALARY_SLIP_READ',
  ],
  PLATFORM_OWNER: ['COMPANY_CREATE', 'COMPANY_READ', 'COMPANY_UPDATE', 'COMPANY_DELETE', 'AUDIT_READ', 'AUDIT_MANAGE'],
  PLATFORM_ADMIN: ['COMPANY_CREATE', 'COMPANY_READ', 'COMPANY_UPDATE', 'COMPANY_DELETE', 'AUDIT_READ', 'AUDIT_MANAGE'],
};

// Every grantable code, in the same order as the backend's PermissionCode enum -
// used to render the custom-role permission checklist. Platform-only codes are
// listed separately so the UI can omit them (CustomRoleService.setPermissions
// rejects them outright).
export const PERMISSION_CODES = [
  'DEPARTMENT_MANAGE', 'DEPARTMENT_READ',
  'DESIGNATION_MANAGE', 'DESIGNATION_READ',
  'CATEGORY_MANAGE', 'CATEGORY_READ',
  'EMPLOYMENT_TYPE_READ', 'EMPLOYMENT_TYPE_MANAGE',
  'CONTRACTOR_READ', 'CONTRACTOR_MANAGE',
  'EMPLOYEE_CREATE', 'EMPLOYEE_READ', 'EMPLOYEE_UPDATE', 'EMPLOYEE_DELETE',
  'SHIFT_MANAGE', 'SHIFT_READ',
  'SHIFT_SCHEDULE_MANAGE', 'SHIFT_SCHEDULE_READ',
  'ATTENDANCE_READ', 'ATTENDANCE_GENERATE', 'ATTENDANCE_CORRECT', 'ATTENDANCE_UNLOCK',
  'ATTENDANCE_RULE_READ', 'ATTENDANCE_RULE_MANAGE',
  'ATTENDANCE_POLICY_READ', 'ATTENDANCE_POLICY_MANAGE',
  'HOLIDAY_MANAGE', 'HOLIDAY_READ',
  'LEAVE_APPLY', 'LEAVE_READ', 'LEAVE_SUPERVISOR_APPROVE', 'LEAVE_APPROVE',
  'LEAVE_BALANCE_READ', 'LEAVE_BALANCE_MANAGE',
  'SALARY_RULE_READ', 'SALARY_RULE_MANAGE',
  'PAYROLL_PROCESS', 'PAYROLL_READ',
  'SALARY_SLIP_READ',
  'REPORT_READ',
  'DASHBOARD_READ',
  'ROLE_MANAGE', 'ROLE_READ',
  'COMPANY_READ', 'AUDIT_READ',
];

// COMPANY_CREATE/UPDATE/DELETE and AUDIT_MANAGE are the only codes
// CustomRoleService.setPermissions rejects outright (see SECURITY.md Phase 10) -
// never offered in a custom role's permission checklist, mirroring that guard.
export const PLATFORM_ONLY_CODES = ['COMPANY_CREATE', 'COMPANY_UPDATE', 'COMPANY_DELETE', 'AUDIT_MANAGE'];

// The custom-role checklist (RoleDetail), grouped so it scans. Every code in
// PERMISSION_CODES appears exactly once (permissions.test.js holds this);
// platform-only codes are never offered.
export const PERMISSION_GROUPS = [
  { label: 'Company', codes: ['COMPANY_READ'] },
  { label: 'Department', codes: ['DEPARTMENT_MANAGE', 'DEPARTMENT_READ'] },
  { label: 'Designation', codes: ['DESIGNATION_MANAGE', 'DESIGNATION_READ'] },
  { label: 'Category', codes: ['CATEGORY_MANAGE', 'CATEGORY_READ'] },
  { label: 'Employment type', codes: ['EMPLOYMENT_TYPE_MANAGE', 'EMPLOYMENT_TYPE_READ'] },
  { label: 'Employee', codes: ['EMPLOYEE_CREATE', 'EMPLOYEE_READ', 'EMPLOYEE_UPDATE', 'EMPLOYEE_DELETE'] },
  { label: 'Contractor', codes: ['CONTRACTOR_MANAGE', 'CONTRACTOR_READ'] },
  { label: 'Shift', codes: ['SHIFT_MANAGE', 'SHIFT_READ'] },
  { label: 'Shift schedule', codes: ['SHIFT_SCHEDULE_MANAGE', 'SHIFT_SCHEDULE_READ'] },
  { label: 'Attendance', codes: ['ATTENDANCE_READ', 'ATTENDANCE_GENERATE', 'ATTENDANCE_CORRECT', 'ATTENDANCE_UNLOCK'] },
  { label: 'Attendance rule', codes: ['ATTENDANCE_RULE_MANAGE', 'ATTENDANCE_RULE_READ'] },
  { label: 'Attendance policy', codes: ['ATTENDANCE_POLICY_MANAGE', 'ATTENDANCE_POLICY_READ'] },
  { label: 'Holiday', codes: ['HOLIDAY_MANAGE', 'HOLIDAY_READ'] },
  { label: 'Leave', codes: ['LEAVE_APPLY', 'LEAVE_READ', 'LEAVE_SUPERVISOR_APPROVE', 'LEAVE_APPROVE'] },
  { label: 'Leave balance', codes: ['LEAVE_BALANCE_READ', 'LEAVE_BALANCE_MANAGE'] },
  { label: 'Salary rule', codes: ['SALARY_RULE_READ', 'SALARY_RULE_MANAGE'] },
  { label: 'Payroll', codes: ['PAYROLL_PROCESS', 'PAYROLL_READ'] },
  { label: 'Salary slip', codes: ['SALARY_SLIP_READ'] },
  { label: 'Reports & dashboard', codes: ['REPORT_READ', 'DASHBOARD_READ'] },
  { label: 'Custom roles', codes: ['ROLE_MANAGE', 'ROLE_READ'] },
  { label: 'Audit log', codes: ['AUDIT_READ'] },
];

// What a session may do: the list the server sent at login or refresh - the
// fixed role's grants plus any custom roles - or, from a server too old to send
// one, the fixed role's grants alone.
export const resolvePermissions = (session) =>
  Array.isArray(session?.permissions) ? session.permissions : ROLE_PERMISSIONS[session?.role] || [];
