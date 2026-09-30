import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import leaveRulesApi from '../../api/leaveRules';
import leaveBalancesApi from '../../api/leaveBalances';
import leaveSettingsApi from '../../api/leaveSettings';
import { EMPLOYEE_STATUS, labelize } from '../../constants/enums';
import EmployeePicker from '../../components/EmployeePicker';
import EmployeeMultiPicker from '../../components/EmployeeMultiPicker';
import {
  SCOPES,
  SCOPE_LABEL,
  SCOPE_REF_LABEL,
  blankForm,
  grantsFor,
  needsScopeRef,
  scopeFields,
  withLeaveType,
  withScope,
} from './leaveRuleForm';

// Unpaid leave has no balance, so it takes no rules.
const RULE_LEAVE_TYPES = ['CASUAL_LEAVE', 'SICK_LEAVE', 'EARNED_LEAVE'];

const GRANT_LABEL = {
  YEARLY_GRANT: 'A yearly amount',
  EARNED_BY_ATTENDANCE: 'Earned from attendance',
  MONTHLY_ACCRUAL: 'A few days each month',
  NOT_ENTITLED: 'Not entitled',
};


const str = (v) => (v === null || v === undefined ? '' : String(v));
const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
const digits = (v) => v.replace(/[^0-9.]/g, '');

const toForm = (rule) => {
  const [upper, lower] = [...(rule.creditSteps || [])].sort((a, b) => b.minDays - a.minDays);
  return {
    scope: rule.scope,
    scopeRef: rule.scopeRef,
    leaveType: rule.leaveType,
    grantMethod: rule.grantMethod,
    yearlyDays: str(rule.yearlyDays),
    fullMonthCredit: str(rule.fullMonthCredit ?? '1.5'),
    upperStepDays: str(upper?.minDays ?? 20),
    upperStepCredit: str(upper?.credit ?? '1.0'),
    lowerStepDays: str(lower?.minDays ?? 10),
    lowerStepCredit: str(lower?.credit ?? '0.5'),
    daysPerStatutoryDay: str(rule.daysPerStatutoryDay ?? 20),
    monthlyCredit: str(rule.monthlyCredit),
    yearlyAccrualCap: str(rule.yearlyAccrualCap),
    carryForwardCap: str(rule.carryForwardCap),
    excessOverCap: rule.excessOverCap || 'PAY_OUT',
    effectiveFrom: dayjs(rule.effectiveFrom),
    enabled: rule.enabled,
  };
};

const toPayload = (form, isNew) => {
  const earned = form.grantMethod === 'EARNED_BY_ATTENDANCE';
  const steps = [
    [form.upperStepDays, form.upperStepCredit],
    [form.lowerStepDays, form.lowerStepCredit],
  ]
    .filter(([days, credit]) => days !== '' && credit !== '')
    .map(([days, credit]) => ({ minDays: Number(days), credit: Number(credit) }));
  return {
    ...scopeFields(form, isNew),
    leaveType: form.leaveType,
    grantMethod: form.grantMethod,
    yearlyDays: form.grantMethod === 'YEARLY_GRANT' ? num(form.yearlyDays) : null,
    monthlyCredit: form.grantMethod === 'MONTHLY_ACCRUAL' ? num(form.monthlyCredit) : null,
    yearlyAccrualCap: num(form.yearlyAccrualCap),
    fullMonthCredit: earned ? num(form.fullMonthCredit) : null,
    creditSteps: earned ? steps : null,
    daysPerStatutoryDay: earned ? num(form.daysPerStatutoryDay) : null,
    carryForwardCap: num(form.carryForwardCap),
    excessOverCap: form.carryForwardCap === '' ? null : form.excessOverCap,
    effectiveFrom: form.effectiveFrom.startOf('month').format('YYYY-MM-DD'),
    enabled: form.enabled,
  };
};

