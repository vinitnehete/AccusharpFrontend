import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatCard from '../../components/StatCard';
import StatusChip from '../../components/StatusChip';
import ContractorPicker from '../../components/ContractorPicker';
import contractorsApi from '../../api/contractors';
import { ATTENDANCE_STATUS_COLOR } from '../../constants/enums';
import { downloadBlob } from '../../utils/download';

const VIEWS = {
  MONTHLY: 'monthly',
  DAILY: 'daily',
  ALL: 'all',
};

const formatPunch = (value) => (value ? dayjs(value).format('DD MMM, HH:mm') : '—');

/**
 * The three reports this module exists to produce.
 *
 * - Monthly: one line per worker, plus the contractor's own totals. This is
 *   the sheet you send them; they run their payroll from it.
 * - Daily register: the day-by-day evidence behind those totals, for when a
 *   figure is queried.
 * - All contractors: one line each, for a company running several agencies.
 *
 * Every export is server-rendered rather than a dump of the on-screen grid,
 * because the monthly sheet appends the contractor's totals below the rows —
 * the figure they invoice against travels in the same file as the rows it came
 * from.
 */
export default function ContractorReports() {
  const [view, setView] = useState(VIEWS.MONTHLY);
  const [contractorId, setContractorId] = useState(null);
  const [month, setMonth] = useState(dayjs());
  const [fromDate, setFromDate] = useState(dayjs().startOf('month'));
  const [toDate, setToDate] = useState(dayjs().endOf('month'));

  const [report, setReport] = useState(null);
  const [dailyRows, setDailyRows] = useState([]);
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(() => {
    if (view === VIEWS.ALL) {
      if (!month?.isValid()) return;
      setLoading(true);
      contractorsApi
        .allContractorsSummary(month.format('YYYY-MM'))
        .then(setAllRows)
        .catch(() => setAllRows([]))
        .finally(() => setLoading(false));
      return;
    }
    if (!contractorId) {
      setReport(null);
      setDailyRows([]);
      return;
    }
    setLoading(true);
    if (view === VIEWS.MONTHLY) {
      if (!month?.isValid()) return;
      contractorsApi
        .monthlyReport(contractorId, month.format('YYYY-MM'))
        .then(setReport)
        .catch(() => setReport(null))
        .finally(() => setLoading(false));
    } else {
      if (!fromDate?.isValid() || !toDate?.isValid()) return;
      contractorsApi
        .dailyRegister(contractorId, fromDate.format('YYYY-MM-DD'), toDate.format('YYYY-MM-DD'))
        .then(setDailyRows)
        .catch(() => setDailyRows([]))
        .finally(() => setLoading(false));
    }
  }, [view, contractorId, month, fromDate, toDate]);

  useEffect(load, [load]);

  const handleExport = () => {
    setExporting(true);
    const stamp = month?.format('YYYY-MM');
    const call =
      view === VIEWS.ALL
        ? contractorsApi
            .allContractorsSummaryCsv(stamp)
            .then((blob) => downloadBlob(`contractor-summary-${stamp}.csv`, blob))
        : view === VIEWS.MONTHLY
          ? contractorsApi
              .monthlyReportCsv(contractorId, stamp)
              .then((blob) => downloadBlob(`contractor-attendance-${stamp}.csv`, blob))
          : contractorsApi
              .dailyRegisterCsv(
                contractorId,
                fromDate.format('YYYY-MM-DD'),
                toDate.format('YYYY-MM-DD')
              )
              .then((blob) =>
                downloadBlob(
                  `contractor-daily-${fromDate.format('YYYY-MM-DD')}-to-${toDate.format('YYYY-MM-DD')}.csv`,
                  blob
                )
              );
    call.catch(() => {}).finally(() => setExporting(false));
  };

  const monthlyColumns = [
    { field: 'employeeCode', headerName: 'Worker Code', width: 130 },
    { field: 'employeeName', headerName: 'Name', flex: 1, minWidth: 170 },
    { field: 'userId', headerName: 'Device ID', width: 110 },
    { field: 'designationName', headerName: 'Trade', width: 140 },
    { field: 'supervisorName', headerName: 'Supervisor', width: 150 },
    { field: 'workingDays', headerName: 'Working', width: 90, type: 'number' },
    { field: 'presentDays', headerName: 'Present', width: 90, type: 'number' },
    { field: 'absentDays', headerName: 'Absent', width: 90, type: 'number' },
    { field: 'weekOffDays', headerName: 'Week Offs', width: 100, type: 'number' },
    { field: 'holidayDays', headerName: 'Holidays', width: 95, type: 'number' },
    { field: 'lateCount', headerName: 'Late', width: 80, type: 'number' },
    { field: 'totalHours', headerName: 'Total Hrs', width: 100, type: 'number' },
    { field: 'overtimeHours', headerName: 'OT Hrs', width: 90, type: 'number' },
  ];

  const dailyColumns = [
    { field: 'employeeCode', headerName: 'Worker Code', width: 130 },
    { field: 'employeeName', headerName: 'Name', width: 170 },
    {
      field: 'date',
      headerName: 'Date',
      width: 120,
      valueFormatter: (value) => (value ? dayjs(value).format('DD MMM YYYY') : ''),
    },
    { field: 'shiftCode', headerName: 'Shift', width: 90 },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: ({ value }) => <StatusChip value={value} colorMap={ATTENDANCE_STATUS_COLOR} />,
    },
    {
      field: 'firstIn',
      headerName: 'First In',
      width: 150,
      valueFormatter: (value) => formatPunch(value),
    },
    {
      field: 'lastOut',
      headerName: 'Last Out',
      width: 150,
      valueFormatter: (value) => formatPunch(value),
    },
    { field: 'workingHours', headerName: 'Hours', width: 90, type: 'number' },
    { field: 'overtimeHours', headerName: 'OT', width: 80, type: 'number' },
    { field: 'lateMinutes', headerName: 'Late (min)', width: 100, type: 'number' },
    {
      field: 'recordStatus',
      headerName: 'Source',
      width: 110,
      description: 'MANUAL means somebody corrected this day by hand',
    },
  ];

  const allColumns = [
    { field: 'contractorCode', headerName: 'Code', width: 110 },
    { field: 'contractorName', headerName: 'Contractor', flex: 1, minWidth: 190 },
    { field: 'contactPerson', headerName: 'Contact', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'workerCount', headerName: 'Workers', width: 95, type: 'number' },
    {
      field: 'workersWithoutAttendance',
      headerName: 'Not Generated',
      width: 130,
      type: 'number',
      description: 'Workers with no generated attendance — the report is not ready to send',
    },
    { field: 'presentDays', headerName: 'Present Days', width: 120, type: 'number' },
    { field: 'absentDays', headerName: 'Absent Days', width: 120, type: 'number' },
    { field: 'totalHours', headerName: 'Total Hrs', width: 105, type: 'number' },
    { field: 'overtimeHours', headerName: 'OT Hrs', width: 95, type: 'number' },
  ];

  const summary = report?.summary;
  const needsContractor = view !== VIEWS.ALL && !contractorId;
  const rowCount = view === VIEWS.ALL ? allRows.length : view === VIEWS.MONTHLY ? (report?.rows?.length ?? 0) : dailyRows.length;

  const filters = useMemo(
    () => (
      <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1 }}>
        {view !== VIEWS.ALL && (
          <ContractorPicker value={contractorId} onChange={setContractorId} autoSelectFirst />
        )}
        {view === VIEWS.DAILY ? (
          <>
            <DatePicker
              label="From"
              value={fromDate}
              onChange={setFromDate}
              slotProps={{ textField: { size: 'small' } }}
            />
            <DatePicker
              label="To"
              value={toDate}
              onChange={setToDate}
              slotProps={{ textField: { size: 'small' } }}
            />
          </>
        ) : (
          <DatePicker
            label="Month"
            views={['year', 'month']}
            value={month}
            onChange={setMonth}
            slotProps={{ textField: { size: 'small' } }}
          />
        )}
        <Button
          startIcon={<DownloadRoundedIcon />}
          onClick={handleExport}
          disabled={rowCount === 0 || exporting || needsContractor}
        >
          Export CSV
        </Button>
      </Stack>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [view, contractorId, month, fromDate, toDate, rowCount, exporting, needsContractor]
  );

  return (
    <>
      <PageHeader
        title="Contractor Reports"
        subtitle="The attendance you send each contractor so they can run their own payroll. Figures come straight from the generated attendance — they can never disagree with what the console shows."
        actions={filters}
      />

      <Tabs
        value={view}
        onChange={(_, value) => setView(value)}
        sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value={VIEWS.MONTHLY} label="Monthly summary" />
        <Tab value={VIEWS.DAILY} label="Daily register" />
        <Tab value={VIEWS.ALL} label="All contractors" />
      </Tabs>

      {needsContractor ? (
        <Alert severity="info">Pick a contractor to see their report.</Alert>
      ) : (
        <>
          {view === VIEWS.MONTHLY && summary && (
            <>
              {summary.workersWithoutAttendance > 0 && (
                <Alert severity="warning" sx={{ mb: 2.5 }}>
                  {summary.workersWithoutAttendance} of {summary.workerCount} worker(s) have no
                  generated attendance for {report.month}. Generate it under the Attendance tab
                  before sending this report — they currently read as zero.
                </Alert>
              )}
              <Card sx={{ mb: 2.5 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
                    {summary.contractorName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {report.month}
                    {summary.contactPerson ? ` · ${summary.contactPerson}` : ''}
                    {summary.email ? ` · ${summary.email}` : ''}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                      <StatCard label="Workers" value={summary.workerCount} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                      <StatCard label="Working days" value={summary.workingDays} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                      <StatCard label="Present days" value={summary.presentDays} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                      <StatCard label="Absent days" value={summary.absentDays} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                      <StatCard label="Total hours" value={summary.totalHours} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4, md: 2 }}>
                      <StatCard label="Overtime hours" value={summary.overtimeHours} />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </>
          )}

          <DataTable
            rows={
              view === VIEWS.ALL ? allRows : view === VIEWS.MONTHLY ? (report?.rows ?? []) : dailyRows
            }
            columns={
              view === VIEWS.ALL ? allColumns : view === VIEWS.MONTHLY ? monthlyColumns : dailyColumns
            }
            loading={loading}
            getRowId={
              view === VIEWS.ALL
                ? (row) => row.contractorId
                : view === VIEWS.MONTHLY
                  ? (row) => row.userId
                  : (row) => `${row.userId}-${row.date}`
            }
            height={600}
            density={view === VIEWS.DAILY ? 'compact' : 'standard'}
            pageSize={view === VIEWS.DAILY ? 25 : 10}
            emptyState={{
              title: 'Nothing to report yet',
              description:
                view === VIEWS.ALL
                  ? 'No active contractors, or none of them has any workers on site.'
                  : 'No attendance has been generated for this contractor and period. Generate it under the Attendance tab.',
            }}
          />
        </>
      )}
    </>
  );
}
