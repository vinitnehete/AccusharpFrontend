import dayjs from 'dayjs';

const yesNo = (v) => (v ? 'Yes' : 'No');

// Full date, not just the time - a night shift's out-punch falls on the next
// calendar day, the same reason the table shows the date beside it.
const punchTime = (v) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '');

/**
 * The Records screen's CSV columns, in the shape downloadCsv reads - every
 * figure on the screen, plus the break, late and early-exit figures HR
 * reconciles a month with.
 *
 * Hours stay decimal (12.25, not "12h 15m") so a spreadsheet can add them up
 * and the month's total matches the totalHours payroll works from.
 */
export const RECORD_CSV_COLUMNS = [
  { field: 'userId', headerName: 'Employee ID' },
  { field: 'attendanceDate', headerName: 'Date' },
  { field: 'day', headerName: 'Day', valueGetter: (_, row) => dayjs(row.attendanceDate).format('ddd') },
  { field: 'shiftCode', headerName: 'Shift', valueGetter: (v) => v || '' },
  { field: 'firstIn', headerName: 'In', valueGetter: punchTime },
  { field: 'lastOut', headerName: 'Out', valueGetter: punchTime },
  { field: 'workingHours', headerName: 'Hours' },
  { field: 'breakHours', headerName: 'Break hours' },
  { field: 'overtimeHours', headerName: 'OT hours' },
  { field: 'lateMinutes', headerName: 'Late (min)' },
  { field: 'earlyExitMinutes', headerName: 'Early exit (min)' },
  { field: 'status', headerName: 'Status' },
  { field: 'weekOff', headerName: 'Weekly off', valueGetter: yesNo },
  { field: 'holiday', headerName: 'Holiday', valueGetter: yesNo },
  { field: 'recordStatus', headerName: 'Source' },
  { field: 'locked', headerName: 'Locked', valueGetter: yesNo },
  { field: 'remarks', headerName: 'Remarks', valueGetter: (v) => v || '' },
];

export function recordsCsvFilename(userId, month) {
  return `attendance-records-${userId}-${month}.csv`;
}
