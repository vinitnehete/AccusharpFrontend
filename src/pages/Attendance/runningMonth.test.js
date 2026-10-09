import { attentionCount, dayPhase, isMonthInProgress, splitDays, withoutDaysToCome } from './runningMonth';

const day = (attendanceDate, status, extra = {}) => ({
  attendanceDate,
  shiftCode: 'GENERAL',
  firstIn: null,
  lastOut: null,
  invalidPunch: false,
  status,
  ...extra,
});

const TODAY = '2026-10-03';

describe('isMonthInProgress', () => {
  it('is true for the month today falls in, false before and after', () => {
    expect(isMonthInProgress('2026-10-01', TODAY)).toBe(true);
    expect(isMonthInProgress('2026-09-01', TODAY)).toBe(false);
    expect(isMonthInProgress('2026-11-01', TODAY)).toBe(false);
  });
});

describe('splitDays', () => {
  const days = [
    day('2026-10-01', 'PRESENT'),
    day('2026-10-02', 'HOLIDAY'),
    day('2026-10-03', 'ABSENT'),
    day('2026-10-04', 'WEEKLY_OFF'),
    day('2026-10-05', 'ABSENT'),
    day('2026-10-06', 'ABSENT'),
    day('2026-10-20', 'ON_LEAVE'),
  ];

  it('lists the days up to and including today, in date order', () => {
    expect(splitDays(days, TODAY).past.map((d) => d.attendanceDate)).toEqual(['2026-10-01', '2026-10-02', '2026-10-03']);
  });

  it('keeps coming days apart and only the ones that already mean something', () => {
    // 5 and 6 Oct are "not worked yet" - an absence nobody has had the chance to avoid.
    expect(splitDays(days, TODAY).upcoming.map((d) => [d.attendanceDate, d.status])).toEqual([
      ['2026-10-04', 'WEEKLY_OFF'],
      ['2026-10-20', 'ON_LEAVE'],
    ]);
  });

  it('shows a finished month exactly as it is', () => {
    const past = [day('2026-09-01', 'PRESENT'), day('2026-09-02', 'ABSENT')];
    const split = splitDays(past, TODAY);
    expect(split.past.map((d) => d.attendanceDate)).toEqual(['2026-09-01', '2026-09-02']);
    expect(split.upcoming).toEqual([]);
  });

  it('copes with no days, or no list at all', () => {
    expect(splitDays([], TODAY)).toEqual({ past: [], upcoming: [] });
    expect(splitDays(undefined, TODAY)).toEqual({ past: [], upcoming: [] });
  });
});

describe('dayPhase', () => {
  it('calls today "waiting" until the first punch - an absence needs the day to be over', () => {
    expect(dayPhase(day(TODAY, 'ABSENT'), TODAY)).toBe('waiting');
  });

  it('calls today "going" once somebody has punched in but not out', () => {
    // The server calls one punch INVALID_PUNCH until the out-punch arrives.
    expect(dayPhase(day(TODAY, 'INVALID_PUNCH', { firstIn: '2026-10-03T09:02:00', invalidPunch: true }), TODAY)).toBe('going');
  });

  it('leaves a finished day, and any other status today, as the server says', () => {
    expect(dayPhase(day('2026-10-02', 'ABSENT'), TODAY)).toBe('normal');
    expect(dayPhase(day('2026-10-02', 'INVALID_PUNCH', { firstIn: '2026-10-02T09:00:00' }), TODAY)).toBe('normal');
    expect(dayPhase(day(TODAY, 'PRESENT', { firstIn: '2026-10-03T09:00:00', lastOut: '2026-10-03T18:00:00' }), TODAY)).toBe('normal');
    expect(dayPhase(day(TODAY, 'WEEKLY_OFF'), TODAY)).toBe('normal');
  });
});

describe('attentionCount', () => {
  it('counts lone punches on days that are over, not on the day still going on', () => {
    const days = [
      day('2026-10-01', 'INVALID_PUNCH', { invalidPunch: true, firstIn: '2026-10-01T09:00:00' }),
      day(TODAY, 'INVALID_PUNCH', { invalidPunch: true, firstIn: '2026-10-03T09:00:00' }),
    ];
    expect(attentionCount(days, TODAY)).toBe(1);
  });

  it('still counts a day rescued to a half day that had one punch', () => {
    expect(attentionCount([day('2026-10-01', 'HALF_DAY', { invalidPunch: true })], TODAY)).toBe(1);
  });

  it('is zero for no days', () => {
    expect(attentionCount(undefined, TODAY)).toBe(0);
  });
});

describe('withoutDaysToCome (stored records, as the HR console lists them)', () => {
  const stored = (attendanceDate, status, extra = {}) => ({ attendanceDate, status, recordStatus: 'GENERATED', locked: false, ...extra });

  it('drops days that have not happened and were only ever generated as absent', () => {
    // Generating a month that is still running stores every day of it, the 31st included.
    const rows = [stored('2026-10-02', 'ABSENT'), stored('2026-10-03', 'ABSENT'), stored('2026-10-05', 'ABSENT'), stored('2026-10-31', 'ABSENT')];
    expect(withoutDaysToCome(rows, TODAY).map((r) => r.attendanceDate)).toEqual(['2026-10-02', '2026-10-03']);
  });

  it('keeps coming days that already mean something', () => {
    const rows = [stored('2026-10-04', 'WEEKLY_OFF'), stored('2026-10-10', 'HOLIDAY'), stored('2026-10-20', 'ON_LEAVE')];
    expect(withoutDaysToCome(rows, TODAY)).toHaveLength(3);
  });

  it('keeps a coming day a person declared or that is locked - somebody meant it', () => {
    const rows = [stored('2026-10-12', 'ABSENT', { recordStatus: 'MANUAL' }), stored('2026-10-13', 'ABSENT', { locked: true })];
    expect(withoutDaysToCome(rows, TODAY)).toHaveLength(2);
  });

  it('leaves a finished month exactly as stored, in the order given', () => {
    const rows = [stored('2026-09-02', 'ABSENT'), stored('2026-09-01', 'PRESENT')];
    expect(withoutDaysToCome(rows, TODAY)).toEqual(rows);
  });

  it('copes with no rows', () => {
    expect(withoutDaysToCome(undefined, TODAY)).toEqual([]);
  });
});
