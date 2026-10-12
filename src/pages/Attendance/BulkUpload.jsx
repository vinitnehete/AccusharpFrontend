import { useState } from 'react';
import dayjs from 'dayjs';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import EmployeePicker from '../../components/EmployeePicker';
import CsvFileField from '../../components/CsvFileField';
import DataTable from '../../components/DataTable';
import attendanceApi from '../../api/attendance';
import { downloadCsv } from '../../utils/csv';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_COLOR, labelize } from '../../constants/enums';
import { useAuth } from '../../context/AuthContext';

// Mirrors AttendanceCsvParser.java's expected header exactly.
const TEMPLATE_COLUMNS = ['userId', 'fromDate', 'toDate', 'status', 'remarks'];
const TEMPLATE_EXAMPLE = {
  userId: 'DIR001',
  fromDate: '2026-09-01',
  toDate: '2026-09-30',
  status: 'PRESENT',
  remarks: 'Management - exempt from biometric',
};

// Why a day inside an uploaded range was left alone. Reported rather than
// dropped: a range that silently skips four days is a wrong salary a fortnight
// later.
const SKIP_REASON_LABEL = {
  LOCKED: 'Payroll already run — unlock the month first',
  ON_LEAVE: 'Approved leave already covers this day',
  NON_WORKING_DAY: 'Week off or holiday — left as it is',
  NOT_ROSTERED: 'No shift rostered for this date',
};

const APPLIED_COLUMNS = [
  { field: 'userId', headerName: 'User ID', width: 110 },
  { field: 'attendanceDate', headerName: 'Date', width: 120 },
  { field: 'shiftCode', headerName: 'Shift', width: 110 },
  {
    field: 'status',
    headerName: 'Status',
    width: 130,
    renderCell: (params) => (
      <Chip
        size="small"
        label={labelize(params.value)}
        color={ATTENDANCE_STATUS_COLOR[params.value] || 'default'}
      />
    ),
  },
  { field: 'workingHours', headerName: 'Hours', width: 100 },
  { field: 'remarks', headerName: 'Remarks', width: 280 },
];

const SKIPPED_COLUMNS = [
  { field: 'userId', headerName: 'User ID', width: 110 },
  { field: 'date', headerName: 'Date', width: 120 },
  {
    field: 'reason',
    headerName: 'Left alone because',
    width: 340,
    valueGetter: (value) => SKIP_REASON_LABEL[value] || value,
  },
  { field: 'detail', headerName: 'Detail', width: 240 },
];

function Result({ result }) {
  if (!result) return null;
  return (
    <>
      <Alert severity={result.errors?.length > 0 ? 'warning' : 'success'} sx={{ mb: 2.5 }}>
        {result.daysApplied} day(s) recorded, {result.daysSkipped} left alone
        {result.totalRows > 1 ? ` across ${result.totalRows} row(s)` : ''}.
        {result.errors?.length > 0 && (
          <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
            {result.errors.map((e) => (
              <li key={`${e.rowNumber}-${e.identifier}`}>
                {e.identifier || `row ${e.rowNumber}`}: {e.message}
              </li>
            ))}
          </ul>
        )}
      </Alert>

      {result.skipped?.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Days left alone
          </Typography>
          <DataTable
            rows={result.skipped}
            columns={SKIPPED_COLUMNS}
            getRowId={(r) => `${r.userId}-${r.date}`}
            height={280}
            sx={{ mb: 3 }}
          />
        </>
      )}

      {result.applied?.length > 0 && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Days recorded
          </Typography>
          <DataTable
            rows={result.applied}
            columns={APPLIED_COLUMNS}
            getRowId={(r) => `${r.userId}-${r.attendanceDate}`}
            height={420}
          />
        </>
      )}
    </>
  );
}

export default function AttendanceBulkUpload() {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = useAuth();
  const canCorrect = can('ATTENDANCE_CORRECT');
  const [userId, setUserId] = useState(null);
  const [fromDate, setFromDate] = useState(dayjs().startOf('month'));
  const [toDate, setToDate] = useState(dayjs().endOf('month'));
  const [status, setStatus] = useState('PRESENT');
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const canSubmit = canCorrect && userId && fromDate?.isValid() && toDate?.isValid() && !toDate.isBefore(fromDate, 'day') && remarks.trim();

  const run = (call) => {
    setSaving(true);
    setResult(null);
    call
      .then((res) => {
        setResult(res);
        enqueueSnackbar(`${res.daysApplied} day(s) recorded`, {
          variant: res.daysApplied > 0 ? 'success' : 'warning',
        });
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  const handleSubmit = () =>
    run(
      attendanceApi.bulkUpload({
        userId,
        fromDate: fromDate.format('YYYY-MM-DD'),
        toDate: toDate.format('YYYY-MM-DD'),
        status,
        remarks,
      })
    );

  const handleUpload = () => run(attendanceApi.bulkUploadCsv(file));

  const handleTemplate = () =>
    downloadCsv(
      'attendance-bulk-upload-template.csv',
      TEMPLATE_COLUMNS.map((field) => ({ field })),
      [TEMPLATE_EXAMPLE]
    );

  return (
    <>
      <PageHeader
        title="Bulk Attendance Upload"
        subtitle="Declare attendance without punch times — for staff who are not on the biometric device, or any period a device outage left without punches"
      />

      <Alert severity="info" sx={{ mb: 2.5 }}>
        Senior staff marked <strong>&ldquo;does not punch the biometric device&rdquo;</strong> on their
        employee record need nothing uploaded — generating attendance already marks every working day
        present for them. Use this for the exceptions on top: a day one of them was actually absent, or
        a stretch of days for anyone else the device missed. Week offs, holidays and approved leave are
        never overwritten.
      </Alert>

      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            One employee, one stretch of days
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <EmployeePicker label="Employee" value={userId} onChange={setUserId} required />
            </Grid>
            <Grid size={{ xs: 6, sm: 2.5 }}>
              <DatePicker
                label="From"
                value={fromDate}
                onChange={setFromDate}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 2.5 }}>
              <DatePicker
                label="To"
                value={toDate}
                onChange={setToDate}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {ATTENDANCE_STATUS.map((s) => (
                  <MenuItem key={s} value={s}>
                    {labelize(s)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                required
                label="Reason"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                helperText="Recorded on every day this writes — attendance decides pay, so a change to it without a reason is not auditable"
              />
            </Grid>
          </Grid>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!canSubmit || saving}
            sx={{ mt: 2 }}
          >
            Record days
          </Button>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Many employees, from a CSV
          </Typography>
          <Stack spacing={2}>
            <Alert severity="info">
              Expected header (case-insensitive, any order): <code>{TEMPLATE_COLUMNS.join(', ')}</code>.{' '}
              <code>userId</code>, <code>fromDate</code> and <code>remarks</code> are required;{' '}
              <code>toDate</code> defaults to <code>fromDate</code> and <code>status</code> defaults to{' '}
              <code>PRESENT</code>. A whole month for one person is one line.
            </Alert>
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
              <CsvFileField value={file} onChange={setFile} />
              <Button
                size="small"
                startIcon={<DownloadRoundedIcon />}
                onClick={handleTemplate}
                sx={{ ml: { sm: 'auto' } }}
              >
                Download template
              </Button>
            </Stack>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!canCorrect || !file || saving}
              sx={{ alignSelf: 'flex-start' }}
            >
              Upload &amp; record
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Divider sx={{ mb: 2.5 }} />
      <Result result={result} />
    </>
  );
}
