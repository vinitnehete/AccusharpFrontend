import { sandwichMark } from './sandwichMark';

describe('marking the days the sandwich leave rule made unpaid', () => {
  it('marks nothing when the rule took nothing, or is not switched on', () => {
    expect(sandwichMark(undefined)).toBeNull();
    expect(sandwichMark({ holidays: [], leaveDates: [], leaveDays: 0 })).toBeNull();
  });

  it('absent on both sides: marks the holiday and says why', () => {
    const mark = sandwichMark({ holidays: ['2026-08-15'], leaveDates: [], leaveDays: 0 });

    expect([...mark.dates]).toEqual(['2026-08-15']);
    expect(mark.text).toBe(
      'Sandwich leave: 15 Aug holiday unpaid - the working day before and after the holiday were not worked.'
    );
  });

  it('leave on both sides: marks the holiday and both leave days', () => {
    const mark = sandwichMark({ holidays: ['2026-08-15'], leaveDates: ['2026-08-14', '2026-08-16'], leaveDays: 2 });

    expect([...mark.dates]).toEqual(['2026-08-15', '2026-08-14', '2026-08-16']);
    expect(mark.text).toContain('15 Aug holiday unpaid; paid leave on 14 Aug, 16 Aug made unpaid');
  });
});
