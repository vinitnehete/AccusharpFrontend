import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import { alpha } from '@mui/material/styles';
import PrintRoundedIcon from '@mui/icons-material/PrintRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import PageHeader from '../../components/PageHeader';
import EmployeePicker from '../../components/EmployeePicker';
import MoneyText from '../../components/MoneyText';
import CardLabel from '../../components/CardLabel';
import { initialsOf } from '../../layout/shell';
import salarySlipsApi from '../../api/salarySlips';

export default function SalarySlip({ fixedEmployeeId }) {
  const [employeeId, setEmployeeId] = useState(fixedEmployeeId || null);
  const [period, setPeriod] = useState(dayjs());
  const month = period ? period.month() + 1 : null;
  const year = period ? period.year() : null;
  const [slip, setSlip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (fixedEmployeeId) setEmployeeId(fixedEmployeeId);
  }, [fixedEmployeeId]);

  useEffect(() => {
    if (!employeeId || !month || !year) return;
    setLoading(true);
    setError(false);
    salarySlipsApi
      .get(employeeId, Number(month), Number(year))
      .then(setSlip)
      .catch(() => {
        setSlip(null);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [employeeId, month, year]);

  return (
    <>
      <PageHeader
        title={fixedEmployeeId ? 'My Salary Slip' : 'Salary Slips'}
        subtitle="Read straight from the payroll snapshot — reprinting an old month always gives the same figures"
        actions={
          <>
            {!fixedEmployeeId && (
              <EmployeePicker label="Employee" value={employeeId} onChange={setEmployeeId} />
            )}
            <DatePicker
              label="Month"
              views={['year', 'month']}
              value={period}
              onChange={setPeriod}
              slotProps={{ textField: { size: 'small' } }}
            />
            {employeeId && slip && (
              <Button
                startIcon={<PrintRoundedIcon />}
                onClick={() =>
                  window.open(
                    salarySlipsApi.printUrl(employeeId, month, year),
                    '_blank',
                    'noopener,noreferrer'
                  )
                }
              >
                Print
              </Button>
            )}
            {/* Whole-company export - HR/Admin only view, not shown on the
                employee's own self-service salary-slip screen. */}
            {!fixedEmployeeId && (
              <Button
                startIcon={<DownloadRoundedIcon />}
                onClick={() =>
                  window.open(salarySlipsApi.exportUrl(month, year), '_blank', 'noopener,noreferrer')
                }
              >
                Export month CSV
              </Button>
            )}
          </>
        }
      />

      {!employeeId ? (
        <Alert severity="info">Pick an employee to view their salary slip.</Alert>
      ) : loading ? (
        <Skeleton variant="rounded" height={420} sx={{ maxWidth: 720 }} />
      ) : error ? (
        <Alert severity="warning">
          No salary slip for this period — payroll may not have been generated yet.
        </Alert>
      ) : (
        slip && (
          <Card sx={{ maxWidth: 760, overflow: 'hidden' }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              sx={{
                justifyContent: 'space-between',
                alignItems: { sm: 'center' },
                px: { xs: 2.5, sm: 3 },
                py: 2,
                bgcolor: 'surfaceAlt',
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Box>
                <Typography variant="h6">{slip.companyName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Salary Slip — {slip.period}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                <Chip
                  size="small"
                  label={`Payable days: ${slip.attendance?.payableDays} / ${slip.attendance?.workingDays}`}
                />
                <Chip size="small" label={`LOP days: ${slip.attendance?.lopDays}`} />
              </Stack>
            </Stack>

            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2.5 }}>
                <Avatar sx={{ width: 40, height: 40, fontSize: 14, bgcolor: '#EEF1F5', color: 'text.primary' }}>
                  {initialsOf(slip.employeeName)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle1" noWrap>
                    {slip.employeeName}{' '}
                    {slip.employeeCode && (
                      <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}>
                        ({slip.employeeCode})
                      </Box>
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {slip.departmentName} — {slip.designationName}
                  </Typography>
                </Box>
              </Stack>

              <Grid container spacing={2}>
                {[
                  { title: 'Earnings', lines: slip.earnings, total: slip.totalEarnings },
                  { title: 'Deductions', lines: slip.deductions, total: slip.totalDeductions },
                ].map((block) => (
                  <Grid key={block.title} size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: '12px', p: 2, height: '100%' }}>
                      <CardLabel sx={{ mb: 1 }}>{block.title}</CardLabel>
                      <Table size="small">
                        <TableBody>
                          {block.lines?.map((line) => (
                            <TableRow key={line.label}>
                              <TableCell sx={{ pl: 0, color: 'text.secondary' }}>{line.label}</TableCell>
                              <TableCell sx={{ pr: 0 }} align="right" className="tabular-nums">
                                <MoneyText value={line.amount} />
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell sx={{ borderBottom: 0, pl: 0, fontWeight: 700 }}>Total</TableCell>
                            <TableCell sx={{ borderBottom: 0, pr: 0, fontWeight: 700 }} align="right">
                              <MoneyText value={block.total} />
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{
                  mt: 2.5,
                  px: 2.5,
                  py: 2,
                  borderRadius: '12px',
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
                  border: 1,
                  borderColor: (theme) => alpha(theme.palette.primary.main, 0.16),
                  justifyContent: 'space-between',
                  alignItems: { sm: 'center' },
                }}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Net pay
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    {slip.netSalaryInWords}
                  </Typography>
                </Box>
                <Typography
                  className="tabular-nums"
                  sx={{ fontSize: '1.625rem', fontWeight: 600, letterSpacing: '-0.02em', color: 'primary.dark' }}
                >
                  <MoneyText value={slip.netSalary} />
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        )
      )}
    </>
  );
}
