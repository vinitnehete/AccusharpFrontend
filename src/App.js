import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LinearProgress from '@mui/material/LinearProgress';
import AppLayout from './layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import RequireRole from './components/RequireRole';
import { HR_ADMIN, SUP_HR_ADMIN, ADMIN_ONLY, PLATFORM_ONLY } from './layout/navConfig';
import { useAuth } from './context/AuthContext';
import SiteLayout from './layout/SiteLayout';
import SiteHome from './pages/Site/Home';
import SiteServices from './pages/Site/Services';
import SiteAbout from './pages/Site/About';
import SiteContact from './pages/Site/Contact';
import Login from './pages/Auth/Login';
import ChangePassword from './pages/Auth/ChangePassword';
import Dashboard from './pages/Dashboard/Dashboard';
import NotFound from './pages/NotFound';
import MastersLayout from './pages/Masters/MastersLayout';
import Companies from './pages/Masters/Companies';
import Departments from './pages/Masters/Departments';
import Designations from './pages/Masters/Designations';
import Categories from './pages/Masters/Categories';
import EmploymentTypes from './pages/Masters/EmploymentTypes';
import SalaryRule from './pages/Masters/SalaryRule';
import AttendanceRule from './pages/Masters/AttendanceRule';
import EmployeeList from './pages/Employees/EmployeeList';
import EmployeeForm from './pages/Employees/EmployeeForm';
import EmployeeDetail from './pages/Employees/EmployeeDetail';
import MyTeam from './pages/Employees/MyTeam';
import BulkImportEmployees from './pages/Employees/BulkImportEmployees';
import BulkSalaryRevision from './pages/Employees/BulkSalaryRevision';
import BulkSalaryStructure from './pages/Employees/BulkSalaryStructure';
import ContractorsLayout from './pages/Contractors/ContractorsLayout';
import ContractorList from './pages/Contractors/ContractorList';
import ContractorWorkforce from './pages/Contractors/ContractorWorkforce';
import ContractorRoster from './pages/Contractors/ContractorRoster';
import ContractorAttendance from './pages/Contractors/ContractorAttendance';
import ContractorReports from './pages/Contractors/ContractorReports';
import ShiftList from './pages/Shifts/ShiftList';
import RosterLayout from './pages/Roster/RosterLayout';
import Planner from './pages/Roster/Planner';
import BulkAssign from './pages/Roster/BulkAssign';
import BulkImportCsv from './pages/Roster/BulkImportCsv';
import AutoRotate from './pages/Roster/AutoRotate';
import CopyMonth from './pages/Roster/CopyMonth';
import Swap from './pages/Roster/Swap';
import Holidays from './pages/Holidays/Holidays';
import MyAttendance from './pages/Attendance/MyAttendance';
import AttendanceConsoleLayout from './pages/Attendance/AttendanceConsoleLayout';
import AttendanceGenerate from './pages/Attendance/Generate';
import AttendanceRecords from './pages/Attendance/Records';
import AttendancePolicyRules from './pages/Attendance/PolicyRules';
import AttendancePolicyEffective from './pages/Attendance/PolicyEffective';
import LeaveLayout from './pages/Leave/LeaveLayout';
import LeaveApply from './pages/Leave/Apply';
import MyLeaves from './pages/Leave/MyLeaves';
import PendingApprovals from './pages/Leave/PendingApprovals';
import AllLeaves from './pages/Leave/AllLeaves';
import BulkImportLeaves from './pages/Leave/BulkImportLeaves';
import LeaveCalendar from './pages/Leave/Calendar';
import LeaveBalances from './pages/Leave/Balances';
import LeaveRules from './pages/Leave/LeaveRules';
import PayrollLayout from './pages/Payroll/PayrollLayout';
import PayrollGenerate from './pages/Payroll/Generate';
import PayrollGenerateAll from './pages/Payroll/GenerateAll';
import PayrollBulkGenerate from './pages/Payroll/BulkGenerate';
import PayrollList from './pages/Payroll/List';
import PayrollEmployeeHistory from './pages/Payroll/EmployeeHistory';
import SalarySlip from './pages/SalarySlips/SalarySlip';
import MySalarySlip from './pages/SalarySlips/MySalarySlip';
import ReportsHub from './pages/Reports/ReportsHub';
import RolesList from './pages/Roles/RolesList';
import RoleDetail from './pages/Roles/RoleDetail';
import AuditLog from './pages/AuditLog/AuditLog';
import OnboardCompany from './pages/Platform/OnboardCompany';
// Every concrete report page is lazy-loaded - HANDOFF.md's own flagged best
// code-splitting candidate: rarely all used in one session, and each pulls in
// DataGrid column defs that don't need to sit in the main bundle. That matters
// more now than it did at thirteen pages.
const EmployeesReport = lazy(() => import('./pages/Reports/EmployeesReport'));
const AttendanceMonthlyReport = lazy(() => import('./pages/Reports/AttendanceMonthlyReport'));
const LateComingReport = lazy(() => import('./pages/Reports/LateComingReport'));
const WeekOffWorkedReport = lazy(() => import('./pages/Reports/WeekOffWorkedReport'));
const AbsentReport = lazy(() => import('./pages/Reports/AbsentReport'));
const OvertimeReport = lazy(() => import('./pages/Reports/OvertimeReport'));
const LopReport = lazy(() => import('./pages/Reports/LopReport'));
const LeaveBalancesReport = lazy(() => import('./pages/Reports/LeaveBalancesReport'));
const PayrollReport = lazy(() => import('./pages/Reports/PayrollReport'));
const PayrollByDepartmentReport = lazy(() => import('./pages/Reports/PayrollByDepartmentReport'));
const PayrollByCompanyReport = lazy(() => import('./pages/Reports/PayrollByCompanyReport'));
const PfReport = lazy(() => import('./pages/Reports/PfReport'));
const ProfessionalTaxReport = lazy(() => import('./pages/Reports/ProfessionalTaxReport'));
const EsicReport = lazy(() => import('./pages/Reports/EsicReport'));
const PayrollAuditReport = lazy(() => import('./pages/Reports/PayrollAuditReport'));
const PayrollRegisterReport = lazy(() => import('./pages/Reports/PayrollRegisterReport'));
const PayslipRegisterReport = lazy(() => import('./pages/Reports/PayslipRegisterReport'));
const SalaryRevisionReport = lazy(() => import('./pages/Reports/SalaryRevisionReport'));
const BankTransferReport = lazy(() => import('./pages/Reports/BankTransferReport'));
const FullAndFinalReport = lazy(() => import('./pages/Reports/FullAndFinalReport'));
const AttendanceExceptionReport = lazy(() => import('./pages/Reports/AttendanceExceptionReport'));
const OvertimeRegisterReport = lazy(() => import('./pages/Reports/OvertimeRegisterReport'));
const LeaveTransactionReport = lazy(() => import('./pages/Reports/LeaveTransactionReport'));
const PfEcrReport = lazy(() => import('./pages/Reports/PfEcrReport'));
const EsiReturnReport = lazy(() => import('./pages/Reports/EsiReturnReport'));
const ProfessionalTaxRegisterReport = lazy(() =>
  import('./pages/Reports/ProfessionalTaxRegisterReport')
);
const Tds24qReport = lazy(() => import('./pages/Reports/Tds24qReport'));
const GratuityAccrualReport = lazy(() => import('./pages/Reports/GratuityAccrualReport'));

