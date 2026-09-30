import dayjs from 'dayjs';

const days = (dates) => dates.map((date) => dayjs(date).format('D MMM')).join(', ');

/**
 * What the sandwich leave rule took this month, for the records screen: the
 * dates to mark and one sentence to show above the table. The rule never
 * changes a day's own status - the holiday still reads Holiday - so without
 * this the unpaid days are invisible here. Null when the rule took nothing.
 */
export const sandwichMark = (sandwich) => {
  const holidays = sandwich?.holidays || [];
  const leave = sandwich?.leaveDates || [];
  if (holidays.length === 0 && leave.length === 0) return null;

  const parts = [
    holidays.length > 0 && `${days(holidays)} holiday unpaid`,
    leave.length > 0 && `paid leave on ${days(leave)} made unpaid`,
  ].filter(Boolean);
  return {
    dates: new Set([...holidays, ...leave]),
    text: `Sandwich leave: ${parts.join('; ')} - the working day before and after the holiday were not worked.`,
  };
};
