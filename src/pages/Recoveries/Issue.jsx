import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import EmployeePicker from '../../components/EmployeePicker';
import MoneyText from '../../components/MoneyText';
import RecoveryBalances from './RecoveryBalances';
import recoveriesApi from '../../api/recoveries';
import { RECOVERY_TYPE, RECOVERY_TYPE_LABEL } from '../../constants/enums';
import { useAuth } from '../../context/AuthContext';

const emptyForm = {
  employeeId: null,
  type: 'LOAN',
  principalAmount: '',
  installmentAmount: '',
  tenureMonths: '',
  issuedOn: dayjs(),
  startMonth: '',
  startYear: '',
  reason: '',
  remarks: '',
};

const money = (value) => (value === '' || value === null ? null : Number(value));
const moneyInPaise = (value) => {
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(String(value))) return null;
  const [whole, fraction = ''] = String(value).split('.');
  return Number(whole) * 100 + Number(fraction.slice(0, 2).padEnd(2, '0')) + (Number(fraction[2] || 0) >= 5 ? 1 : 0);
};

export default function IssueRecovery() {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = useAuth();
  const canManage = can('RECOVERY_MANAGE');
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [statement, setStatement] = useState(null);
  const [issued, setIssued] = useState(null);

  const set = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  // What they already owe, so a second loan is never issued blind to the first.
  useEffect(() => {
    let active = true;
    setStatement(null);
    if (!form.employeeId) {
      return;
    }
    recoveriesApi
      .statement(form.employeeId)
      .then((res) => { if (active) setStatement(res); })
      .catch(() => { if (active) setStatement(null); });
    return () => { active = false; };
  }, [form.employeeId, issued]);

  const isLoan = form.type === 'LOAN';

  // Mirrors RecoveryService.resolveInstallment so the figure shown here is the
  // one the server will actually store, rather than a second guess at it.
  const derivedInstallment = useMemo(() => {
    const principal = moneyInPaise(form.principalAmount);
    if (!principal || !Number.isFinite(principal)) return null;
    if (moneyInPaise(form.installmentAmount)) return moneyInPaise(form.installmentAmount) / 100;
    const tenure = money(form.tenureMonths);
    if (isLoan && tenure > 0) return Math.round(principal / tenure) / 100;
    return principal / 100;
  }, [form.principalAmount, form.installmentAmount, form.tenureMonths, isLoan]);

  const issuedDateValid = !form.issuedOn || form.issuedOn.isValid();
  const issueDate = form.issuedOn || dayjs();
  const hasStartPeriod = form.startMonth !== '' || form.startYear !== '';
  const startPeriodValid = !hasStartPeriod || (
    Number.isInteger(money(form.startMonth)) && money(form.startMonth) >= 1 && money(form.startMonth) <= 12 &&
    Number.isInteger(money(form.startYear)) && money(form.startYear) >= 2000 && money(form.startYear) <= 2100 &&
    issuedDateValid && money(form.startYear) * 12 + money(form.startMonth) >= issueDate.year() * 12 + issueDate.month() + 1
  );
  const principalInPaise = moneyInPaise(form.principalAmount);
  const installmentInPaise = moneyInPaise(form.installmentAmount);
  const principalValid = Number.isFinite(principalInPaise) && principalInPaise > 0;
  const installmentValid = form.installmentAmount === '' || (Number.isFinite(installmentInPaise) && installmentInPaise > 0 && installmentInPaise <= principalInPaise);
  const tenureValid = form.tenureMonths === '' || (Number.isInteger(money(form.tenureMonths)) && money(form.tenureMonths) >= 1 && money(form.tenureMonths) <= 600);
  const isValid = canManage && form.employeeId && form.type && principalValid &&
    installmentValid && tenureValid && issuedDateValid && startPeriodValid;

  const handleSubmit = () => {
    if (!isValid) return;
    setSaving(true);
    recoveriesApi
      .issue({
        employeeId: form.employeeId,
        type: form.type,
        principalAmount: money(form.principalAmount),
        installmentAmount: money(form.installmentAmount),
        tenureMonths: money(form.tenureMonths),
        startMonth: money(form.startMonth),
        startYear: money(form.startYear),
        issuedOn: form.issuedOn ? form.issuedOn.format('YYYY-MM-DD') : undefined,
        reason: form.reason || undefined,
        remarks: form.remarks || undefined,
      })
      .then((res) => {
        setIssued(res);
        setForm((prev) => ({ ...emptyForm, employeeId: prev.employeeId, type: prev.type }));
        enqueueSnackbar(`${RECOVERY_TYPE_LABEL[res.type]} raised`, { variant: 'success' });
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  return (
    <>
      <PageHeader
        title="Issue Loan / Advance / Fine"
        subtitle="Payroll recovers this automatically from the start period on — no amount needs typing on the payroll screen"
        actions={
          <Button variant="contained" onClick={handleSubmit} disabled={!isValid || saving}>
            Issue
          </Button>
        }
      />

      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <EmployeePicker label="Employee" value={form.employeeId} onChange={(v) => set('employeeId', v)} required />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Type"
                value={form.type}
                onChange={(e) => set('type', e.target.value)}
              >
                {RECOVERY_TYPE.map((t) => (
                  <MenuItem key={t} value={t}>
                    {RECOVERY_TYPE_LABEL[t]}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <DatePicker
                label={isLoan ? 'Disbursed on' : 'Levied on'}
                value={form.issuedOn}
                onChange={(v) => set('issuedOn', v)}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>

            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                required
                label={isLoan ? 'Loan amount' : 'Amount'}
                value={form.principalAmount}
                onChange={(e) => set('principalAmount', e.target.value.replace(/[^0-9.-]/g, ''))}
                error={form.principalAmount !== '' && !principalValid}
                helperText={form.principalAmount !== '' && !principalValid ? 'Enter an amount of at least 0.01' : undefined}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Monthly instalment"
                value={form.installmentAmount}
                onChange={(e) => set('installmentAmount', e.target.value.replace(/[^0-9.-]/g, ''))}
                error={!installmentValid}
                helperText={!installmentValid ? 'Enter a positive amount no greater than the principal' : isLoan ? 'Or give a tenure instead' : 'Blank recovers it in full'}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Tenure (months)"
                value={form.tenureMonths}
                onChange={(e) => set('tenureMonths', e.target.value.replace(/[^0-9-]/g, ''))}
                disabled={!!form.installmentAmount}
                error={!tenureValid}
                helperText={!tenureValid ? 'Enter 1 to 600 months' : undefined}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth
                  size="small"
                  label="Start month"
                  value={form.startMonth}
                  onChange={(e) => set('startMonth', e.target.value.replace(/[^0-9-]/g, ''))}
                  error={!startPeriodValid}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Start year"
                  value={form.startYear}
                  onChange={(e) => set('startYear', e.target.value.replace(/[^0-9-]/g, ''))}
                  error={!startPeriodValid}
                />
              </Stack>
              {!startPeriodValid && <Typography variant="caption" color="error">
                Enter both a month (1–12) and year (2000–2100), from the issue month onward.
              </Typography>}
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label={isLoan ? 'Purpose' : 'Reason'}
                value={form.reason}
                onChange={(e) => set('reason', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Remarks"
                value={form.remarks}
                onChange={(e) => set('remarks', e.target.value)}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary">
            {derivedInstallment ? (
              <>
                Payroll will recover <MoneyText value={derivedInstallment} /> each period from{' '}
                {form.startMonth && form.startYear
                  ? `${form.startMonth}/${form.startYear}`
                  : isLoan
                    ? 'the month after it was disbursed'
                    : 'the month it was raised'}
                , stopping when the balance reaches zero. A period that cannot afford the full
                instalment recovers what it can and carries the rest to the next one.
              </>
            ) : (
              'Enter an amount to see what payroll will recover each period.'
            )}
          </Typography>
        </CardContent>
      </Card>

      {issued && (
        <Alert severity="success" sx={{ mb: 2.5 }}>
          {RECOVERY_TYPE_LABEL[issued.type]} of <MoneyText value={issued.principalAmount} /> raised for{' '}
          {issued.employeeName || issued.employeeId} — <MoneyText value={issued.installmentAmount} /> per
          period from {issued.startMonth}/{issued.startYear}
          {issued.remainingInstallments ? ` (about ${issued.remainingInstallments} period(s))` : ''}.
        </Alert>
      )}

      {statement && <RecoveryBalances statement={statement} />}
    </>
  );
}
