import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import InputAdornment from '@mui/material/InputAdornment';
import Stack from '@mui/material/Stack';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import salaryRulesApi from '../../api/salaryRules';
import employeesApi from '../../api/employees';
import { useAuth } from '../../context/AuthContext';

const NUMBER_FIELDS = [
  { name: 'basicDaPercent', label: 'Basic + DA', suffix: '%' },
  { name: 'basicDaMinimumThreshold', label: 'Basic + DA minimum threshold', suffix: 'INR' },
  { name: 'hraPercent', label: 'HRA (of basic)', suffix: '%' },
  { name: 'conveyancePercent', label: 'Conveyance (of basic)', suffix: '%' },
  { name: 'educationPercent', label: 'Education (of basic)', suffix: '%' },
];

const ESIC_FIELDS = [
  { name: 'pfPercent', label: 'PF rate', suffix: '%' },
  { name: 'esicPercent', label: 'ESIC rate', suffix: '%' },
  { name: 'esicWageCeiling', label: 'ESIC wage ceiling', suffix: 'INR' },
  { name: 'mlwfAmount', label: 'MLWF (June & December only)', suffix: 'INR' },
];

const PT_FIELDS = [
  { name: 'ptUpperThreshold', label: 'PT upper threshold', suffix: 'INR' },
  { name: 'ptUpperAmount', label: 'PT upper amount', suffix: 'INR' },
  { name: 'ptLowerThreshold', label: 'PT lower threshold', suffix: 'INR' },
  { name: 'ptLowerAmount', label: 'PT lower amount', suffix: 'INR' },
];

const OTHER_FIELDS = [
  { name: 'dayWiseDaysInMonth', label: 'Day-wise days in month', suffix: 'days' },
  { name: 'standardHoursPerDay', label: 'Standard hours/day', suffix: 'hrs' },
  { name: 'overtimeRateMultiplier', label: 'Overtime rate multiplier', suffix: 'x' },
  // 0 still guarantees net pay never goes negative; raising it protects a
  // minimum take-home, and whatever a period can't recover under the floor
  // stays owed for the next one rather than being written off.
  {
    name: 'recoveryMinimumNetPercent',
    label: 'Protected net pay (loans & fines cannot go below)',
    suffix: '%',
  },
];

function NumberSection({ title, fieldsList, values, onChange, readOnly }) {
  return (
    <Card sx={{ mb: 2.5 }}>
      <CardHeader title={<Typography variant="subtitle1">{title}</Typography>} />
      <CardContent sx={{ pt: 0 }}>
        <Grid container spacing={2}>
          {fieldsList.map((f) => (
            <Grid key={f.name} size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label={f.label}
                value={values[f.name] ?? ''}
                disabled={readOnly}
                onChange={(e) => onChange(f.name, e.target.value.replace(/[^0-9.]/g, ''))}
                slotProps={{
                  input: { endAdornment: <InputAdornment position="end">{f.suffix}</InputAdornment> },
                }}
              />
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}

export default function SalaryRule() {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = useAuth();
  const canManageRule = can('SALARY_RULE_MANAGE');
  const canRegenerateStructures = can('EMPLOYEE_UPDATE');
  const [values, setValues] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerateConfirmOpen, setRegenerateConfirmOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    salaryRulesApi
      .get()
      .then(setValues)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    setSaving(true);
    const {
      basicDaPercent,
      basicDaMinimumThreshold,
      hraPercent,
      conveyancePercent,
      educationPercent,
      pfPercent,
      esicPercent,
      esicWageCeiling,
      ptUpperThreshold,
      ptUpperAmount,
      ptLowerThreshold,
      ptLowerAmount,
      dayWiseDaysInMonth,
      standardHoursPerDay,
      overtimeRateMultiplier,
      mlwfAmount,
      recoveryMinimumNetPercent,
    } = values;
    salaryRulesApi
      .update({
        basicDaPercent,
        basicDaMinimumThreshold,
        hraPercent,
        conveyancePercent,
        educationPercent,
        pfPercent,
        esicPercent,
        esicWageCeiling,
        ptUpperThreshold,
        ptUpperAmount,
        ptLowerThreshold,
        ptLowerAmount,
        dayWiseDaysInMonth: Number(dayWiseDaysInMonth),
        standardHoursPerDay,
        overtimeRateMultiplier,
        mlwfAmount,
        recoveryMinimumNetPercent,
      })
      .then((updated) => {
        setValues(updated);
        enqueueSnackbar('Salary rule updated', { variant: 'success' });
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  const handleRegenerateAll = () => {
    setRegenerating(true);
    employeesApi
      .regenerateAllSalaryStructures()
      .then((res) => {
        enqueueSnackbar(`Regenerated ${res.regenerated} employee(s) from the current rule`, {
          variant: 'success',
        });
        setRegenerateConfirmOpen(false);
      })
      .catch(() => {})
      .finally(() => setRegenerating(false));
  };

  if (loading) {
    return <Skeleton variant="rounded" height={400} />;
  }

  if (!values) {
    return <Alert severity="error">Could not load the salary rule.</Alert>;
  }

  return (
    <>
      <PageHeader
        title="Salary Rule"
        subtitle="The single company-wide salary breakup rule"
        actions={
          <Stack direction="row" spacing={1.5}>
            {canRegenerateStructures && (
              <Button
                color="inherit"
                startIcon={<RestartAltRoundedIcon />}
                onClick={() => setRegenerateConfirmOpen(true)}
              >
                Regenerate all from rule
              </Button>
            )}
            {canManageRule && (
              <Button variant="contained" onClick={handleSave} disabled={saving}>
                Save changes
              </Button>
            )}
          </Stack>
        }
      />
      <Alert severity="info" sx={{ mb: 2.5 }}>
        The breakup is calculated at the moment an employee is created or updated. Changing a
        percentage here only affects employees you create or update afterward — existing records
        keep what was computed at the time.
      </Alert>
      <NumberSection
        title="Salary breakup"
        fieldsList={NUMBER_FIELDS}
        values={values}
        onChange={handleChange}
        readOnly={!canManageRule}
      />
      <NumberSection
        title="PF, ESIC & MLWF"
        fieldsList={ESIC_FIELDS}
        values={values}
        onChange={handleChange}
        readOnly={!canManageRule}
      />
      <NumberSection
        title="Professional tax slabs"
        fieldsList={PT_FIELDS}
        values={values}
        onChange={handleChange}
        readOnly={!canManageRule}
      />
      <NumberSection
        title="Other"
        fieldsList={OTHER_FIELDS}
        values={values}
        onChange={handleChange}
        readOnly={!canManageRule}
      />

      <ConfirmDialog
        open={regenerateConfirmOpen}
        title="Regenerate all from rule?"
        description="Recomputes Basic + DA, HRA, conveyance and education for every active employee in the company from this rule. Employees with a manual override are skipped."
        confirmLabel="Regenerate"
        loading={regenerating}
        onConfirm={handleRegenerateAll}
        onClose={() => setRegenerateConfirmOpen(false)}
      />
    </>
  );
}
