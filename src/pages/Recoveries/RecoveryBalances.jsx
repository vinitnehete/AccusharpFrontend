import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import MoneyText from '../../components/MoneyText';
import { RECOVERY_TYPE_LABEL } from '../../constants/enums';

/**
 * What one employee currently owes, by type. Always renders all four types,
 * including the zero ones - "no loan" is an answer HR needs to see stated,
 * not inferred from a missing row.
 */
export default function RecoveryBalances({ statement, title = 'Outstanding balances' }) {
  if (!statement) return null;
  const { balances = [], totalOutstanding } = statement;

  return (
    <Card sx={{ mb: 2.5 }}>
      <CardContent>
        <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="subtitle2">{title}</Typography>
          <Typography variant="subtitle1">
            Total owed: <MoneyText value={totalOutstanding} />
          </Typography>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {balances.map((balance) => (
            <Grid key={balance.type} size={{ xs: 6, sm: 3 }}>
              <Typography variant="caption" color="text.secondary">
                {RECOVERY_TYPE_LABEL[balance.type] || balance.type}
              </Typography>
              <Typography variant="h6">
                <MoneyText value={balance.outstandingAmount} />
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {balance.activeCount} open
                {balance.scheduledInstallment > 0 && (
                  <>
                    {' · '}
                    <MoneyText value={balance.scheduledInstallment} /> due
                  </>
                )}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
