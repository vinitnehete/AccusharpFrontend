import { useEffect, useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import ContractorPicker from '../../components/ContractorPicker';

/**
 * Moves a worker between agencies - the real case of somebody staying on site
 * while the contractor supplying them changes.
 *
 * The warning is not decoration. Attendance is keyed by device user ID, not by
 * contractor, so days already generated stay exactly where they are and will
 * be reported under the *new* contractor from now on. That is the honest
 * answer for a live change and the wrong one for restating a past month, so
 * the dialog says which it is doing.
 */
export default function ReassignContractorDialog({ open, worker, loading, onClose, onConfirm }) {
  const [target, setTarget] = useState(null);

  useEffect(() => {
    if (open) setTarget(null);
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Move to another contractor</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <DialogContentText>
            {worker?.employeeName} is currently deployed by {worker?.contractorName}.
          </DialogContentText>
          <ContractorPicker
            label="New contractor"
            value={target}
            onChange={setTarget}
            required
            sx={{ width: '100%' }}
          />
          <Alert severity="warning">
            Attendance already generated stays as it is and will be reported under the new
            contractor from now on. Do this when the agency genuinely changes — not to correct a
            month that has already been reported.
          </Alert>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={() => onConfirm(target)}
          variant="contained"
          disabled={!target || target === worker?.contractorId || loading}
        >
          Move worker
        </Button>
      </DialogActions>
    </Dialog>
  );
}