// One line a person can read: what this rule actually gives.
const describe = (rule) => {
  if (rule.grantMethod === 'NOT_ENTITLED') return 'None';
  if (rule.grantMethod === 'YEARLY_GRANT') return `${rule.yearlyDays} days a year`;
  if (rule.grantMethod === 'MONTHLY_ACCRUAL') {
    return `${rule.monthlyCredit} a month${rule.yearlyAccrualCap ? `, up to ${rule.yearlyAccrualCap} a year` : ''}`;
  }
  const steps = [...(rule.creditSteps || [{ minDays: 20, credit: 1 }, { minDays: 10, credit: 0.5 }])]
    .sort((a, b) => b.minDays - a.minDays)
    .map((s) => `${s.minDays} days = ${s.credit}`)
    .join(', ');
  return `Full month ${rule.fullMonthCredit ?? 1.5}; ${steps}; never below 1 per ${
    rule.daysPerStatutoryDay ?? 20} days worked`;
};

const CLOSE_COLUMNS = [
  { field: 'userId', headerName: 'User ID', width: 100 },
  { field: 'employeeName', headerName: 'Employee', flex: 1, minWidth: 160 },
  { field: 'leaveType', headerName: 'Leave', width: 130, valueFormatter: (v) => labelize(v) },
  { field: 'available', headerName: 'Unused', width: 90 },
  { field: 'carriedForward', headerName: 'Carried', width: 90 },
  { field: 'excessToPayOut', headerName: 'To pay out', width: 110 },
  { field: 'lapsed', headerName: 'Lapsed', width: 90 },
];

