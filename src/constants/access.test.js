import { ACCESS, isAllowed } from './access';
import { ROLE_PERMISSIONS } from './permissions';

const session = (role, extra = []) => ({ role, permissions: [...(ROLE_PERMISSIONS[role] || []), ...extra] });

describe('area access rules', () => {
  it('lets a permission-based area in on any one of its permissions, whatever the role', () => {
    expect(isAllowed(ACCESS.leaveApprovals, session('SUPERVISOR'))).toBe(true);
    expect(isAllowed(ACCESS.leaveApprovals, session('EMPLOYEE'))).toBe(false);
    expect(isAllowed(ACCESS.leaveApprovals, session('EMPLOYEE', ['LEAVE_APPROVE']))).toBe(true);
  });

  it('keeps team access with the fixed role, whatever a custom role adds', () => {
    expect(isAllowed(ACCESS.team, session('SUPERVISOR'))).toBe(true);
    expect(isAllowed(ACCESS.team, session('HR'))).toBe(true);
    expect(isAllowed(ACCESS.team, session('EMPLOYEE', ['LEAVE_SUPERVISOR_APPROVE', 'SHIFT_SCHEDULE_MANAGE']))).toBe(false);
  });

  it('opens the audit log to a platform owner, not only a company admin', () => {
    expect(isAllowed(ACCESS.auditLog, session('PLATFORM_OWNER'))).toBe(true);
    expect(isAllowed(ACCESS.auditLog, session('ADMIN'))).toBe(true);
    expect(isAllowed(ACCESS.auditLog, session('HR'))).toBe(false);
  });

  it('lets nobody in without a session', () => {
    expect(isAllowed(ACCESS.reports, { role: null, permissions: [] })).toBe(false);
  });
});
