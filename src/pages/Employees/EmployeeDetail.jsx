import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import dayjs from 'dayjs';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Skeleton from '@mui/material/Skeleton';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import LockResetRoundedIcon from '@mui/icons-material/LockResetRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import StatusChip from '../../components/StatusChip';
import MoneyText from '../../components/MoneyText';
import EmployeePicker from '../../components/EmployeePicker';
import ConfirmDialog from '../../components/ConfirmDialog';
import TempPasswordDialog from '../../components/TempPasswordDialog';
import employeesApi from '../../api/employees';
import customRolesApi from '../../api/customRoles';
import { RECORD_STATUS_COLOR, ROLE_COLOR, SALARY_REVISION_REASON, labelize } from '../../constants/enums';
import { useActingAs } from '../../context/ActingAsContext';
import { useAuth } from '../../context/AuthContext';
import { maskSensitive } from '../../utils/mask';

function Field({ label, value }) {
  return (
    <Grid size={{ xs: 12, sm: 4 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value ?? '-'}</Typography>
    </Grid>
  );
}

// Ordered Monday-first so a two-day weekend reads "Saturday, Sunday" rather
// than in whatever order the API happened to serialise the set.
const WEEK_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

// Unset means Sunday only for an auto-rostered employee - that is what their
// roster always said. For anyone else it means no weekly off at all.
const weekOffLabel = (days, autoRostered) => {
  if (!days) return autoRostered ? 'Not set (Sunday)' : 'Not set — no weekly off';
  if (days.length === 0) return 'None — works every day';
  return [...days].sort((a, b) => WEEK_ORDER.indexOf(a) - WEEK_ORDER.indexOf(b))
    .map(labelize)
    .join(', ');
};

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { reloadEmployees } = useActingAs();
  const { can, username, isAdmin } = useAuth();
  const canUpdate = can('EMPLOYEE_UPDATE');
  const canSeePay = canUpdate || can('PAYROLL_PROCESS');
  const canReadRoles = can('ROLE_READ');
  const canManageRoles = can('ROLE_MANAGE');
  const [emp, setEmp] = useState(null);
  // Your own record is the admin's to change (the server refuses it), so the actions are not offered.
  const mayChange = canUpdate && (isAdmin || emp?.userId !== username);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [newSupervisor, setNewSupervisor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);
  const [structureOpen, setStructureOpen] = useState(false);
  const [structureValues, setStructureValues] = useState(null);
  const [savingStructure, setSavingStructure] = useState(false);
  const [regenerateConfirmOpen, setRegenerateConfirmOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [reviseOpen, setReviseOpen] = useState(false);
  const [reviseValues, setReviseValues] = useState(null);
  const [revising, setRevising] = useState(false);
  const [revisions, setRevisions] = useState([]);
  const [revisionsLoading, setRevisionsLoading] = useState(false);
  const [customRoles, setCustomRoles] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [roleToAssign, setRoleToAssign] = useState('');
  const [assigning, setAssigning] = useState(false);

  const load = () => {
    setLoading(true);
    employeesApi
      .get(id)
      .then((data) => {
        setEmp(data);
        setNewSupervisor(data.supervisorUserId);
        return employeesApi.team(data.userId).catch(() => []);
      })
      .then(setTeam)
      .catch(() => setEmp(null))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const loadRevisions = () => {
    setRevisionsLoading(true);
    employeesApi
      .getSalaryRevisions(id)
      .then(setRevisions)
      .catch(() => setRevisions([]))
      .finally(() => setRevisionsLoading(false));
  };

  useEffect(() => {
    if (canSeePay) loadRevisions();
  }, [id, canSeePay]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCustomRoles = (userId) => {
    if (!canReadRoles || !userId) return;
    setRolesLoading(true);
    Promise.all([customRolesApi.listForEmployee(userId), customRolesApi.list()])
      .then(([assigned, all]) => {
        setCustomRoles(assigned);
        setAllRoles(all);
      })
      .catch(() => {})
      .finally(() => setRolesLoading(false));
  };

  useEffect(() => {
    if (emp?.userId) loadCustomRoles(emp.userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emp?.userId]);

  const handleReassign = () => {
    setSaving(true);
    employeesApi
      .reassignSupervisor(emp.userId, newSupervisor)
      .then(() => {
        enqueueSnackbar('Supervisor reassigned', { variant: 'success' });
        setReassignOpen(false);
        reloadEmployees();
        load();
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  const handleResetPassword = () => {
    setResetting(true);
    employeesApi
      .resetPassword(emp.id)
      .then((res) => {
        setResetConfirmOpen(false);
        setTempPassword(res);
      })
      .catch(() => {})
      .finally(() => setResetting(false));
  };

  const openStructureDialog = () => {
    setStructureValues({
      basicDA: emp.basicDA,
      hra: emp.hra,
      conveyanceAllowance: emp.conveyanceAllowance,
      educationAllowance: emp.educationAllowance,
    });
    setStructureOpen(true);
  };

  const handleStructureChange = (name, value) => {
    setStructureValues((prev) => ({ ...prev, [name]: value.replace(/[^0-9.]/g, '') }));
  };

  const handleSaveStructure = () => {
    setSavingStructure(true);
    employeesApi
      .updateSalaryStructure(emp.id, structureValues)
      .then(() => {
        enqueueSnackbar('Salary structure overridden', { variant: 'success' });
        setStructureOpen(false);
        load();
      })
      .catch(() => {})
      .finally(() => setSavingStructure(false));
  };

  const handleRegenerateStructure = () => {
    setRegenerating(true);
    employeesApi
      .regenerateSalaryStructure(emp.id)
      .then(() => {
        enqueueSnackbar('Salary structure regenerated from the current rule', { variant: 'success' });
        setRegenerateConfirmOpen(false);
        load();
      })
      .catch(() => {})
      .finally(() => setRegenerating(false));
  };

  const openReviseDialog = () => {
    setReviseValues({
      newGrossSalary: '',
      effectiveDate: dayjs(),
      reason: 'ANNUAL_INCREMENT',
      remarks: '',
      // Only required by the server when the employee is currently overridden - a frozen
      // structure never follows grossSalary on its own, so these must be supplied together.
      basicDA: '',
      hra: '',
      conveyanceAllowance: '',
      educationAllowance: '',
    });
    setReviseOpen(true);
  };

  const setReviseField = (name, value) => setReviseValues((prev) => ({ ...prev, [name]: value }));

  const setReviseMoneyField = (name, value) =>
    setReviseValues((prev) => ({ ...prev, [name]: value.replace(/[^0-9.]/g, '') }));

  const reviseRequiresStructure = emp?.salaryStructureOverridden;
  const reviseOk =
    reviseValues &&
    reviseValues.newGrossSalary !== '' &&
    !!reviseValues.effectiveDate &&
    !!reviseValues.reason &&
    (!reviseRequiresStructure ||
      (reviseValues.basicDA !== '' &&
        reviseValues.hra !== '' &&
        reviseValues.conveyanceAllowance !== '' &&
        reviseValues.educationAllowance !== ''));

  const handleReviseSalary = () => {
    setRevising(true);
    const payload = {
      newGrossSalary: reviseValues.newGrossSalary,
      effectiveDate: reviseValues.effectiveDate.format('YYYY-MM-DD'),
      reason: reviseValues.reason,
      remarks: reviseValues.remarks || null,
      ...(reviseRequiresStructure
        ? {
            basicDA: reviseValues.basicDA,
            hra: reviseValues.hra,
            conveyanceAllowance: reviseValues.conveyanceAllowance,
            educationAllowance: reviseValues.educationAllowance,
          }
        : {}),
    };
    employeesApi
      .reviseSalary(emp.id, payload)
      .then(() => {
        enqueueSnackbar('Salary revision recorded', { variant: 'success' });
        setReviseOpen(false);
        load();
        loadRevisions();
      })
      .catch(() => {})
      .finally(() => setRevising(false));
  };

  const handleAssignRole = () => {
    if (!roleToAssign) return;
    setAssigning(true);
    customRolesApi
      .assign(roleToAssign, emp.userId)
      .then(() => {
        enqueueSnackbar('Custom role assigned', { variant: 'success' });
        setRoleToAssign('');
        loadCustomRoles(emp.userId);
      })
      .catch(() => {})
      .finally(() => setAssigning(false));
  };

  const handleUnassignRole = (roleId) => {
    customRolesApi
      .unassign(roleId, emp.userId)
      .then(() => {
        enqueueSnackbar('Custom role removed', { variant: 'success' });
        loadCustomRoles(emp.userId);
      })
      .catch(() => {});
  };

  const assignableRoles = allRoles.filter((r) => !customRoles.some((cr) => cr.id === r.id));

  if (loading) return <Skeleton variant="rounded" height={500} />;
  if (!emp) return <Typography color="text.secondary">Employee not found.</Typography>;

  return (
    <>
      <PageHeader
        title={emp.employeeName}
        subtitle={[emp.employeeCode, emp.userId].filter(Boolean).join(' · ')}
        actions={
          mayChange && (
            <>
              <Button
                color="inherit"
                startIcon={<LockResetRoundedIcon />}
                onClick={() => setResetConfirmOpen(true)}
              >
                Reset password
              </Button>
              <Button
                variant="contained"
                startIcon={<EditRoundedIcon />}
                onClick={() => navigate(`/employees/${id}/edit`)}
              >
                Edit
              </Button>
            </>
          )
        }
      />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ mb: 2.5 }}>
            <CardHeader
              title={<Typography variant="subtitle1">Identity & organisation</Typography>}
              avatar={
                <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                  {emp.employeeName?.charAt(0)}
                </Avatar>
              }
              action={
                <Stack direction="row" spacing={1} sx={{ mt: 1, mr: 1 }}>
                  <StatusChip value={emp.role} colorMap={ROLE_COLOR} />
                  <StatusChip value={emp.recordStatus} colorMap={RECORD_STATUS_COLOR} />
                </Stack>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              <Grid container spacing={2}>
                <Field label="Company" value={emp.companyName} />
                <Field label="Department" value={emp.departmentName} />
                <Field label="Designation" value={emp.designationName} />
                <Field label="Category" value={emp.categoryName} />
                <Field
                  label="Supervisor"
                  value={emp.supervisorName ? `${emp.supervisorName} (${emp.supervisorUserId})` : 'None'}
                />
                <Field label="Employment status" value={labelize(emp.status)} />
                {/* Null for every employee who has not been put on a
                    configurable type - which is the norm, and means payroll
                    follows the employment status above. Spelling that out beats
                    a blank field somebody has to interpret. */}
                <Field
                  label="Employment type (pay behaviour)"
                  value={emp.employmentTypeName || 'From employment status'}
                />
                {/* Null means nobody has configured it, which the server
                    resolves to Sunday - not "no weekly off". An employee who
                    genuinely works every day has an empty list, and the two
                    have to read differently here or somebody will "fix" the
                    wrong one. */}
                <Field label="Weekly off" value={weekOffLabel(emp.weekOffDays, emp.autoRostersDefaultShift)} />
                <Field label="Gender" value={emp.gender ? labelize(emp.gender) : '-'} />
                <Field
                  label="Joining date"
                  value={emp.joiningDate ? dayjs(emp.joiningDate).format('DD MMM YYYY') : '-'}
                />
                <Field
                  label="Date of birth"
                  value={emp.dateOfBirth ? dayjs(emp.dateOfBirth).format('DD MMM YYYY') : '-'}
                />
                <Field label="Email" value={emp.email} />
                <Field label="Phone" value={emp.phone} />
              </Grid>
              {mayChange && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Button size="small" onClick={() => setReassignOpen(true)}>
                    Reassign supervisor
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pay and bank details are for those who manage pay - not a supervisor
            opening a team member from My Team. */}
          {canSeePay && (
            <>
            <Card sx={{ mb: 2.5 }}>
              <CardHeader title={<Typography variant="subtitle1">Statutory & bank details</Typography>} />
              <CardContent sx={{ pt: 0 }}>
                <Grid container spacing={2}>
                  <Field label="UAN No" value={maskSensitive(emp.uanNo)} />
                  <Field label="ESIC IP No" value={maskSensitive(emp.esicIpNo)} />
                  <Field label="Bank Account No" value={maskSensitive(emp.bankAccountNo)} />
                  <Field label="Bank IFSC No" value={maskSensitive(emp.bankIfscNo)} />
                </Grid>
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title={<Typography variant="subtitle1">Salary structure</Typography>}
                action={
                  <Stack direction="row" spacing={1} sx={{ mt: 1, mr: 1, alignItems: 'center' }}>
                    <Chip
                      label={emp.salaryStructureOverridden ? 'Manually overridden' : 'Rule-derived'}
                      color={emp.salaryStructureOverridden ? 'warning' : 'default'}
                      size="small"
                    />
                    {mayChange && (
                      <Button size="small" startIcon={<TrendingUpRoundedIcon />} onClick={openReviseDialog}>
                        Revise salary
                      </Button>
                    )}
                    {mayChange && (
                      <Button size="small" startIcon={<EditRoundedIcon />} onClick={openStructureDialog}>
                        Override
                      </Button>
                    )}
                    {mayChange && emp.salaryStructureOverridden && (
                      <Button
                        size="small"
                        color="inherit"
                        startIcon={<RestartAltRoundedIcon />}
                        onClick={() => setRegenerateConfirmOpen(true)}
                      >
                        Regenerate from rule
                      </Button>
                    )}
                  </Stack>
                }
              />
              <CardContent sx={{ pt: 0 }}>
                <Grid container spacing={2}>
                  <Field label="Gross salary" value={<MoneyText value={emp.grossSalary} />} />
                  <Field label="Gross wage (proration base)" value={<MoneyText value={emp.grossSalaryWage} />} />
                  <Field label="Overtime eligible" value={emp.overtimeEligible ? 'Yes' : 'No'} />
                  <Field label="Basic + DA" value={<MoneyText value={emp.basicDA} />} />
                  <Field label="HRA" value={<MoneyText value={emp.hra} />} />
                  <Field label="Conveyance" value={<MoneyText value={emp.conveyanceAllowance} />} />
                  <Field label="Education" value={<MoneyText value={emp.educationAllowance} />} />
                  <Field label="Medical allowance" value={<MoneyText value={emp.medicalAllowance} />} />
                  <Field label="Other allowance" value={<MoneyText value={emp.otherAllowance} />} />
                  <Field label="PF basic" value={<MoneyText value={emp.pfBasic} />} />
                </Grid>
              </CardContent>
            </Card>

            <Card sx={{ mt: 2.5 }}>
              <CardHeader title={<Typography variant="subtitle1">Salary revision history</Typography>} />
              <CardContent sx={{ pt: 0 }}>
                {revisionsLoading ? (
                  <Skeleton variant="rounded" height={80} />
                ) : revisions.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No hikes, promotions or corrections recorded yet — use &quot;Revise salary&quot;
                    above instead of a plain edit so a change like this is never lost.
                  </Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Effective</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell align="right">Previous</TableCell>
                        <TableCell align="right">New</TableCell>
                        <TableCell align="right">Hike</TableCell>
                        <TableCell>By</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {revisions.map((rev, i) => (
                        <TableRow key={rev.id ?? i}>
                          <TableCell>{dayjs(rev.effectiveDate).format('DD MMM YYYY')}</TableCell>
                          <TableCell>{labelize(rev.reason)}</TableCell>
                          <TableCell align="right">
                            <MoneyText value={rev.previousGrossSalary} />
                          </TableCell>
                          <TableCell align="right">
                            <MoneyText value={rev.newGrossSalary} />
                          </TableCell>
                          <TableCell align="right">
                            {rev.hikePercent > 0 ? '+' : ''}
                            {rev.hikePercent}%
                          </TableCell>
                          <TableCell>{rev.revisedBy || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            </>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardHeader title={<Typography variant="subtitle1">Direct reports ({team.length})</Typography>} />
            <CardContent sx={{ pt: 0 }}>
              {team.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No one reports to this employee.
                </Typography>
              ) : (
                <List dense disablePadding>
                  {team.map((t) => (
                    <ListItemButton
                      key={t.id}
                      component={RouterLink}
                      to={`/employees/${t.id}`}
                      sx={{ borderRadius: 1.5 }}
                    >
                      <ListItemText primary={t.employeeName} secondary={`${t.userId} · ${t.designationName || ''}`} />
                    </ListItemButton>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {canReadRoles && (
            <Card sx={{ mt: 2.5 }}>
              <CardHeader title={<Typography variant="subtitle1">Custom roles</Typography>} />
              <CardContent sx={{ pt: 0 }}>
                {customRoles.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    No custom roles assigned.
                  </Typography>
                ) : (
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 1.5 }}>
                    {customRoles.map((r) => (
                      <Chip
                        key={r.id}
                        label={r.name}
                        onDelete={canManageRoles ? () => handleUnassignRole(r.id) : undefined}
                        deleteIcon={<CloseRoundedIcon />}
                        size="small"
                      />
                    ))}
                  </Stack>
                )}
                {canManageRoles && assignableRoles.length > 0 && (
                  <Stack direction="row" spacing={1}>
                    <FormControl size="small" fullWidth>
                      <InputLabel id="assign-role-label">Assign a role</InputLabel>
                      <Select
                        labelId="assign-role-label"
                        label="Assign a role"
                        value={roleToAssign}
                        onChange={(e) => setRoleToAssign(e.target.value)}
                        disabled={rolesLoading}
                      >
                        {assignableRoles.map((r) => (
                          <MenuItem key={r.id} value={r.id}>
                            {r.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="outlined"
                      onClick={handleAssignRole}
                      disabled={!roleToAssign || assigning}
                    >
                      Assign
                    </Button>
                  </Stack>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      <ConfirmDialog
        open={resetConfirmOpen}
        title="Reset password?"
        description={`This generates a new one-time temporary password for ${emp.employeeName} (${emp.userId}), clears any lockout, and signs them out everywhere.`}
        confirmLabel="Reset password"
        loading={resetting}
        onConfirm={handleResetPassword}
        onClose={() => setResetConfirmOpen(false)}
      />

      <TempPasswordDialog
        open={!!tempPassword}
        title="Password reset"
        userId={tempPassword?.employee?.userId}
        temporaryPassword={tempPassword?.temporaryPassword}
        onClose={() => setTempPassword(null)}
      />

      <Dialog open={reassignOpen} onClose={() => setReassignOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reassign supervisor</DialogTitle>
        <DialogContent>
          <EmployeePicker label="New supervisor" value={newSupervisor} onChange={setNewSupervisor} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setReassignOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleReassign} disabled={saving}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={structureOpen} onClose={() => setStructureOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Override salary structure</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Pins these four figures for {emp.employeeName} regardless of the salary rule or a future
            gross salary change, until regenerated.
          </Typography>
          <Grid container spacing={2}>
            {structureValues &&
              [
                { name: 'basicDA', label: 'Basic + DA' },
                { name: 'hra', label: 'HRA' },
                { name: 'conveyanceAllowance', label: 'Conveyance' },
                { name: 'educationAllowance', label: 'Education' },
              ].map((f) => (
                <Grid key={f.name} size={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label={f.label}
                    value={structureValues[f.name] ?? ''}
                    onChange={(e) => handleStructureChange(f.name, e.target.value)}
                  />
                </Grid>
              ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setStructureOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveStructure} disabled={savingStructure}>
            Save override
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={regenerateConfirmOpen}
        title="Regenerate from rule?"
        description={`Clears the manual override and recomputes Basic + DA, HRA, conveyance and education for ${emp.employeeName} from their gross salary and the company's current salary rule.`}
        confirmLabel="Regenerate"
        loading={regenerating}
        onConfirm={handleRegenerateStructure}
        onClose={() => setRegenerateConfirmOpen(false)}
      />

      <Dialog open={reviseOpen} onClose={() => setReviseOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Revise salary</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Updates {emp.employeeName}&apos;s gross salary and records why — unlike a plain edit,
            this is never lost. The structure is re-derived from the current salary rule
            automatically{emp.salaryStructureOverridden ? ', except here, where it is overridden:' : '.'}
          </DialogContentText>
          {reviseValues && (
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField
                  fullWidth
                  size="small"
                  label="New gross salary"
                  required
                  value={reviseValues.newGrossSalary}
                  onChange={(e) => setReviseMoneyField('newGrossSalary', e.target.value)}
                />
              </Grid>
              <Grid size={6}>
                <DatePicker
                  label="Effective date"
                  value={reviseValues.effectiveDate}
                  onChange={(v) => setReviseField('effectiveDate', v)}
                  slotProps={{ textField: { size: 'small', fullWidth: true, required: true } }}
                />
              </Grid>
              <Grid size={6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Reason"
                  required
                  value={reviseValues.reason}
                  onChange={(e) => setReviseField('reason', e.target.value)}
                >
                  {SALARY_REVISION_REASON.map((r) => (
                    <MenuItem key={r} value={r}>
                      {labelize(r)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  label="Remarks (optional)"
                  value={reviseValues.remarks}
                  onChange={(e) => setReviseField('remarks', e.target.value)}
                />
              </Grid>
              {reviseRequiresStructure && (
                <>
                  <Grid size={12}>
                    <Alert severity="warning">
                      This employee&apos;s structure is manually overridden, so it will not follow
                      the new gross salary on its own — enter the replacement figures below.
                    </Alert>
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Basic + DA"
                      required
                      value={reviseValues.basicDA}
                      onChange={(e) => setReviseMoneyField('basicDA', e.target.value)}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="HRA"
                      required
                      value={reviseValues.hra}
                      onChange={(e) => setReviseMoneyField('hra', e.target.value)}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Conveyance"
                      required
                      value={reviseValues.conveyanceAllowance}
                      onChange={(e) => setReviseMoneyField('conveyanceAllowance', e.target.value)}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Education"
                      required
                      value={reviseValues.educationAllowance}
                      onChange={(e) => setReviseMoneyField('educationAllowance', e.target.value)}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setReviseOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleReviseSalary} disabled={!reviseOk || revising}>
            Save revision
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
