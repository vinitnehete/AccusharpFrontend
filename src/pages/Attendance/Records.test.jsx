import { fireEvent, render, screen } from '@testing-library/react';
import Records from './Records';
import attendanceApi from '../../api/attendance';
import { downloadCsv } from '../../utils/csv';

jest.mock('../../api/attendance', () => ({
  records: jest.fn(),
  monthly: jest.fn(),
  correct: jest.fn(),
  unlock: jest.fn(),
  refreshSummaries: jest.fn(),
}));
jest.mock('../../api/shifts', () => ({ list: jest.fn().mockResolvedValue([]) }));
jest.mock('../../utils/csv', () => ({ downloadCsv: jest.fn() }));
jest.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: jest.fn() }) }));
jest.mock('../../context/AuthContext', () => ({ useAuth: () => ({ can: () => true }) }));
jest.mock('../../context/ActingAsContext', () => ({ useActingAs: () => ({ actingAs: { userId: 'HR001' } }) }));
// The pickers need a localisation provider this test has no use for.
jest.mock('@mui/x-date-pickers/DatePicker', () => ({ DatePicker: () => null }));
jest.mock('@mui/x-date-pickers/DateTimePicker', () => ({ DateTimePicker: () => null }));
// HR has picked a person already.
jest.mock('../../components/EmployeePicker', () => {
  const React = require('react');
  return function PickedEmployee({ onChange }) {
    React.useEffect(() => {
      onChange('EMP001');
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return null;
  };
});

// The page reads "today" from the clock, so the clock is fixed: Saturday 3 Oct 2026, mid-morning.
const TODAY = '2026-10-03';
const iso = (n) => `2026-10-${String(n).padStart(2, '0')}`;

const stored = (n, status, extra = {}) => ({
  id: n,
  userId: 'EMP001',
  attendanceDate: iso(n),
  shiftCode: 'GENERAL',
  firstIn: null,
  lastOut: null,
  workingHours: 0,
  breakHours: 0,
  overtimeHours: 0,
  lateMinutes: 0,
  earlyExitMinutes: 0,
  invalidPunch: false,
  weekOff: status === 'WEEKLY_OFF',
  holiday: status === 'HOLIDAY',
  status,
  recordStatus: 'GENERATED',
  locked: false,
  remarks: null,
  ...extra,
});

/**
 * October after HR pressed "Generate" on the 3rd: every day of the month is
 * stored, the ones that have not happened as ABSENT with no punches.
 */
const generatedRunningMonth = (dayOver = {}) =>
  Array.from({ length: 31 }, (_, i) => i + 1).map((n) => {
    if (n === 1) return stored(n, 'PRESENT', { firstIn: '2026-10-01T09:00:00', lastOut: '2026-10-01T18:00:00', workingHours: 8 });
    if (n === 2) return stored(n, 'HOLIDAY');
    if (n === 3) return stored(n, 'ABSENT', dayOver);
    if ([4, 11, 18, 25].includes(n)) return stored(n, 'WEEKLY_OFF');
    return stored(n, 'ABSENT');
  });

const summary = (over = {}) => ({ attendanceTracked: true, sandwich: { holidays: [], leaveDates: [], leaveDays: 0 }, ...over });

beforeAll(() => {
  jest.useFakeTimers('modern');
});
afterAll(() => jest.useRealTimers());

beforeEach(() => {
  jest.setSystemTime(new Date(`${TODAY}T10:00:00`));
  jest.clearAllMocks();
  attendanceApi.records.mockResolvedValue(generatedRunningMonth());
  attendanceApi.monthly.mockResolvedValue(summary());
});

describe('Attendance Records, for a month that was generated while it was still running', () => {
  it('lists the days up to today and the coming days that already mean something, not every generated absence', async () => {
    render(<Records />);

    // 1-4 Oct plus the three Sundays still to come: seven rows, not thirty-one.
    expect(await screen.findByText(/of 7$/)).toBeInTheDocument();
  });

  it('calls today "No punch yet" instead of an absence, and shows no red absences at all', async () => {
    render(<Records />);

    expect(await screen.findByText('No punch yet')).toBeInTheDocument();
    expect(screen.queryByText('Absent')).not.toBeInTheDocument();
  });

  it('does not ask HR to correct a lone punch on the day that is still going on', async () => {
    attendanceApi.records.mockResolvedValue(
      generatedRunningMonth({ status: 'INVALID_PUNCH', invalidPunch: true, firstIn: '2026-10-03T09:02:00' })
    );
    render(<Records />);

    expect(await screen.findByText('Day in progress')).toBeInTheDocument();
    expect(screen.queryByTestId('attendance-warning')).not.toBeInTheDocument();
  });

  it('still asks HR to correct a lone punch on a day that is over', async () => {
    const rows = generatedRunningMonth();
    rows[0] = stored(1, 'INVALID_PUNCH', { invalidPunch: true, firstIn: '2026-10-01T09:00:00' });
    attendanceApi.records.mockResolvedValue(rows);
    render(<Records />);

    expect(await screen.findByTestId('attendance-warning')).toHaveTextContent('1 day(s) have a single punch only');
  });

  it('keeps a coming day somebody corrected by hand', async () => {
    const rows = generatedRunningMonth();
    rows[11] = stored(12, 'ABSENT', { recordStatus: 'MANUAL', remarks: 'Declared in advance' });
    attendanceApi.records.mockResolvedValue(rows);
    render(<Records />);

    expect(await screen.findByText(/of 8$/)).toBeInTheDocument();
  });

  it('exports every stored row - the export is data, not the view', async () => {
    render(<Records />);

    await screen.findByText(/of 7$/);
    fireEvent.click(screen.getByRole('button', { name: /export csv/i }));

    expect(downloadCsv).toHaveBeenCalledTimes(1);
    expect(downloadCsv.mock.calls[0][2]).toHaveLength(31);
  });
});

describe('Attendance Records, for a month that is over', () => {
  it('shows every stored day exactly as it is', async () => {
    jest.setSystemTime(new Date('2026-11-05T10:00:00'));
    render(<Records />);

    expect(await screen.findByText(/of 31$/)).toBeInTheDocument();
    expect(screen.queryByText('No punch yet')).not.toBeInTheDocument();
  });
});

describe('Attendance Records, for a month that has not started', () => {
  it('says so instead of showing a column of generated absences', async () => {
    jest.setSystemTime(new Date('2026-09-15T10:00:00'));
    render(<Records />);

    expect(await screen.findByText(/has not started yet/i)).toBeInTheDocument();
  });
});

describe('Attendance Records, when there is nothing stored', () => {
  beforeEach(() => {
    attendanceApi.records.mockResolvedValue([]);
  });

  it('tells HR to generate attendance first, for someone who is tracked', async () => {
    render(<Records />);

    expect(await screen.findByText(/generate attendance first/i)).toBeInTheDocument();
  });

  it('does not send HR off to generate attendance for someone who is not tracked - it would never produce any', async () => {
    attendanceApi.monthly.mockResolvedValue(summary({ attendanceTracked: false }));
    render(<Records />);

    expect(await screen.findByText(/attendance is not tracked/i)).toBeInTheDocument();
    expect(screen.queryByText(/generate attendance first/i)).not.toBeInTheDocument();
  });

  it('treats a server that does not send the flag as tracked', async () => {
    attendanceApi.monthly.mockResolvedValue({ sandwich: null });
    render(<Records />);

    expect(await screen.findByText(/generate attendance first/i)).toBeInTheDocument();
  });
});

describe('Attendance Records, when the sandwich leave rule took a day', () => {
  it('still explains it and marks the day', async () => {
    attendanceApi.monthly.mockResolvedValue(summary({ sandwich: { holidays: ['2026-10-02'], leaveDates: [], leaveDays: 0 } }));
    render(<Records />);

    expect(await screen.findByText(/Sandwich leave: 2 Oct holiday unpaid/)).toBeInTheDocument();
    expect(screen.getByText('Unpaid (sandwich)')).toBeInTheDocument();
  });
});
