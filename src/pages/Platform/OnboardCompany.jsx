import { useMemo, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import TempPasswordDialog from '../../components/TempPasswordDialog';
import companiesApi from '../../api/companies';

const emptyForm = {
  companyCode: '',
  companyName: '',
  address: '',
  phone: '',
  companyEmail: '',
  adminUserId: '',
  adminName: '',
  adminEmail: '',
};

export default function OnboardCompany() {
  const { enqueueSnackbar } = useSnackbar();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const set = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const requiredOk = useMemo(
    () => form.companyCode && form.companyName && form.adminUserId && form.adminName,
    [form]
  );

  const handleSubmit = () => {
    setSaving(true);
    companiesApi
      .onboard({
        companyCode: form.companyCode,
        companyName: form.companyName,
        address: form.address || null,
        phone: form.phone || null,
        companyEmail: form.companyEmail || null,
        adminUserId: form.adminUserId,
        adminName: form.adminName,
        adminEmail: form.adminEmail || null,
      })
      .then((res) => {
        enqueueSnackbar('Company onboarded successfully', { variant: 'success' });
        setResult(res);
        setForm(emptyForm);
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  return (
    <>
      <PageHeader
        title="Onboard Company"
        subtitle="Creates a company and its admin account together, atomically."
        actions={
          <Button variant="contained" onClick={handleSubmit} disabled={!requiredOk || saving}>
            Onboard company
          </Button>
        }
      />

      <Alert severity="info" sx={{ mb: 2.5 }}>
        A bare company has nobody able to add its staff - this creates the company and its admin
        account together, with a one-time temporary password. The admin is a company account, not
        an employee: it has no salary or employee code, and no workspace of its own.
      </Alert>

      <Card sx={{ mb: 2.5 }}>
        <CardHeader title={<Typography variant="subtitle1">Company</Typography>} />
        <CardContent sx={{ pt: 0 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Company code"
                required
                value={form.companyCode}
                onChange={(e) => set('companyCode', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField
                fullWidth
                size="small"
                label="Company name"
                required
                value={form.companyName}
                onChange={(e) => set('companyName', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size="small"
                label="Address"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Phone"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="email"
                label="Company email"
                value={form.companyEmail}
                onChange={(e) => set('companyEmail', e.target.value)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2.5 }}>
        <CardHeader title={<Typography variant="subtitle1">Admin account</Typography>} />
        <CardContent sx={{ pt: 0 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="User ID"
                required
                value={form.adminUserId}
                onChange={(e) => set('adminUserId', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Name"
                required
                value={form.adminName}
                onChange={(e) => set('adminName', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="email"
                label="Email"
                value={form.adminEmail}
                onChange={(e) => set('adminEmail', e.target.value)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <TempPasswordDialog
        open={!!result}
        title="Company onboarded"
        userId={result?.admin?.userId}
        temporaryPassword={result?.temporaryPassword}
        onClose={() => setResult(null)}
      />
    </>
  );
}
