import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import BeachAccessRoundedIcon from '@mui/icons-material/BeachAccessRounded';
import EditCalendarRoundedIcon from '@mui/icons-material/EditCalendarRounded';
import DateRangeRoundedIcon from '@mui/icons-material/DateRangeRounded';
import DonutSmallRoundedIcon from '@mui/icons-material/DonutSmallRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import ApartmentRoundedIcon from '@mui/icons-material/ApartmentRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import DomainAddRoundedIcon from '@mui/icons-material/DomainAddRounded';
import EngineeringRoundedIcon from '@mui/icons-material/EngineeringRounded';
import { ACCESS, isAllowed } from '../constants/access';

// Each item names the ACCESS rule that opens it - the same rule its route is
// guarded by in App.js, so the sidebar never offers a page the router refuses.
// An item with no rule is open to everyone signed in to a company.
const navConfig = [
  {
    label: 'Overview',
    items: [
      // Plain EMPLOYEE has no DASHBOARD_READ permission - see PermissionSeeder -
      // and is routed to /attendance/me instead (App.js's RootRedirect).
      { label: 'Dashboard', path: '/', icon: DashboardRoundedIcon, access: ACCESS.dashboard },
    ],
  },
  {
    label: 'My Workspace',
    items: [
      { label: 'My Attendance', path: '/attendance/me', icon: EventAvailableRoundedIcon },
      { label: 'Apply Leave', path: '/leave/apply', icon: EditCalendarRoundedIcon },
      { label: 'My Leaves', path: '/leave/my', icon: BeachAccessRoundedIcon },
      { label: 'Leave Calendar', path: '/leave/calendar', icon: DateRangeRoundedIcon },
      { label: 'Leave Balances', path: '/leave/balances', icon: DonutSmallRoundedIcon },
      { label: 'My Salary Slip', path: '/salary-slips/me', icon: ReceiptLongRoundedIcon },
    ],
  },
  {
    label: 'Team',
    items: [
      { label: 'My Team', path: '/team', icon: GroupsRoundedIcon, access: ACCESS.team },
      {
        label: 'Pending Approvals',
        path: '/leave/approvals',
        icon: PendingActionsRoundedIcon,
        access: ACCESS.leaveApprovals,
      },
      {
        label: 'Roster Planner',
        path: '/roster/planner',
        icon: CalendarMonthRoundedIcon,
        access: ACCESS.roster,
      },
    ],
  },
  {
    label: 'HR Admin',
    items: [
      { label: 'Employees', path: '/employees', icon: BadgeRoundedIcon, access: ACCESS.employees },
      { label: 'Shifts', path: '/shifts', icon: ScheduleRoundedIcon, access: ACCESS.shifts },
      { label: 'Holidays', path: '/holidays', icon: EventBusyRoundedIcon, access: ACCESS.holidays },
      {
        label: 'All Leaves',
        path: '/leave/all',
        icon: FactCheckRoundedIcon,
        access: ACCESS.leaveAll,
      },
      {
        label: 'Attendance Console',
        path: '/attendance/generate',
        icon: EventAvailableRoundedIcon,
        access: ACCESS.attendanceConsole,
      },
      { label: 'Payroll', path: '/payroll/list', icon: PaymentsRoundedIcon, access: ACCESS.payroll },
      {
        label: 'Salary Slips',
        path: '/salary-slips',
        icon: ReceiptLongRoundedIcon,
        access: ACCESS.salarySlips,
      },
      { label: 'Masters', path: '/masters/companies', icon: ApartmentRoundedIcon, access: ACCESS.masters },
      { label: 'Reports', path: '/reports', icon: AssessmentRoundedIcon, access: ACCESS.reports },
    ],
  },
  {
    label: 'Contractors',
    items: [
      {
        label: 'Contractors',
        path: '/contractors/list',
        icon: EngineeringRoundedIcon,
        access: ACCESS.contractors,
      },
      {
        label: 'Contractor Workforce',
        path: '/contractors/workforce',
        icon: GroupsRoundedIcon,
        access: ACCESS.contractors,
      },
      {
        label: 'Contractor Roster',
        path: '/contractors/roster',
        icon: CalendarMonthRoundedIcon,
        access: ACCESS.contractors,
      },
      {
        label: 'Contractor Attendance',
        path: '/contractors/attendance',
        icon: EventAvailableRoundedIcon,
        access: ACCESS.contractors,
      },
      {
        label: 'Contractor Reports',
        path: '/contractors/reports',
        icon: AssessmentRoundedIcon,
        access: ACCESS.contractors,
      },
    ],
  },
  {
    label: 'Security',
    items: [
      {
        label: 'Custom Roles',
        path: '/roles',
        icon: AdminPanelSettingsRoundedIcon,
        access: ACCESS.roles,
      },
      { label: 'Audit Log', path: '/audit-logs', icon: HistoryRoundedIcon, access: ACCESS.auditLog },
    ],
  },
];

// A platform principal (PLATFORM_OWNER/PLATFORM_ADMIN) has no company, so
// none of the sections above apply - it gets its own small nav instead.
export const platformNavConfig = [
  {
    label: 'Platform',
    items: [
      { label: 'Companies', path: '/platform/companies', icon: ApartmentRoundedIcon, access: ACCESS.platform },
      { label: 'Onboard Company', path: '/platform/onboard', icon: DomainAddRoundedIcon, access: ACCESS.platform },
      { label: 'Audit Log', path: '/audit-logs', icon: HistoryRoundedIcon, access: ACCESS.auditLog },
    ],
  },
];

// The sections and items this session may open; a section left empty is dropped.
export const visibleNav = (config, session) =>
  config
    .map((section) => ({ ...section, items: section.items.filter((item) => isAllowed(item.access, session)) }))
    .filter((section) => section.items.length > 0);

export default navConfig;
