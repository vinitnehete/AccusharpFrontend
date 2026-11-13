import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import EmployeePicker from '../../components/EmployeePicker';
import MoneyText from '../../components/MoneyText';
import payrollApi from '../../api/payroll';
import recoveriesApi from '../../api/recoveries';
import RecoveryBalances from '../Recoveries/RecoveryBalances';
import { useActingAs } from '../../context/ActingAsContext';

// The four recovery fields are pre-filled from the employee's loan/advance/fine
// ledger when one is selected, and left blank otherwise. Blank is not zero on
// these: it tells the backend to recover whatever the ledger schedules (see
// PayrollRequest.java), which is what makes Generate All and the CSV run
// collect instalments without anyone typing a figure. Clearing a box back to
// blank restores that behaviour; typing 0 deliberately skips the instalment.
const RECOVERY_FIELDS = [
  { name: 'advanceDeduction', label: 'Advance deduction' },
  { name: 'loanDeduction', label: 'Loan deduction' },
  { name: 'fine', label: 'Fine' },
  { name: 'otherDeduction', label: 'Other deduction' },
];

const MONEY_FIELDS = [
  { name: 'tds', label: 'TDS' },
  { name: 'canteen', label: 'Canteen' },
  { name: 'bonus', label: 'Bonus' },
  { name: 'incentive', label: 'Incentive' },
];

function Field({ label, value }) {
  return (
    <Grid size={{ xs: 6, sm: 4, md: 3 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Grid>
  );
}

// Surfaces the backend's stored-vs-live comparison for an employee that
// already has a payroll for this period, so HR sees exactly what changed
// before deciding to regenerate - rather than finding out after the fact.
function PayrollReadiness({ debugRow }) {
  if (!debugRow) return null;
  const issues = [];
  if (debugRow.masterDataDrifted) {
    issues.push({
      title: 'Employee salary details changed after this payroll was generated',
      detail: (
        <>
          Gross salary: <MoneyText value={debugRow.storedGrossSalary} /> (stored) vs{' '}
          <MoneyText value={debugRow.liveGrossSalary} /> (current). PF basic:{' '}
          <MoneyText value={debugRow.storedPfBasic} /> (stored) vs{' '}
          <MoneyText value={debugRow.livePfBasic} /> (current).
        </>
      ),
    });
  }
  if (debugRow.ruleDrifted) {
    issues.push({
      title: 'The salary rule changed after this payroll was generated',
      detail: `Basic+DA ${debugRow.storedRuleBasicDaPercent}% → ${debugRow.liveRuleBasicDaPercent}%, PF ${debugRow.storedRulePfPercent}% → ${debugRow.liveRulePfPercent}%, ESIC ${debugRow.storedRuleEsicPercent}% → ${debugRow.liveRuleEsicPercent}%, day-wise days/month ${debugRow.storedRuleDayWiseDaysInMonth} → ${debugRow.liveRuleDayWiseDaysInMonth}, standard hours/day ${debugRow.storedRuleStandardHoursPerDay} → ${debugRow.liveRuleStandardHoursPerDay}, OT rate ${debugRow.storedRuleOvertimeRateMultiplier}x → ${debugRow.liveRuleOvertimeRateMultiplier}x.`,
    });
  }
  if (issues.length === 0) return null;

  return (
    <Alert severity="warning" sx={{ mb: 2.5 }} data-testid="payroll-warning">
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Payroll readiness — {issues.length} configuration issue{issues.length > 1 ? 's' : ''}{' '}
        {issues.length > 1 ? 'need' : 'needs'} attention
      </Typography>
      <List dense disablePadding sx={{ mb: 0.5 }}>
        {issues.map((issue) => (
          <ListItem key={issue.title} disableGutters disablePadding sx={{ display: 'block', mb: 0.5 }}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'flex-start' }}>
              <WarningAmberRoundedIcon fontSize="small" sx={{ mt: 0.25 }} />
              <Typography variant="body2">
                {issue.title}. {issue.detail}
              </Typography>
            </Stack>
          </ListItem>
        ))}
      </List>
      <Typography variant="body2">
        Regenerating will recalculate this payroll from the current data — review the numbers below
        before you do.
      </Typography>
    </Alert>
  );
}

