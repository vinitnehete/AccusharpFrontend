import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import ScopedReportPage from './ScopedReportPage';
import StatCard from '../../components/StatCard';
import MoneyText, { formatMoney } from '../../components/MoneyText';
import reportsApi from '../../api/reports';
import { formatHours } from '../../utils/hours';

const money = (params) => <MoneyText value={params.value} />;

const columns = [
  { field: 'employeeCode', headerName: 'Code', width: 120 },
  { field: 'employeeName', headerName: 'Employee', width: 170 },
  { field: 'departmentName', headerName: 'Department', width: 140 },
  { field: 'designationName', headerName: 'Designation', width: 140 },
  { field: 'joiningDate', headerName: 'DOJ', width: 110 },
  { field: 'lopDays', headerName: 'LOP days', width: 100 },
  { field: 'payableDays', headerName: 'Payable days', width: 115 },
  { field: 'fixedBasicDA', headerName: 'Basic + DA (fixed)', width: 155, renderCell: money },
  { field: 'fixedHra', headerName: 'HRA (fixed)', width: 130, renderCell: money },
  { field: 'fixedGrossWage', headerName: 'Fixed wage', width: 140, renderCell: money },
  { field: 'earnGrossSalary', headerName: 'Earned wage', width: 140, renderCell: money },
  { field: 'perDay', headerName: 'Per day', width: 120, renderCell: money },
  { field: 'overtimeHours', headerName: 'OT hrs', width: 95, valueFormatter: formatHours },
  { field: 'otAllowance', headerName: 'OT amount', width: 130, renderCell: money },
  { field: 'totalHours', headerName: 'Total hrs', width: 105, valueFormatter: formatHours },
  { field: 'pfDeduction', headerName: 'PF', width: 110, renderCell: money },
  { field: 'esic', headerName: 'ESIC', width: 105, renderCell: money },
  { field: 'professionalTax', headerName: 'PT', width: 100, renderCell: money },
  { field: 'tds', headerName: 'TDS', width: 105, renderCell: money },
  { field: 'totalDeduction', headerName: 'Deductions', width: 135, renderCell: money },
  { field: 'netSalary', headerName: 'Net salary', width: 140, renderCell: money },
];

