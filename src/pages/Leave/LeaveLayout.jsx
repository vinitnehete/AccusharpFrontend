import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { useActingAs } from '../../context/ActingAsContext';

export default function LeaveLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSupervisorOrAbove, isHrOrAdmin } = useActingAs();

  const tabs = [
    { label: 'Apply', path: '/leave/apply' },
    { label: 'My Leaves', path: '/leave/my' },
    ...(isSupervisorOrAbove ? [{ label: 'Pending Approvals', path: '/leave/approvals' }] : []),
    ...(isHrOrAdmin ? [{ label: 'All Leaves', path: '/leave/all' }] : []),
    { label: 'Calendar', path: '/leave/calendar' },
    { label: 'Balances', path: '/leave/balances' },
    ...(isHrOrAdmin ? [{ label: 'Rules', path: '/leave/rules' }] : []),
  ];

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
