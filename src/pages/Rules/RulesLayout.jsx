import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { useAuth } from '../../context/AuthContext';
import { ACCESS } from '../../constants/access';
import { visibleRuleAreas } from './rulesCatalog';

const RULES_HOME = '/rules';
const RULE_CHECK_PATH = '/rules/check';

export default function RulesLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { permissions, canAccess } = useAuth();

  // Only the tabs whose page this session may open - the same rules their
  // routes are guarded by in App.js.
  const tabs = [
    { label: 'Overview', path: RULES_HOME },
    ...visibleRuleAreas(permissions).map((area) => ({ label: area.label, path: area.path })),
    ...(canAccess(ACCESS.attendancePolicy) ? [{ label: 'Who gets which rule', path: RULE_CHECK_PATH }] : []),
  ];

  // Longest match wins: every tab path starts with /rules.
  const current =
    [...tabs]
      .sort((a, b) => b.path.length - a.path.length)
      .find((t) => location.pathname.startsWith(t.path))?.path || RULES_HOME;

  return (
    <Box>
      <Tabs
        value={current}
        onChange={(_, value) => navigate(value)}
        variant="scrollable"
        scrollButtons="auto"
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
