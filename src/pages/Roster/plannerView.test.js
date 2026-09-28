import { initialWeek, matchesSearch, shiftStyles, shortCodes, weeksOf } from './plannerView';

describe('shortCodes - the label that fits a month cell', () => {
  test('one letter when the first letters already differ', () => {
    expect(shortCodes(['MORNING', 'GENERAL', 'EVENING', 'NIGHT'])).toEqual({
      MORNING: 'M',
      GENERAL: 'G',
      EVENING: 'E',
      NIGHT: 'N',
    });
  });

  test('as many letters as it takes to tell two codes apart, up to three', () => {
    expect(shortCodes(['EARLY', 'EVENING', 'NIGHT'])).toEqual({ EARLY: 'EA', EVENING: 'EV', NIGHT: 'N' });
  });

  test('codes that share three letters get a number instead, in code order', () => {
    expect(shortCodes(['GENERAL', 'GEN2', 'NIGHT'])).toEqual({ GEN2: 'G1', GENERAL: 'G2', NIGHT: 'N' });
    expect(shortCodes(['SHIFT-A', 'SHIFT-B'])).toEqual({ 'SHIFT-A': 'S1', 'SHIFT-B': 'S2' });
  });

  test('a short code is kept whole', () => {
    expect(shortCodes(['A', 'B1'])).toEqual({ A: 'A', B1: 'B' });
  });

  test('weekly off is never shortened', () => {
    expect(shortCodes(['WO', 'WORKSHOP'])).toEqual({ WO: 'WO', WORKSHOP: 'W' });
  });
});

describe('shiftStyles - one colour per shift', () => {
  test('every shift gets its own colour, in code order, and WO stays grey', () => {
    const styles = shiftStyles(['NIGHT', 'WO', 'GENERAL', 'MORNING']);
    expect(Object.keys(styles).sort()).toEqual(['GENERAL', 'MORNING', 'NIGHT', 'WO']);
    const colours = ['GENERAL', 'MORNING', 'NIGHT'].map((c) => styles[c].bg);
    expect(new Set(colours).size).toBe(3);
    expect(styles.WO.weekOff).toBe(true);
  });

  test('the same shift keeps its colour when another shift appears later in the alphabet', () => {
    const before = shiftStyles(['GENERAL', 'MORNING']);
    const after = shiftStyles(['GENERAL', 'MORNING', 'ZULU']);
    expect(after.GENERAL.bg).toBe(before.GENERAL.bg);
    expect(after.MORNING.bg).toBe(before.MORNING.bg);
  });
});

describe('weeksOf - Monday-to-Sunday weeks of the month', () => {
  const september = Array.from({ length: 30 }, (_, i) => `2026-09-${String(i + 1).padStart(2, '0')}`);

  test('splits on Mondays and keeps the short first and last weeks', () => {
    const weeks = weeksOf(september);
    // 1 Sep 2026 is a Tuesday, 30 Sep a Wednesday.
    expect(weeks.map((w) => [w[0], w[w.length - 1]])).toEqual([
      ['2026-09-01', '2026-09-06'],
      ['2026-09-07', '2026-09-13'],
      ['2026-09-14', '2026-09-20'],
      ['2026-09-21', '2026-09-27'],
      ['2026-09-28', '2026-09-30'],
    ]);
  });

  test('an empty month has no weeks', () => {
    expect(weeksOf([])).toEqual([]);
  });

  test('opens on the week holding today, else the first week', () => {
    const weeks = weeksOf(september);
    expect(initialWeek(weeks, '2026-09-16')).toBe(2);
    expect(initialWeek(weeks, '2026-10-02')).toBe(0);
  });
});

describe('matchesSearch', () => {
  const row = { employeeName: 'Asha Kulkarni', userId: 'EMP001' };
  test('matches name or user id, ignoring case and spaces around the query', () => {
    expect(matchesSearch(row, 'asha')).toBe(true);
    expect(matchesSearch(row, ' emp001 ')).toBe(true);
    expect(matchesSearch(row, 'kul')).toBe(true);
    expect(matchesSearch(row, 'ravi')).toBe(false);
  });
  test('an empty query matches everyone', () => {
    expect(matchesSearch(row, '')).toBe(true);
    expect(matchesSearch(row, '   ')).toBe(true);
  });
});
