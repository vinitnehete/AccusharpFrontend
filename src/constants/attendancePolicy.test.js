import { RULE_CATALOG, RULE_TYPES, describeRule, expandDraft, toParamsPayload, validateParams } from './attendancePolicy';

describe('the sandwich leave rule in the attendance policy catalog', () => {
  it('is offered as a monthly rule', () => {
    expect(RULE_TYPES).toContain('SANDWICH_LEAVE');
    expect(RULE_CATALOG.SANDWICH_LEAVE.evaluationScope).toBe('MONTH');
  });

  it('starts with the leave around the holiday unpaid too, and sends exactly the server field', () => {
    const { defaults } = RULE_CATALOG.SANDWICH_LEAVE;

    expect(validateParams('SANDWICH_LEAVE', defaults)).toBeNull();
    expect(toParamsPayload('SANDWICH_LEAVE', defaults)).toEqual({ adjacentLeaveUnpaid: true });
  });

  it('says in one sentence what it does, either way', () => {
    expect(describeRule('SANDWICH_LEAVE', '{"adjacentLeaveUnpaid":true}')).toMatch(/holiday .* leave next to it too/i);
    expect(describeRule('SANDWICH_LEAVE', '{"adjacentLeaveUnpaid":false}')).toMatch(/only the holiday/i);
  });
});

describe('one attendance rule for several employees', () => {
  it('tests the month with one rule per picked employee', () => {
    const draft = { scope: 'EMPLOYEE', scopeRef: null, scopeRefs: ['EMP1', 'EMP2'], ruleType: 'LATE_ARRIVAL' };

    expect(expandDraft(draft)).toEqual([
      { scope: 'EMPLOYEE', scopeRef: 'EMP1', ruleType: 'LATE_ARRIVAL' },
      { scope: 'EMPLOYEE', scopeRef: 'EMP2', ruleType: 'LATE_ARRIVAL' },
    ]);
  });

  it('leaves a rule for one population as it is', () => {
    const draft = { scope: 'CATEGORY', scopeRef: 'STAFF', ruleType: 'LATE_ARRIVAL' };

    expect(expandDraft(draft)).toEqual([draft]);
  });
});
