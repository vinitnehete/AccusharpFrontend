import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusChip from '../../components/StatusChip';
import leavesApi from '../../api/leaves';
import { LEAVE_STATUS_COLOR, labelize } from '../../constants/enums';
import { useActingAs } from '../../context/ActingAsContext';
import { useAuth } from '../../context/AuthContext';

function DecisionDialog({ open, action, target, onClose, onDone }) {
  const { enqueueSnackbar } = useSnackbar();
  const { actingAs } = useActingAs();
  const [comments, setComments] = useState('');
  const [busy, setBusy] = useState(false);

  const handleConfirm = () => {
    setBusy(true);
    const payload = { approverId: actingAs.userId, comments };
    const call =
      action === 'supervisor-approve'
        ? leavesApi.supervisorApprove(target.id, payload)
        : action === 'approve'
        ? leavesApi.approve(target.id, payload)
        : leavesApi.reject(target.id, payload);
    call
      .then(() => {
        enqueueSnackbar('Decision recorded', { variant: 'success' });
        onDone();
        onClose();
        setComments('');
      })
      .catch(() => {})
      .finally(() => setBusy(false));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {action === 'reject' ? 'Reject' : action === 'approve' ? 'Approve (final)' : 'Endorse'} leave
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {target?.employeeName} — {target && dayjs(target.fromDate).format('DD MMM')} to{' '}
          {target && dayjs(target.toDate).format('DD MMM YYYY')}
        </Typography>
        <TextField
          fullWidth
          size="small"
          multiline
          minRows={2}
          label="Comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color={action === 'reject' ? 'error' : 'primary'}
          onClick={handleConfirm}
          disabled={busy}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function PendingApprovals() {
  const { actingAs } = useActingAs();
  const { can } = useAuth();
  const canEndorse = can('LEAVE_SUPERVISOR_APPROVE');
  const canApprove = can('LEAVE_APPROVE');
  const [supervisorQueue, setSupervisorQueue] = useState([]);
  const [hrQueue, setHrQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);
  // Your own leave is decided by someone else - the admin, or your supervisor - never by you.
  const isOwn = (row) => row.userId === actingAs?.userId;

  const load = () => {
    if (!actingAs) return;
    setLoading(true);
    const calls = [];
    calls.push(canEndorse ? leavesApi.pendingFor(actingAs.userId).catch(() => []) : Promise.resolve([]));
    calls.push(
      canApprove ? leavesApi.byStatus('SUPERVISOR_APPROVED').catch(() => []) : Promise.resolve([])
    );
    Promise.all(calls)
      .then(([sup, hr]) => {
        setSupervisorQueue(sup);
        setHrQueue(hr);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [actingAs]); // eslint-disable-line react-hooks/exhaustive-deps

  const baseColumns = [
    { field: 'employeeName', headerName: 'Employee', width: 160 },
    { field: 'leaveType', headerName: 'Type', width: 130, valueFormatter: (v) => labelize(v) },
    {
      field: 'fromDate',
      headerName: 'From',
      width: 110,
      valueFormatter: (v) => (v ? dayjs(v).format('DD MMM YYYY') : ''),
    },
    {
      field: 'toDate',
      headerName: 'To',
      width: 110,
      valueFormatter: (v) => (v ? dayjs(v).format('DD MMM YYYY') : ''),
    },
    { field: 'totalDays', headerName: 'Days', width: 80 },
    { field: 'reason', headerName: 'Reason', flex: 1, minWidth: 160 },
    {
      field: 'status',
      headerName: 'Status',
      width: 160,
      renderCell: (params) => <StatusChip value={params.value} colorMap={LEAVE_STATUS_COLOR} />,
    },
  ];

  const notYours = <Typography variant="caption" color="text.secondary">Not yours to decide</Typography>;

  const supervisorColumns = [
    ...baseColumns,
    {
      field: 'actions',
      headerName: '',
      sortable: false,
      filterable: false,
      width: 170,
      renderCell: (params) => isOwn(params.row) ? notYours : (
        <Stack direction="row" spacing={0.5}>
          <Button size="small" startIcon={<CheckRoundedIcon />} onClick={() => setDialog({ action: 'supervisor-approve', target: params.row })}>
            Endorse
          </Button>
          <Button size="small" color="error" startIcon={<CloseRoundedIcon />} onClick={() => setDialog({ action: 'reject', target: params.row })}>
            Reject
          </Button>
        </Stack>
      ),
    },
  ];

  const hrColumns = [
    ...baseColumns,
    {
      field: 'actions',
      headerName: '',
      sortable: false,
      filterable: false,
      width: 170,
      renderCell: (params) => isOwn(params.row) ? notYours : (
        <Stack direction="row" spacing={0.5}>
          <Button size="small" startIcon={<CheckRoundedIcon />} onClick={() => setDialog({ action: 'approve', target: params.row })}>
            Approve
          </Button>
          <Button size="small" color="error" startIcon={<CloseRoundedIcon />} onClick={() => setDialog({ action: 'reject', target: params.row })}>
            Reject
          </Button>
        </Stack>
      ),
    },
  ];

  if (!canEndorse && !canApprove) {
    return <Alert severity="info">Only supervisors, HR and admins have an approval queue.</Alert>;
  }

  return (
    <>
      <PageHeader title="Pending Approvals" subtitle="Leave requests waiting on your decision" />

      {canEndorse && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
            Awaiting your endorsement (as supervisor)
          </Typography>
          <DataTable
            rows={supervisorQueue}
            columns={supervisorColumns}
            loading={loading}
            height={340}
            emptyState={{ title: 'Nothing waiting on you', description: 'No leave requests need your endorsement right now.' }}
          />
        </Box>
      )}

      {canApprove && (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
            Awaiting final HR/Admin approval
          </Typography>
          <DataTable
            rows={hrQueue}
            columns={hrColumns}
            loading={loading}
            height={340}
            emptyState={{ title: 'Nothing waiting on you', description: 'No leave requests need final approval right now.' }}
          />
        </Box>
      )}

      <DecisionDialog
        open={!!dialog}
        action={dialog?.action}
        target={dialog?.target}
        onClose={() => setDialog(null)}
        onDone={load}
      />
    </>
  );
}
