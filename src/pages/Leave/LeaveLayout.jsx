import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { useAuth } from '../../context/AuthContext';
import { ACCESS } from '../../constants/access';

// Same ACCESS rules the routes are guarded by, so a tab is only ever offered
// when the page behind it will open. Leave rules live on the Rules page.
export const leaveTabs = (canAccess) => [
  { label: 'Apply', path: '/leave/apply' },
  { label: 'My Leaves', path: '/leave/my' },
  ...(canAccess(ACCESS.leaveApprovals) ? [{ label: 'Pending Approvals', path: '/leave/approvals' }] : []),
  ...(canAccess(ACCESS.leaveAll) ? [{ label: 'All Leaves', path: '/leave/all' }] : []),
  { label: 'Calendar', path: '/leave/calendar' },
  { label: 'Balances', path: '/leave/balances' },
];

export default function LeaveLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { canAccess } = useAuth();
  const tabs = leaveTabs(canAccess);

  const current = tabs.find((t) => location.pathname.startsWith(t.path))?.path || tabs[0].path;

  return (
    <Box>
      <Tabs
        value={current}
        onChange={(_, value) => navigate(value)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        variant="scrollable"
      >
        {tabs.map((t) => (
          <Tab key={t.path} value={t.path} label={t.label} />
        ))}
      </Tabs>
      <Outlet />
    </Box>
  );
}
