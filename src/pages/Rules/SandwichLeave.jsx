import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import dayjs from 'dayjs';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import PolicyRuleDialog from '../Attendance/PolicyRuleDialog';
import attendancePolicyApi from '../../api/attendancePolicy';
import { useAuth } from '../../context/AuthContext';
import { SCOPE_LABEL, describeRule, parseParams } from '../../constants/attendancePolicy';

const RULE = 'SANDWICH_LEAVE';
const COMPANY_PRESET = { ruleType: RULE, scope: 'COMPANY' };
const GROUP_PRESET = { ruleType: RULE, scope: 'CATEGORY' };
const fmt = (date) => dayjs(date).format('D MMM YYYY');

// Friday 14th, Saturday 15th (the holiday), Sunday 16th, Monday 17th August.
const EXAMPLES = [
  ['Leave 14th · Holiday 15th · Leave 16th', '14th, 15th and 16th all unpaid', true],
  ['Absent 14th · Holiday 15th · Absent 16th', 'The holiday is unpaid as well', true],
  ['Leave 14th · Holiday 15th · Worked 16th', 'All paid - one working day next to the holiday is enough'],
  ['One leave from 14th to 16th', 'All paid - the holiday is taken as leave, so 3 days of leave are used'],
  ['Leave Fri 14th · Holiday Sat 15th · Sunday off · Worked Mon 17th', 'All paid - the weekly off is looked past'],
  ['Leave Fri 14th · Holiday Sat 15th · Sunday off · Leave Mon 17th', '14th, 15th and 17th unpaid - the Sunday stays paid', true],
  ['Worked on the holiday itself', 'Nothing is lost'],
];

/** The newest version of every rule chain - the one that decides from its date on. */
const latestVersions = (rules) =>
  Object.values(
    rules.reduce((heads, rule) => {
      const key = `${rule.scope}|${rule.scopeRef}|${rule.ruleType}`;
      return !heads[key] || rule.version > heads[key].version ? { ...heads, [key]: rule } : heads;
    }, {})
  );

const statusOf = (rule) => {
  if (!rule) return { state: 'off', label: 'Off', text: 'Every public holiday is paid as usual.' };
  if (dayjs(rule.effectiveFrom).isAfter(dayjs(), 'day')) {
    return {
      state: 'future',
      label: 'Starts later',
      color: 'info',
      text: `${rule.enabled ? 'Starts' : 'Switches off on'} ${fmt(rule.effectiveFrom)}`,
    };
  }
  return rule.enabled
    ? { state: 'on', label: 'On for everyone', color: 'success', text: `since ${fmt(rule.effectiveFrom)}` }
    : { state: 'off', label: 'Off', text: 'Every public holiday is paid as usual.' };
};

