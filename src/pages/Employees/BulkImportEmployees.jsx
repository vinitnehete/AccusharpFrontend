import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import CsvFileField from '../../components/CsvFileField';
import BulkImportSummary from '../../components/BulkImportSummary';
import employeesApi from '../../api/employees';
import { downloadCsv } from '../../utils/csv';
import { downloadEmployeeTemplate, EMPLOYEE_TEMPLATE_COLUMNS as TEMPLATE_COLUMNS } from '../../utils/employeeTemplate';
import { useActingAs } from '../../context/ActingAsContext';

const SUCCEEDED_COLUMNS = [
  { field: 'employeeCode', headerName: 'Code', width: 110, valueGetter: (v, row) => row.employee.employeeCode },
  { field: 'employeeName', headerName: 'Name', flex: 1, minWidth: 170, valueGetter: (v, row) => row.employee.employeeName },
  { field: 'userId', headerName: 'User ID', width: 110, valueGetter: (v, row) => row.employee.userId },
  { field: 'departmentName', headerName: 'Department', width: 150, valueGetter: (v, row) => row.employee.departmentName },
  {
    field: 'temporaryPassword',
    headerName: 'Temporary password',
    width: 180,
    renderCell: (params) => <PasswordCell value={params.value} />,
  },
];

function PasswordCell({ value }) {
  const { enqueueSnackbar } = useSnackbar();
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
        {value}
      </Typography>
      <Tooltip title="Copy">
        <IconButton
          size="small"
          onClick={() => {
            navigator.clipboard?.writeText(value || '');
            enqueueSnackbar('Password copied to clipboard', { variant: 'success' });
          }}
        >
          <ContentCopyRoundedIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

export default function BulkImportEmployees() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { reloadEmployees } = useActingAs();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTemplate = () => {
    downloadEmployeeTemplate().catch(() =>
      enqueueSnackbar('Could not generate the template file', { variant: 'error' })
    );
  };

  const handleDownloadPasswords = () => {
    downloadCsv(
      'employee-bulk-import-passwords.csv',
      [
        { field: 'userId', headerName: 'userId' },
        { field: 'employeeCode', headerName: 'employeeCode' },
        { field: 'employeeName', headerName: 'employeeName' },
        { field: 'temporaryPassword', headerName: 'temporaryPassword' },
      ],
      result.succeeded.map((r) => ({
        userId: r.employee.userId,
        employeeCode: r.employee.employeeCode,
        employeeName: r.employee.employeeName,
        temporaryPassword: r.temporaryPassword,
      }))
    );
  };

  const handleUpload = () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    employeesApi
      .bulkImport(file)
      .then((res) => {
        setResult(res);
        enqueueSnackbar(`${res.successCount} of ${res.totalRows} employee(s) created`, {
          variant: res.failureCount > 0 ? 'warning' : 'success',
        });
        reloadEmployees();
      })
      .catch(() => {})
      .finally(() => setUploading(false));
  };

  return (
    <>
      <PageHeader
        title="Bulk Import Employees"
        subtitle="Onboard many employees from one CSV file — each row runs the same create path as adding one employee"
        actions={
          <Button color="inherit" onClick={() => navigate('/employees')}>
            Back to Employees
          </Button>
        }
      />
      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Stack spacing={2}>
            <Alert severity="info">
              Download the template below — required columns are marked in red. Fill it in, then use{' '}
              <strong>File → Save As → CSV (Comma delimited)</strong> before uploading, since the upload only
              accepts <code>.csv</code> files. Expected header (case-insensitive, any order):{' '}
              <code>{TEMPLATE_COLUMNS.join(', ')}</code>. Required: <code>userId</code>, <code>employeeCode</code>,{' '}
              <code>employeeName</code>, <code>status</code>, <code>grossSalary</code>, <code>pfBasic</code>,{' '}
              <code>medicalAllowance</code> and <code>otherAllowance</code> — everything else is optional.{' '}
              <code>companyId</code> is ignored unless you're a platform-level import; it's always overwritten
              with your own company otherwise.
            </Alert>
            <Alert severity="info">
              <code>weekOffDays</code> is the days an employee does not work — one cell, day names
              in any order and any case (<code>SATURDAY SUNDAY</code>, <code>sun</code>,{' '}
              <code>Sat/Sun</code> all work). Leave it blank to leave the employee unconfigured —
              permanent staff then fall back to Sunday, everyone else has no weekly off. Put <code>NONE</code> to say explicitly that this employee
              has no weekly off. This is what attendance uses to decide which days are Weekly Off
              rather than absent, so fill it in for day-wise staff in particular.
            </Alert>
            <Alert severity="info">
              The last four columns (<code>basicDA</code>, <code>hra</code>,{' '}
              <code>conveyanceAllowance</code>, <code>educationAllowance</code>) are optional, and only
              make sense filled in together. Leave all four blank on a row to keep deriving that
              employee's structure from the salary rule, as before — fill in all four to use those
              exact figures instead (e.g. migrating known values from an existing payroll system).
              Filling in only some of the four fails that row.
            </Alert>
            <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
              <CsvFileField value={file} onChange={setFile} />
              <Button
                size="small"
                startIcon={<DownloadRoundedIcon />}
                onClick={handleTemplate}
                sx={{ ml: { sm: 'auto' } }}
              >
                Download template (.xlsx)
              </Button>
            </Stack>
            <Button variant="contained" onClick={handleUpload} disabled={!file || uploading} sx={{ alignSelf: 'flex-start' }}>
              Upload &amp; create
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {result?.successCount > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleDownloadPasswords}>
              Download passwords CSV
            </Button>
          }
        >
          Temporary passwords are shown here exactly once and cannot be retrieved again — save them now.
        </Alert>
      )}

      <BulkImportSummary
        result={result}
        succeededColumns={SUCCEEDED_COLUMNS}
        getSucceededRowId={(r) => r.employee.id}
        succeededMessage={result ? `${result.successCount} employee(s) created — see temporary passwords below.` : undefined}
      />
    </>
  );
}
