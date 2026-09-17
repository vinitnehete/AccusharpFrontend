import client from './client';

// Department/designation/category narrowing every new report accepts. Undefined
// entries are dropped by axios, so an unfiltered call sends no extra params at
// all and the server sees the same request it always did.
const scope = (params = {}) => ({
  departmentId: params.departmentId || undefined,
  designationId: params.designationId || undefined,
  categoryId: params.categoryId || undefined,
});

const get = (path, params) => client.get(path, { params }).then((r) => r.data);

// Server-rendered CSV, as a blob for utils/download.js#downloadBlob. Used where
// the export is more than the on-screen grid - the payroll audit appends the
// company control totals, the bank advice its reconciliation block.
const getCsv = (path, params) =>
  client.get(path, { params, responseType: 'blob' }).then((r) => r.data);

const reports = {
  employees: () => client.get('/reports/employees').then((r) => r.data),
  attendanceMonthly: (month) =>
    client.get('/reports/attendance/monthly', { params: { month } }).then((r) => r.data),
  lateComing: (month) =>
    client.get('/reports/attendance/late-coming', { params: { month } }).then((r) => r.data),
  absent: (month) =>
    client.get('/reports/attendance/absent', { params: { month } }).then((r) => r.data),
  overtime: (month) =>
    client.get('/reports/attendance/overtime', { params: { month } }).then((r) => r.data),
  lop: (month) => client.get('/reports/attendance/lop', { params: { month } }).then((r) => r.data),
  weekOffWorked: (month) =>
    client.get('/reports/attendance/week-off-worked', { params: { month } }).then((r) => r.data),
  leaveBalances: (year) =>
    client.get('/reports/leave-balances', { params: { year } }).then((r) => r.data),
  payroll: (month, year) =>
    client.get('/reports/payroll', { params: { month, year } }).then((r) => r.data),
  payrollByDepartment: (month, year) =>
    client.get('/reports/payroll/by-department', { params: { month, year } }).then((r) => r.data),
  payrollByCompany: (month, year) =>
    client.get('/reports/payroll/by-company', { params: { month, year } }).then((r) => r.data),
  statutoryPf: (month, year) =>
    client.get('/reports/statutory/pf', { params: { month, year } }).then((r) => r.data),
  statutoryProfessionalTax: (month, year) =>
    client
      .get('/reports/statutory/professional-tax', { params: { month, year } })
      .then((r) => r.data),
  statutoryEsic: (month, year) =>
    client.get('/reports/statutory/esic', { params: { month, year } }).then((r) => r.data),

  // ---- monthly payroll audit ----
  payrollAudit: (params) =>
    get('/reports/payroll/audit', { month: params.month, year: params.year, ...scope(params) }),
  payrollAuditSummary: (params) =>
    get('/reports/payroll/audit/summary', { month: params.month, year: params.year, ...scope(params) }),
  payrollAuditDays: (employeeId, month, year) =>
    get(`/reports/payroll/audit/${employeeId}/days`, { month, year }),
  payrollAuditCsv: (params) =>
    getCsv('/reports/payroll/audit/export', { month: params.month, year: params.year, ...scope(params) }),

  // ---- payroll registers ----
  payrollRegister: (params) =>
    get('/reports/payroll/register', { month: params.month, year: params.year, ...scope(params) }),
  payrollRegisterCsv: (params) =>
    getCsv('/reports/payroll/register/export', { month: params.month, year: params.year, ...scope(params) }),
  payslipRegister: (params) =>
    get('/reports/payroll/payslip-register', { month: params.month, year: params.year, ...scope(params) }),
  salaryRevisions: (params) =>
    get('/reports/payroll/salary-revisions', { from: params.from, to: params.to, ...scope(params) }),
  bankTransfer: (params) =>
    get('/reports/payroll/bank-transfer', { month: params.month, year: params.year, ...scope(params) }),
  bankTransferCsv: (params) =>
    getCsv('/reports/payroll/bank-transfer/export', { month: params.month, year: params.year, ...scope(params) }),
  fullAndFinal: (params) =>
    get('/reports/payroll/full-and-final', { from: params.from, to: params.to, ...scope(params) }),

  // ---- attendance & leave drill-downs ----
  attendanceExceptions: (params) =>
    get('/reports/attendance/exceptions', { month: params.month, ...scope(params) }),
  attendanceExceptionsCsv: (params) =>
    getCsv('/reports/attendance/exceptions/export', { month: params.month, ...scope(params) }),
  overtimeRegister: (params) =>
    get('/reports/attendance/overtime-register', { month: params.month, ...scope(params) }),
  overtimeRegisterCsv: (params) =>
    getCsv('/reports/attendance/overtime-register/export', { month: params.month, ...scope(params) }),
  leaveTransactions: (params) =>
    get('/reports/leave/transactions', { from: params.from, to: params.to, ...scope(params) }),
  leaveTransactionsCsv: (params) =>
    getCsv('/reports/leave/transactions/export', { from: params.from, to: params.to, ...scope(params) }),

  // ---- statutory filings ----
  statutoryPfEcr: (params) =>
    get('/reports/statutory/pf-ecr', { month: params.month, year: params.year, ...scope(params) }),
  statutoryEsiReturn: (params) =>
    get('/reports/statutory/esi-return', { month: params.month, year: params.year, ...scope(params) }),
  statutoryPtRegister: (params) =>
    get('/reports/statutory/pt-register', { month: params.month, year: params.year, ...scope(params) }),
  statutoryTds24q: (params) =>
    get('/reports/statutory/tds-24q', {
      financialYear: params.financialYear,
      quarter: params.quarter,
      ...scope(params),
    }),
  statutoryGratuity: (params) => get('/reports/statutory/gratuity', { asOf: params.asOf, ...scope(params) }),
};

export default reports;
