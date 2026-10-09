import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import EmployeePicker from '../../components/EmployeePicker';
import attendanceApi from '../../api/attendance';
import shiftsApi from '../../api/shifts';
import { ATTENDANCE_STATUS } from '../../constants/enums';
import { useActingAs } from '../../context/ActingAsContext';
import { formatHours } from '../../utils/hours';
import { useAuth } from '../../context/AuthContext';
import { downloadCsv } from '../../utils/csv';
import { RECORD_CSV_COLUMNS, recordsCsvFilename } from './recordsExport';
import { sandwichMark } from './sandwichMark';
import DayChip from './DayChip';
import { withoutDaysToCome } from './runningMonth';

function CorrectionDialog({ open, record, userId, onClose, onSaved }) {
  const { enqueueSnackbar } = useSnackbar();
  const { actingAs } = useActingAs();
  const [firstIn, setFirstIn] = useState(null);
  const [lastOut, setLastOut] = useState(null);
  const [status, setStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [shiftCode, setShiftCode] = useState('');
  const [shifts, setShifts] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !record) return;
    setFirstIn(record.firstIn ? dayjs(record.firstIn) : null);
    setLastOut(record.lastOut ? dayjs(record.lastOut) : null);
    setStatus('');
    setRemarks('');
    setShiftCode('');
  }, [open, record]);

  // Only a day with no shift needs one chosen, so the catalogue is fetched only
  // then. Failing to load it just leaves the picker empty.
  useEffect(() => {
    if (!open || !record || record.shiftCode) return;
    shiftsApi.list().then(setShifts).catch(() => setShifts([]));
  }, [open, record]);

  // Mirrors the backend's own rule (AttendanceCorrectionRequest): both times together,
  // or neither - a lone firstIn/lastOut would be silently dropped server-side otherwise.
  const bothTimesGiven = !!firstIn && !!lastOut;
  const noTimesGiven = !firstIn && !lastOut;
  const timesConsistent = noTimesGiven || (bothTimesGiven && lastOut.isAfter(firstIn));
  // A day with no shift has nothing to measure times against - generation wrote
  // it blank for exactly that reason - so times need a shift chosen alongside
  // them. Without one the day could only be saved by forcing a status, with
  // zero hours, which is the bug this picker exists to prevent.
  const needsShift = bothTimesGiven && !record?.shiftCode;
  const isValid = remarks.trim().length > 0 && timesConsistent && (bothTimesGiven || !!status)
    && (!needsShift || !!shiftCode);

  const handleSubmit = () => {
    setSaving(true);
    const payload = { remarks, updatedBy: actingAs?.userId };
    if (bothTimesGiven) {
      payload.firstIn = firstIn.format('YYYY-MM-DDTHH:mm:ss');
      payload.lastOut = lastOut.format('YYYY-MM-DDTHH:mm:ss');
    }
    if (status) {
      payload.status = status;
    }
    if (needsShift && shiftCode) {
      payload.shiftCode = shiftCode;
    }
    attendanceApi
      .correct(userId, record.attendanceDate, payload)
      .then(() => {
        enqueueSnackbar('Attendance corrected', { variant: 'success' });
        onSaved();
        onClose();
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  if (!record) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Correct {dayjs(record.attendanceDate).format('DD MMM YYYY')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Supply the real punch times, declare a status outright, or both - an explicit status
          always labels the day, but hours/overtime are only ever computed from real times.
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DateTimePicker
              label="First in"
              value={firstIn}
              onChange={setFirstIn}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  InputProps: firstIn
                    ? {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setFirstIn(null)} edge="end">
                              <ClearRoundedIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }
                    : undefined,
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <DateTimePicker
              label="Last out"
              value={lastOut}
              onChange={setLastOut}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  InputProps: lastOut
                    ? {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setLastOut(null)} edge="end">
                              <ClearRoundedIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }
                    : undefined,
                },
              }}
            />
          </Grid>
        </Grid>
        {!timesConsistent && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
            {noTimesGiven || bothTimesGiven
              ? 'Last out must be after first in.'
              : 'Provide both first in and last out, or clear both and declare a status instead.'}
          </Typography>
        )}
        {record.shiftCode ? (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: 'block' }}>
            Shift: <strong>{record.shiftCode}</strong> — the times are measured against it. To change
            a rostered shift, use the Roster planner.
          </Typography>
        ) : (
          <TextField
            select
            fullWidth
            size="small"
            label={needsShift ? 'Shift worked (required)' : 'Shift worked'}
            value={shiftCode}
            onChange={(e) => setShiftCode(e.target.value)}
            error={needsShift && !shiftCode}
            helperText="This day has no shift, so there is nothing to measure the times against. The shift you pick is added to the roster for this day."
            sx={{ mt: 2 }}
          >
            {shifts.map((s) => (
              <MenuItem key={s.shiftCode} value={s.shiftCode}>
                {s.shiftCode} — {s.shiftName}
              </MenuItem>
            ))}
          </TextField>
        )}
        <TextField
          select
          fullWidth
          size="small"
          label={bothTimesGiven ? 'Declare status (optional override)' : 'Declare status'}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          helperText={
            bothTimesGiven
              ? 'Leave unset to let the status follow the times above.'
              : 'Required when no punch times are supplied - hours will follow the shift, not real punches.'
          }
          sx={{ mt: 2 }}
        >
          <MenuItem value="">
            <em>{bothTimesGiven ? 'No override - use computed status' : 'Select a status'}</em>
          </MenuItem>
          {ATTENDANCE_STATUS.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          fullWidth
          size="small"
          multiline
          minRows={2}
          required
          label="Remarks (required)"
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!isValid || saving}>
          Save correction
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function Records() {
  const { enqueueSnackbar } = useSnackbar();
  const { actingAs } = useActingAs();
  const { can } = useAuth();
  const canCorrect = can('ATTENDANCE_CORRECT');
  const canUnlock = can('ATTENDANCE_UNLOCK');
  const canGenerate = can('ATTENDANCE_GENERATE');
  const [userId, setUserId] = useState(null);
  const [month, setMonth] = useState(dayjs());
  const [rows, setRows] = useState([]);
  const [sandwich, setSandwich] = useState(null);
  // The person's work policy leaves attendance untracked: generation skips them, so
  // "generate attendance first" would send HR on an errand that never ends.
  const [untracked, setUntracked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [correcting, setCorrecting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (!userId || !month) {
      setRows([]);
      setSandwich(null);
      setUntracked(false);
      return;
    }
    setLoading(true);
    attendanceApi
      .records(userId, month.format('YYYY-MM'))
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
    // The days a sandwich rule made unpaid - their own status does not change.
    attendanceApi
      .monthly(userId, month.format('YYYY-MM'))
      .then((summary) => {
        setSandwich(sandwichMark(summary.sandwich));
        setUntracked(summary.attendanceTracked === false);
      })
      .catch(() => {
        setSandwich(null);
        setUntracked(false);
      });
  };

  useEffect(load, [userId, month]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUnlock = () => {
    if (!userId || !month) return;
    setBusy(true);
    attendanceApi
      .unlock(userId, month.format('YYYY-MM'), actingAs?.userId)
      .then((res) => {
        enqueueSnackbar(`Unlocked ${res.unlockedDays} day(s)`, { variant: 'success' });
        load();
      })
      .catch(() => {})
      .finally(() => setBusy(false));
  };

  const handleRefresh = () => {
    if (!month) return;
    setBusy(true);
    attendanceApi
      .refreshSummaries(month.format('YYYY-MM'))
      .then(() => enqueueSnackbar('Summaries refreshed', { variant: 'success' }))
      .catch(() => {})
      .finally(() => setBusy(false));
  };

  // Generating a month that is still running stores every day of it, the days to
  // come as red ABSENT rows with an edit button. The table lists what has
  // happened (and the coming days that already mean something); the CSV export
  // below still takes every stored row, because that is data, not a view.
  const today = dayjs().format('YYYY-MM-DD');
  const shown = withoutDaysToCome(rows, today);
  // One punch is INVALID_PUNCH on a day that is over - and on the day still going on.
  // A month that has not begun: nothing in it has happened and nobody has touched a day.
  const notStarted = rows.length > 0 && rows.every((r) => r.attendanceDate > today && r.recordStatus !== 'MANUAL' && !r.locked);
  const lonePunches = rows.filter((r) => r.status === 'INVALID_PUNCH' && r.attendanceDate !== today).length;

  const columns = [
    {
      field: 'attendanceDate',
      headerName: 'Date',
      width: 130,
      valueFormatter: (v) => (v ? dayjs(v).format('DD MMM YYYY') : ''),
    },
    { field: 'shiftCode', headerName: 'Shift', width: 90 },
    {
      // Date included, not just time - a night shift's lastOut (and sometimes
      // firstIn) falls on the next calendar day, and "07:17" alone doesn't
      // say which day that is.
      field: 'firstIn',
      headerName: 'In',
      width: 150,
      valueFormatter: (v) => (v ? dayjs(v).format('DD MMM, HH:mm') : '-'),
    },
    {
      field: 'lastOut',
      headerName: 'Out',
      width: 150,
      valueFormatter: (v) => (v ? dayjs(v).format('DD MMM, HH:mm') : '-'),
    },
    { field: 'workingHours', headerName: 'Hours', width: 90, valueFormatter: formatHours },
    { field: 'overtimeHours', headerName: 'OT', width: 80, valueFormatter: formatHours },
    {
      field: 'status',
      headerName: 'Status',
      width: 210,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', height: '100%' }}>
          <DayChip day={params.row} today={today} />
          {sandwich?.dates.has(params.row.attendanceDate) && (
            <Chip size="small" color="warning" variant="outlined" label="Unpaid (sandwich)" />
          )}
        </Stack>
      ),
    },
    {
      field: 'recordStatus',
      headerName: 'Source',
      width: 100,
      renderCell: (params) =>
        params.value && (
          <Chip
            label={params.value}
            size="small"
            color={params.value === 'MANUAL' ? 'secondary' : 'default'}
          />
        ),
    },
    {
      field: 'locked',
      headerName: 'Locked',
      width: 90,
      renderCell: (params) => (params.value ? <Chip label="Locked" size="small" color="error" /> : null),
    },
    { field: 'remarks', headerName: 'Remarks', flex: 1, minWidth: 160 },
    {
      field: 'actions',
      headerName: '',
      sortable: false,
      filterable: false,
      width: 70,
      renderCell: (params) =>
        canCorrect && (
          <Tooltip title={params.row.locked ? 'Unlock the month first' : 'Correct'}>
            <span>
              <IconButton size="small" disabled={params.row.locked} onClick={() => setCorrecting(params.row)}>
                <EditRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        ),
    },
  ];

  // The month's total worked and overtime hours, summed from the same rows
  // the table shows - lets HR see at a glance that it matches the monthly
  // summary without adding the day rows up by hand. @mui/x-data-grid (no
  // -pro license here) has no row-pinning/footer-aggregation of its own, so
  // this renders as a line under the table instead of a row inside it.
  const totalWorkingHours = shown.reduce((sum, r) => sum + Number(r.workingHours || 0), 0);
  const totalOvertimeHours = shown.reduce((sum, r) => sum + Number(r.overtimeHours || 0), 0);

  return (
    <>
      <PageHeader
        title="Attendance Records"
        subtitle="Review generated days, fix device misses, and manage locks before payroll"
        actions={
          <>
            <EmployeePicker label="Employee" value={userId} onChange={setUserId} />
            <DatePicker
              label="Month"
              views={['year', 'month']}
              value={month}
              onChange={setMonth}
              slotProps={{ textField: { size: 'small' } }}
            />
            {canUnlock && (
              <Button startIcon={<LockOpenRoundedIcon />} onClick={handleUnlock} disabled={!userId || busy}>
                Unlock month
              </Button>
            )}
            {canGenerate && (
              <Button startIcon={<RefreshRoundedIcon />} onClick={handleRefresh} disabled={busy}>
                Refresh summaries
              </Button>
            )}
            <Button
              startIcon={<DownloadRoundedIcon />}
              onClick={() =>
                downloadCsv(recordsCsvFilename(userId, month.format('YYYY-MM')), RECORD_CSV_COLUMNS, rows)
              }
              disabled={!userId || !month || rows.length === 0 || loading}
            >
              Export CSV
            </Button>
          </>
        }
      />
      {!userId ? (
        <Alert severity="info">Pick an employee to see their attendance records.</Alert>
      ) : rows.length === 0 && !loading ? (
        untracked ? (
          <Alert severity="info">
            This person&apos;s attendance is not tracked - their work policy expects no punches - so there is
            nothing to generate or correct.
          </Alert>
        ) : (
          <Alert severity="info">
            No records for this month yet — generate attendance first from the Generate tab.
          </Alert>
        )
      ) : notStarted && !loading ? (
        <Alert severity="info">This month has not started yet - its days will appear here as they pass.</Alert>
      ) : (
        <>
          {lonePunches > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }} data-testid="attendance-warning">
              {lonePunches} day(s) have a single punch
              only — correct them below before payroll is generated.
            </Alert>
          )}
          {sandwich && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {sandwich.text}
            </Alert>
          )}
          <DataTable rows={shown} columns={columns} loading={loading} height={560} density="compact" />
          <Stack
            direction="row"
            spacing={3}
            sx={{ mt: 1.5, px: 1 }}
            data-testid="attendance-records-totals"
          >
            <Typography variant="body2" color="text.secondary">
              Total hours: <strong>{formatHours(totalWorkingHours)}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total overtime: <strong>{formatHours(totalOvertimeHours)}</strong>
            </Typography>
          </Stack>
        </>
      )}

      <CorrectionDialog
        open={!!correcting}
        record={correcting}
        userId={userId}
        onClose={() => setCorrecting(null)}
        onSaved={load}
      />
    </>
  );
}
