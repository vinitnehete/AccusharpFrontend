import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import PageHeader from '../../components/PageHeader';
import EmployeePicker from '../../components/EmployeePicker';
import attendancePolicyApi from '../../api/attendancePolicy';
import { labelize } from '../../constants/enums';
import { SCOPE_LABEL, describeRule, ruleLabel } from '../../constants/attendancePolicy';

function RuleCard({ entry }) {
  const { applied, beaten, ruleType, evaluationScope, appliedBecause } = entry;

  return (
    <Card sx={{ mb: 1.5 }}>
      <CardContent sx={{ pb: 1.5 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
        >
          <Box>
            <Typography variant="subtitle2">{ruleLabel(ruleType)}</Typography>
            <Typography variant="caption" color="text.secondary">
              {evaluationScope === 'MONTH' ? 'Worked out once a month' : 'Worked out day by day'}
            </Typography>
          </Box>
          {applied ? (
            <Chip
              size="small"
              color={applied.enabled ? 'success' : 'default'}
              label={applied.enabled ? 'Applies' : 'Switched off for this employee'}
            />
          ) : (
            <Chip size="small" label="Not configured" />
          )}
        </Stack>

        <Divider sx={{ my: 1.25 }} />

        {applied ? (
          <>
            <Typography variant="body2">
              {applied.enabled
                ? describeRule(ruleType, applied.params)
                : 'This rule does not apply to this employee, and no wider rule takes over for them.'}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {SCOPE_LABEL[applied.scope] || applied.scope}
              {applied.scopeRef !== '*' ? ` · ${applied.scopeRef}` : ''} · version {applied.version} ·
              in force from {dayjs(applied.effectiveFrom).format('DD MMM YYYY')}
              {applied.notes ? ` · ${applied.notes}` : ''}
            </Typography>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            The built-in behaviour applies — the same as before any policy rules existed.
          </Typography>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
          <strong>Why:</strong> {appliedBecause}
        </Typography>

        {/* The rules that matched and lost. Without these, "why isn't my
            department's rule applying?" has no answer on this screen. */}
        {!!(beaten || []).length && (
          <Accordion elevation={0} disableGutters sx={{ mt: 1, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ px: 0, minHeight: 36 }}>
              <Typography variant="caption" color="text.secondary">
                {beaten.length} other rule{beaten.length > 1 ? 's' : ''} matched but lost
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 0, pt: 0 }}>
              {beaten.map((rule) => (
                <Typography key={rule.id} variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {SCOPE_LABEL[rule.scope] || rule.scope}
                  {rule.scopeRef !== '*' ? ` ${rule.scopeRef}` : ''} (v{rule.version}, from{' '}
                  {dayjs(rule.effectiveFrom).format('DD MMM YYYY')}) — {describeRule(ruleType, rule.params)}
                </Typography>
              ))}
            </AccordionDetails>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}

export default function PolicyEffective() {
  const [userId, setUserId] = useState(null);
  const [date, setDate] = useState(dayjs());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !date) {
      setData(null);
      return;
    }
    setLoading(true);
    attendancePolicyApi
      .effective(userId, date.format('YYYY-MM-DD'))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [userId, date]);

  const groups = data
    ? [
        ['Category', data.categoryCode],
        ['Department', data.departmentCode],
        ['Designation', data.designationCode],
        ['Employment status', data.employmentType && labelize(data.employmentType)],
      ].filter(([, v]) => !!v)
    : [];

  return (
    <>
      <PageHeader
        title="Who gets which rule"
        subtitle="Pick a person and a date to see exactly which rules applied to them, and which ones lost"
        actions={
          <>
            <EmployeePicker label="Employee" value={userId} onChange={setUserId} />
            <DatePicker
              label="Date"
              value={date}
              onChange={setDate}
              slotProps={{ textField: { size: 'small' } }}
            />
          </>
        }
      />

      {!userId ? (
        <Alert severity="info">
          Pick an employee and a date. This is the screen to open when somebody asks why a day came
          out the way it did.
        </Alert>
      ) : loading ? (
        <Skeleton variant="rounded" height={420} />
      ) : !data ? (
        <Alert severity="info">Nothing to show for this employee and date.</Alert>
      ) : (
        <>
          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {data.userId} on {dayjs(data.date).format('DD MMM YYYY')}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {groups.length ? (
                  groups.map(([label, value]) => (
                    <Chip key={label} size="small" variant="outlined" label={`${label}: ${value}`} />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    This employee is in no category, department or designation, so only company-wide
                    rules can reach them.
                  </Typography>
                )}
              </Stack>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                Company-wide settings these rules sit on top of (Masters → Attendance Rule):
              </Typography>
              <Grid container spacing={1}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="body2">
                    Entry window buffer: <strong>{data.base?.entryWindowBufferMinutes} min</strong>
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="body2">
                    Full day at: <strong>{data.base?.fullDayThresholdPercent}</strong>
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="body2">
                    Half day at: <strong>{data.base?.halfDayThresholdPercent}</strong>
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {(data.rules || []).map((entry) => (
            <RuleCard key={entry.ruleType} entry={entry} />
          ))}
        </>
      )}
    </>
  );
}
