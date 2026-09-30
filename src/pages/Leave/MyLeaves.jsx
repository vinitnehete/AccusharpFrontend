import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Skeleton from '@mui/material/Skeleton';
import BeachAccessRoundedIcon from '@mui/icons-material/BeachAccessRounded';
import { useSnackbar } from 'notistack';
import { Link as RouterLink } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import StatusChip from '../../components/StatusChip';
import leavesApi from '../../api/leaves';
import { LEAVE_STATUS_COLOR, labelize } from '../../constants/enums';
import { useActingAs } from '../../context/ActingAsContext';

// Plain-language explanation for each status, shown under the chip - see
// redesign brief: "Waiting for approval / Your request has been submitted
// to your manager" instead of a raw status code.
const STATUS_COPY = {
  PENDING: 'Waiting for approval. Your request has been submitted to your manager.',
  SUPERVISOR_APPROVED: 'Your manager approved this. Waiting for final approval from HR.',
  APPROVED: 'Approved.',
  REJECTED: 'This request was not approved.',
  CANCELLED: 'You cancelled this request.',
};

const CANCELLABLE_STATUSES = ['PENDING', 'SUPERVISOR_APPROVED', 'APPROVED'];

function LeaveCard({ leave, onCancel }) {
  const sameDay = leave.fromDate === leave.toDate;
  const dateLabel = sameDay
    ? dayjs(leave.fromDate).format('DD MMM YYYY')
    : `${dayjs(leave.fromDate).format('DD MMM')} – ${dayjs(leave.toDate).format('DD MMM YYYY')}`;

  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', mb: 0.5, flexWrap: 'wrap' }}>
              <Typography variant="subtitle1">{labelize(leave.leaveType)}</Typography>
              <StatusChip value={leave.status} colorMap={LEAVE_STATUS_COLOR} />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {dateLabel} · {leave.totalDays} day{leave.totalDays === 1 ? '' : 's'}
              {leave.duration && leave.duration !== 'FULL_DAY' ? ` · ${labelize(leave.duration)}` : ''}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {STATUS_COPY[leave.status] || labelize(leave.status)}
            </Typography>
            {leave.reason && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                “{leave.reason}”
              </Typography>
            )}
          </Box>
          {CANCELLABLE_STATUSES.includes(leave.status) && (
            <Button size="small" color="error" onClick={() => onCancel(leave)} sx={{ flexShrink: 0 }}>
              Cancel
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function MyLeaves() {
  const { enqueueSnackbar } = useSnackbar();
  const { actingAs } = useActingAs();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [comments, setComments] = useState('');
  const [busy, setBusy] = useState(false);

  const load = () => {
    if (!actingAs) return;
    setLoading(true);
    leavesApi
      .forEmployee(actingAs.userId)
      .then((data) => setRows([...data].sort((a, b) => (a.fromDate < b.fromDate ? 1 : -1))))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [actingAs]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCancel = () => {
    setBusy(true);
    leavesApi
      .cancel(cancelTarget.id, { approverId: actingAs.userId, comments })
      .then(() => {
        enqueueSnackbar('Leave request withdrawn', { variant: 'success' });
        setCancelTarget(null);
        setComments('');
        load();
      })
      .catch(() => {})
      .finally(() => setBusy(false));
  };

  return (
    <>
      <PageHeader title="My Leaves" subtitle={actingAs ? `${actingAs.employeeName}'s leave history` : ''} />

      {loading ? (
        <Stack spacing={2}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rounded" height={104} />
          ))}
        </Stack>
      ) : rows.length === 0 ? (
        <Card sx={{ p: 5, textAlign: 'center' }}>
          <BeachAccessRoundedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
            No leave requests yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            When you apply for leave, your requests will show up here.
          </Typography>
          <Button variant="contained" component={RouterLink} to="/leave/apply" data-testid="leave-apply-cta">
            Apply for leave
          </Button>
        </Card>
      ) : (
        <Stack spacing={2}>
          {rows.map((leave) => (
            <LeaveCard key={leave.id} leave={leave} onCancel={setCancelTarget} />
          ))}
        </Stack>
      )}

      <Dialog open={!!cancelTarget} onClose={() => setCancelTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Withdraw this leave request?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 1.5 }}>
            Your manager will be notified and this request will no longer be considered.
          </DialogContentText>
          <TextField
            fullWidth
            size="small"
            multiline
            minRows={2}
            label="Comments (optional)"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setCancelTarget(null)}>
            Keep request
          </Button>
          <Button color="error" variant="contained" onClick={handleCancel} disabled={busy}>
            Withdraw
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
