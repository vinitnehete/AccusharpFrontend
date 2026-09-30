import { ACCESS, isAllowed } from './access';
import { ROLE_PERMISSIONS } from './permissions';

const session = (role, extra = []) => ({ role, permissions: [...(ROLE_PERMISSIONS[role] || []), ...extra] });

describe('area access rules', () => {
  it('lets a permission-based area in on any one of its permissions, whatever the role', () => {
    expect(isAllowed(ACCESS.leaveApprovals, session('SUPERVISOR'))).toBe(true);
    expect(isAllowed(ACCESS.leaveApprovals, session('EMPLOYEE'))).toBe(false);
    expect(isAllowed(ACCESS.leaveApprovals, session('EMPLOYEE', ['LEAVE_APPROVE']))).toBe(true);
  });

  it('opens team screens on a scope, which a fixed role carries and a custom role can grant', () => {
    expect(isAllowed(ACCESS.team, session('SUPERVISOR'))).toBe(true);
    expect(isAllowed(ACCESS.team, session('HR'))).toBe(true);
    // A capability is not a scope: these say what may be done, not to whom.
    expect(isAllowed(ACCESS.team, session('EMPLOYEE', ['LEAVE_SUPERVISOR_APPROVE', 'SHIFT_SCHEDULE_MANAGE']))).toBe(false);
    // A director's scope, granted through a custom role.
    expect(isAllowed(ACCESS.team, session('EMPLOYEE', ['SCOPE_ALL_REPORTS']))).toBe(true);
  });

  it('opens the audit log to a platform owner, not only a company admin', () => {
    expect(isAllowed(ACCESS.auditLog, session('PLATFORM_OWNER'))).toBe(true);
    expect(isAllowed(ACCESS.auditLog, session('ADMIN'))).toBe(true);
    expect(isAllowed(ACCESS.auditLog, session('HR'))).toBe(false);
  });

  it('opens the Rules page to HR and admin, and to a custom role holding any one rule', () => {
    expect(isAllowed(ACCESS.rules, session('HR'))).toBe(true);
    expect(isAllowed(ACCESS.rules, session('ADMIN'))).toBe(true);
    expect(isAllowed(ACCESS.rules, session('SUPERVISOR'))).toBe(false);
    expect(isAllowed(ACCESS.rules, session('EMPLOYEE'))).toBe(false);
    expect(isAllowed(ACCESS.rules, session('EMPLOYEE', ['WORK_POLICY_READ']))).toBe(true);
  });

  it('lets nobody in without a session', () => {
    expect(isAllowed(ACCESS.reports, { role: null, permissions: [] })).toBe(false);
  });

  it("opens an employee's profile to their supervisor, but not the employee admin screens", () => {
    expect(isAllowed(ACCESS.employeeProfile, session('SUPERVISOR'))).toBe(true);
    expect(isAllowed(ACCESS.employeeProfile, session('HR'))).toBe(true);
    expect(isAllowed(ACCESS.employees, session('SUPERVISOR'))).toBe(false);
    expect(isAllowed(ACCESS.employeeProfile, session('EMPLOYEE'))).toBe(false);
  });
});
