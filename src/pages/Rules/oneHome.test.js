import navConfig from '../../layout/navConfig';
import { MASTERS_TABS } from '../Masters/MastersLayout';
import { CONSOLE_TABS } from '../Attendance/AttendanceConsoleLayout';
import { leaveTabs } from '../Leave/LeaveLayout';
import { LEGACY_RULE_PATHS } from './rulesCatalog';

// The layouts import react-router, which does not load under this Jest; only
// their tab lists are read here.
jest.mock('react-router-dom', () => ({}));
jest.mock('../../context/AuthContext', () => ({ useAuth: jest.fn() }));

const oldRulePaths = Object.keys(LEGACY_RULE_PATHS);
const offersNoRuleScreen = (paths) => paths.forEach((path) => expect(oldRulePaths).not.toContain(path));

describe('every rule has one home: the Rules page', () => {
  it('the sidebar links to Rules and to no rule screen elsewhere', () => {
    const paths = navConfig.flatMap((section) => section.items.map((item) => item.path));

    expect(paths).toContain('/rules');
    offersNoRuleScreen(paths);
  });

  it('Masters keeps only the lists of the organisation', () => {
    expect(MASTERS_TABS.map((tab) => tab.label)).toEqual(['Companies', 'Departments', 'Designations', 'Categories']);
  });

  it('the attendance console and the leave pages carry no rule tabs', () => {
    offersNoRuleScreen(CONSOLE_TABS.map((tab) => tab.path));
    offersNoRuleScreen(leaveTabs(() => true).map((tab) => tab.path));
  });
});
