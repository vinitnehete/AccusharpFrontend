import { blankForm, grantsFor, scopeFields, withLeaveType, withScope } from './leaveRuleForm';

describe('switching a leave rule form to another leave type', () => {
  it('clears the earned-leave carry-forward default when switching to casual or sick leave', () => {
    // A new rule opens on EL with "carry forward up to 30" filled in - the OSH
    // Code limit for EL. Kept on CL/SL, it would quietly let 30 days carry.
    ['CASUAL_LEAVE', 'SICK_LEAVE'].forEach((leaveType) => {
      expect(withLeaveType(blankForm(), leaveType).carryForwardCap).toBe('');
    });
  });

  it('keeps a carry-forward somebody typed in themselves', () => {
    const typed = { ...blankForm(), carryForwardCap: '45' };

    expect(withLeaveType(typed, 'CASUAL_LEAVE').carryForwardCap).toBe('45');
  });

  it('keeps the carry-forward when the type stays earned leave', () => {
    expect(withLeaveType(blankForm(), 'EARNED_LEAVE').carryForwardCap).toBe('30');
  });

  it('moves an earned-from-attendance grant to a yearly grant, which is all CL and SL allow', () => {
    const switched = withLeaveType(blankForm(), 'SICK_LEAVE');

    expect(switched.leaveType).toBe('SICK_LEAVE');
    expect(switched.grantMethod).toBe('YEARLY_GRANT');
  });

  it('keeps a grant the new type still allows', () => {
    const notEntitled = { ...blankForm(), leaveType: 'CASUAL_LEAVE', grantMethod: 'NOT_ENTITLED', carryForwardCap: '' };

    expect(withLeaveType(notEntitled, 'EARNED_LEAVE').grantMethod).toBe('NOT_ENTITLED');
  });
});

describe('who a leave rule applies to, and how it is given', () => {
  it('offers a monthly accrual for every paid leave type', () => {
    expect(grantsFor('CASUAL_LEAVE')).toContain('MONTHLY_ACCRUAL');
    expect(grantsFor('EARNED_LEAVE')).toContain('MONTHLY_ACCRUAL');
    // Only earned leave comes from attendance.
    expect(grantsFor('SICK_LEAVE')).not.toContain('EARNED_BY_ATTENDANCE');
  });

  it('clears what the old scope named when the population changes', () => {
    const forOneEmployee = withScope({ ...blankForm(), scope: 'EMPLOYEE', scopeRef: 'EMP007' }, 'CATEGORY');

    expect(forOneEmployee.scopeRef).toBe('');
  });

  it('defaults an employment-type rule to a real employment type', () => {
    expect(withScope(blankForm(), 'EMPLOYMENT_TYPE').scopeRef).toBe('PERMANENT');
  });

  it('opens with no monthly credit and no accrual cap - both are opt-in', () => {
    expect(blankForm().monthlyCredit).toBe('');
    expect(blankForm().yearlyAccrualCap).toBe('');
  });
});

describe('a new leave rule for several employees', () => {
  it('sends every picked employee when creating, so each gets their own rule', () => {
    const form = { ...blankForm(), scope: 'EMPLOYEE', scopeRefs: ['EMP007', 'EMP008'] };

    expect(scopeFields(form, true)).toEqual({ scope: 'EMPLOYEE', scopeRef: null, scopeRefs: ['EMP007', 'EMP008'] });
  });

  it('edits one rule for one employee, as before', () => {
    const form = { ...blankForm(), scope: 'EMPLOYEE', scopeRef: 'EMP007', scopeRefs: [] };

    expect(scopeFields(form, false)).toEqual({ scope: 'EMPLOYEE', scopeRef: 'EMP007' });
  });

  it('names any other population by its code, trimmed', () => {
    expect(scopeFields({ ...blankForm(), scope: 'CATEGORY', scopeRef: ' DIRECTOR ' }, true))
      .toEqual({ scope: 'CATEGORY', scopeRef: 'DIRECTOR' });
    expect(scopeFields(blankForm(), true)).toEqual({ scope: 'COMPANY', scopeRef: null });
  });

  it('clears the picked employees when the population changes', () => {
    expect(withScope({ ...blankForm(), scope: 'EMPLOYEE', scopeRefs: ['EMP007'] }, 'CATEGORY').scopeRefs).toEqual([]);
  });
});
