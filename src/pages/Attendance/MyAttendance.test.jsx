import { render, screen } from '@testing-library/react';
import MyAttendance from './MyAttendance';
import attendanceApi from '../../api/attendance';

jest.mock('../../api/attendance', () => ({ monthly: jest.fn() }));
// The pickers need a localisation provider this test has no use for.
jest.mock('@mui/x-date-pickers/DatePicker', () => ({ DatePicker: () => null }));
jest.mock('../../components/EmployeePicker', () => () => null);

let mockSupervisorOrAbove = false;
jest.mock('../../context/ActingAsContext', () => ({
  useActingAs: () => ({
    actingAs: { userId: 'EMP001', employeeName: 'Asha Patil' },
    isSupervisorOrAbove: mockSupervisorOrAbove,
  }),
}));

// The page reads "today" from the clock, so the clock is fixed: Saturday 3 Oct 2026, mid-morning.
const TODAY = '2026-10-03';

const iso = (n) => `2026-10-${String(n).padStart(2, '0')}`;
const day = (n, status, extra = {}) => ({
  attendanceDate: iso(n),
  shiftCode: 'GENERAL',
  firstIn: null,
  lastOut: null,
  workingHours: null,
  overtimeHours: 0,
  lateMinutes: 0,
  invalidPunch: false,
  status,
  ...extra,
});

/**
 * October as the server previews it on the 3rd: nothing is generated, so every
 * day that has not happened - and today, before a punch - is ABSENT, and all of
 * them are already counted in absentDays and lopDays.
 */
const runningMonth = (over = {}, dayOver = {}) => ({
  userId: 'EMP001',
  employeeName: 'Asha Patil',
  month: '2026-10',
  workingDays: 27,
  presentDays: 1,
  absentDays: 25,
  leaveDays: 2,
  lateCount: 0,
  earlyExitCount: 0,
  invalidPunches: 0,
  overtimeHours: 0,
  lopDays: 25,
  policyLopDays: 0,
  compOffCreditDays: 0,
  policyOutcomes: [],
  sandwich: { holidays: [], leaveDates: [], leaveDays: 0 },
  attendanceTracked: true,
  days: [
    day(1, 'PRESENT', { firstIn: '2026-10-01T09:00:00', lastOut: '2026-10-01T18:00:00', workingHours: 8 }),
    day(2, 'HOLIDAY'),
    day(3, 'ABSENT', dayOver),
    day(4, 'WEEKLY_OFF'),
    ...Array.from({ length: 27 }, (_, i) => i + 5).map((n) => (n === 20 || n === 21 ? day(n, 'ON_LEAVE') : day(n, 'ABSENT'))),
  ],
  ...over,
});

beforeAll(() => {
  jest.useFakeTimers('modern');
  jest.setSystemTime(new Date(`${TODAY}T10:00:00`));
});
afterAll(() => jest.useRealTimers());

beforeEach(() => {
  jest.setSystemTime(new Date(`${TODAY}T10:00:00`));
  jest.clearAllMocks();
  mockSupervisorOrAbove = false;
  attendanceApi.monthly.mockResolvedValue(runningMonth());
});

describe('My Attendance, for an employee, while the month is still running', () => {
  it('lists the days up to today and does not show the days to come as absent', async () => {
    render(<MyAttendance />);

    expect(await screen.findByText('01 Oct')).toBeInTheDocument();
    expect(screen.getByText('03 Oct')).toBeInTheDocument();
    // Nothing between the 5th and the 31st is an absence yet - the 20th and 21st are leave and stay visible.
    expect(screen.queryByText('Absent')).not.toBeInTheDocument();
    expect(screen.queryByText('05 Oct')).not.toBeInTheDocument();
    expect(screen.queryByText('31 Oct')).not.toBeInTheDocument();
  });

  it('keeps the coming days that already mean something under "Coming up"', async () => {
    render(<MyAttendance />);

    expect(await screen.findByText('Coming up')).toBeInTheDocument();
    expect(screen.getByText('04 Oct')).toBeInTheDocument();
    expect(screen.getByText('20 Oct')).toBeInTheDocument();
    expect(screen.getByText('21 Oct')).toBeInTheDocument();
  });

  it('says there is no punch yet today instead of calling it an absence', async () => {
    render(<MyAttendance />);

    expect(await screen.findByText('No punch yet')).toBeInTheDocument();
  });

  it('calls a lone punch today a day in progress, not a missing punch', async () => {
    attendanceApi.monthly.mockResolvedValue(
      runningMonth({ invalidPunches: 1 }, { status: 'INVALID_PUNCH', invalidPunch: true, firstIn: '2026-10-03T09:02:00' })
    );
    render(<MyAttendance />);

    expect(await screen.findByText('Day in progress')).toBeInTheDocument();
    expect(screen.queryByTestId('attendance-needs-attention')).not.toBeInTheDocument();
  });

  it('still raises a lone punch on a day that is over', async () => {
    const month = runningMonth({ invalidPunches: 1 });
    month.days[0] = day(1, 'INVALID_PUNCH', { invalidPunch: true, firstIn: '2026-10-01T09:00:00' });
    attendanceApi.monthly.mockResolvedValue(month);
    render(<MyAttendance />);

    expect(await screen.findByTestId('attendance-needs-attention')).toHaveTextContent('1 day needs attention');
  });

  it('shows a finished month exactly as the server sent it', async () => {
    // Weeks later the same October is over: nothing is a preview any more.
    jest.setSystemTime(new Date('2026-11-05T10:00:00'));
    render(<MyAttendance />);

    expect(await screen.findByText('31 Oct')).toBeInTheDocument();
    expect(screen.getAllByText('Absent')).toHaveLength(26);
    expect(screen.queryByText('Coming up')).not.toBeInTheDocument();
    expect(screen.queryByText('No punch yet')).not.toBeInTheDocument();
  });
});

