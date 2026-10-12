import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { label: 'Register', path: '/recoveries/register' },
  { label: 'Issue', path: '/recoveries/issue', permission: 'RECOVERY_MANAGE' },
  { label: 'Bulk Issue (CSV)', path: '/recoveries/bulk', permission: 'RECOVERY_MANAGE' },
  { label: 'Employee Statement', path: '/recoveries/statement' },
];

export default function RecoveriesLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { can } = useAuth();
  const tabs = TABS.filter((t) => !t.permission || can(t.permission));
  // Longest matching prefix wins, same as PayrollLayout - first-in-array would
  // highlight the wrong tab for any path that is a prefix of another.
  const current =
    tabs.filter((t) => location.pathname.startsWith(t.path)).sort(
      (a, b) => b.path.length - a.path.length
    )[0]?.path || tabs[0].path;

  return (
    <Box>
      <Tabs
        value={current}
        onChange={(_, value) => navigate(value)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {tabs.map((t) => (
          <Tab key={t.path} value={t.path} label={t.label} />
        ))}
      </Tabs>
      <Outlet />
    </Box>
  );
}
