import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import ScopedReportPage from './ScopedReportPage';
import MoneyText from '../../components/MoneyText';
import reportsApi from '../../api/reports';

const money = (params) => <MoneyText value={params.value} />;

const columns = [
  { field: 'employeeCode', headerName: 'Code', width: 120 },
  { field: 'employeeName', headerName: 'Employee', width: 170 },
  { field: 'departmentName', headerName: 'Department', width: 140 },
  { field: 'designationName', headerName: 'Designation', width: 140 },
  { field: 'joiningDate', headerName: 'Joined', width: 110 },
  { field: 'relievingDate', headerName: 'Relieved', width: 110 },
  { field: 'yearsOfService', headerName: 'Service (yrs)', width: 115 },
  {
    field: 'finalMonthPayrollGenerated',
    headerName: 'Final month run',
    width: 145,
    renderCell: (params) =>
      params.value ? (
        <Chip size="small" color="success" label="Generated" />
      ) : (
        <Chip size="small" color="warning" label="Pending" />
      ),
  },
  { field: 'lastPaidPeriod', headerName: 'Last paid period', width: 145 },
  { field: 'lastPaidNetSalary', headerName: 'Last net paid', width: 140, renderCell: money },
  { field: 'grossSalary', headerName: 'Gross at exit', width: 140, renderCell: money },
  { field: 'basicDA', headerName: 'Basic + DA', width: 130, renderCell: money },
  { field: 'paidLeaveBalanceDays', headerName: 'Paid leave balance', width: 165 },
  { field: 'lastRunAdvanceDeduction', headerName: 'Advance (last run)', width: 165, renderCell: money },
  { field: 'lastRunLoanDeduction', headerName: 'Loan (last run)', width: 150, renderCell: money },
  // What the settlement actually has to recover - as distinct from whatever
  // the last run happened to take, which says nothing about the balance.
  { field: 'outstandingRecoveries', headerName: 'Still owed', width: 140, renderCell: money },
  {
    field: 'gratuityEligible',
    headerName: 'Gratuity',
    width: 120,
    renderCell: (params) =>
      params.value ? (
        <Chip size="small" color="success" label="Eligible" />
      ) : (
        <Chip size="small" variant="outlined" label="Under 5 yrs" />
      ),
  },
  { field: 'gratuityAccrued', headerName: 'Gratuity accrued', width: 155, renderCell: money },
];

export default function FullAndFinalReport() {
  return (
    <ScopedReportPage
      title="Full & Final Settlement"
      subtitle="The exit worksheet for everyone relieved in the window, assembled from what is already on record"
      period="dateRange"
      fetchFn={reportsApi.fullAndFinal}
      columns={columns}
      getRowId={(row) => row.userId}
      emptyDescription="Nobody was relieved in this window."
      note={
        <Alert severity="info">
          Leave encashment and notice-period recovery are deliberately absent: neither has a policy
          modelled anywhere in this system, so any figure shown for them would be a guess. The paid
          leave balance and the recoveries taken in the last run are here so the settlement can be
          worked out against real numbers.
        </Alert>
      }
    />
  );
}
