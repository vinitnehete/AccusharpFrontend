import { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import dayjs from 'dayjs';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import PageHeader from '../../components/PageHeader';
import salaryRulesApi from '../../api/salaryRules';
import attendanceRulesApi from '../../api/attendanceRules';
import attendancePolicyApi from '../../api/attendancePolicy';
import workPoliciesApi from '../../api/workPolicies';
import leaveRulesApi from '../../api/leaveRules';
import leaveSettingsApi from '../../api/leaveSettings';
import employmentTypesApi from '../../api/employmentTypes';
import shiftsApi from '../../api/shifts';
import holidaysApi from '../../api/holidays';
import { useAuth } from '../../context/AuthContext';
import { labelize } from '../../constants/enums';
import { describeRule, ruleLabel } from '../../constants/attendancePolicy';
import { SCOPE_LABEL, needsScopeRef } from '../../constants/scopes';
import { visibleRuleAreas } from './rulesCatalog';
import {
  inForce,
  summariseAttendanceRule,
  summariseHolidays,
  summariseLeaveRules,
  summariseSalaryRule,
} from './rulesSummary';

// status: 'set' - the company has configured this; 'default' - nothing
// configured, and the built-in behaviour applies; 'missing' - nothing
// configured, and the built-in behaviour is almost certainly not wanted.
const STATUS_CHIP = {
  set: { label: 'Set', color: 'success' },
  default: { label: 'Using defaults', color: 'default' },
  missing: { label: 'Needs setup', color: 'warning' },
};

const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;
const who = (rule) => (needsScopeRef(rule.scope) ? `${SCOPE_LABEL[rule.scope]}: ${rule.scopeRef}` : 'Everyone');
const hhmm = (time) => String(time || '').slice(0, 5);

// One loader per area: fetches what the area's own screen fetches and returns
// what its card shows - `lines` ({label, value}), `text`, `items`, `status`.
const LOADERS = {
  salary: () => salaryRulesApi.get().then((rule) => ({ lines: summariseSalaryRule(rule) })),

  'employment-types': () =>
    employmentTypesApi.list().then((types) => {
      const active = types.filter((type) => type.active !== false);
      return active.length === 0
        ? {
          status: 'default',
          text: 'None yet - everyone is paid by the status on their record (Permanent, Day wise, Contract, Intern)',
        }
        : {
          status: 'set',
          text: plural(active.length, 'type'),
          items: active.map((type) => `${type.typeCode} - ${type.typeName}`),
        };
    }),

  shifts: () =>
    shiftsApi.list().then((shifts) => {
      if (shifts.length === 0) {
        return { status: 'missing', text: 'No shifts yet - nobody can be rostered' };
      }
      const warned = shifts.filter((shift) => (shift.warnings || []).length > 0).length;
      return {
        status: warned > 0 ? 'missing' : 'set',
        text: `${plural(shifts.length, 'shift')}${warned > 0 ? ` - ${plural(warned, 'has', 'have')} a warning` : ''}`,
        items: shifts.map(
          (shift) => `${shift.shiftCode} ${hhmm(shift.startTime)}–${hhmm(shift.endTime)}, grace ${shift.graceMinutes} min`
        ),
      };
    }),

  holidays: () => {
    const year = dayjs().year();
    return holidaysApi.list(`${year}-01-01`, `${year}-12-31`).then((holidays) => {
      const summary = summariseHolidays(holidays);
      return {
        status: summary.configured ? 'set' : 'missing',
        text: summary.text,
        items: summary.next ? [summary.next] : [],
      };
    });
  },

  attendance: () => attendanceRulesApi.get().then((rule) => ({ lines: summariseAttendanceRule(rule) })),

  'attendance-policy': () =>
    attendancePolicyApi.list().then((rules) => {
      const on = inForce(rules, (rule) => `${rule.scope}|${rule.scopeRef}|${rule.ruleType}`);
      return on.length === 0
        ? { status: 'default', text: 'None - every day is judged by the thresholds alone' }
        : {
          status: 'set',
          text: `${plural(on.length, 'rule')} in force`,
          items: on.map((rule) => `${ruleLabel(rule.ruleType)} - ${who(rule)}`),
        };
    }),

  'sandwich-leave': () =>
    attendancePolicyApi.list().then((rules) => {
      const on = inForce(rules.filter((rule) => rule.ruleType === 'SANDWICH_LEAVE'), (rule) => `${rule.scope}|${rule.scopeRef}`);
      return on.length === 0
        ? { status: 'default', text: 'Off - every public holiday is paid' }
        : { status: 'set', text: 'On', items: on.map((rule) => `${who(rule)}: ${describeRule(rule.ruleType, rule.params)}`) };
    }),

  'work-policies': () =>
    workPoliciesApi.list().then((policies) => {
      const on = inForce(policies, (policy) => `${policy.scope}|${policy.scopeRef}`);
      return on.length === 0
        ? { status: 'default', text: 'Every employee is tracked and paid from attendance' }
        : {
          status: 'set',
          text: `${plural(on.length, 'policy', 'policies')} in force`,
          items: on.map(
            (policy) =>
              `${who(policy)}: ${labelize(policy.attendanceTracking)}, ${labelize(policy.payrollMode)}, leave ${labelize(
                policy.leaveApproval
              )}`
          ),
        };
    }),

  leave: () =>
    Promise.all([leaveRulesApi.list(), leaveSettingsApi.get()]).then(([rules, settings]) => {
      const summary = summariseLeaveRules(rules);
      const months = settings.leaveYearStartMonth === 4 ? 'April – March' : 'January – December';
      return {
        status: summary.configured ? 'set' : 'default',
        text: summary.text,
        items: [`Leave year: ${settings.currentLeaveYearLabel} (${months})`],
      };
    }),
};

function CardBody({ state }) {
  if (!state || state.loading) {
    return (
      <>
        <Skeleton width="80%" />
        <Skeleton width="60%" />
      </>
    );
  }
  if (state.error) {
    return (
      <Typography variant="body2" color="error">
        Could not load this rule
      </Typography>
    );
  }
  const { lines, text, items } = state.model;
  return (
    <Stack spacing={0.75}>
      {lines && (
        <Box
          component="dl"
          sx={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', columnGap: 2, rowGap: 0.5, m: 0 }}
        >
          {lines.map((line) => (
            <Box key={line.label} sx={{ display: 'contents' }}>
              <Typography component="dt" variant="body2" color="text.secondary">
                {line.label}
              </Typography>
              <Typography component="dd" variant="body2" sx={{ m: 0 }}>
                {line.value}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
      {text && <Typography variant="body2">{text}</Typography>}
      {items && items.length > 0 && (
        <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
          {items.map((item) => (
            <Typography key={item} component="li" variant="body2" color="text.secondary">
              {item}
            </Typography>
          ))}
        </Box>
      )}
    </Stack>
  );
}

export default function RulesOverview() {
  const { permissions } = useAuth();
  const areas = useMemo(() => visibleRuleAreas(permissions), [permissions]);
  const [cards, setCards] = useState({});

  // Each card loads on its own, so one failing area never blanks the page.
  useEffect(() => {
    let cancelled = false;
    setCards(Object.fromEntries(areas.map((area) => [area.key, { loading: true }])));
    areas.forEach((area) => {
      LOADERS[area.key]()
        .then((model) => !cancelled && setCards((prev) => ({ ...prev, [area.key]: { model } })))
        .catch(() => !cancelled && setCards((prev) => ({ ...prev, [area.key]: { error: true } })));
    });
    return () => {
      cancelled = true;
    };
  }, [areas]);

  return (
    <>
      <PageHeader
        title="Rules"
        subtitle="Every rule the company runs on, in one place. Set them up once in the order shown; after that, come back only to change one."
      />
      <Alert severity="info" sx={{ mb: 3 }}>
        When more than one rule could apply to the same person, the most specific one wins: one employee, then
        designation, category, department, employment type, and last, everyone in the company.
      </Alert>
      <Grid container spacing={2.5}>
        {areas.map((area) => {
          const state = cards[area.key];
          const chip = state?.model?.status && STATUS_CHIP[state.model.status];
          return (
            <Grid key={area.key} size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: 14, bgcolor: 'primary.main' }}>{area.step}</Avatar>
                    <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                      {area.label}
                    </Typography>
                    {chip && <Chip size="small" variant="outlined" label={chip.label} color={chip.color} />}
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    {area.question}
                  </Typography>
                  <CardBody state={state} />
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    component={RouterLink}
                    to={area.path}
                    size="small"
                    endIcon={<ArrowForwardRoundedIcon />}
                    aria-label={`Open ${area.label}`}
                  >
                    Open
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </>
  );
}
