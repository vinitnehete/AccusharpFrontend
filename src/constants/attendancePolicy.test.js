import { RULE_CATALOG, RULE_TYPES, describeRule, toParamsPayload, validateParams } from './attendancePolicy';

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
