import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const EMPTY = {
  contractorCode: '',
  contractorName: '',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  gstNo: '',
  panNo: '',
  notes: '',
};

/**
 * Onboards or edits a contractor.
 *
 * Not MasterFormDialog: that component renders a flat list of text/select/
 * switch fields and has no date support, and this form needs two dates plus a
 * grouped layout (who they are / how we reach them / the agreement). Keeping
 * it here leaves MasterFormDialog unchanged for the seven master screens that
 * already use it.
 */
export default function ContractorFormDialog({ open, contractor, saving, onClose, onSubmit }) {
  const [values, setValues] = useState(EMPTY);
  const [agreementStart, setAgreementStart] = useState(null);
  const [agreementEnd, setAgreementEnd] = useState(null);

  useEffect(() => {
    if (!open) return;
    setValues({ ...EMPTY, ...(contractor || {}) });
    setAgreementStart(contractor?.agreementStartDate ? dayjs(contractor.agreementStartDate) : null);
    setAgreementEnd(contractor?.agreementEndDate ? dayjs(contractor.agreementEndDate) : null);
  }, [open, contractor]);

  const set = (name) => (event) => setValues((prev) => ({ ...prev, [name]: event.target.value }));

  const endBeforeStart =
    agreementStart && agreementEnd && agreementEnd.isBefore(agreementStart, 'day');
  const isValid = values.contractorCode.trim() && values.contractorName.trim() && !endBeforeStart;

  const handleSubmit = () =>
    onSubmit({
      ...values,
      // Blank strings would fail the server's @Email check on an optional
      // field; undefined omits it, which is what "not provided" means.
      email: values.email?.trim() || undefined,
      agreementStartDate: agreementStart ? agreementStart.format('YYYY-MM-DD') : null,
      agreementEndDate: agreementEnd ? agreementEnd.format('YYYY-MM-DD') : null,
    });

  const field = (name, label, extra = {}) => (
    <TextField
      fullWidth
      size="small"
      label={label}
      value={values[name] ?? ''}
      onChange={set(name)}
      {...extra}
    />
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{contractor ? 'Edit contractor' : 'Onboard contractor'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            {field('contractorCode', 'Contractor code', {
              required: true,
              helperText: 'Your own reference — unique within this company',
            })}
          </Grid>
          <Grid size={{ xs: 12, sm: 8 }}>{field('contractorName', 'Contractor name', { required: true })}</Grid>

          <Grid size={12}>
            <Typography variant="overline" color="text.secondary">
              Who the attendance report goes to
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>{field('contactPerson', 'Contact person')}</Grid>
          <Grid size={{ xs: 12, sm: 4 }}>{field('email', 'Email', { type: 'email' })}</Grid>
          <Grid size={{ xs: 12, sm: 4 }}>{field('phone', 'Phone')}</Grid>
          <Grid size={12}>{field('address', 'Address', { multiline: true, minRows: 2 })}</Grid>

          <Grid size={12}>
            <Typography variant="overline" color="text.secondary">
              Agreement
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>{field('gstNo', 'GST number')}</Grid>
          <Grid size={{ xs: 12, sm: 3 }}>{field('panNo', 'PAN')}</Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <DatePicker
              label="Agreement start"
              value={agreementStart}
              onChange={setAgreementStart}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <DatePicker
              label="Agreement end"
              value={agreementEnd}
              onChange={setAgreementEnd}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  error: !!endBeforeStart,
                  helperText: endBeforeStart ? 'Cannot be before the start date' : undefined,
                },
              }}
            />
          </Grid>
          <Grid size={12}>{field('notes', 'Notes', { multiline: true, minRows: 2 })}</Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!isValid || saving}>
          {contractor ? 'Save' : 'Onboard'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
