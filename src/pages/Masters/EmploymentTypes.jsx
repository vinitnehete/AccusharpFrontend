import { useCallback, useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import employmentTypesApi from '../../api/employmentTypes';
import { useAuth } from '../../context/AuthContext';
import {
  PAY_BASIS,
  PAY_BASIS_LABEL,
  PAY_BASIS_HELP,
  OVERTIME_BASIS,
  OVERTIME_BASIS_LABEL,
  OVERTIME_BASIS_HELP,
} from '../../constants/enums';

const emptyForm = {
  typeCode: '',
  typeName: '',
  payBasis: 'PER_CALENDAR_DAY_LESS_LOP',
  payableDaysCap: '',
  lopApplies: true,
  paidLeaveAddsPayableDays: true,
  overtimeBasis: 'PER_DAY_SHIFT_EXCESS',
  paidLeaveEarnsOvertime: false,
  segmentedRevisionEarnings: true,
  autoRosterDefaultShift: false,
  active: true,
};

// Switching the pay basis is the one change that makes other answers on this
// form illegal - EmploymentTypeService.validate() refuses a per-attended-day
// type that also applies loss of pay (it would deduct the same absence twice),
// and refuses a monthly type carrying a payable-days cap (a monthly type
// prorates against the month's own length). Rather than let somebody compose
// that and read a 400 afterwards, the form moves the dependent answers with it
// and disables the ones that no longer mean anything.
const applyPayBasis = (form, payBasis) =>
  payBasis === 'PER_ATTENDED_DAY'
    ? { ...form, payBasis, lopApplies: false }
    : { ...form, payBasis, payableDaysCap: '' };

function BooleanRow({ label, help, checked, onChange, disabled, disabledReason }) {
  const control = (
    <FormControlLabel
      sx={{ alignItems: 'flex-start', m: 0 }}
      control={
        <Switch
          checked={!!checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          sx={{ mr: 1 }}
        />
      }
      label={
        <span>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {label}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {disabled && disabledReason ? disabledReason : help}
          </Typography>
        </span>
      }
    />
  );
  return <Grid size={{ xs: 12, sm: 6 }}>{control}</Grid>;
}

function EmploymentTypeDialog({ open, editing, saving, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;
    setForm(
      editing
        ? {
            ...emptyForm,
            ...editing,
            payableDaysCap: editing.payableDaysCap ?? '',
          }
        : emptyForm
    );
  }, [open, editing]);

  const set = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));
  const perAttendedDay = form.payBasis === 'PER_ATTENDED_DAY';
  const isValid = form.typeCode.trim() && form.typeName.trim();

  const handleSubmit = () =>
    onSubmit({
      typeCode: form.typeCode.trim().toUpperCase(),
      typeName: form.typeName.trim(),
      payBasis: form.payBasis,
      // Null, not 0 or '' - null means "use the company's Day-wise days in
      // month from Masters -> Salary Rule", which is where that number lives.
      payableDaysCap:
        perAttendedDay && form.payableDaysCap !== '' ? Number(form.payableDaysCap) : null,
      lopApplies: perAttendedDay ? false : form.lopApplies,
      paidLeaveAddsPayableDays: form.paidLeaveAddsPayableDays,
      overtimeBasis: form.overtimeBasis,
      paidLeaveEarnsOvertime: form.paidLeaveEarnsOvertime,
      segmentedRevisionEarnings: form.segmentedRevisionEarnings,
      autoRosterDefaultShift: form.autoRosterDefaultShift,
      active: form.active,
    });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{editing ? `Edit ${editing.typeName}` : 'Add employment type'}</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2.5 }}>
          These settings decide how payroll pays anybody on this type. Editing them does not change
          payslips that have already been generated — each payslip records the behaviour it was
          calculated under.
        </Alert>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              size="small"
              required
              label="Code"
              placeholder="DAY_WISE_SITE"
              value={form.typeCode}
              onChange={(e) => set('typeCode', e.target.value)}
              helperText="Short, no spaces. Cannot clash with an existing code."
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>
            <TextField
              fullWidth
              size="small"
              required
              label="Name"
              placeholder="Day-wise (site)"
              value={form.typeName}
              onChange={(e) => set('typeName', e.target.value)}
              helperText="What HR sees in the employee form."
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2.5 }} />
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          How pay is worked out
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 7 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Pay basis"
              value={form.payBasis}
              onChange={(e) => setForm((prev) => applyPayBasis(prev, e.target.value))}
              helperText={PAY_BASIS_HELP[form.payBasis]}
              slotProps={{ formHelperText: { sx: { mx: 0 } } }}
            >
              {PAY_BASIS.map((b) => (
                <MenuItem key={b} value={b}>
                  {PAY_BASIS_LABEL[b]}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 5 }}>
            <TextField
              fullWidth
              size="small"
              label="Monthly base (days)"
              value={form.payableDaysCap}
              disabled={!perAttendedDay}
              onChange={(e) => set('payableDaysCap', e.target.value.replace(/[^0-9]/g, ''))}
              slotProps={{
                input: { endAdornment: <InputAdornment position="end">days</InputAdornment> },
              }}
              helperText={
                perAttendedDay
                  ? 'Leave blank to use the company’s Day-wise days in month (Masters → Salary Rule, 26 by default). Set it only to give this type its own base. 1–31.'
                  : 'Only used when pay is per day attended — a monthly salary prorates against the month’s own length.'
              }
            />
          </Grid>

          <BooleanRow
            label="Unpaid (LOP) days are deducted"
            help="Attendance shortfalls become loss-of-pay deductions."
            checked={form.lopApplies}
            disabled={perAttendedDay}
            disabledReason="Not available when pay is per day attended — the days not worked are already unpaid, so deducting again would charge the same absence twice."
            onChange={(v) => set('lopApplies', v)}
          />
          <BooleanRow
            label="Approved paid leave counts as a paid day"
            help="Paid leave earns its share of the salary structure on top of days attended."
            checked={form.paidLeaveAddsPayableDays}
            onChange={(v) => set('paidLeaveAddsPayableDays', v)}
          />
        </Grid>

        <Divider sx={{ my: 2.5 }} />
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          How overtime is worked out
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Overtime basis"
              value={form.overtimeBasis}
              onChange={(e) => set('overtimeBasis', e.target.value)}
              helperText={OVERTIME_BASIS_HELP[form.overtimeBasis]}
              slotProps={{ formHelperText: { sx: { mx: 0 } } }}
            >
              {OVERTIME_BASIS.map((b) => (
                <MenuItem key={b} value={b}>
                  {OVERTIME_BASIS_LABEL[b]}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <BooleanRow
            label="Approved paid leave earns overtime hours"
            help="Leave hours are added to the month’s overtime. This is what day-wise workers get today."
            checked={form.paidLeaveEarnsOvertime}
            onChange={(v) => set('paidLeaveEarnsOvertime', v)}
          />
        </Grid>

        <Divider sx={{ my: 2.5 }} />
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          Everything else
        </Typography>
        <Grid container spacing={2}>
          <BooleanRow
            label="Split earnings across a mid-month salary revision"
            help="A raise dated mid-month pays the old rate up to that date and the new rate after it. Switch off to pay the whole month at the new rate."
            checked={form.segmentedRevisionEarnings}
            onChange={(v) => set('segmentedRevisionEarnings', v)}
          />
          <BooleanRow
            label="Put new employees on the GENERAL shift automatically"
            help="Without this, somebody must roster them before attendance can be generated."
            checked={form.autoRosterDefaultShift}
            onChange={(v) => set('autoRosterDefaultShift', v)}
          />
          <BooleanRow
            label="Active"
            help="Switch off to stop this type being assigned to anyone new. Employees already on it keep it."
            checked={form.active}
            onChange={(v) => set('active', v)}
          />
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!isValid || saving}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function EmploymentTypes() {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = useAuth();
  const canManage = can('EMPLOYMENT_TYPE_MANAGE');

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    employmentTypesApi
      .list()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const handleSubmit = (payload) => {
    setSaving(true);
    const action = editing
      ? employmentTypesApi.update(editing.id, payload)
      : employmentTypesApi.create(payload);
    action
      .then(() => {
        enqueueSnackbar(`Employment type ${editing ? 'updated' : 'created'}`, { variant: 'success' });
        setDialogOpen(false);
        load();
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  const handleSeed = () => {
    setSeeding(true);
    employmentTypesApi
      .seedDefaults()
      .then((created) => {
        enqueueSnackbar(
          created.length
            ? `Added ${created.length} standard type(s)`
            : 'The standard types are already set up — nothing was changed',
          { variant: created.length ? 'success' : 'info' }
        );
        load();
      })
      .catch(() => {})
      .finally(() => setSeeding(false));
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setDeleting(true);
    employmentTypesApi
      .remove(deleteTarget.id)
      .then(() => {
        enqueueSnackbar('Employment type deleted', { variant: 'success' });
        setDeleteTarget(null);
        load();
      })
      // A type somebody is on cannot be deleted; the server says so in the
      // error toast, and the confirm dialog says so before you try.
      .catch(() => setDeleteTarget(null))
      .finally(() => setDeleting(false));
  };

  const columns = [
    { field: 'typeCode', headerName: 'Code', width: 150 },
    { field: 'typeName', headerName: 'Name', flex: 1, minWidth: 170 },
    {
      field: 'payBasis',
      headerName: 'Paid',
      width: 210,
      renderCell: (params) => (
        <Tooltip title={PAY_BASIS_HELP[params.value] || ''}>
          <span>{PAY_BASIS_LABEL[params.value] || params.value}</span>
        </Tooltip>
      ),
    },
    {
      field: 'payableDaysCap',
      headerName: 'Monthly base',
      width: 120,
      valueFormatter: (v, row) =>
        row.payBasis !== 'PER_ATTENDED_DAY' ? '—' : v ? `${v} days` : 'Company default',
    },
    {
      field: 'overtimeBasis',
      headerName: 'Overtime',
      width: 240,
      renderCell: (params) => (
        <Tooltip title={OVERTIME_BASIS_HELP[params.value] || ''}>
          <span>{OVERTIME_BASIS_LABEL[params.value] || params.value}</span>
        </Tooltip>
      ),
    },
    {
      field: 'flags',
      headerName: 'Also',
      flex: 1,
      minWidth: 220,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const chips = [];
        if (params.row.lopApplies) chips.push('LOP deducted');
        if (params.row.paidLeaveEarnsOvertime) chips.push('Leave earns OT');
        if (params.row.autoRosterDefaultShift) chips.push('Auto-roster');
        return (
          <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
            {chips.map((c) => (
              <Chip key={c} label={c} size="small" variant="outlined" />
            ))}
          </Stack>
        );
      },
    },
    {
      field: 'active',
      headerName: 'Status',
      width: 100,
      renderCell: (params) =>
        params.value ? (
          <Chip label="Active" size="small" color="success" />
        ) : (
          <Chip label="Inactive" size="small" />
        ),
    },
    ...(canManage
      ? [
          {
            field: 'actions',
            headerName: '',
            sortable: false,
            filterable: false,
            width: 100,
            renderCell: (params) => (
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditing(params.row);
                      setDialogOpen(true);
                    }}
                  >
                    <EditRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => setDeleteTarget(params.row)}>
                    <DeleteRoundedIcon fontSize="small" color="error" />
                  </IconButton>
                </Tooltip>
              </Stack>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Employment Types"
        subtitle="How payroll pays each group — per day attended, or a monthly salary less unpaid days"
        actions={
          canManage && (
            <>
              <Button
                startIcon={<AutoFixHighRoundedIcon />}
                onClick={handleSeed}
                disabled={seeding}
              >
                Set up standard types
              </Button>
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={() => {
                  setEditing(null);
                  setDialogOpen(true);
                }}
              >
                Add type
              </Button>
            </>
          )
        }
      />

      <Alert severity="info" sx={{ mb: 2.5 }}>
        <AlertTitle>Nothing changes until you assign one</AlertTitle>
        Every employee is paid exactly as before until an employment type is set on their record
        (Employees → edit → Employment). Employees with none keep the built-in behaviour of their
        status — Permanent, Day wise, Contract or Intern.
        {canManage && (
          <>
            {' '}
            <strong>Set up standard types</strong> creates those four as editable rows to start
            from; it never overwrites a type you have already changed.
          </>
        )}
      </Alert>

      <DataTable
        rows={rows}
        columns={columns}
        loading={loading}
        height={520}
        emptyState={{
          title: 'No employment types yet',
          description:
            'Everyone is paid by their built-in status. Add types only when a group needs to be paid differently.',
          action: canManage && (
            <Button size="small" variant="contained" onClick={handleSeed} disabled={seeding}>
              Set up standard types
            </Button>
          ),
        }}
      />

      <EmploymentTypeDialog
        open={dialogOpen}
        editing={editing}
        saving={saving}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete employment type?"
        description={`This removes "${deleteTarget?.typeName || ''}" completely. If anyone is on this type it cannot be deleted — edit it and switch Active off instead, which stops it being assigned to anyone new while leaving payroll history intact.`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
