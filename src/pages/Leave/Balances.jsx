import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import EmployeePicker from '../../components/EmployeePicker';
import leaveBalancesApi from '../../api/leaveBalances';
import leaveSettingsApi from '../../api/leaveSettings';
import { labelize } from '../../constants/enums';
import { useActingAs } from '../../context/ActingAsContext';
import { useAuth } from '../../context/AuthContext';

// Each row is one posting onto the year's balances, with its reason in words.
const CREDIT_COLUMNS = [
  { field: 'period', headerName: 'For', width: 90 },
  { field: 'leaveType', headerName: 'Leave', width: 130, valueFormatter: (v) => labelize(v) },
  {
    field: 'kind',
    headerName: 'What',
    width: 140,
    valueFormatter: (v) => (v === 'CARRY_FORWARD' ? 'Carried forward' : 'Earned'),
  },
  { field: 'days', headerName: 'Days', width: 80 },
  { field: 'basis', headerName: 'Why', flex: 1, minWidth: 320 },
];

function BalanceCard({ balance, canEdit, onEdit }) {
  const pct = balance.quota > 0 ? Math.min(100, (Number(balance.used) / Number(balance.quota)) * 100) : 0;
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="subtitle2">{labelize(balance.leaveType)}</Typography>
          {canEdit && (
            <Tooltip title="Override quota">
              <IconButton size="small" onClick={onEdit}>
                <EditRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
        <Typography variant="h5" sx={{ mt: 1 }}>
          {balance.available}
          <Typography component="span" variant="body2" color="text.secondary">
            {' '}
            / {balance.quota} available
          </Typography>
        </Typography>
        <LinearProgress variant="determinate" value={pct} sx={{ my: 1.5, height: 6, borderRadius: 3 }} />
        <Typography variant="caption" color="text.secondary">
          Used: {balance.used}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function Balances() {
  const { enqueueSnackbar } = useSnackbar();
  const { actingAs, isHrOrAdmin } = useActingAs();
  const { can } = useAuth();
  const canEditQuota = can('LEAVE_BALANCE_MANAGE');
  const [userId, setUserId] = useState(actingAs?.userId || null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [balances, setBalances] = useState([]);
  const [credits, setCredits] = useState([]);
  const [yearStartMonth, setYearStartMonth] = useState(1);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [quotaValue, setQuotaValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setUserId(actingAs?.userId || null);
  }, [actingAs]);

  // Open on the leave year today falls in - for a financial-year company that
  // is last calendar year's number until April.
  useEffect(() => {
    leaveSettingsApi
      .get()
      .then((s) => {
        setYearStartMonth(s.leaveYearStartMonth);
        setYear(s.currentLeaveYear);
      })
      .catch(() => {});
  }, []);

  const load = () => {
    if (!userId) return;
    setLoading(true);
    leaveBalancesApi
      .forEmployee(userId, year)
      .then(setBalances)
      .catch(() => setBalances([]))
      .finally(() => setLoading(false));
    leaveBalancesApi
      .credits(userId, year)
      .then(setCredits)
      .catch(() => setCredits([]));
  };

  useEffect(load, [userId, year]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveQuota = () => {
    setSaving(true);
    leaveBalancesApi
      .setQuota(userId, year, editing.leaveType, quotaValue)
      .then(() => {
        enqueueSnackbar('Quota updated', { variant: 'success' });
        setEditing(null);
        load();
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  return (
    <>
      <PageHeader
        title="Leave Balances"
        subtitle="Casual, sick, earned and unpaid leave - quota, used and available"
        actions={
          <>
            {isHrOrAdmin && <EmployeePicker label="Employee" value={userId} onChange={setUserId} />}
            <TextField
              size="small"
              label="Leave year"
              value={year}
              onChange={(e) => setYear(e.target.value.replace(/[^0-9]/g, ''))}
              helperText={
                yearStartMonth === 4 && String(year).length === 4
                  ? `${year}-${String((Number(year) + 1) % 100).padStart(2, '0')} (Apr–Mar)`
                  : undefined
              }
              sx={{ width: 150 }}
            />
          </>
        }
      />
      {!loading && balances.length === 0 ? (
        <Typography color="text.secondary">No balance data.</Typography>
      ) : (
        <Grid container spacing={2.5}>
          {balances.map((b) => (
            <Grid key={b.leaveType} size={{ xs: 12, sm: 6, md: 4 }}>
              <BalanceCard
                balance={b}
                canEdit={canEditQuota}
                onEdit={() => {
                  setEditing(b);
                  setQuotaValue(String(b.quota));
                }}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {credits.length > 0 && (
        <>
          <Typography variant="subtitle1" sx={{ mt: 4, mb: 1 }}>
            How this year's balance was built
          </Typography>
          <DataTable rows={credits} columns={CREDIT_COLUMNS} height={320} pageSize={12} density="compact" />
        </>
      )}

      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Override {editing ? labelize(editing.leaveType) : ''} quota</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Cannot be set below what has already been used ({editing?.used}).
          </Typography>
          <TextField
            fullWidth
            size="small"
            label="New quota"
            value={quotaValue}
            onChange={(e) => setQuotaValue(e.target.value.replace(/[^0-9.]/g, ''))}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setEditing(null)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveQuota} disabled={saving}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
