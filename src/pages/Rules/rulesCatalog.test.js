import { RULE_AREAS, visibleRuleAreas } from './rulesCatalog';
import { ROLE_PERMISSIONS } from '../../constants/permissions';

const keys = (areas) => areas.map((area) => area.key);

describe('the rule areas the Rules page offers', () => {
  it('lists every area once, each on its own page under /rules', () => {
    const paths = RULE_AREAS.map((area) => area.path);

    expect(new Set(keys(RULE_AREAS)).size).toBe(RULE_AREAS.length);
    expect(new Set(paths).size).toBe(paths.length);
    paths.forEach((path) => expect(path).toMatch(/^\/rules\/[a-z-]+$/));
  });

  it('numbers the areas in the order a new company should set them up', () => {
    expect(RULE_AREAS.map((area) => area.step)).toEqual(RULE_AREAS.map((_, index) => index + 1));
    expect(keys(RULE_AREAS)[0]).toBe('salary');
  });

  it('shows HR and admin every area', () => {
    expect(keys(visibleRuleAreas(ROLE_PERMISSIONS.HR))).toEqual(keys(RULE_AREAS));
    expect(keys(visibleRuleAreas(ROLE_PERMISSIONS.ADMIN))).toEqual(keys(RULE_AREAS));
  });

  it('shows a supervisor or a plain employee nothing', () => {
    expect(visibleRuleAreas(ROLE_PERMISSIONS.SUPERVISOR)).toEqual([]);
    expect(visibleRuleAreas(ROLE_PERMISSIONS.EMPLOYEE)).toEqual([]);
  });

  it('shows a custom role exactly the areas its permissions open', () => {
    const permissions = [...ROLE_PERMISSIONS.EMPLOYEE, 'SALARY_RULE_READ', 'WORK_POLICY_READ'];

    expect(keys(visibleRuleAreas(permissions))).toEqual(['salary', 'work-policies']);
  });
});
