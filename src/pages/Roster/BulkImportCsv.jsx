import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import shiftSchedulesApi from '../../api/shiftSchedules';
import { downloadCsv } from '../../utils/csv';

// Mirrors ShiftAssignmentCsvParser.java's expected header exactly.
const TEMPLATE_COLUMNS = ['userId', 'shiftDate', 'shiftCode', 'weekOff'];
const TEMPLATE_EXAMPLE = { userId: 'EMP001', shiftDate: '2026-09-01', shiftCode: 'MORNING', weekOff: 'false' };

const SUCCEEDED_COLUMNS = [
  { field: 'userId', headerName: 'User ID', width: 110 },
  { field: 'shiftDate', headerName: 'Date', width: 120 },
  { field: 'shiftCode', headerName: 'Shift', width: 110 },
  { field: 'shiftName', headerName: 'Shift name', width: 150 },
  { field: 'weekOff', headerName: 'Week off', width: 100, valueGetter: (v) => (v ? 'Yes' : 'No') },
];

export default function BulkImportCsv() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleTemplate = () => {
    downloadCsv(
      'roster-bulk-import-template.csv',
      TEMPLATE_COLUMNS.map((field) => ({ field })),
      [TEMPLATE_EXAMPLE]
    );
  };

  const handleUpload = () => {
    if (!file) return;
    setUploading(true);
    setResult(null);
    shiftSchedulesApi
      .bulkImportCsv(file)
      .then((res) => {
        setResult(res);
        enqueueSnackbar(`${res.successCount} of ${res.totalRows} shift-day(s) assigned`, {
          variant: res.failureCount > 0 ? 'warning' : 'success',
        });
      })
      .catch(() => {})
      .finally(() => setUploading(false));
  };

  return (
    <>
      <PageHeader
        title="CSV Roster Upload"
        subtitle="One row per employee-day-shift — unlike Bulk Assign, each row can carry its own shift, so a whole team can be rostered across different shifts and days in one file"
        actions={
          <Button color="inherit" onClick={() => navigate('/roster/planner')}>
            Back to Planner
          </Button>
        }
      />
      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Stack spacing={2}>
            <Alert severity="info">
              Expected header (case-insensitive, any order): <code>{TEMPLATE_COLUMNS.join(', ')}</code>. Only{' '}
              <code>weekOff</code> is optional (defaults to <code>false</code>).
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
              Upload &amp; assign
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <BulkImportSummary result={result} succeededColumns={SUCCEEDED_COLUMNS} getSucceededRowId={(r) => r.id} />
    </>
  );
}