// Plain EMPLOYEE lacks DASHBOARD_READ (see PermissionSeeder) and would 403 on
// the dashboard's data calls; PLATFORM principals have no company dashboard
// at all. Route each principal to a landing page it actually has access to.
function withSuspense(element) {
  return <Suspense fallback={<LinearProgress />}>{element}</Suspense>;
}

function RootRedirect() {
  const { isPlatform, isEmployee } = useAuth();
  if (isPlatform) return <Navigate to="/platform/companies" replace />;
  if (isEmployee) return <Navigate to="/attendance/me" replace />;
  return <Dashboard />;
}

function App() {
  return (
    <Routes>
      {/* Public marketing site. No auth, no API calls, no shared state with
          the application - it only renders copy from src/content/siteContent.js.
          It sits in front of the sign-in form so a visitor (or a demo) lands on
          the company site first and signs in from there. */}
      <Route element={<SiteLayout />}>
        <Route path="/home" element={<SiteHome />} />
        <Route path="/services" element={<SiteServices />} />
        <Route path="/about" element={<SiteAbout />} />
        <Route path="/contact" element={<SiteContact />} />
      </Route>

      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/change-password" element={<ChangePassword />} />

          {/* Open to every authenticated role - self-service pages with no
              navConfig visibleFor restriction of their own. */}
          <Route path="/attendance/me" element={<MyAttendance />} />
          <Route path="/salary-slips/me" element={<MySalarySlip />} />
          <Route path="/leave" element={<LeaveLayout />}>
            <Route index element={<LeaveApply />} />
            <Route path="apply" element={<LeaveApply />} />
            <Route path="my" element={<MyLeaves />} />
            <Route path="calendar" element={<LeaveCalendar />} />
            <Route path="balances" element={<LeaveBalances />} />

            {/* Approving someone else's leave is a supervisor-and-up action. */}
            <Route element={<RequireRole allow={SUP_HR_ADMIN} />}>
              <Route path="approvals" element={<PendingApprovals />} />
            </Route>
            <Route element={<RequireRole allow={HR_ADMIN} />}>
              <Route path="all" element={<AllLeaves />} />
              <Route path="rules" element={<LeaveRules />} />
            </Route>
          </Route>

          <Route element={<RequireRole allow={SUP_HR_ADMIN} />}>
            <Route path="/team" element={<MyTeam />} />

            {/* A SUPERVISOR holds CONTRACTOR_READ and SHIFT_SCHEDULE_MANAGE, so
                they can see the workforce they supervise and roster it. The
                manage-only actions inside each page are gated on
                can('CONTRACTOR_MANAGE') individually. */}
            <Route path="/contractors" element={<ContractorsLayout />}>
              <Route index element={<ContractorList />} />
              <Route path="list" element={<ContractorList />} />
              <Route path="workforce" element={<ContractorWorkforce />} />
              <Route path="roster" element={<ContractorRoster />} />
              <Route path="attendance" element={<ContractorAttendance />} />
              <Route path="reports" element={<ContractorReports />} />
            </Route>

            <Route path="/roster" element={<RosterLayout />}>
              <Route index element={<Planner />} />
              <Route path="planner" element={<Planner />} />
              <Route path="bulk" element={<BulkAssign />} />
              <Route path="csv-upload" element={<BulkImportCsv />} />
              <Route path="auto-rotate" element={<AutoRotate />} />
              <Route path="copy-month" element={<CopyMonth />} />
              <Route path="swap" element={<Swap />} />
            </Route>
          </Route>

          <Route element={<RequireRole allow={HR_ADMIN} />}>
            <Route path="/masters" element={<MastersLayout />}>
              <Route path="companies" element={<Companies />} />
              <Route path="departments" element={<Departments />} />
              <Route path="designations" element={<Designations />} />
              <Route path="categories" element={<Categories />} />
              <Route path="employment-types" element={<EmploymentTypes />} />
              <Route path="salary-rule" element={<SalaryRule />} />
              <Route path="attendance-rule" element={<AttendanceRule />} />
            </Route>

            <Route path="/employees" element={<EmployeeList />} />
            <Route path="/employees/new" element={<EmployeeForm />} />
            <Route path="/employees/bulk-import" element={<BulkImportEmployees />} />
            <Route path="/employees/bulk-salary-revision" element={<BulkSalaryRevision />} />
            <Route path="/employees/bulk-salary-structure" element={<BulkSalaryStructure />} />
            <Route path="/employees/:id/edit" element={<EmployeeForm />} />
            <Route path="/employees/:id" element={<EmployeeDetail />} />

            <Route path="/shifts" element={<ShiftList />} />
            <Route path="/holidays" element={<Holidays />} />

            <Route path="/attendance" element={<AttendanceConsoleLayout />}>
              <Route index element={<AttendanceGenerate />} />
              <Route path="generate" element={<AttendanceGenerate />} />
              <Route path="records" element={<AttendanceRecords />} />
              <Route path="policy" element={<AttendancePolicyRules />} />
              <Route path="policy-check" element={<AttendancePolicyEffective />} />
            </Route>

            <Route path="/leave/bulk-import" element={<BulkImportLeaves />} />

            <Route path="/payroll" element={<PayrollLayout />}>
              <Route index element={<PayrollGenerate />} />
              <Route path="generate" element={<PayrollGenerate />} />
              <Route path="generate-all" element={<PayrollGenerateAll />} />
              <Route path="bulk-generate" element={<PayrollBulkGenerate />} />
              <Route path="list" element={<PayrollList />} />
              <Route path="history" element={<PayrollEmployeeHistory />} />
            </Route>

            <Route path="/salary-slips" element={<SalarySlip />} />

            <Route path="/reports" element={<ReportsHub />} />
            <Route path="/reports/employees" element={withSuspense(<EmployeesReport />)} />
            <Route
              path="/reports/attendance/monthly"
              element={withSuspense(<AttendanceMonthlyReport />)}
            />
            <Route
              path="/reports/attendance/late-coming"
              element={withSuspense(<LateComingReport />)}
            />
            <Route path="/reports/attendance/absent" element={withSuspense(<AbsentReport />)} />
            <Route path="/reports/attendance/overtime" element={withSuspense(<OvertimeReport />)} />
            <Route path="/reports/attendance/lop" element={withSuspense(<LopReport />)} />
            <Route
              path="/reports/attendance/week-off-worked"
              element={withSuspense(<WeekOffWorkedReport />)}
            />
            <Route path="/reports/leave-balances" element={withSuspense(<LeaveBalancesReport />)} />
            <Route path="/reports/payroll" element={withSuspense(<PayrollReport />)} />
            <Route
              path="/reports/payroll/by-department"
              element={withSuspense(<PayrollByDepartmentReport />)}
            />
            <Route
              path="/reports/payroll/by-company"
              element={withSuspense(<PayrollByCompanyReport />)}
            />
            <Route path="/reports/statutory/pf" element={withSuspense(<PfReport />)} />
            <Route
              path="/reports/statutory/professional-tax"
              element={withSuspense(<ProfessionalTaxReport />)}
            />
            <Route path="/reports/statutory/esic" element={withSuspense(<EsicReport />)} />

            {/* Monthly payroll audit and the greytHR-parity registers. */}
            <Route path="/reports/payroll/audit" element={withSuspense(<PayrollAuditReport />)} />
            <Route path="/reports/payroll/register" element={withSuspense(<PayrollRegisterReport />)} />
            <Route
              path="/reports/payroll/payslip-register"
              element={withSuspense(<PayslipRegisterReport />)}
            />
            <Route
              path="/reports/payroll/salary-revisions"
              element={withSuspense(<SalaryRevisionReport />)}
            />
            <Route
              path="/reports/payroll/bank-transfer"
              element={withSuspense(<BankTransferReport />)}
            />
            <Route
              path="/reports/payroll/full-and-final"
              element={withSuspense(<FullAndFinalReport />)}
            />
            <Route
              path="/reports/attendance/exceptions"
              element={withSuspense(<AttendanceExceptionReport />)}
            />
            <Route
              path="/reports/attendance/overtime-register"
              element={withSuspense(<OvertimeRegisterReport />)}
            />
            <Route
              path="/reports/leave/transactions"
              element={withSuspense(<LeaveTransactionReport />)}
            />
            <Route path="/reports/statutory/pf-ecr" element={withSuspense(<PfEcrReport />)} />
            <Route
              path="/reports/statutory/esi-return"
              element={withSuspense(<EsiReturnReport />)}
            />
            <Route
              path="/reports/statutory/pt-register"
              element={withSuspense(<ProfessionalTaxRegisterReport />)}
            />
            <Route path="/reports/statutory/tds-24q" element={withSuspense(<Tds24qReport />)} />
            <Route
              path="/reports/statutory/gratuity"
              element={withSuspense(<GratuityAccrualReport />)}
            />
          </Route>

          <Route element={<RequireRole allow={ADMIN_ONLY} />}>
            <Route path="/roles" element={<RolesList />} />
            <Route path="/roles/:id" element={<RoleDetail />} />
            <Route path="/audit-logs" element={<AuditLog />} />
          </Route>

          <Route element={<RequireRole allow={PLATFORM_ONLY} />}>
            <Route path="/platform/companies" element={<Companies />} />
            <Route path="/platform/onboard" element={<OnboardCompany />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