describe('My Attendance, for someone whose attendance is not tracked', () => {
  it('says so instead of showing a month of absences', async () => {
    attendanceApi.monthly.mockResolvedValue(runningMonth({ attendanceTracked: false }));
    render(<MyAttendance />);

    expect(await screen.findByText('Your attendance is not recorded')).toBeInTheDocument();
    expect(screen.queryByTestId('attendance-summary')).not.toBeInTheDocument();
    expect(screen.queryByText('Day by day')).not.toBeInTheDocument();
  });

  it('treats a server that does not send the flag as tracked', async () => {
    const month = runningMonth();
    delete month.attendanceTracked;
    attendanceApi.monthly.mockResolvedValue(month);
    render(<MyAttendance />);

    expect(await screen.findByTestId('attendance-summary')).toBeInTheDocument();
  });
});

describe('My Attendance, when the sandwich leave rule took a day', () => {
  it('explains the unpaid holiday', async () => {
    attendanceApi.monthly.mockResolvedValue(
      runningMonth({ sandwich: { holidays: ['2026-10-02'], leaveDates: [], leaveDays: 0 } })
    );
    render(<MyAttendance />);

    expect(await screen.findByTestId('attendance-sandwich')).toHaveTextContent('2 Oct holiday unpaid');
  });

  it('says nothing when the rule took nothing', async () => {
    render(<MyAttendance />);

    await screen.findByTestId('attendance-summary');
    expect(screen.queryByTestId('attendance-sandwich')).not.toBeInTheDocument();
  });
});

describe('My Attendance, the supervisor / HR view of a person', () => {
  beforeEach(() => {
    mockSupervisorOrAbove = true;
  });

  it('holds back the loss-of-pay total until the month is over', async () => {
    render(<MyAttendance />);

    // Cards appear while loading, so wait for the table footer, which needs the data.
    await screen.findByText(/Total hours/);
    expect(screen.getByText('LOP days')).toBeInTheDocument();
    expect(screen.getByText('LOP days are counted once the month is over.')).toBeInTheDocument();
    // The server's figure counts every day to come; it must not be shown as a finding.
    expect(screen.queryByText('25')).not.toBeInTheDocument();
  });

  it('does not count a lone punch on today in the invalid-punch alert', async () => {
    attendanceApi.monthly.mockResolvedValue(
      runningMonth({ invalidPunches: 1 }, { status: 'INVALID_PUNCH', invalidPunch: true, firstIn: '2026-10-03T09:02:00' })
    );
    render(<MyAttendance />);

    // The table's footer only appears once the month has loaded.
    await screen.findByText(/Total hours/);
    expect(screen.queryByTestId('attendance-needs-attention')).not.toBeInTheDocument();
  });

  it('shows the loss-of-pay total as the server sent it once the month is over', async () => {
    jest.setSystemTime(new Date('2026-11-05T10:00:00'));
    render(<MyAttendance />);

    await screen.findByText(/Total hours/);
    expect(screen.getByText('LOP days')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.queryByText('LOP days are counted once the month is over.')).not.toBeInTheDocument();
  });

  it('says a person is not tracked instead of listing their "absences"', async () => {
    attendanceApi.monthly.mockResolvedValue(runningMonth({ attendanceTracked: false }));
    render(<MyAttendance />);

    expect(await screen.findByText(/attendance is not tracked/i)).toBeInTheDocument();
    expect(screen.queryByText('Day-by-day')).not.toBeInTheDocument();
  });
});
