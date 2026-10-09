import dayjs from 'dayjs';

// Presentation rules for a person's month, while it is still going on. None of
// this decides what a day is worth - the server does - only what to show now.
//
// A month that has not been generated is a preview, and the preview is blunt:
// every day that has not happened (and today, until the first punch) comes back
// ABSENT with no punches, and is already counted in `absentDays` and `lopDays`.
// Shown as it arrives, someone looking on the 3rd reads a red "Absent" on every
// day up to the 31st. (The mobile app applies the same rules - keep the two in
// step: AccusharpMobile/src/features/attendance.ts.)

/** True when `today` falls inside the month of `month` (any date in it). */
export const isMonthInProgress = (month, today) => dayjs(month).isSame(dayjs(today), 'month');

const byDate = (a, b) => (a.attendanceDate < b.attendanceDate ? -1 : a.attendanceDate > b.attendanceDate ? 1 : 0);

/**
 * `past`: today and earlier, in date order - what has actually happened.
 * `upcoming`: days still to come that already mean something (weekly off, holiday,
 * approved leave). A coming day that is just ABSENT is not an absence, it is a day
 * nobody has worked yet, so it is left out rather than shown in red.
 */
export function splitDays(days, today) {
  const all = days || [];
  return {
    past: all.filter((d) => d.attendanceDate <= today).sort(byDate),
    upcoming: all.filter((d) => d.attendanceDate > today && d.status !== 'ABSENT').sort(byDate),
  };
}

/**
 * How to read one row. Today is not over: with no punch yet it is not an absence,
 * and with one punch it is a day in progress, not the "missing punch" the server
 * must call it once the day has ended.
 *   'waiting' - today, no punch yet
 *   'going'   - today, punched in, not out
 *   'normal'  - everything else: the server's status stands
 */
export function dayPhase(day, today) {
  if (day.attendanceDate !== today) return 'normal';
  if (day.firstIn && !day.lastOut) return 'going';
  if (day.status === 'ABSENT' && !day.firstIn) return 'waiting';
  return 'normal';
}

/** Days that need fixing: a lone punch on a day that is over. Today is not over. */
export const attentionCount = (days, today) =>
  (days || []).filter((d) => d.invalidPunch && d.attendanceDate !== today).length;

/**
 * The HR console lists stored rows, not a preview - but generating a month that is
 * still running stores every day of it, so the 31st sits there as a red ABSENT
 * with an edit button on it. A day to come that the engine only ever wrote as
 * absent is left out. One a person declared (MANUAL) or that payroll locked is
 * kept: somebody meant it. Order is untouched.
 */
export const withoutDaysToCome = (rows, today) =>
  (rows || []).filter(
    (r) => !(r.attendanceDate > today && r.status === 'ABSENT' && r.recordStatus !== 'MANUAL' && !r.locked)
  );
