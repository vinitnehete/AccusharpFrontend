import { useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import CsvFileField from '../../components/CsvFileField';
import BulkImportSummary from '../../components/BulkImportSummary';
import MoneyText from '../../components/MoneyText';
import recoveriesApi from '../../api/recoveries';
import { downloadCsv } from '../../utils/csv';
import { RECOVERY_TYPE_LABEL } from '../../constants/enums';

// Mirrors RecoveryCsvParser.java's expected header exactly.
const TEMPLATE_COLUMNS = [
  'employeeId',
  'type',
  'principalAmount',
  'installmentAmount',
  'tenureMonths',
  'startMonth',
  'startYear',
  'issuedOn',
  'reason',
  'remarks',
];

const TEMPLATE_EXAMPLE = {
  employeeId: 'EMP001',
  type: 'LOAN',
  principalAmount: '60000',
  installmentAmount: '5000',
  tenureMonths: '',
  startMonth: '',
  startYear: '',
  issuedOn: '2026-09-01',
  reason: 'Home repair loan',
  remarks: '',
};

const SUCCEEDED_COLUMNS = [
  { field: 'employeeId', headerName: 'User ID', width: 100 },
  { field: 'employeeName', headerName: 'Employee', width: 170 },
  {
    field: 'type',
    headerName: 'Type',
    width: 130,
    valueGetter: (value) => RECOVERY_TYPE_LABEL[value] || value,
  },
  {
    field: 'principalAmount',
    headerName: 'Issued',
    width: 130,
    renderCell: (params) => <MoneyText value={params.value} />,
  },
  {
    field: 'installmentAmount',
    headerName: 'Instalment',
    width: 130,
    renderCell: (params) => <MoneyText value={params.value} />,
  },
  {
    field: 'startPeriod',
    headerName: 'Recovers from',
    width: 130,
    valueGetter: (_value, row) => `${row.startMonth}/${row.startYear}`,
  },
];

export default function BulkIssueRecoveries() {
  const { enqueueSnackbar } = useSnackbar();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTemplate = () =>
    downloadCsv(
      'recovery-bulk-issue-template.csv',
      TEMPLATE_COLUMNS.map((field) => ({ field })),
      [TEMPLATE_EXAMPLE]
    );

  const handleUpload = () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    recoveriesApi
      .bulkIssue(file)
      .then((res) => {
        setResult(res);
        enqueueSnackbar(`Raised ${res.successCount} of ${res.totalRows} recoveries`, {
          variant: res.failureCount > 0 ? 'warning' : 'success',
        });
      })
      .catch(() => {})
      .finally(() => setUploading(false));
  };

  return (
    <>
      <PageHeader
        title="Bulk Issue (CSV)"
        subtitle="Raise many loans, advances or fines at once — a month's fine list, or a festival advance run"
      />
      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Stack spacing={2}>
            <Alert severity="info">
              Expected header (case-insensitive, any order): <code>{TEMPLATE_COLUMNS.join(', ')}</code>.{' '}
              <code>employeeId</code>, <code>type</code> and <code>principalAmount</code> are required;{' '}
              <code>type</code> is one of LOAN, ADVANCE, FINE, OTHER. Leave{' '}
              <code>installmentAmount</code> blank to recover the whole amount in one go, or give a{' '}
              <code>tenureMonths</code> to spread a loan evenly. Blank{' '}
              <code>startMonth</code>/<code>startYear</code> starts a loan in the month after its issued date
              and everything else in the issue month. Supply both to choose a period from the issue month onward.
            </Alert>
            <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
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
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!file || uploading}
              sx={{ alignSelf: 'flex-start' }}
            >
              Upload &amp; issue
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <BulkImportSummary result={result} succeededColumns={SUCCEEDED_COLUMNS} getSucceededRowId={(r) => r.id} />
    </>
  );
}
