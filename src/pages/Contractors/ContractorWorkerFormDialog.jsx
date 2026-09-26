import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import ContractorPicker from '../../components/ContractorPicker';
import EmployeePicker from '../../components/EmployeePicker';
import designationsApi from '../../api/designations';
import { GENDER, labelize } from '../../constants/enums';

const EMPTY = {
  userId: '',
  employeeCode: '',
  employeeName: '',
  designationId: '',
  supervisorUserId: null,
  phone: '',
  gender: '',
};

/**
 * Onboards or edits one of a contractor's workers.
 *
 * The form is deliberately short. This company rosters these people and
 * reports their attendance; it does not pay them, so there is no salary
 * structure, no PF/ESIC/UAN, no bank details and no role here — the API will
 * not accept any of them either.
 *
 * The supervisor list is EmployeePicker, which reads the company's own
 * employee directory. That directory excludes contractor workers server-side,
 * so it can only ever offer one of our own people — which is the rule.
 */
export default function ContractorWorkerFormDialog({
  open,
  worker,
  defaultContractorId,
  saving,
  onClose,
  onSubmit,
}) {
  const [values, setValues] = useState(EMPTY);
  const [contractorId, setContractorId] = useState(defaultContractorId ?? null);
  const [joiningDate, setJoiningDate] = useState(null);
  const [designations, setDesignations] = useState([]);

  useEffect(() => {
    designationsApi.list().then(setDesignations).catch(() => setDesignations([]));
  }, []);

  useEffect(() => {
    if (!open) return;
    setValues({
      ...EMPTY,
      ...(worker || {}),
      designationId: worker?.designationId ?? '',
      gender: worker?.gender ?? '',
    });
    setContractorId(worker?.contractorId ?? defaultContractorId ?? null);
    setJoiningDate(worker?.joiningDate ? dayjs(worker.joiningDate) : null);
  }, [open, worker, defaultContractorId]);

  const set = (name) => (event) => setValues((prev) => ({ ...prev, [name]: event.target.value }));

  const isValid =
    values.userId.trim() && values.employeeCode.trim() && values.employeeName.trim() && contractorId;

  const handleSubmit = () =>
    onSubmit(contractorId, {
      userId: values.userId.trim(),
      employeeCode: values.employeeCode.trim(),
      employeeName: values.employeeName.trim(),
      designationId: values.designationId || null,
      supervisorUserId: values.supervisorUserId || null,
      phone: values.phone?.trim() || null,
      gender: values.gender || null,
      joiningDate: joiningDate ? joiningDate.format('YYYY-MM-DD') : null,
    });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{worker ? 'Edit worker' : 'Add contractor worker'}</DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
          Only what attendance needs. The user ID must match the biometric device — it is how every
          punch is matched to this person. No pay details are held here: their contractor runs their
          payroll from the attendance report you send.
        </Alert>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <ContractorPicker
              value={contractorId}
              onChange={setContractorId}
              required
              // Editing never moves a worker between agencies by accident -
              // that is a separate, audited action on the list itself.
              sx={{ width: '100%' }}
              helperText={worker ? 'Use "Move to contractor" on the list to reassign' : undefined}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth
              size="small"
              required
              label="User ID (device)"
              value={values.userId}
              onChange={set('userId')}
              helperText="Biometric device user id"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth
              size="small"
              required
              label="Worker code"
              value={values.employeeCode}
              onChange={set('employeeCode')}
              helperText="The contractor's own code"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size="small"
              required
              label="Worker name"
              value={values.employeeName}
              onChange={set('employeeName')}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Trade / skill"
              value={values.designationId ?? ''}
              onChange={set('designationId')}
            >
              <MenuItem value="">Not specified</MenuItem>
              {designations.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.designationName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <EmployeePicker
              label="Supervisor (from your company)"
              value={values.supervisorUserId}
              onChange={(userId) => setValues((prev) => ({ ...prev, supervisorUserId: userId }))}
              helperText="Who rosters and reviews this worker"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <DatePicker
              label="On site from"
              value={joiningDate}
              onChange={setJoiningDate}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Gender"
              value={values.gender ?? ''}
              onChange={set('gender')}
            >
              <MenuItem value="">Not specified</MenuItem>
              {GENDER.map((g) => (
                <MenuItem key={g} value={g}>
                  {labelize(g)}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="Phone"
              value={values.phone ?? ''}
              onChange={set('phone')}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!isValid || saving}>
          {worker ? 'Save' : 'Add worker'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
