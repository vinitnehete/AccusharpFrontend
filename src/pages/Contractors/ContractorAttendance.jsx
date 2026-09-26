import { useState } from 'react';
import dayjs from 'dayjs';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusChip from '../../components/StatusChip';
import ContractorPicker from '../../components/ContractorPicker';
import contractorsApi from '../../api/contractors';
import { ATTENDANCE_STATUS_COLOR } from '../../constants/enums';
import { useAuth } from '../../context/AuthContext';

const formatPunch = (value) => (value ? dayjs(value).format('DD MMM, HH:mm') : '—');

/**
 * Generates attendance for one contractor's workforce.
 *
 * It is the same engine the company Attendance Console runs — same punch
 * windows, same night-shift handover, same policy rules, same preservation of
 * manual corrections — pointed at a different population. Running "everyone"
 * from the company console never touches these people, and this never touches
 * the company's own staff.
 */
export default function ContractorAttendance() {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = useAuth();
  const canGenerate = can('CONTRACTOR_MANAGE') && can('ATTENDANCE_GENERATE');

  const [contractorId, setContractorId] = useState(null);
  const [month, setMonth] = useState(dayjs());
  const [overwriteManual, setOverwriteManual] = useState(false);
  const [includeUnrostered, setIncludeUnrostered] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const run = (dryRun) => {
    setSaving(true);
    setResult(null);
    contractorsApi
      .generateAttendance(contractorId, {
        month: month.format('YYYY-MM'),
        overwriteManual,
        dryRun,
        includeUnrostered,
      })
      .then((res) => {
        setResult(res);
        enqueueSnackbar(
          dryRun
            ? `Previewed ${res.employeesProcessed} worker(s) — nothing was saved`
            : `Generated attendance for ${res.employeesProcessed} worker(s)`,
          { variant: dryRun ? 'info' : 'success' }
        );
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  const changes = result?.changes ?? [];

  const columns = [
    { field: 'userId', headerName: 'Device ID', width: 120 },
    {
      field: 'date',
      headerName: 'Date',
      width: 120,
      valueFormatter: (value) => (value ? dayjs(value).format('DD MMM YYYY') : ''),
    },
    { field: 'shiftCode', headerName: 'Shift', width: 100 },
    {
      field: 'newStatus',
      headerName: 'Status',
      width: 150,
      renderCell: ({ value }) => <StatusChip value={value} colorMap={ATTENDANCE_STATUS_COLOR} />,
    },
    {
      field: 'newFirstIn',
      headerName: 'First in',
      width: 160,
      valueFormatter: (value) => formatPunch(value),
    },
    {
      field: 'newLastOut',
      headerName: 'Last out',
      width: 160,
      valueFormatter: (value) => formatPunch(value),
    },
  ];

  return (
    <>
      <PageHeader
        title="Contractor Attendance"
        subtitle="Turns your biometric punches into the attendance record you send the contractor. Kept entirely separate from your own staff's runs — generating one never touches the other."
        actions={
          <Stack direction="row" spacing={1.5}>
            <ContractorPicker value={contractorId} onChange={setContractorId} autoSelectFirst />
            <DatePicker
              label="Month"
              views={['year', 'month']}
              value={month}
              onChange={setMonth}
              slotProps={{ textField: { size: 'small' } }}
            />
            {canGenerate && (
              <>
                <Button
                  variant="outlined"
                  onClick={() => run(true)}
                  disabled={saving || !month || !contractorId}
                >
                  Preview
                </Button>
                <Button
                  variant="contained"
                  onClick={() => run(false)}
                  disabled={saving || !month || !contractorId}
                >
                  Generate
                </Button>
              </>
            )}
          </Stack>
        }
      />

      {!contractorId ? (
        <Alert severity="info">Pick a contractor to generate their workers' attendance.</Alert>
      ) : (
        <>
          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Grid container spacing={1}>
                <Grid size={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={overwriteManual}
                        onChange={(e) => setOverwriteManual(e.target.checked)}
                      />
                    }
                    label="Overwrite manual corrections (only when you deliberately want to discard them)"
                  />
                </Grid>
                <Grid size={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={includeUnrostered}
                        onChange={(e) => setIncludeUnrostered(e.target.checked)}
                      />
                    }
                    label="Mark unrostered days absent"
                  />
                </Grid>
                <Grid size={12}>
                  <Typography variant="body2" color="text.secondary">
                    Leave that off unless you roster this contractor for every calendar day. Their
                    workers are scheduled only for the days they are actually sent in, so an
                    unrostered day means "not deployed" — marking it absent would put a dispute on
                    their invoice rather than surface a rostering gap.
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {result && (
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  {result.dryRun ? 'Preview' : 'Result'} — {result.month}
                </Typography>

                {result.dryRun && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <AlertTitle>Nothing was saved</AlertTitle>
                    This is what Generate would write. Days already locked by payroll, and manual
                    corrections, are left out — they are not rewritten either way.
                  </Alert>
                )}

                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 2, gap: 1 }}>
                  <Chip label={`${result.employeesProcessed} workers processed`} color="primary" />
                  <Chip
                    label={`${result.daysGenerated} days ${result.dryRun ? 'would be generated' : 'generated'}`}
                    color="success"
                  />
                  <Chip label={`${result.manualPreserved} manual corrections preserved`} color="info" />
                  <Chip label={`${result.lockedSkipped} locked (skipped)`} />
                </Stack>

                {result.employeesWithoutRoster?.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Not rostered at all this month: {result.employeesWithoutRoster.join(', ')} — they
                    will have no attendance to report until you schedule them under the Roster tab.
                  </Alert>
                )}

                {result.dryRun &&
                  (changes.length > 0 ? (
                    <>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        {changes.length} day{changes.length === 1 ? '' : 's'} would change
                      </Typography>
                      <DataTable
                        rows={changes}
                        columns={columns}
                        getRowId={(row) => `${row.userId}-${row.date}`}
                        pageSize={25}
                        height={480}
                        density="compact"
                        emptyState={{ title: 'No differences' }}
                      />
                    </>
                  ) : (
                    <Alert severity="success">
                      No day would change. The stored attendance already matches what the punches
                      and the roster produce.
                    </Alert>
                  ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </>
  );
}
