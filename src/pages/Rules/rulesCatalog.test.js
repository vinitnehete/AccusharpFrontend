import { LEGACY_RULE_PATHS, RULE_AREAS, visibleRuleAreas } from './rulesCatalog';
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

  it('offers the sandwich leave rule as its own tab, to whoever may set attendance policy', () => {
    const sandwich = RULE_AREAS.find((area) => area.key === 'sandwich-leave');

    expect(sandwich.path).toBe('/rules/sandwich-leave');
    expect(keys(visibleRuleAreas(['ATTENDANCE_POLICY_READ']))).toEqual(['attendance-policy', 'sandwich-leave']);
  });

  it('sends every old location of a rule screen to its tab on the Rules page', () => {
    const tabs = [...RULE_AREAS.map((area) => area.path), '/rules/check'];

    expect(Object.keys(LEGACY_RULE_PATHS).sort()).toEqual([
      '/attendance/policy', '/attendance/policy-check', '/holidays', '/leave/rules',
      '/masters/attendance-rule', '/masters/employment-types', '/masters/salary-rule',
      '/masters/work-policies', '/shifts',
    ]);
    Object.values(LEGACY_RULE_PATHS).forEach((to) => expect(tabs).toContain(to));
  });
});
