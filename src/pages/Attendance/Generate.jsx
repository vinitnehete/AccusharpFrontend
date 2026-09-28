import { useState } from 'react';
import dayjs from 'dayjs';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import ArrowRightAltRoundedIcon from '@mui/icons-material/ArrowRightAltRounded';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import EmployeeMultiPicker from '../../components/EmployeeMultiPicker';
import StatusChip from '../../components/StatusChip';
import attendanceApi from '../../api/attendance';
import { ATTENDANCE_STATUS_COLOR } from '../../constants/enums';
import { useActingAs } from '../../context/ActingAsContext';
import { useAuth } from '../../context/AuthContext';

const formatPunch = (value) => (value ? dayjs(value).format('DD MMM, HH:mm') : '—');

/**
 * Renders one field's before and after side by side. A day only appears in the
 * preview when something about it actually moves, so the pair is always worth
 * showing - but the "before" is empty for a day that has never been generated,
 * which reads as a new row rather than a change.
 */
function BeforeAfter({ before, after, render }) {
  const unchanged = before === after;
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', minWidth: 0 }}>
      <Box component="span" sx={{ color: 'text.disabled', textDecoration: unchanged ? 'none' : 'line-through' }}>
        {before == null ? '—' : render(before)}
      </Box>
      {!unchanged && (
        <>
          <ArrowRightAltRoundedIcon fontSize="small" sx={{ color: 'text.disabled', flexShrink: 0 }} />
          <Box component="span">{render(after)}</Box>
        </>
      )}
    </Stack>
  );
}

export default function Generate() {
  const { enqueueSnackbar } = useSnackbar();
  const { actingAs } = useActingAs();
  const { can } = useAuth();
  const canGenerate = can('ATTENDANCE_GENERATE');
  const [month, setMonth] = useState(dayjs());
  const [userIds, setUserIds] = useState([]);
  const [overwriteManual, setOverwriteManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const run = (dryRun) => {
    setSaving(true);
    setResult(null);
    attendanceApi
      .generate({
        month: month.format('YYYY-MM'),
        userIds: userIds.length > 0 ? userIds : undefined,
        generatedBy: actingAs?.userId,
        overwriteManual,
        dryRun,
      })
      .then((res) => {
        setResult(res);
        enqueueSnackbar(
          dryRun
            ? `Previewed ${res.employeesProcessed} employee(s) — nothing was saved`
            : `Generated attendance for ${res.employeesProcessed} employee(s)`,
          { variant: dryRun ? 'info' : 'success' },
        );
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  const changes = result?.changes ?? [];

  const columns = [
    { field: 'userId', headerName: 'Employee', width: 120 },
    {
      field: 'date',
      headerName: 'Date',
      width: 120,
      valueFormatter: (value) => (value ? dayjs(value).format('DD MMM YYYY') : ''),
    },
    { field: 'shiftCode', headerName: 'Shift', width: 100 },
    {
      field: 'status',
      headerName: 'Status',
      width: 260,
      sortable: false,
      renderCell: ({ row }) => (
        <BeforeAfter
          before={row.previousStatus}
          after={row.newStatus}
          render={(value) => <StatusChip value={value} colorMap={ATTENDANCE_STATUS_COLOR} />}
        />
      ),
    },
    {
      field: 'firstIn',
      headerName: 'First in',
      width: 220,
      sortable: false,
      renderCell: ({ row }) => (
        <BeforeAfter before={row.previousFirstIn} after={row.newFirstIn} render={formatPunch} />
      ),
    },
    {
      field: 'lastOut',
      headerName: 'Last out',
      width: 220,
      sortable: false,
      renderCell: ({ row }) => (
        <BeforeAfter before={row.previousLastOut} after={row.newLastOut} render={formatPunch} />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Generate Attendance"
        subtitle="Turns punches into the attendance record payroll pays from. Rerun freely — manual corrections survive unless you choose to overwrite them."
        actions={
          canGenerate && (
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => run(true)} disabled={saving || !month}>
                Preview changes
              </Button>
              <Button variant="contained" onClick={() => run(false)} disabled={saving || !month}>
                Generate
              </Button>
            </Stack>
          )
        }
      />
      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <DatePicker
                label="Month"
                views={['year', 'month']}
                value={month}
                onChange={setMonth}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <EmployeeMultiPicker
                label="Employees (leave empty for the whole company)"
                value={userIds}
                onChange={setUserIds}
              />
            </Grid>
            <Grid size={12}>
              <FormControlLabel
                control={
                  <Switch checked={overwriteManual} onChange={(e) => setOverwriteManual(e.target.checked)} />
                }
                label="Overwrite manual corrections (only when you deliberately want to discard them)"
              />
            </Grid>
            <Grid size={12}>
              <Typography variant="body2" color="text.secondary">
                Regenerating a past month can move its loss of pay, and therefore its pay. Preview
                first — it computes exactly what Generate would write, and writes nothing.
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

            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 2 }}>
              <Chip label={`${result.employeesProcessed} employees processed`} color="primary" />
              <Chip
                label={`${result.daysGenerated} days ${result.dryRun ? 'would be generated' : 'generated'}`}
                color="success"
              />
              <Chip label={`${result.manualPreserved} manual corrections preserved`} color="info" />
              <Chip label={`${result.lockedSkipped} locked (skipped)`} />
            </Stack>

            {result.employeesWithoutRoster?.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                No roster for: {result.employeesWithoutRoster.join(', ')} — they will read as fully
                absent until scheduled.
              </Alert>
            )}

            {result.dryRun && (
              changes.length > 0 ? (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {changes.length} day{changes.length === 1 ? '' : 's'} would change
                  </Typography>
                  <DataTable
                    rows={changes}
                    columns={columns}
                    getRowId={(row) => `${row.userId}-${row.date}`}
                    pageSize={25}
                    height={520}
                    density="compact"
                    emptyState={{ title: 'No differences' }}
                  />
                </>
              ) : (
                <Alert severity="success">
                  No day would change. The stored attendance already matches what the punches and
                  the roster produce.
                </Alert>
              )
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}
