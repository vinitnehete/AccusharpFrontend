import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

const TABS = [
  { label: 'Companies', path: '/masters/companies' },
  { label: 'Departments', path: '/masters/departments' },
  { label: 'Designations', path: '/masters/designations' },
  { label: 'Categories', path: '/masters/categories' },
  { label: 'Employment Types', path: '/masters/employment-types' },
  { label: 'Salary Rule', path: '/masters/salary-rule' },
  { label: 'Attendance Rule', path: '/masters/attendance-rule' },
  { label: 'Work Policies', path: '/masters/work-policies' },
];

export default function MastersLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const current = TABS.find((t) => location.pathname.startsWith(t.path))?.path || TABS[0].path;

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
