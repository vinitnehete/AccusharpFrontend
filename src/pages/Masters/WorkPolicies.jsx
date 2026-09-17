import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import EmployeePicker from '../../components/EmployeePicker';
import StatusChip from '../../components/StatusChip';
import workPoliciesApi from '../../api/workPolicies';
import { EMPLOYEE_STATUS, labelize } from '../../constants/enums';
import { useAuth } from '../../context/AuthContext';
import {
  LEAVE_APPROVAL_LABEL,
  PAYROLL_MODE_LABEL,
  SCOPES,
  SCOPE_LABEL,
  SCOPE_REF_LABEL,
  TRACKING_LABEL,
  blankForm,
  isValid,
  needsScopeRef,
  toPayload,
  withTracking,
} from './workPolicyForm';

const TRACKING_COLOR = { TRACKED: 'success', NOT_TRACKED: 'warning' };

const columns = [
  {
    field: 'scope',
    headerName: 'Applies to',
    width: 200,
    valueGetter: (value, row) =>
      needsScopeRef(row.scope) ? `${SCOPE_LABEL[row.scope]}: ${row.scopeRef}` : SCOPE_LABEL[row.scope],
  },
  {
    field: 'attendanceTracking',
    headerName: 'Attendance',
    width: 140,
    renderCell: (params) => <StatusChip value={params.value} colorMap={TRACKING_COLOR} />,
  },
  { field: 'payrollMode', headerName: 'Pay', width: 170, valueFormatter: (v) => labelize(v) },
  { field: 'leaveApproval', headerName: 'Leave approval', width: 180, valueFormatter: (v) => labelize(v) },
  {
    field: 'effectiveFrom',
    headerName: 'From',
    width: 120,
    valueFormatter: (v) => (v ? dayjs(v).format('DD MMM YYYY') : ''),
  },
  { field: 'version', headerName: 'Version', width: 90 },
  {
    field: 'enabled',
    headerName: 'Status',
    width: 110,
    valueGetter: (value) => (value ? 'Active' : 'Ended'),
  },
];