export default function Generate() {
  const { enqueueSnackbar } = useSnackbar();
  const { actingAs } = useActingAs();
  const [employeeId, setEmployeeId] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [amounts, setAmounts] = useState({ tds: 0, canteen: 0, bonus: 0, incentive: 0 });
  const [recoveries, setRecoveries] = useState({
    advanceDeduction: '',
    loanDeduction: '',
    fine: '',
    otherDeduction: '',
  });
  const [schedule, setSchedule] = useState(null);
  const [recoveryOverrides, setRecoveryOverrides] = useState({});
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [conflict, setConflict] = useState(false);
  const [debugRow, setDebugRow] = useState(null);

  const isValid = employeeId && month >= 1 && month <= 12 && year;

  // Pre-fill from the ledger so HR runs payroll seeing the amounts that are
  // about to apply, rather than typing them from memory or leaving zeros in
  // place that quietly recover nothing.
  useEffect(() => {
    let active = true;
    setSchedule(null);
    setRecoveryOverrides({});
    setRecoveries({ advanceDeduction: '', loanDeduction: '', fine: '', otherDeduction: '' });
    if (!isValid) {
      return;
    }
    recoveriesApi
      .schedule(employeeId, Number(month), Number(year))
      .then((res) => {
        if (!active) return;
        setSchedule(res);
        setRecoveries({
          advanceDeduction: String(res.advanceDeduction ?? ''),
          loanDeduction: String(res.loanDeduction ?? ''),
          fine: String(res.fine ?? ''),
          otherDeduction: String(res.otherDeduction ?? ''),
        });
      })
      .catch(() => {
        if (active) setSchedule(null);
      });
    return () => { active = false; };
  }, [employeeId, month, year]); // eslint-disable-line react-hooks/exhaustive-deps

  // A blank recovery box is sent as null, not 0 - the two mean different
  // things to the backend, and collapsing them would turn "use the schedule"
  // into "skip the instalment".
  const buildPayload = () => ({
    employeeId,
    month: Number(month),
    year: Number(year),
    ...amounts,
    ...Object.fromEntries(
      Object.entries(recoveries).map(([key, value]) => [key, !recoveryOverrides[key] || value === '' ? null : Number(value)])
    ),
    generatedBy: actingAs?.userId,
  });

  const runGenerate = (fn) => {
    setSaving(true);
    setConflict(false);
    fn(buildPayload())
      .then((res) => {
        setResult(res);
        setDebugRow(null);
        // The run just moved the balances - re-read them so the panel isn't
        // showing what was owed before this payroll recovered against it.
        recoveriesApi
          .schedule(employeeId, Number(month), Number(year))
          .then(setSchedule)
          .catch(() => {});
        enqueueSnackbar('Payroll generated', { variant: 'success' });
      })
      .catch((err) => {
        if (err.status === 409) {
          setConflict(true);
          // A conflict means a payroll already exists for this period, which
          // is exactly when the stored-vs-live comparison becomes meaningful
          // - a fresh generation has nothing yet to compare against.
          payrollApi
            .debug(month, year)
            .then((rows) => setDebugRow(rows.find((r) => r.employeeId === employeeId) || null))
            .catch(() => setDebugRow(null));
        }
      })
      .finally(() => setSaving(false));
  };

  return (
    <>
      <PageHeader
        title="Generate Payroll"
        subtitle="One employee, one period. Attendance for the period must already be generated."
        actions={
          <Button variant="contained" onClick={() => runGenerate(payrollApi.generate)} disabled={!isValid || saving}>
            Generate
          </Button>
        }
      />
      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <EmployeePicker label="Employee" value={employeeId} onChange={setEmployeeId} />
            </Grid>
            <Grid size={{ xs: 6, sm: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Month"
                value={month}
                onChange={(e) => setMonth(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Year"
                value={year}
                onChange={(e) => setYear(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </Grid>
            {MONEY_FIELDS.map((f) => (
              <Grid key={f.name} size={{ xs: 6, sm: 4, md: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={f.label}
                  value={amounts[f.name]}
                  onChange={(e) =>
                    setAmounts((prev) => ({ ...prev, [f.name]: e.target.value.replace(/[^0-9.]/g, '') }))
                  }
                />
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            Recoveries
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            Pre-filled from this employee&apos;s loan, advance and fine balances. Leave a box blank to
            recover whatever is scheduled, or type an amount to override it for this period only — an
            explicit 0 skips the instalment. Anything the period can&apos;t afford stays owed and is taken
            from the next one.
          </Typography>
          <Grid container spacing={2}>
            {RECOVERY_FIELDS.map((f) => (
              <Grid key={f.name} size={{ xs: 6, sm: 4, md: 3 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={f.label}
                  value={recoveries[f.name]}
                  placeholder="Scheduled"
                  onChange={(e) => {
                    setRecoveryOverrides((prev) => ({ ...prev, [f.name]: true }));
                    setRecoveries((prev) => ({
                      ...prev,
                      [f.name]: e.target.value.replace(/[^0-9.]/g, ''),
                    }));
                  }}
                />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {schedule && schedule.totalOutstanding > 0 && (
        <RecoveryBalances statement={schedule} title="What this employee owes" />
      )}

      {conflict && (
        <>
          <PayrollReadiness debugRow={debugRow} />
          <Alert
            severity="warning"
            sx={{ mb: 2.5 }}
            action={
              <Button color="inherit" size="small" onClick={() => runGenerate(payrollApi.regenerate)}>
                Regenerate
              </Button>
            }
          >
            This period is already generated. Regenerate to create a new revision (the old one is
            marked superseded).
          </Alert>
        </>
      )}

      {result && (
        <Card>
          <CardHeader
            title={
              <Typography variant="subtitle1">
                {result.employeeName} — {result.month}/{result.year} (revision {result.revision})
              </Typography>
            }
          />
          <CardContent sx={{ pt: 0 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Attendance
            </Typography>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Field label="Working days" value={result.workingDays} />
              <Field label="Present days" value={result.presentDays} />
              <Field label="Paid leave days" value={result.paidLeaveDays} />
              <Field label="LOP days" value={result.lopDays} />
              <Field label="Payable days" value={result.payableDays} />
              <Field label="Overtime hours" value={result.overtimeHours} />
            </Grid>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Earnings
            </Typography>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Field label="Basic + DA" value={<MoneyText value={result.earnBasicDA} />} />
              <Field label="HRA" value={<MoneyText value={result.earnHra} />} />
              <Field label="Conveyance" value={<MoneyText value={result.earnConveyance} />} />
              <Field label="Education" value={<MoneyText value={result.earnEducation} />} />
              <Field label="Medical" value={<MoneyText value={result.earnMedical} />} />
              <Field label="Other" value={<MoneyText value={result.earnOther} />} />
              <Field label="Overtime" value={<MoneyText value={result.otAllowance} />} />
              <Field label="Bonus" value={<MoneyText value={result.bonus} />} />
              <Field label="Incentive" value={<MoneyText value={result.incentive} />} />
              <Field label="Total earnings" value={<MoneyText value={result.totalEarnings} />} />
            </Grid>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Deductions
            </Typography>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              <Field label="PF" value={<MoneyText value={result.pfDeduction} />} />
              <Field label="ESIC" value={<MoneyText value={result.esic} />} />
              <Field label="Professional tax" value={<MoneyText value={result.professionalTax} />} />
              <Field label="MLWF" value={<MoneyText value={result.mlwf} />} />
              <Field label="TDS" value={<MoneyText value={result.tds} />} />
              <Field label="Advance" value={<MoneyText value={result.advanceDeduction} />} />
              <Field label="Loan" value={<MoneyText value={result.loanDeduction} />} />
              <Field label="Fine" value={<MoneyText value={result.fine} />} />
              <Field label="Other deduction" value={<MoneyText value={result.otherDeduction} />} />
              <Field label="Canteen" value={<MoneyText value={result.canteen} />} />
              <Field label="Total deductions" value={<MoneyText value={result.totalDeduction} />} />
            </Grid>

            {Number(result.loanClosingBalance ?? 0) > 0 ||
            Number(result.advanceClosingBalance ?? 0) > 0 ||
            Number(result.fineClosingBalance ?? 0) > 0 ||
            Number(result.otherClosingBalance ?? 0) > 0 ||
            Number(result.recoveryCarriedForward ?? 0) > 0 ? (
              <>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Recovery balances
                </Typography>
                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  <Field label="Loan opening" value={<MoneyText value={result.loanOpeningBalance} />} />
                  <Field label="Loan remaining" value={<MoneyText value={result.loanClosingBalance} />} />
                  <Field label="Advance opening" value={<MoneyText value={result.advanceOpeningBalance} />} />
                  <Field label="Advance remaining" value={<MoneyText value={result.advanceClosingBalance} />} />
                  <Field label="Fine remaining" value={<MoneyText value={result.fineClosingBalance} />} />
                  <Field label="Other remaining" value={<MoneyText value={result.otherClosingBalance} />} />
                </Grid>
                {Number(result.recoveryCarriedForward ?? 0) > 0 && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <MoneyText value={result.recoveryCarriedForward} /> could not be recovered this period
                    without taking net pay below the floor — it stays outstanding and will be deducted from
                    the next payroll.
                  </Alert>
                )}
              </>
            ) : null}

            <Divider sx={{ mb: 2 }} />
            <Typography variant="h6">
              Net salary: <MoneyText value={result.netSalary} />
            </Typography>
          </CardContent>
        </Card>
      )}
    </>
  );
}
