import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { useAuth } from '../../context/AuthContext';

// The attendance policy and "who gets which rule" live on the Rules page.
export const CONSOLE_TABS = [
  { label: 'Generate', path: '/attendance/generate' },
  { label: 'Bulk Upload', path: '/attendance/bulk-upload', permission: 'ATTENDANCE_CORRECT' },
  { label: 'Records', path: '/attendance/records' },
];

export default function AttendanceConsoleLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { can } = useAuth();
  const tabs = CONSOLE_TABS.filter((t) => !t.permission || can(t.permission));
  const current = tabs.find((t) => location.pathname.startsWith(t.path))?.path || tabs[0].path;

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
