import { PERMISSION_CODES, PERMISSION_GROUPS, PLATFORM_ONLY_CODES } from './permissions';

// Mirrors com.accusharp.hrms.enums.PermissionCode. When a code is added there,
// add it here too - these tests then point at every list that still needs it.
const BACKEND_PERMISSION_CODES = [
  'COMPANY_CREATE', 'COMPANY_READ', 'COMPANY_UPDATE', 'COMPANY_DELETE',
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
  'AUDIT_READ', 'AUDIT_MANAGE',
  'ROLE_MANAGE', 'ROLE_READ',
  'SCOPE_DIRECT_REPORTS', 'SCOPE_ALL_REPORTS', 'SCOPE_COMPANY',
];

const sorted = (codes) => [...codes].sort();

describe('permission catalogue', () => {
  it('knows every permission code the backend grants', () => {
    expect(sorted([...PERMISSION_CODES, ...PLATFORM_ONLY_CODES])).toEqual(sorted(BACKEND_PERMISSION_CODES));
  });

  it('offers every grantable code in the custom-role checklist exactly once', () => {
    expect(sorted(PERMISSION_GROUPS.flatMap((group) => group.codes))).toEqual(sorted(PERMISSION_CODES));
  });

  it('never offers a platform-only code in the checklist', () => {
    const offered = PERMISSION_GROUPS.flatMap((group) => group.codes);
    PLATFORM_ONLY_CODES.forEach((code) => expect(offered).not.toContain(code));
  });
});
