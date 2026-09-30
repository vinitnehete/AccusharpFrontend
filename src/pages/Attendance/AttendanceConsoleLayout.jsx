import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

// The attendance policy and "who gets which rule" live on the Rules page.
export const CONSOLE_TABS = [
  { label: 'Generate', path: '/attendance/generate' },
  { label: 'Records', path: '/attendance/records' },
];

export default function AttendanceConsoleLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const current = CONSOLE_TABS.find((t) => location.pathname.startsWith(t.path))?.path || CONSOLE_TABS[0].path;

  return (
    <Box>
      <Tabs
        value={current}
        onChange={(_, value) => navigate(value)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {CONSOLE_TABS.map((t) => (
          <Tab key={t.path} value={t.path} label={t.label} />
        ))}
      </Tabs>
      <Outlet />
    </Box>
  );
}
