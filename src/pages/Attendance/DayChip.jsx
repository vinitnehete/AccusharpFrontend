import Chip from '@mui/material/Chip';
import StatusChip from '../../components/StatusChip';
import { ATTENDANCE_STATUS_COLOR } from '../../constants/enums';
import { dayPhase } from './runningMonth';

// One day's status. Today is not over: no punch yet is not an absence, and one
// punch is a day in progress rather than the "missing punch" the server must call
// it once the day has ended (see runningMonth.js). Works on a daily row from the
// monthly summary and on a stored record alike - both carry status, firstIn, lastOut.
export default function DayChip({ day, today }) {
  const phase = dayPhase(day, today);
  if (phase === 'going') return <Chip label="Day in progress" color="info" size="small" variant="filled" />;
  if (phase === 'waiting') return <Chip label="No punch yet" size="small" variant="filled" />;
  return <StatusChip value={day.status} colorMap={ATTENDANCE_STATUS_COLOR} />;
}
