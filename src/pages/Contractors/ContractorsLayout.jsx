import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

const TABS = [
  { label: 'Contractors', path: '/contractors/list' },
  { label: 'Workforce', path: '/contractors/workforce' },
  { label: 'Roster', path: '/contractors/roster' },
  { label: 'Attendance', path: '/contractors/attendance' },
  { label: 'Reports', path: '/contractors/reports' },
];

export default function ContractorsLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  // Longest match wins, same rule AttendanceConsoleLayout uses: a detail route
  // like /contractors/list/12 must still light up the Contractors tab.
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
