import { blankForm, isValid, needsScopeRef, toPayload, withTracking } from './workPolicyForm';

describe('work policy form', () => {
  it('opens on the settings every employee is already on', () => {
    const form = blankForm();

    expect(form.scope).toBe('COMPANY');
    expect(form.attendanceTracking).toBe('TRACKED');
    expect(form.payrollMode).toBe('ATTENDANCE_BASED');
    expect(form.leaveApproval).toBe('SUPERVISOR_THEN_HR');
  });

  it('switches pay to fixed monthly when attendance stops being tracked', () => {
    // The server refuses NOT_TRACKED with ATTENDANCE_BASED - there would be no
    // attendance to pay from - so the form never offers that combination.
    const untracked = withTracking(blankForm(), 'NOT_TRACKED');

    expect(untracked.payrollMode).toBe('FIXED_MONTHLY');
  });

  it('leaves the pay mode alone when attendance is tracked again', () => {
    const tracked = withTracking(withTracking(blankForm(), 'NOT_TRACKED'), 'TRACKED');

    // Tracked and paid a fixed salary is a real combination: attendance is
    // recorded, it just does not decide the pay.
    expect(tracked.payrollMode).toBe('FIXED_MONTHLY');
  });

  it('knows which scopes name somebody', () => {
    expect(needsScopeRef('COMPANY')).toBe(false);
    expect(needsScopeRef('EMPLOYEE')).toBe(true);
    expect(needsScopeRef('CATEGORY')).toBe(true);
  });

  it('is invalid until the scope it names is filled in', () => {
    expect(isValid({ ...blankForm(), scope: 'EMPLOYEE', scopeRef: '' })).toBe(false);
    expect(isValid({ ...blankForm(), scope: 'EMPLOYEE', scopeRef: 'EMP007' })).toBe(true);
    expect(isValid(blankForm())).toBe(true);
    expect(isValid({ ...blankForm(), effectiveFrom: null })).toBe(false);
  });

  it('sends no scope reference for a company-wide policy', () => {
    const payload = toPayload(blankForm());

    expect(payload.scopeRef).toBeNull();
    expect(payload.effectiveFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(payload.enabled).toBe(true);
  });

  it('sends the named scope reference, trimmed', () => {
    const payload = toPayload({ ...blankForm(), scope: 'CATEGORY', scopeRef: ' DIRECTOR ' });

    expect(payload.scopeRef).toBe('DIRECTOR');
  });
});
