import { RECORD_CSV_COLUMNS, recordsCsvFilename } from './recordsExport';

// One CSV line's values, the way downloadCsv reads each column.
const csvValues = (row) =>
  RECORD_CSV_COLUMNS.map((c) => (c.valueGetter ? c.valueGetter(row[c.field], row) : row[c.field]));

const csvHeaders = () => RECORD_CSV_COLUMNS.map((c) => c.headerName || c.field);

const nightShift = {
  userId: 'SE10285',
  attendanceDate: '2026-08-07',
  shiftCode: 'NIGHT',
  firstIn: '2026-08-07T18:52:10',
  lastOut: '2026-08-08T07:08:45',
  workingHours: 12.25,
  breakHours: 0,
  overtimeHours: 4.25,
  lateMinutes: 0,
  earlyExitMinutes: 51,
  weekOff: false,
  holiday: false,
  status: 'PRESENT',
  recordStatus: 'GENERATED',
  locked: true,
  remarks: null,
};

describe('attendance records CSV export', () => {
  it('has one column per figure on the records screen, plus the ones HR reconciles with', () => {
    expect(csvHeaders()).toEqual([
      'Employee ID',
      'Date',
      'Day',
      'Shift',
      'In',
      'Out',
      'Hours',
      'Break hours',
      'OT hours',
      'Late (min)',
      'Early exit (min)',
      'Status',
      'Weekly off',
      'Holiday',
      'Source',
      'Locked',
      'Remarks',
    ]);
  });

  it('writes a night shift with the out-punch on its own calendar day', () => {
    expect(csvValues(nightShift)).toEqual([
      'SE10285',
      '2026-08-07',
      'Fri',
      'NIGHT',
      '2026-08-07 18:52',
      '2026-08-08 07:08',
      12.25,
      0,
      4.25,
      0,
      51,
      'PRESENT',
      'No',
      'No',
      'GENERATED',
      'Yes',
      '',
    ]);
  });

  it('leaves the punch cells blank on a day with no punches, and marks the holiday', () => {
    const holiday = {
      ...nightShift,
      attendanceDate: '2026-08-15',
      shiftCode: null,
      firstIn: null,
      lastOut: null,
      workingHours: 0,
      overtimeHours: 0,
      earlyExitMinutes: 0,
      holiday: true,
      status: 'HOLIDAY',
      locked: false,
    };

    const values = csvValues(holiday);
    const cell = (header) => values[csvHeaders().indexOf(header)];

    expect(cell('Day')).toBe('Sat');
    expect(cell('Shift')).toBe('');
    expect(cell('In')).toBe('');
    expect(cell('Out')).toBe('');
    expect(cell('Holiday')).toBe('Yes');
    expect(cell('Weekly off')).toBe('No');
    expect(cell('Status')).toBe('HOLIDAY');
    expect(cell('Locked')).toBe('No');
  });

  it('names the file after the employee and the month', () => {
    expect(recordsCsvFilename('SE10285', '2026-08')).toBe('attendance-records-SE10285-2026-08.csv');
  });
});