function Summary(summary) {
  const cards = [
    { label: 'Headcount', value: summary.headcount, icon: <GroupsRoundedIcon />, accent: 'primary.main' },
    { label: 'Total earned wages', value: formatMoney(summary.totalEarnedWages), icon: <PaymentsRoundedIcon />, accent: 'success.main' },
    { label: 'Total OT amount', value: formatMoney(summary.totalOtAmount), icon: <ScheduleRoundedIcon />, accent: 'warning.main' },
    { label: 'Total deductions', value: formatMoney(summary.totalDeductions), icon: <EventBusyRoundedIcon />, accent: 'error.main' },
    { label: 'Net payable', value: formatMoney(summary.totalNetSalary), icon: <PaymentsRoundedIcon />, accent: 'primary.main' },
    { label: 'Total hours', value: formatHours(summary.totalHours), icon: <ScheduleRoundedIcon />, accent: 'info.main' },
  ];

  return (
    <>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {cards.map((card) => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        <Chip size="small" label={`${summary.employeesWithLop} with LOP (${summary.totalLopDays} days)`} />
        <Chip size="small" label={`${summary.employeesWithOvertime} with overtime (${formatHours(summary.totalOvertimeHours)})`} />
        <Chip size="small" label={`Regular hours ${formatHours(summary.totalRegularHours)}`} />
        {summary.deductions
          ?.filter((deduction) => Number(deduction.amount) !== 0)
          .map((deduction) => (
            <Chip key={deduction.label} size="small" variant="outlined" label={`${deduction.label} ${formatMoney(deduction.amount)}`} />
          ))}
      </Stack>
    </>
  );
}

/** The day-wise wage table behind one employee's line. */
function DayWiseDialog({ employee, onClose }) {
  const [report, setReport] = useState(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employee) return undefined;
    let cancelled = false;
    setLoading(true);
    setFailed(false);

    reportsApi
      .payrollAuditDays(employee.userId, employee.month, employee.year)
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [employee]);

  return (
    <Dialog open={Boolean(employee)} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {employee?.employeeName} — day-wise wages
        {report && (
          <Typography variant="body2" color="text.secondary">
            {report.period} · per day {formatMoney(report.perDay)} · per hour {formatMoney(report.perHour)} ·
            payable {report.payableDays} days · LOP {report.lopDays} days
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {loading && <LinearProgress />}
        {failed && (
          <Typography color="text.secondary">
            No payroll generated for this employee for this period.
          </Typography>
        )}
        {report && !report.reconciled && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            The day column sums to {report.dayWisePaidDays} paid and {report.dayWiseLopDays} LOP days,
            but the run paid {report.payableDays} and recorded {report.lopDays} LOP. That gap appears
            when a day is both attended and covered by approved paid leave — leave nobody cancelled
            when the employee turned up. The monthly LOP formula credits such a day twice, so the run
            is the optimistic figure; the days below are the true count.
          </Alert>
        )}
        {report && (
          <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
            {/* Thirty-one rows of sixteen columns: without this the date and
                hour cells wrap to two lines each and the table doubles in
                height for no gain. It scrolls sideways in its own container
                instead. */}
            <Table size="small" stickyHeader sx={{ '& td, & th': { whiteSpace: 'nowrap' } }}>
              <TableHead>
                <TableRow>
                  {['Date', 'Day', 'Shift', 'Status', 'Leave', 'In', 'Out', 'Hours', 'OT hrs', 'Late', 'Early out', 'Paid', 'LOP', 'Day wage', 'OT amount', 'Total'].map((head) => (
                    <TableCell key={head}>{head}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {report.days.map((day) => (
                  <TableRow key={day.date} hover>
                    <TableCell>{day.date}</TableCell>
                    <TableCell>{day.dayOfWeek}</TableCell>
                    <TableCell>{day.shiftCode || '—'}</TableCell>
                    <TableCell>
                      {day.recorded ? day.status : <Typography variant="caption" color="text.secondary">No record</Typography>}
                      {day.weekOff && ' (WO)'}
                      {day.holiday && ' (Hol)'}
                    </TableCell>
                    <TableCell>{day.leaveType || '—'}</TableCell>
                    <TableCell>{day.firstIn ? day.firstIn.slice(11, 16) : '—'}</TableCell>
                    <TableCell>{day.lastOut ? day.lastOut.slice(11, 16) : '—'}</TableCell>
                    <TableCell>{formatHours(day.workingHours)}</TableCell>
                    <TableCell>{formatHours(day.overtimeHours)}</TableCell>
                    <TableCell>{day.lateMinutes ? `${day.lateMinutes}m` : '—'}</TableCell>
                    <TableCell>{day.earlyExitMinutes ? `${day.earlyExitMinutes}m` : '—'}</TableCell>
                    <TableCell>{day.paidFraction}</TableCell>
                    <TableCell>{Number(day.lopFraction) > 0 ? day.lopFraction : '—'}</TableCell>
                    <TableCell><MoneyText value={day.dayWage} /></TableCell>
                    <TableCell><MoneyText value={day.overtimeAmount} /></TableCell>
                    <TableCell><MoneyText value={day.dayTotal} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        )}
        {report && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            The day wage uses the stored per-day rate
            (gross salary ÷ {report.prorationBase} days); earned wages prorate the salary structure
            instead, so the two totals sit on different bases by design — earned gross for this month
            was {formatMoney(report.earnedGrossSalary)} and net {formatMoney(report.netSalary)}.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function PayrollAuditReport() {
  const [drilldown, setDrilldown] = useState(null);

  return (
    <>
      <ScopedReportPage
        title="Monthly Payroll Audit"
        subtitle="Every employee's fixed wages, earned wages, overtime, hours and deductions for the month — read straight off the payroll run, so it can never disagree with a salary slip. Select a row for the day-wise breakdown."
        period="monthYear"
        fetchFn={reportsApi.payrollAudit}
        summaryFn={reportsApi.payrollAuditSummary}
        renderSummary={Summary}
        exportFn={reportsApi.payrollAuditCsv}
        columns={columns}
        getRowId={(row) => row.userId}
        height={620}
        onRowClick={(event, params) =>
          setDrilldown({
            userId: event.row.userId,
            employeeName: event.row.employeeName,
            month: params.month,
            year: params.year,
          })
        }
        emptyDescription="Payroll has not been generated for this period yet, or no employee matches the filter."
      />
      {drilldown && (
        <DayWiseDialog key={drilldown.userId} employee={drilldown} onClose={() => setDrilldown(null)} />
      )}
    </>
  );
}