export default function LeaveRules() {
  const { enqueueSnackbar } = useSnackbar();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [closeYear, setCloseYear] = useState(String(new Date().getFullYear() - 1));
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeRows, setCloseRows] = useState(null);
  const [settings, setSettings] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const load = () => {
    setLoading(true);
    leaveRulesApi
      .list()
      .then(setRules)
      .catch(() => setRules([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // The leave year also decides which year "last year" is for the close below.
  const loadSettings = () => {
    leaveSettingsApi
      .get()
      .then((s) => {
        setSettings(s);
        setCloseYear(String(s.currentLeaveYear - 1));
      })
      .catch(() => setSettings(null));
  };

  useEffect(loadSettings, []);

  // 2026 for a calendar company; 2026-27 for one on the financial year.
  const yearLabel = (y) =>
    !settings || settings.leaveYearStartMonth === 1
      ? String(y)
      : `${y}-${String((Number(y) + 1) % 100).padStart(2, '0')}`;

  const handleLeaveYearChange = (month) => {
    setSavingSettings(true);
    leaveSettingsApi
      .update(month)
      .then((s) => {
        setSettings(s);
        setCloseYear(String(s.currentLeaveYear - 1));
        enqueueSnackbar('Leave year updated', { variant: 'success' });
      })
      .catch(() => {})
      .finally(() => setSavingSettings(false));
  };

  const form = editing?.form;
  const set = (name, value) => setEditing((prev) => ({ ...prev, form: { ...prev.form, [name]: value } }));

  const setLeaveType = (leaveType) =>
    setEditing((prev) => ({ ...prev, form: withLeaveType(prev.form, leaveType) }));

  const setScope = (scope) => setEditing((prev) => ({ ...prev, form: withScope(prev.form, scope) }));

  const yearly = form?.grantMethod === 'YEARLY_GRANT';
  const earned = form?.grantMethod === 'EARNED_BY_ATTENDANCE';
  const monthly = form?.grantMethod === 'MONTHLY_ACCRUAL';
  const manyEmployees = !editing?.id && form?.scope === 'EMPLOYEE';
  const valid = !!form && !!form.effectiveFrom
    && (!yearly || form.yearlyDays !== '')
    && (!monthly || form.monthlyCredit !== '')
    && (manyEmployees ? form.scopeRefs.length > 0 : !needsScopeRef(form.scope) || !!(form.scopeRef || '').trim());

  const handleSave = () => {
    setSaving(true);
    const payload = toPayload(form, !editing.id);
    const request = editing.id ? leaveRulesApi.update(editing.id, payload) : leaveRulesApi.save(payload);
    request
      .then(() => {
        enqueueSnackbar('Leave rule saved', { variant: 'success' });
        setEditing(null);
        load();
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  const handleDelete = () => {
    setRemoving(true);
    leaveRulesApi
      .remove(deleting.id)
      .then(() => {
        enqueueSnackbar('Leave rule removed', { variant: 'success' });
        setDeleting(null);
        load();
      })
      .catch(() => {})
      .finally(() => setRemoving(false));
  };

  const handleCloseYear = () => {
    setClosing(true);
    leaveBalancesApi
      .closeYear(closeYear)
      .then((rows) => {
        setCloseRows(rows.map((r) => ({ ...r, id: `${r.userId}-${r.leaveType}` })));
        setCloseConfirmOpen(false);
        enqueueSnackbar(`Closed ${closeYear}`, { variant: 'success' });
      })
      .catch(() => {})
      .finally(() => setClosing(false));
  };

  const columns = [
    { field: 'leaveType', headerName: 'Leave', width: 130, valueFormatter: (v) => labelize(v) },
    {
      field: 'scopeRef',
      headerName: 'Who',
      width: 130,
      valueGetter: (v, row) => (needsScopeRef(row.scope) ? `${labelize(row.scope)}: ${row.scopeRef}` : 'Everyone'),
    },
    { field: 'grantMethod', headerName: 'How', width: 170, valueFormatter: (v) => GRANT_LABEL[v] || v },
    { field: 'detail', headerName: 'Gives', flex: 1, minWidth: 280, valueGetter: (v, row) => describe(row) },
    {
      field: 'carryForwardCap',
      headerName: 'Year end',
      width: 200,
      valueGetter: (v, row) => {
        if (v === null || v === undefined) return 'Lapses';
        return `Carries up to ${v}, rest ${row.excessOverCap === 'LAPSE' ? 'lapses' : 'paid out'}`;
      },
    },
    {
      field: 'effectiveFrom',
      headerName: 'From',
      width: 100,
      valueFormatter: (v) => dayjs(v).format('MMM YYYY'),
    },
    { field: 'enabled', headerName: 'On', width: 70, valueFormatter: (v) => (v ? 'Yes' : 'No') },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => setEditing({ id: params.row.id, form: toForm(params.row) })}>
              <EditRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Remove">
            <IconButton size="small" onClick={() => setDeleting(params.row)}>
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Leave Rules"
        subtitle="Who gets which leave, per employment type. With no rule, everyone keeps CL 12 / SL 8 and earns no EL."
        actions={
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setEditing({ form: blankForm() })}>
            Add rule
          </Button>
        }
      />
      {settings && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
              <TextField
                select
                size="small"
                label="Leave year"
                value={settings.leaveYearStartMonth}
                onChange={(e) => handleLeaveYearChange(Number(e.target.value))}
                disabled={!settings.canChange || savingSettings}
                sx={{ minWidth: 260 }}
              >
                <MenuItem value={1}>January – December (calendar)</MenuItem>
                <MenuItem value={4}>April – March (financial)</MenuItem>
              </TextField>
              <Typography variant="body2" color="text.secondary">
                Current leave year: <strong>{settings.currentLeaveYearLabel}</strong>. Balances, carry-forward and
                the year close all follow it.
              </Typography>
            </Stack>
            {!settings.canChange && (
              <Alert severity="info" sx={{ mt: 2 }}>
                The leave year can no longer be switched: {settings.blockedBecause}.
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <DataTable
        rows={rules}
        columns={columns}
        loading={loading}
        height={420}
        density="compact"
        emptyState={{
          title: 'No leave rules yet',
          description: 'Everyone gets the standard CL 12 / SL 8 and no earned leave until you add one.',
        }}
      />

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="subtitle1">Close a leave year</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Carries each unused balance into the next leave year, up to its rule's carry-forward limit. Anything
            above a limit is listed for payout or lapses, as the rule says; leave with no limit lapses. Run it once
            the last month's payroll is done (December, or March on the financial year) - that month's earned leave
            is credited by that run. Running it again is safe.
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <TextField
              size="small"
              label="Year to close"
              value={closeYear}
              onChange={(e) => setCloseYear(e.target.value.replace(/[^0-9]/g, ''))}
              helperText={closeYear.length === 4 ? `Leave year ${yearLabel(closeYear)}` : ' '}
              sx={{ width: 170 }}
            />
            <Button variant="outlined" disabled={closeYear.length !== 4} onClick={() => setCloseConfirmOpen(true)}>
              Close year
            </Button>
          </Stack>
          {closeRows && (
            <DataTable
              rows={closeRows}
              columns={CLOSE_COLUMNS}
              height={320}
              density="compact"
              sx={{ mt: 2 }}
              emptyState={{ title: 'Nothing to carry', description: 'No balance had a carry-forward limit.' }}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing?.id ? 'Edit leave rule' : 'Add leave rule'}</DialogTitle>
        {form && (
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select fullWidth size="small" label="Applies to" value={form.scope}
                  onChange={(e) => setScope(e.target.value)}>
                  {SCOPES.map((scope) => (
                    <MenuItem key={scope} value={scope}>
                      {scope === 'EMPLOYEE' && !editing?.id ? 'One or more employees' : SCOPE_LABEL[scope]}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                {form.scope === 'EMPLOYMENT_TYPE' && (
                  <TextField select fullWidth size="small" label={SCOPE_REF_LABEL.EMPLOYMENT_TYPE}
                    value={form.scopeRef}
                    onChange={(e) => set('scopeRef', e.target.value)}>
                    {EMPLOYEE_STATUS.map((s) => (
                      <MenuItem key={s} value={s}>{labelize(s)}</MenuItem>
                    ))}
                  </TextField>
                )}
                {manyEmployees && (
                  <EmployeeMultiPicker label="Employees - one or more" value={form.scopeRefs}
                    onChange={(userIds) => set('scopeRefs', userIds)} />
                )}
                {form.scope === 'EMPLOYEE' && !manyEmployees && (
                  <EmployeePicker label={SCOPE_REF_LABEL.EMPLOYEE} value={form.scopeRef || null}
                    onChange={(userId) => set('scopeRef', userId || '')} required />
                )}
                {needsScopeRef(form.scope) && !['EMPLOYEE', 'EMPLOYMENT_TYPE'].includes(form.scope) && (
                  <TextField fullWidth size="small" required label={SCOPE_REF_LABEL[form.scope]}
                    value={form.scopeRef}
                    onChange={(e) => set('scopeRef', e.target.value)}
                    helperText="The code exactly as the master holds it" />
                )}
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select fullWidth size="small" label="Leave" value={form.leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}>
                  {RULE_LEAVE_TYPES.map((t) => (
                    <MenuItem key={t} value={t}>{labelize(t)}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select fullWidth size="small" label="Given as" value={form.grantMethod}
                  onChange={(e) => set('grantMethod', e.target.value)}>
                  {grantsFor(form.leaveType).map((g) => (
                    <MenuItem key={g} value={g}>{GRANT_LABEL[g]}</MenuItem>
                  ))}
                </TextField>
              </Grid>

              {yearly && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth size="small" required label="Days a year" value={form.yearlyDays}
                    onChange={(e) => set('yearlyDays', digits(e.target.value))}
                    helperText="Someone joining mid-year gets the months left, to the nearest half day." />
                </Grid>
              )}

              {monthly && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth size="small" required label="Days a month" value={form.monthlyCredit}
                    onChange={(e) => set('monthlyCredit', digits(e.target.value))}
                    helperText="Credited when each month's payroll is generated, for a whole month on the books." />
                </Grid>
              )}

              {(earned || monthly) && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth size="small" label="Accrue at most, a year" value={form.yearlyAccrualCap}
                    onChange={(e) => set('yearlyAccrualCap', digits(e.target.value))}
                    helperText="Leave blank for no ceiling. The month that reaches it credits the remainder." />
                </Grid>
              )}

              {earned && (
                <>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" color="text.secondary">
                      Credited when each month's payroll is generated. A full month with no LOP earns the full-month
                      amount; otherwise the highest step reached - but never less than one day per the legal number
                      of days worked (OSH Code 2020).
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField fullWidth size="small" label="Full month" value={form.fullMonthCredit}
                      onChange={(e) => set('fullMonthCredit', digits(e.target.value))} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <TextField fullWidth size="small" label="Step: days" value={form.upperStepDays}
                      onChange={(e) => set('upperStepDays', digits(e.target.value))} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <TextField fullWidth size="small" label="earns" value={form.upperStepCredit}
                      onChange={(e) => set('upperStepCredit', digits(e.target.value))} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField fullWidth size="small" label="Legal: 1 day per" value={form.daysPerStatutoryDay}
                      onChange={(e) => set('daysPerStatutoryDay', digits(e.target.value))}
                      helperText="days worked (20 for adults)" />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <TextField fullWidth size="small" label="Step: days" value={form.lowerStepDays}
                      onChange={(e) => set('lowerStepDays', digits(e.target.value))} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 4 }}>
                    <TextField fullWidth size="small" label="earns" value={form.lowerStepCredit}
                      onChange={(e) => set('lowerStepCredit', digits(e.target.value))} />
                  </Grid>
                </>
              )}

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth size="small" label="Carry forward up to" value={form.carryForwardCap}
                  onChange={(e) => set('carryForwardCap', digits(e.target.value))}
                  helperText="Leave blank and unused leave lapses at year end. 30 is the OSH Code limit for EL." />
              </Grid>
              {form.carryForwardCap !== '' && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField select fullWidth size="small" label="Above the limit" value={form.excessOverCap}
                    onChange={(e) => set('excessOverCap', e.target.value)}>
                    <MenuItem value="PAY_OUT">Listed for payout</MenuItem>
                    <MenuItem value="LAPSE">Lapses</MenuItem>
                  </TextField>
                </Grid>
              )}
              {form.carryForwardCap !== '' && form.excessOverCap === 'LAPSE' && form.leaveType === 'EARNED_LEAVE' && (
                <Grid size={{ xs: 12 }}>
                  <Alert severity="warning">
                    The OSH Code requires paying out earned leave above the carry-forward limit for employees it
                    counts as workers. Letting it lapse is only safe for staff outside that definition.
                  </Alert>
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="Effective from"
                  views={['year', 'month']}
                  value={form.effectiveFrom}
                  onChange={(v) => set('effectiveFrom', v)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      fullWidth: true,
                      helperText: earned
                        ? 'The go-live month: months before it are never credited.'
                        : 'Applies from this month on.',
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={<Switch checked={form.enabled} onChange={(e) => set('enabled', e.target.checked)} />}
                  label="Rule is on"
                />
              </Grid>
            </Grid>
          </DialogContent>
        )}
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setEditing(null)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={!valid || saving}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        title="Remove this leave rule?"
        description="Credits already posted under it stay posted. From the next payroll or year close, whatever rule is left applies - or the standard CL 12 / SL 8 and no earned leave, if none is."
        confirmLabel="Remove"
        confirmColor="error"
        loading={removing}
        onConfirm={handleDelete}
        onClose={() => setDeleting(null)}
      />

      <ConfirmDialog
        open={closeConfirmOpen}
        title={`Close leave year ${yearLabel(closeYear)}?`}
        description={`Carries unused balances from ${yearLabel(closeYear)} into ${yearLabel(Number(closeYear) + 1)} up to each rule's limit. Anything above a limit is listed for payout or lapses, as each rule says. Make sure the last month's payroll has been generated first.`}
        confirmLabel="Close year"
        loading={closing}
        onConfirm={handleCloseYear}
        onClose={() => setCloseConfirmOpen(false)}
      />
    </>
  );
}
