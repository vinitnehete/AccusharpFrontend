import { Link as RouterLink } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import EventAvailableRoundedIcon from '@mui/icons-material/EventAvailableRounded';
import BeachAccessRoundedIcon from '@mui/icons-material/BeachAccessRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import FactCheckRoundedIcon from '@mui/icons-material/FactCheckRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import GavelRoundedIcon from '@mui/icons-material/GavelRounded';
import PageHeader from '../../components/PageHeader';

const GROUPS = [
  {
    label: 'Payroll Audit',
    items: [
      {
        label: 'Monthly Payroll Audit',
        path: '/reports/payroll/audit',
        icon: FactCheckRoundedIcon,
        description: 'Fixed vs earned wages, per-day rate, OT, hours and deductions — with a day-wise drill-down',
      },
    ],
  },
  {
    label: 'People',
    items: [{ label: 'Employee Master', path: '/reports/employees', icon: PeopleAltRoundedIcon }],
  },
  {
    label: 'Attendance',
    items: [
      { label: 'Monthly Attendance', path: '/reports/attendance/monthly', icon: EventAvailableRoundedIcon },
      { label: 'Late Coming', path: '/reports/attendance/late-coming', icon: EventAvailableRoundedIcon },
      { label: 'Absent', path: '/reports/attendance/absent', icon: EventAvailableRoundedIcon },
      { label: 'Overtime', path: '/reports/attendance/overtime', icon: EventAvailableRoundedIcon },
      { label: 'Loss of Pay', path: '/reports/attendance/lop', icon: EventAvailableRoundedIcon },
      {
        label: 'Worked on Weekly Off',
        path: '/reports/attendance/week-off-worked',
        icon: EventAvailableRoundedIcon,
      },
      {
        label: 'Attendance Exceptions',
        path: '/reports/attendance/exceptions',
        icon: EventAvailableRoundedIcon,
        description: 'Late-ins, early-outs, missed punches and unexplained absences, day by day',
      },
      {
        label: 'Overtime Register',
        path: '/reports/attendance/overtime-register',
        icon: EventAvailableRoundedIcon,
        description: 'Day-level overtime priced at the rate payroll used',
      },
    ],
  },
  {
    label: 'Leave',
    items: [
      { label: 'Leave Balances', path: '/reports/leave-balances', icon: BeachAccessRoundedIcon },
      {
        label: 'Leave Transactions',
        path: '/reports/leave/transactions',
        icon: BeachAccessRoundedIcon,
        description: 'Every request and what became of it — approvals, rejections, cancellations',
      },
    ],
  },
  {
    label: 'Payroll',
    items: [
      { label: 'Payroll', path: '/reports/payroll', icon: PaymentsRoundedIcon },
      { label: 'Payroll by Department', path: '/reports/payroll/by-department', icon: PaymentsRoundedIcon },
      { label: 'Payroll by Company', path: '/reports/payroll/by-company', icon: PaymentsRoundedIcon },
      {
        label: 'Payroll Register',
        path: '/reports/payroll/register',
        icon: ReceiptLongRoundedIcon,
        description: 'Full CTC breakup and every earning and deduction head, per employee per run',
      },
      {
        label: 'Payslip Register',
        path: '/reports/payroll/payslip-register',
        icon: ReceiptLongRoundedIcon,
        description: 'Every employee\u2019s payslip totals for the period, in bulk',
      },
      {
        label: 'Salary Revisions & Arrears',
        path: '/reports/payroll/salary-revisions',
        icon: PaymentsRoundedIcon,
        description: 'Revisions in the window and the periods a retrospective one left underpaid',
      },
      {
        label: 'Bank Transfer Advice',
        path: '/reports/payroll/bank-transfer',
        icon: AccountBalanceRoundedIcon,
        description: 'The disbursement instruction, with bank-file control totals',
      },
      {
        label: 'Full & Final Settlement',
        path: '/reports/payroll/full-and-final',
        icon: PaymentsRoundedIcon,
        description: 'The exit worksheet for everyone relieved in the window',
      },
    ],
  },
  {
    label: 'Statutory & Compliance',
    items: [
      { label: 'Provident Fund', path: '/reports/statutory/pf', icon: PaymentsRoundedIcon },
      { label: 'Professional Tax', path: '/reports/statutory/professional-tax', icon: PaymentsRoundedIcon },
      { label: 'ESIC', path: '/reports/statutory/esic', icon: PaymentsRoundedIcon },
      {
        label: 'PF ECR',
        path: '/reports/statutory/pf-ecr',
        icon: GavelRoundedIcon,
        description: 'Member-wise contribution lines in the EPFO ECR column order',
      },
      {
        label: 'ESI Return',
        path: '/reports/statutory/esi-return',
        icon: GavelRoundedIcon,
        description: 'Insured-person lines with both contribution shares',
      },
      {
        label: 'Professional Tax Register',
        path: '/reports/statutory/pt-register',
        icon: GavelRoundedIcon,
        description: 'Who was taxed, on what, and how much',
      },
      {
        label: 'TDS / Form 24Q',
        path: '/reports/statutory/tds-24q',
        icon: GavelRoundedIcon,
        description: 'Quarterly TDS per employee with the month-wise split',
      },
      {
        label: 'Gratuity Accrual',
        path: '/reports/statutory/gratuity',
        icon: GavelRoundedIcon,
        description: 'Accrued liability per employee as at a date',
      },
    ],
  },
];

export default function ReportsHub() {
  return (
    <>
      <PageHeader title="Reports" subtitle="Aggregated views over attendance, leave and payroll — never recalculated, so a report can never disagree with a salary slip" />
      {GROUPS.map((group) => (
        <Box key={group.label} sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
            {group.label}
          </Typography>
          <Grid container spacing={2}>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <Grid key={item.path} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card sx={{ height: '100%' }}>
                    <CardActionArea component={RouterLink} to={item.path} sx={{ height: '100%' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Icon color="primary" />
                          <Typography variant="body1">{item.label}</Typography>
                        </Box>
                        {item.description && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 1, ml: 4.5 }}
                          >
                            {item.description}
                          </Typography>
                        )}
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      ))}
    </>
  );
}
