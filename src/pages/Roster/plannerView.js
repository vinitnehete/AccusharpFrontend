import dayjs from 'dayjs';

// Pure helpers behind the Roster Planner grid: short labels that fit a month
// cell, one colour per shift, Monday-to-Sunday weeks and the name search.

export const WEEK_OFF = 'WO';

const MAX_LABEL = 3;

// The shortest prefix (up to three letters) no other shift shares. Shifts that
// still clash after three letters are numbered by their first letter instead.
export function shortCodes(codes) {
  const shifts = [...new Set(codes)].filter((c) => c && c !== WEEK_OFF).sort();
  const labels = {};
  const unresolved = [];

  shifts.forEach((code) => {
    for (let k = 1; k <= MAX_LABEL; k += 1) {
      const prefix = code.slice(0, k);
      if (!shifts.some((other) => other !== code && other.slice(0, k) === prefix)) {
        labels[code] = prefix;
        return;
      }
    }
    unresolved.push(code);
  });

  const counters = {};
  unresolved.forEach((code) => {
    const letter = code.charAt(0);
    counters[letter] = (counters[letter] || 0) + 1;
    labels[code] = `${letter}${counters[letter]}`;
  });

  if (codes.includes(WEEK_OFF)) labels[WEEK_OFF] = WEEK_OFF;
  return labels;
}

// Soft fill + strong text; every pair clears WCAG AA (4.5:1) for small bold text.
const PALETTE = [
  { bg: '#EAF1FF', fg: '#1D4ED8' }, // blue
  { bg: '#E3F5F2', fg: '#0F766E' }, // teal
  { bg: '#F0ECFE', fg: '#5B21B6' }, // violet
  { bg: '#FDF1DF', fg: '#8A4B00' }, // amber
  { bg: '#FDEBEF', fg: '#B4123A' }, // rose
  { bg: '#E6F4EA', fg: '#166534' }, // green
  { bg: '#E3F1FA', fg: '#075985' }, // sky
  { bg: '#F6ECE4', fg: '#7C3A12' }, // clay
];
const WEEK_OFF_STYLE = { bg: '#F1F3F7', fg: '#5B6472', weekOff: true };

// Colours follow code order, so a month's shifts keep their colours when a
// new shift is added after them.
export function shiftStyles(codes) {
  const shifts = [...new Set(codes)].filter((c) => c && c !== WEEK_OFF).sort();
  const styles = {};
  shifts.forEach((code, i) => {
    styles[code] = PALETTE[i % PALETTE.length];
  });
  if (codes.includes(WEEK_OFF)) styles[WEEK_OFF] = WEEK_OFF_STYLE;
  return styles;
}

// Consecutive dates grouped into Monday-to-Sunday weeks.
export function weeksOf(dates) {
  const weeks = [];
  dates.forEach((date) => {
    const isMonday = dayjs(date).day() === 1;
    if (weeks.length === 0 || isMonday) weeks.push([]);
    weeks[weeks.length - 1].push(date);
  });
  return weeks;
}

export function initialWeek(weeks, today) {
  const index = weeks.findIndex((week) => week.includes(today));
  return index === -1 ? 0 : index;
}

export function matchesSearch(row, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return true;
  return (
    (row.employeeName || '').toLowerCase().includes(q) || (row.userId || '').toLowerCase().includes(q)
  );
}
