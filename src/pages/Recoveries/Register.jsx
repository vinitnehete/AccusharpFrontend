import { useEffect, useState } from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Grid from '@mui/material/Grid';
import PriceCheckRoundedIcon from '@mui/icons-material/PriceCheckRounded';
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import MoneyText from '../../components/MoneyText';
import StatusChip from '../../components/StatusChip';
import recoveriesApi from '../../api/recoveries';
import { useAuth } from '../../context/AuthContext';
import {
  RECOVERY_STATUS_COLOR,
  RECOVERY_TYPE,
  RECOVERY_TYPE_LABEL,
} from '../../constants/enums';

const money = (params) => <MoneyText value={params.value} />;

export default function RecoveryRegister() {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = useAuth();
  const canManage = can('RECOVERY_MANAGE');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [includeSettled, setIncludeSettled] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [action, setAction] = useState(null);
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    recoveriesApi
      .list(includeSettled)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [includeSettled]); // eslint-disable-line react-hooks/exhaustive-deps

  const openAction = (kind, row) => {
    setAction({ kind, row });
    setAmount(kind === 'cancel' ? '' : String(row.outstandingAmount ?? ''));
    setRemarks('');
  };

  const submitAction = () => {
    if (!action) return;
    const { kind, row } = action;
    setSaving(true);
    const call =
      kind === 'cancel'
        ? recoveriesApi.cancel(row.id, remarks || undefined)
        : recoveriesApi[kind](row.id, { amount: Number(amount), remarks });
    call
      .then(() => {
        enqueueSnackbar(`${RECOVERY_TYPE_LABEL[row.type]} updated`, { variant: 'success' });
        setAction(null);
        load();
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  const columns = [
    { field: 'employeeId', headerName: 'User ID', width: 100 },
    { field: 'employeeName', headerName: 'Employee', width: 160 },
    {
      field: 'type',
      headerName: 'Type',
      width: 130,
      valueGetter: (value) => RECOVERY_TYPE_LABEL[value] || value,
    },
    { field: 'principalAmount', headerName: 'Issued', width: 120, renderCell: money },
    { field: 'recoveredAmount', headerName: 'Recovered', width: 120, renderCell: money },
    { field: 'outstandingAmount', headerName: 'Outstanding', width: 130, renderCell: money },
    { field: 'installmentAmount', headerName: 'Instalment', width: 120, renderCell: money },
    {
      field: 'remainingInstallments',
      headerName: 'Periods left',
      width: 110,
      valueGetter: (value) => value ?? '-',
    },
    {
      field: 'startPeriod',
      headerName: 'Recovers from',
      width: 130,
      valueGetter: (_value, row) => `${row.startMonth}/${row.startYear}`,
    },
    { field: 'issuedOn', headerName: 'Issued on', width: 115 },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => <StatusChip value={params.value} colorMap={RECOVERY_STATUS_COLOR} />,
    },
    ...(canManage
      ? [
          {
            field: 'actions',
            headerName: 'Actions',
            width: 130,
            sortable: false,
            renderCell: (params) =>
              params.row.status === 'CLOSED' || params.row.status === 'CANCELLED' ? null : (
                <Stack direction="row" spacing={0.25}>
                  <Tooltip title="Record a payment made outside payroll">
                    <IconButton size="small" onClick={() => openAction('adjust', params.row)}>
                      <PriceCheckRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Write off part or all of the balance">
                    <IconButton size="small" onClick={() => openAction('waive', params.row)}>
                      <RemoveCircleOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Withdraw — only before anything has been recovered">
                    <span>
                      <IconButton
                        size="small"
                        disabled={Number(params.row.recoveredAmount) > 0}
                        onClick={() => openAction('cancel', params.row)}
                      >
                        <EditRoundedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              ),
          },
        ]
      : []),
  ];

  const visible = typeFilter ? rows.filter((r) => r.type === typeFilter) : rows;
  const totalOutstanding = visible.reduce((sum, r) => sum + Number(r.outstandingAmount || 0), 0);

  return (
    <>
      <PageHeader
        title="Loan & Recovery Register"
        subtitle="Everything employees owe the company — payroll collects these balances automatically each period"
      />

      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="">All types</MenuItem>
                {RECOVERY_TYPE.map((t) => (
                  <MenuItem key={t} value={t}>
                    {RECOVERY_TYPE_LABEL[t]}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 5 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={includeSettled}
                    onChange={(e) => setIncludeSettled(e.target.checked)}
                  />
                }
                label="Include closed and cancelled"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="subtitle1" sx={{ textAlign: { sm: 'right' } }}>
                Total outstanding: <MoneyText value={totalOutstanding} />
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <DataTable
        rows={visible}
        columns={columns}
        loading={loading}
        getRowId={(r) => r.id}
        height={560}
        emptyState={{
          title: 'Nothing outstanding',
          description: 'No loans, advances or fines are being recovered right now.',
        }}
      />

      <Dialog open={!!action} onClose={() => setAction(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {action?.kind === 'waive' && 'Write off balance'}
          {action?.kind === 'adjust' && 'Record a payment'}
          {action?.kind === 'cancel' && 'Withdraw recovery'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {action?.row.employeeName || action?.row.employeeId} —{' '}
              {RECOVERY_TYPE_LABEL[action?.row.type]}, <MoneyText value={action?.row.outstandingAmount} />{' '}
              outstanding.
            </Typography>
            {action?.kind !== 'cancel' && (
              <TextField
                fullWidth
                size="small"
                label="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))}
              />
            )}
            <TextField
              fullWidth
              size="small"
              required={action?.kind !== 'cancel'}
              label="Reason"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              helperText="Recorded on the ledger — an unexplained write-off is exactly what it exists to prevent"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAction(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={submitAction}
            disabled={saving || (action?.kind !== 'cancel' && (!Number(amount) || !remarks))}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