export default function WorkPolicies() {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = useAuth();
  const canManage = can('WORK_POLICY_MANAGE');

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [checkUserId, setCheckUserId] = useState(null);
  const [checkDate, setCheckDate] = useState(dayjs());
  const [effective, setEffective] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    workPoliciesApi
      .list()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  // "Which rule actually applies to this person?" - the question a scope chain
  // always raises, answered by the server rather than re-derived here.
  useEffect(() => {
    if (!checkUserId) {
      setEffective(null);
      return;
    }
    workPoliciesApi
      .effective(checkUserId, checkDate.format('YYYY-MM-DD'))
      .then(setEffective)
      .catch(() => setEffective(null));
  }, [checkUserId, checkDate]);

  const set = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const handleSave = () => {
    setSaving(true);
    workPoliciesApi
      .create(toPayload(form))
      .then(() => {
        enqueueSnackbar('Work policy saved', { variant: 'success' });
        setForm(null);
        load();
        if (checkUserId) setCheckDate((d) => d.clone());
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  return (
    <>
      <PageHeader
        title="Work Policies"
        subtitle="Who follows the attendance process, and who is simply paid their salary."
        actions={
          canManage && (
            <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setForm(blankForm())}>
              New policy
            </Button>
          )
        }
      />

      <Alert severity="info" sx={{ mb: 2 }}>
        Configure nothing and everybody is tracked and paid from their attendance, as usual. A policy is only
        needed for people outside that process - an owner or a director who punches nothing but is paid every
        month. The most specific policy wins, and a change appends a version rather than rewriting history.
      </Alert>

      <DataTable
        rows={rows}
        columns={columns}
        loading={loading}
        height={420}
        emptyState={{
          title: 'No work policies',
          description: 'Every employee is tracked and paid from attendance.',
          action: canManage && (
            <Button size="small" variant="contained" onClick={() => setForm(blankForm())}>
              New policy
            </Button>
          ),
        }}
      />

      <Card sx={{ mt: 2.5 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
            What does one person follow?
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'center' }}>
            <EmployeePicker label="Employee" value={checkUserId} onChange={setCheckUserId} />
            <DatePicker
              label="On"
              value={checkDate}
              onChange={(value) => value && setCheckDate(value)}
              slotProps={{ textField: { size: 'small' } }}
            />
          </Stack>
          {effective && (
            <Alert severity={effective.scope ? 'success' : 'info'} sx={{ mt: 2 }}>
              {effective.summary}
              {effective.scope && (
                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                  From the {SCOPE_LABEL[effective.scope].toLowerCase()} policy
                  {effective.scopeRef ? ` (${effective.scopeRef})` : ''}, version {effective.version}, effective{' '}
                  {dayjs(effective.effectiveFrom).format('DD MMM YYYY')}.
                </Typography>
              )}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!form} onClose={() => setForm(null)} maxWidth="sm" fullWidth>
        <DialogTitle>New work policy</DialogTitle>
        <DialogContent>
          {form && (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Applies to"
                  value={form.scope}
                  onChange={(e) => setForm({ ...form, scope: e.target.value, scopeRef: '' })}
                >
                  {SCOPES.map((scope) => (
                    <MenuItem key={scope} value={scope}>
                      {SCOPE_LABEL[scope]}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {needsScopeRef(form.scope) && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  {form.scope === 'EMPLOYEE' && (
                    <EmployeePicker
                      label={SCOPE_REF_LABEL.EMPLOYEE}
                      value={form.scopeRef || null}
                      onChange={(userId) => set('scopeRef', userId || '')}
                      required
                    />
                  )}
                  {form.scope === 'EMPLOYMENT_TYPE' && (
                    <TextField
                      select
                      fullWidth
                      size="small"
                      required
                      label={SCOPE_REF_LABEL.EMPLOYMENT_TYPE}
                      value={form.scopeRef}
                      onChange={(e) => set('scopeRef', e.target.value)}
                    >
                      {EMPLOYEE_STATUS.map((status) => (
                        <MenuItem key={status} value={status}>
                          {labelize(status)}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                  {!['EMPLOYEE', 'EMPLOYMENT_TYPE'].includes(form.scope) && (
                    <TextField
                      fullWidth
                      size="small"
                      required
                      label={SCOPE_REF_LABEL[form.scope]}
                      value={form.scopeRef}
                      onChange={(e) => set('scopeRef', e.target.value)}
                      helperText="The code exactly as the master holds it - a typo silently never applies"
                    />
                  )}
                </Grid>
              )}

              <Grid size={12}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Attendance"
                  value={form.attendanceTracking}
                  onChange={(e) => setForm(withTracking(form, e.target.value))}
                >
                  {Object.entries(TRACKING_LABEL).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={12}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Pay"
                  value={form.payrollMode}
                  onChange={(e) => set('payrollMode', e.target.value)}
                  disabled={form.attendanceTracking === 'NOT_TRACKED'}
                  helperText={
                    form.attendanceTracking === 'NOT_TRACKED'
                      ? 'Pay cannot come from attendance nobody records'
                      : ' '
                  }
                >
                  {Object.entries(PAYROLL_MODE_LABEL).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={12}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Leave approval"
                  value={form.leaveApproval}
                  onChange={(e) => set('leaveApproval', e.target.value)}
                >
                  {Object.entries(LEAVE_APPROVAL_LABEL).map(([value, label]) => (
                    <MenuItem key={value} value={value}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <DatePicker
                  label="Effective from"
                  value={form.effectiveFrom}
                  onChange={(value) => set('effectiveFrom', value)}
                  slotProps={{ textField: { size: 'small', fullWidth: true } }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControlLabel
                  control={<Switch checked={form.enabled} onChange={(e) => set('enabled', e.target.checked)} />}
                  label={form.enabled ? 'Active' : 'Ends this policy'}
                />
              </Grid>

              <Grid size={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="Notes"
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  multiline
                  minRows={2}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setForm(null)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={!isValid(form) || saving}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
