import ScopedReportPage from './ScopedReportPage';
import MoneyText from '../../components/MoneyText';
import reportsApi from '../../api/reports';
import { maskSensitive } from '../../utils/mask';

const money = (params) => <MoneyText value={params.value} />;

const columns = [
  { field: 'employeeCode', headerName: 'Code', width: 120 },
  { field: 'employeeName', headerName: 'Employee', width: 170 },
  { field: 'departmentName', headerName: 'Department', width: 140 },
  { field: 'designationName', headerName: 'Designation', width: 140 },
  { field: 'categoryName', headerName: 'Category', width: 120 },
  { field: 'employmentStatus', headerName: 'Type', width: 110 },
  {
    field: 'uanNo',
    headerName: 'UAN',
    width: 150,
    renderCell: (params) => maskSensitive(params.value) || '—',
  },
  { field: 'grossSalary', headerName: 'Gross (CTC)', width: 135, renderCell: money },
  { field: 'grossSalaryWage', headerName: 'Gross wage', width: 135, renderCell: money },
  { field: 'payableDays', headerName: 'Payable days', width: 115 },
  { field: 'lopDays', headerName: 'LOP days', width: 100 },
  { field: 'earnBasicDA', headerName: 'Basic + DA', width: 130, renderCell: money },
  { field: 'earnHra', headerName: 'HRA', width: 120, renderCell: money },
  { field: 'earnConveyance', headerName: 'Conveyance', width: 130, renderCell: money },
  { field: 'earnEducation', headerName: 'Education', width: 125, renderCell: money },
  { field: 'earnMedical', headerName: 'Medical', width: 120, renderCell: money },
  { field: 'earnOther', headerName: 'Other', width: 120, renderCell: money },
  { field: 'otAllowance', headerName: 'Overtime', width: 125, renderCell: money },
  { field: 'bonus', headerName: 'Bonus', width: 115, renderCell: money },
  { field: 'incentive', headerName: 'Incentive', width: 120, renderCell: money },
  { field: 'totalEarnings', headerName: 'Total earnings', width: 145, renderCell: money },
  { field: 'pfDeduction', headerName: 'PF', width: 110, renderCell: money },
  { field: 'esic', headerName: 'ESIC', width: 105, renderCell: money },
  { field: 'professionalTax', headerName: 'PT', width: 100, renderCell: money },
  { field: 'mlwf', headerName: 'MLWF', width: 100, renderCell: money },
  { field: 'tds', headerName: 'TDS', width: 105, renderCell: money },
  { field: 'advanceDeduction', headerName: 'Advance', width: 120, renderCell: money },
  { field: 'loanDeduction', headerName: 'Loan', width: 115, renderCell: money },
  { field: 'fine', headerName: 'Fine', width: 110, renderCell: money },
  { field: 'otherDeduction', headerName: 'Other deduction', width: 155, renderCell: money },
  { field: 'canteen', headerName: 'Canteen', width: 115, renderCell: money },
  { field: 'totalDeductions', headerName: 'Total deductions', width: 155, renderCell: money },
  { field: 'netSalary', headerName: 'Net salary', width: 140, renderCell: money },
  // What is still owed after the run, and what the run could not afford to
  // take - the two figures that say whether a loan is actually coming down.
  { field: 'loanClosingBalance', headerName: 'Loan balance', width: 140, renderCell: money },
  { field: 'advanceClosingBalance', headerName: 'Advance balance', width: 155, renderCell: money },
  { field: 'recoveryCarriedForward', headerName: 'Carried forward', width: 150, renderCell: money },
];

export default function PayrollRegisterReport() {
  return (
    <ScopedReportPage
      title="Payroll Register"
      subtitle="The full CTC breakup and every earning and deduction head, one row per employee for the run"
      period="monthYear"
      fetchFn={reportsApi.payrollRegister}
      exportFn={reportsApi.payrollRegisterCsv}
      columns={columns}
      getRowId={(row) => row.userId}
      emptyDescription="Payroll has not been generated for this period yet, or no employee matches the filter."
    />
  );
}
