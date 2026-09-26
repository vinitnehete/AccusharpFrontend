import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

const TABS = [
  { label: 'Generate', path: '/attendance/generate' },
  { label: 'Records', path: '/attendance/records' },
  { label: 'Policy', path: '/attendance/policy' },
  { label: 'Who gets which rule', path: '/attendance/policy-check' },
];

export default function AttendanceConsoleLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  // Longest match wins: '/attendance/policy-check' also starts with
  // '/attendance/policy', and a plain find() would light up the wrong tab.
  const current =
    [...TABS]
      .sort((a, b) => b.path.length - a.path.length)
      .find((t) => location.pathname.startsWith(t.path))?.path || TABS[0].path;

  return (
    <Box>
      <Tabs
        value={current}
        onChange={(_, value) => navigate(value)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {TABS.map((t) => (
          <Tab key={t.path} value={t.path} label={t.label} />
        ))}
      </Tabs>
      <Outlet />
    </Box>
  );
}