export default function SandwichLeave() {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = useAuth();
  const canManage = can('ATTENDANCE_POLICY_MANAGE');

  const [rules, setRules] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [confirmOff, setConfirmOff] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    attendancePolicyApi.list().then(setRules).catch(() => setRules([]));
  }, []);
  useEffect(load, [load]);

  const latest = latestVersions(rules || []);
  const sandwich = latest.filter((rule) => rule.ruleType === RULE);
  const company = sandwich.find((rule) => rule.scope === 'COMPANY');
  const groups = sandwich.filter((rule) => rule.scope !== 'COMPANY');
  const status = statusOf(company);

  const save = (request, message) => {
    setBusy(true);
    return request
      .then(() => {
        enqueueSnackbar(message, { variant: 'success' });
        setDialog(null);
        setConfirmOff(false);
        load();
      })
      .catch(() => {})
      .finally(() => setBusy(false));
  };

  // Never an edit: switching off appends a version, so months already paid keep their answer.
  const switchOff = () =>
    save(
      attendancePolicyApi.create({
        scope: 'COMPANY',
        scopeRef: '*',
        ruleType: RULE,
        effectiveFrom: dayjs().add(1, 'month').startOf('month').format('YYYY-MM-DD'),
        enabled: false,
        params: parseParams(company.params),
        notes: 'Switched off from the Sandwich leave tab',
      }),
      'Sandwich leave switched off from next month'
    );

  if (!rules) return null;

  return (
    <>
      <PageHeader
        title="Sandwich leave"
        subtitle="A public holiday is paid only to someone who works the working day before it or after it."
      />

      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Chip label={status.label} color={status.color || 'default'} />
            <Typography>{status.text}</Typography>
          </Stack>
          {company?.enabled && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {describeRule(RULE, company.params)}
            </Typography>
          )}
          {groups.length > 0 && (
            <Box component="ul" sx={{ mt: 1.5, mb: 0, pl: 2.5 }}>
              {groups.map((rule) => (
                <Typography key={rule.id} component="li" variant="body2">
                  {`${SCOPE_LABEL[rule.scope]} ${rule.scopeRef}: ${rule.enabled ? 'on' : 'off'} from ${fmt(
                    rule.effectiveFrom
                  )}`}
                </Typography>
              ))}
            </Box>
          )}
          {canManage && (
            <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 2, flexWrap: 'wrap' }}>
              {status.state === 'off' && (
                <Button
                  variant="contained"
                  onClick={() =>
                    setDialog({
                      preset: COMPANY_PRESET,
                      basedOn: company && { ...company, parsedParams: parseParams(company.params), enabled: true },
                    })
                  }
                >
                  Switch on
                </Button>
              )}
              {status.state === 'on' && (
                <>
                  <Button
                    variant="outlined"
                    onClick={() =>
                      setDialog({ preset: COMPANY_PRESET, basedOn: { ...company, parsedParams: parseParams(company.params) } })
                    }
                  >
                    Change
                  </Button>
                  <Button color="warning" onClick={() => setConfirmOff(true)}>
                    Switch off
                  </Button>
                </>
              )}
              {status.state === 'future' && (
                <Button
                  color="warning"
                  disabled={busy}
                  onClick={() => save(attendancePolicyApi.remove(company.id), 'Cancelled - nothing had been priced by it')}
                >
                  Cancel it
                </Button>
              )}
              <Button onClick={() => setDialog({ preset: GROUP_PRESET, basedOn: null })}>
                Treat a group differently
              </Button>
            </Stack>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
            A group's own rule is changed or stopped on the{' '}
            <RouterLink to="/rules/attendance-policy">Attendance policy</RouterLink> tab.
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            How it works - 15 August
          </Typography>
          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>The employee's days</TableCell>
                <TableCell>With the rule on</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {EXAMPLES.map(([days, result, lost]) => (
                <TableRow key={days}>
                  <TableCell>{days}</TableCell>
                  <TableCell sx={{ color: lost ? 'error.main' : 'success.main' }}>{result}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Alert severity="info">
            Only mandatory public holidays count - optional holidays and ordinary weekends never do. A half day or
            a single punch counts as working. The rule changes pay, never leave balances; a day-wise worker is simply
            not paid the holiday. It is worked out once a month from the 1st, so switching it on today applies from
            next month, and a holiday at a month end is checked once the next month's attendance is generated.
          </Alert>
        </CardContent>
      </Card>

      <PolicyRuleDialog
        open={!!dialog}
        basedOn={dialog?.basedOn || null}
        preset={dialog?.preset}
        existingRules={latest.filter((rule) => rule.enabled)}
        saving={busy}
        onClose={() => setDialog(null)}
        onSubmit={(payload) => save(attendancePolicyApi.save(payload), 'Sandwich leave saved')}
      />

      <ConfirmDialog
        open={confirmOff}
        title="Switch sandwich leave off?"
        description="From next month every public holiday is paid as usual again. Months already worked out keep their result - this is saved as a new version, and the old one stays in the history."
        confirmLabel="Switch it off"
        confirmColor="warning"
        loading={busy}
        onConfirm={switchOff}
        onClose={() => setConfirmOff(false)}
      />
    </>
  );
}
