import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
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
import leavesApi from '../../api/leaves';
import { downloadCsv } from '../../utils/csv';
import { labelize } from '../../constants/enums';

// Mirrors LeaveCsvParser.java's expected header exactly.
const TEMPLATE_COLUMNS = ['userId', 'leaveType', 'fromDate', 'toDate', 'duration', 'reason'];
const TEMPLATE_EXAMPLE = {
  userId: 'EMP010',
  leaveType: 'CASUAL_LEAVE',
  fromDate: dayjs().format('YYYY-MM-DD'),
  toDate: dayjs().format('YYYY-MM-DD'),
  duration: 'FULL_DAY',
  reason: 'Took the day off informally',
};

const SUCCEEDED_COLUMNS = [
  { field: 'userId', headerName: 'User ID', width: 110 },
  { field: 'employeeName', headerName: 'Employee', width: 170 },
  { field: 'leaveType', headerName: 'Type', width: 140, valueFormatter: (v) => labelize(v) },
  { field: 'fromDate', headerName: 'From', width: 110 },
  { field: 'toDate', headerName: 'To', width: 110 },
  { field: 'totalDays', headerName: 'Days', width: 80 },
];

export default function BulkImportLeaves() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTemplate = () => {
    downloadCsv(
      'leave-bulk-import-template.csv',
      TEMPLATE_COLUMNS.map((field) => ({ field })),
      [TEMPLATE_EXAMPLE]
    );
  };

  const handleUpload = () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    leavesApi
      .bulkImport(file)
      .then((res) => {
        setResult(res);
        enqueueSnackbar(`${res.successCount} of ${res.totalRows} leave(s) added and approved`, {
          variant: res.failureCount > 0 ? 'warning' : 'success',
        });
      })
      .catch(() => {})
      .finally(() => setUploading(false));
  };

  return (
    <>
      <PageHeader
        title="Bulk Import Leaves"
        subtitle="Backfill many already-approved leaves from one CSV file — each row runs the same path as Add Leave"
        actions={
          <Button color="inherit" onClick={() => navigate('/leave/all')}>
            Back to All Leaves
          </Button>
        }
      />
      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Stack spacing={2}>
            <Alert severity="info">
              Each row is entered already <strong>APPROVED</strong>, the same as Add Leave — for
              backfilling days that already happened, not forward-looking requests. Balance is
              hard-blocked the same way: a row that would overdraw an employee's paid balance fails
              that row only. Expected header (case-insensitive, any order):{' '}
              <code>{TEMPLATE_COLUMNS.join(', ')}</code>. Required: <code>userId</code>,{' '}
              <code>leaveType</code>, <code>fromDate</code>, <code>toDate</code>.{' '}
              <code>duration</code> defaults to <code>FULL_DAY</code> when left blank;{' '}
              <code>reason</code> is optional.
            </Alert>
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
            <Button variant="contained" onClick={handleUpload} disabled={!file || uploading} sx={{ alignSelf: 'flex-start' }}>
              Upload &amp; add
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <BulkImportSummary
        result={result}
        succeededColumns={SUCCEEDED_COLUMNS}
        getSucceededRowId={(r) => r.id}
        succeededMessage={result ? `${result.successCount} leave(s) added and approved.` : undefined}
      />
    </>
  );
}
