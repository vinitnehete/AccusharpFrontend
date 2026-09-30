import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

// The organisation's lists only. Every rule - salary, employment types,
// attendance, work policies - lives on the Rules page.
export const MASTERS_TABS = [
  { label: 'Companies', path: '/masters/companies' },
  { label: 'Departments', path: '/masters/departments' },
  { label: 'Designations', path: '/masters/designations' },
  { label: 'Categories', path: '/masters/categories' },
];

export default function MastersLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const current = MASTERS_TABS.find((t) => location.pathname.startsWith(t.path))?.path || MASTERS_TABS[0].path;

  return (
    <Box>
      <Tabs
        value={current}
        onChange={(_, value) => navigate(value)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        {MASTERS_TABS.map((t) => (
          <Tab key={t.path} value={t.path} label={t.label} />
        ))}
      </Tabs>
      <Outlet />
    </Box>
  );
}
