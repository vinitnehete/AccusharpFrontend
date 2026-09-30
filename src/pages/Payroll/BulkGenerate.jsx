import { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import CsvFileField from '../../components/CsvFileField';
import BulkImportSummary from '../../components/BulkImportSummary';
import MoneyText from '../../components/MoneyText';
import payrollApi from '../../api/payroll';
import { downloadCsv } from '../../utils/csv';

// Mirrors PayrollCsvParser.java's expected header exactly.
const TEMPLATE_COLUMNS = ['employeeId', 'bonus', 'incentive', 'tds', 'advanceDeduction', 'loanDeduction', 'canteen'];
const TEMPLATE_EXAMPLE = {
  employeeId: 'EMP001', bonus: '0', incentive: '0', tds: '0', advanceDeduction: '0', loanDeduction: '0', canteen: '0',
};

const SUCCEEDED_COLUMNS = [
  { field: 'employeeId', headerName: 'User ID', width: 100 },
  { field: 'employeeName', headerName: 'Employee', width: 170 },
  { field: 'payableDays', headerName: 'Payable days', width: 110 },
  { field: 'totalEarnings', headerName: 'Earnings', width: 130, renderCell: (params) => <MoneyText value={params.value} /> },
  { field: 'totalDeduction', headerName: 'Deductions', width: 130, renderCell: (params) => <MoneyText value={params.value} /> },
  { field: 'netSalary', headerName: 'Net salary', width: 140, renderCell: (params) => <MoneyText value={params.value} /> },
];

export default function BulkGenerate() {
  const { enqueueSnackbar } = useSnackbar();
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [regenerate, setRegenerate] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTemplate = () => {
    downloadCsv(
      'payroll-bulk-generate-template.csv',
      TEMPLATE_COLUMNS.map((field) => ({ field })),
      [TEMPLATE_EXAMPLE]
    );
  };

  const isValid = file && month && year;

  const handleUpload = () => {
    if (!isValid) return;
    setUploading(true);
    setResult(null);
    payrollApi
      .bulkGenerate(file, Number(month), Number(year), regenerate)
      .then((res) => {
        setResult(res);
        enqueueSnackbar(`Payroll generated for ${res.successCount} of ${res.totalRows} employee(s)`, {
          variant: res.failureCount > 0 ? 'warning' : 'success',
        });
      })
      .catch(() => {})
      .finally(() => setUploading(false));
  };

  return (
    <>
      <PageHeader
        title="Bulk Generate Payroll (CSV)"
        subtitle="Run payroll for a whole company from one CSV, carrying whatever one-off bonus/incentive/deduction amounts that month needs — everything else is still computed server-side"
      />
      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Stack spacing={2}>
            <Alert severity="info">
              Expected header (case-insensitive, any order): <code>{TEMPLATE_COLUMNS.join(', ')}</code>. Only{' '}
              <code>employeeId</code> is required — every amount defaults to zero. <code>month</code>/
              <code>year</code> below apply to the whole file, not a column.
            </Alert>
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
              <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={<Switch checked={regenerate} onChange={(e) => setRegenerate(e.target.checked)} />}
                  label="Regenerate if already generated (new revision)"
                />
              </Grid>
            </Grid>
            <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
              <CsvFileField value={file} onChange={setFile} />
              <Button
                size="small"
                startIcon={<DownloadRoundedIcon />}
                onClick={handleTemplate}
                sx={{ ml: { sm: 'auto' } }}
              >
                Download template
              </Button>
            </Stack>
            <Button variant="contained" onClick={handleUpload} disabled={!isValid || uploading} sx={{ alignSelf: 'flex-start' }}>
              Upload &amp; generate
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <BulkImportSummary result={result} succeededColumns={SUCCEEDED_COLUMNS} getSucceededRowId={(r) => r.id} />
    </>
  );
}
