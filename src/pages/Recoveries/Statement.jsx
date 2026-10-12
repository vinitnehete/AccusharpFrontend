import { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import PageHeader from '../../components/PageHeader';
import EmployeePicker from '../../components/EmployeePicker';
import DataTable from '../../components/DataTable';
import MoneyText from '../../components/MoneyText';
import StatusChip from '../../components/StatusChip';
import RecoveryBalances from './RecoveryBalances';
import recoveriesApi from '../../api/recoveries';
import { useAuth } from '../../context/AuthContext';
import {
  RECOVERY_STATUS_COLOR,
  RECOVERY_TRANSACTION_TYPE_COLOR,
  RECOVERY_TYPE_LABEL,
  labelize,
} from '../../constants/enums';

const money = (params) => <MoneyText value={params.value} />;

const RECOVERY_COLUMNS = [
  {
    field: 'type',
    headerName: 'Type',
    width: 130,
    valueGetter: (value) => RECOVERY_TYPE_LABEL[value] || value,
  },
  { field: 'principalAmount', headerName: 'Issued', width: 120, renderCell: money },
  { field: 'recoveredAmount', headerName: 'Recovered', width: 120, renderCell: money },
  { field: 'outstandingAmount', headerName: 'Outstanding', width: 130, renderCell: money },
  { field: 'installmentAmount', headerName: 'Instalment', width: 120, renderCell: money },
  { field: 'issuedOn', headerName: 'Issued on', width: 115 },
  { field: 'reason', headerName: 'Reason', width: 220 },
  {
    field: 'status',
    headerName: 'Status',
    width: 110,
    renderCell: (params) => <StatusChip value={params.value} colorMap={RECOVERY_STATUS_COLOR} />,
  },
];

// The ledger. REVERSAL rows are the ones worth understanding: a payroll that
// was regenerated gives back exactly what its superseded revision took, which
// is why regenerating a period never collects an instalment twice.
const TRANSACTION_COLUMNS = [
  {
    field: 'recordedAt',
    headerName: 'When',
    width: 170,
    valueGetter: (value) => (value ? new Date(value).toLocaleString() : ''),
  },
  {
    field: 'type',
    headerName: 'Type',
    width: 130,
    valueGetter: (value) => RECOVERY_TYPE_LABEL[value] || value,
  },
  {
    field: 'transactionType',
    headerName: 'Movement',
    width: 130,
    renderCell: (params) => (
      <Chip
        size="small"
        label={labelize(params.value)}
        color={RECOVERY_TRANSACTION_TYPE_COLOR[params.value] || 'default'}
      />
    ),
  },
  { field: 'amount', headerName: 'Amount', width: 120, renderCell: money },
  { field: 'balanceBefore', headerName: 'Before', width: 120, renderCell: money },
  { field: 'balanceAfter', headerName: 'After', width: 120, renderCell: money },
  {
    field: 'period',
    headerName: 'Payroll',
    width: 120,
    valueGetter: (_value, row) =>
      row.month ? `${row.month}/${row.year}${row.payrollRevision ? ` r${row.payrollRevision}` : ''}` : '-',
  },
  { field: 'remarks', headerName: 'Note', width: 300 },
  { field: 'recordedBy', headerName: 'By', width: 110 },
];

export default function RecoveryStatement() {
  const { can, username } = useAuth();
  const canSeePay = can('PAY_READ');
  const [selectedEmployeeId, setEmployeeId] = useState(null);
  const employeeId = canSeePay ? selectedEmployeeId : username;
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setStatement(null);
    setLoading(false);
    if (!employeeId) {
      return;
    }
    setLoading(true);
    recoveriesApi
      .statement(employeeId)
      .then((res) => { if (active) setStatement(res); })
      .catch(() => { if (active) setStatement(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [employeeId]);

  return (
    <>
      <PageHeader
        title="Employee Recovery Statement"
        subtitle="Every loan, advance and fine on file, and every movement behind the balance"
      />

      {canSeePay && <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 5 }}>
              <EmployeePicker label="Employee" value={employeeId} onChange={setEmployeeId} />
            </Grid>
          </Grid>
        </CardContent>
      </Card>}

      {statement && <RecoveryBalances statement={statement} />}

      {statement && (
        <>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Recoveries
          </Typography>
          <DataTable
            rows={statement.recoveries}
            columns={RECOVERY_COLUMNS}
            loading={loading}
            getRowId={(r) => r.id}
            height={340}
            sx={{ mb: 3 }}
            emptyState={{ title: 'Nothing on file', description: 'This employee owes the company nothing.' }}
          />

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Ledger
          </Typography>
          <DataTable
            rows={statement.transactions}
            columns={TRANSACTION_COLUMNS}
            loading={loading}
            getRowId={(r) => r.id}
            height={420}
            emptyState={{ title: 'No movements yet' }}
          />
        </>
      )}
    </>
  );
}
