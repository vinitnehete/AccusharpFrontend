import { blankForm, withLeaveType } from './leaveRuleForm';

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
