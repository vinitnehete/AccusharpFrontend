import { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import MoneyText from '../../components/MoneyText';
import payrollApi from '../../api/payroll';
import { useActingAs } from '../../context/ActingAsContext';

const columns = [
  { field: 'employeeId', headerName: 'User ID', width: 100 },
  { field: 'employeeName', headerName: 'Employee', width: 170 },
  { field: 'departmentName', headerName: 'Department', width: 150 },
  { field: 'payableDays', headerName: 'Payable days', width: 110 },
  {
    field: 'totalEarnings',
    headerName: 'Earnings',
    width: 130,
    renderCell: (params) => <MoneyText value={params.value} />,
  },
  {
    field: 'totalDeduction',
    headerName: 'Deductions',
    width: 130,
    renderCell: (params) => <MoneyText value={params.value} />,
  },
  {
    field: 'netSalary',
    headerName: 'Net salary',
    width: 140,
    renderCell: (params) => <MoneyText value={params.value} />,
  },
];

export default function GenerateAll() {
  const { enqueueSnackbar } = useSnackbar();
  const { actingAs } = useActingAs();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState(null);

  const handleGenerate = () => {
    setSaving(true);
    payrollApi
      .generateAll(Number(month), Number(year), actingAs?.userId)
      .then((res) => {
        setResults(res);
        if (res.failureCount > 0) {
          enqueueSnackbar(
            `Generated payroll for ${res.successCount} employee(s), ${res.failureCount} failed — see below`,
            { variant: res.successCount > 0 ? 'warning' : 'error' }
          );
        } else {
          enqueueSnackbar(`Generated payroll for ${res.successCount} employee(s)`, { variant: 'success' });
        }
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  return (
    <>
      <PageHeader
        title="Generate All Payroll"
        subtitle="Skips anyone whose period is already generated — safe to re-run. Manual amounts (bonus, incentive, TDS, canteen) are zero; loans, advances and fines are recovered from each employee's own balance."
        actions={
          <Button variant="contained" onClick={handleGenerate} disabled={saving}>
            Generate for everyone
          </Button>
        }
      />
      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Month"
                value={month}
                onChange={(e) => setMonth(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Year"
                value={year}
                onChange={(e) => setYear(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {results && (
        <>
          {results.successCount === 0 && results.failureCount === 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Nothing generated — everyone for this period may already have payroll.
            </Alert>
          )}
          {results.failureCount > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {results.failureCount} employee(s) could not be generated — the rest were generated
              normally.
              <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                {results.errors.map((e) => (
                  <li key={`${e.rowNumber}-${e.identifier}`}>
                    {e.identifier || `row ${e.rowNumber}`}: {e.message}
                  </li>
                ))}
              </ul>
            </Alert>
          )}
          {results.successCount > 0 && (
            <DataTable rows={results.succeeded} columns={columns} getRowId={(r) => r.id} height={480} />
          )}
        </>
      )}
    </>
  );
}
