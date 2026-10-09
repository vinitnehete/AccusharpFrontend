import { leaveTabs } from './LeaveLayout';
import { isAllowed } from '../../constants/access';
import { ROLE_PERMISSIONS } from '../../constants/permissions';

// react-router v7 does not load under this Jest; the tab list needs none of it.
jest.mock('react-router-dom', () => ({ Outlet: () => null, useLocation: jest.fn(), useNavigate: jest.fn() }));

const tabsFor = (role) => {
  const session = { role, permissions: ROLE_PERMISSIONS[role] };
  return leaveTabs((rule) => isAllowed(rule, session)).map((tab) => tab.label);
};

describe('leave tabs', () => {
  it('offers an admin the company view of leave - approvals, all leaves, calendar, balances - but no leave of their own', () => {
    expect(tabsFor('ADMIN')).toEqual(['Pending Approvals', 'All Leaves', 'Calendar', 'Balances']);
  });

  it('keeps Apply and My Leaves for everyone who has a workspace', () => {
    expect(tabsFor('HR')).toEqual(expect.arrayContaining(['Apply', 'My Leaves']));
    expect(tabsFor('EMPLOYEE')).toEqual(['Apply', 'My Leaves', 'Calendar', 'Balances']);
  });
});
