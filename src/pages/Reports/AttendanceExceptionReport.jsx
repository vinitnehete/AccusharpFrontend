import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import ScopedReportPage from './ScopedReportPage';
import reportsApi from '../../api/reports';
import { formatHours } from '../../utils/hours';

const time = (value) => (value ? String(value).slice(11, 16) : '—');

const columns = [
  { field: 'employeeCode', headerName: 'Code', width: 120 },
  { field: 'employeeName', headerName: 'Employee', width: 170 },
  { field: 'departmentName', headerName: 'Department', width: 140 },
  { field: 'date', headerName: 'Date', width: 115 },
  { field: 'dayOfWeek', headerName: 'Day', width: 80 },
  { field: 'shiftCode', headerName: 'Shift', width: 120 },
  { field: 'status', headerName: 'Status', width: 120 },
  {
    field: 'firstIn',
    headerName: 'First in',
    width: 100,
    valueGetter: (value) => time(value),
  },
  {
    field: 'lastOut',
    headerName: 'Last out',
    width: 100,
    valueGetter: (value) => time(value),
  },
  { field: 'workingHours', headerName: 'Hours', width: 100, valueFormatter: formatHours },
  {
    field: 'exceptions',
    headerName: 'Exceptions',
    width: 300,
    renderCell: (params) => (
      <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
        {String(params.value || '')
          .split(', ')
          .filter(Boolean)
          .map((label) => (
            <Chip
              key={label}
              size="small"
              label={label}
              color={label === 'Absent' ? 'error' : label.startsWith('Missed') ? 'warning' : 'default'}
              variant={label === 'Absent' ? 'filled' : 'outlined'}
            />
          ))}
      </Stack>
    ),
  },
  { field: 'recordStatus', headerName: 'Source', width: 110 },
  {
    field: 'locked',
    headerName: 'Locked',
    width: 100,
    renderCell: (params) => (params.value ? <Chip size="small" label="Locked" /> : '—'),
  },
  { field: 'remarks', headerName: 'Remarks', width: 220 },
];

export default function AttendanceExceptionReport() {
  return (
    <ScopedReportPage
      title="Attendance Exceptions"
      subtitle="Every day in the month that needs explaining — late in, early out, a missed punch, or an absence on a day the employee was rostered to work"
      period="month"
      fetchFn={reportsApi.attendanceExceptions}
      exportFn={reportsApi.attendanceExceptionsCsv}
      columns={columns}
      getRowId={(row) => `${row.userId}-${row.date}`}
      emptyDescription="No exceptions in this month — or attendance has not been generated for it yet."
    />
  );
}
