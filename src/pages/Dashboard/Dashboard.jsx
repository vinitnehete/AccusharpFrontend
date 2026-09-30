import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import LinearProgress from '@mui/material/LinearProgress';
import { alpha } from '@mui/material/styles';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import EventBusyOutlinedIcon from '@mui/icons-material/EventBusyOutlined';
import BeachAccessOutlinedIcon from '@mui/icons-material/BeachAccessOutlined';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import EventRepeatOutlinedIcon from '@mui/icons-material/EventRepeatOutlined';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import CakeOutlinedIcon from '@mui/icons-material/CakeOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import PageHeader from '../../components/PageHeader';
import CardLabel from '../../components/CardLabel';
import dashboardApi from '../../api/dashboard';
import { formatMoney } from '../../components/MoneyText';
import { useAuth } from '../../context/AuthContext';
import { greetingFor, initialsOf } from '../../layout/shell';
import { tokens } from '../../theme/theme';

// Chart marks only (not text), so these need 3:1 against white, not 4.5:1.
const PIE_COLORS = [
  tokens.color.accent.main,
  tokens.color.secondary.main,
  '#0D9488',
  '#D97706',
  '#E11D48',
  tokens.color.accent.light,
];

const AXIS_TICK = { fontSize: 12, fill: tokens.color.text.tertiary };
const TOOLTIP_PROPS = {
  contentStyle: {
    borderRadius: 10,
    border: `1px solid ${tokens.color.neutral.border}`,
    boxShadow: tokens.elevation.menu,
    fontSize: 13,
    padding: '8px 12px',
  },
  labelStyle: { color: tokens.color.text.secondary, marginBottom: 2 },
  cursor: { fill: alpha(tokens.color.accent.main, 0.06), stroke: tokens.color.neutral.border },
};

function MetricRow({ icon, label, value, color, loading }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minHeight: 44 }}>
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: '9px',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          color,
          bgcolor: alpha(color, 0.1),
          '& svg': { fontSize: 17 },
        }}
      >
        {icon}
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ flexGrow: 1, minWidth: 0 }} noWrap>
        {label}
      </Typography>
      {loading ? (
        <Skeleton variant="text" width={36} />
      ) : (
        <Typography className="tabular-nums" sx={{ fontWeight: 600, fontSize: '1rem' }}>
          {value ?? '—'}
        </Typography>
      )}
    </Stack>
  );
}

function SnapshotCard({ cards, loading, asOf }) {
  const palette = tokens.color;
  const total = Number(cards?.totalEmployees) || 0;
  const present = Number(cards?.presentToday) || 0;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <Card sx={{ mb: 3, overflow: 'hidden' }}>
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.5,
          py: 1.75,
          bgcolor: 'surfaceAlt',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" component="h2">
          Today at a glance
        </Typography>
        <Typography variant="body2" color="text.secondary">
          As of {(asOf || dayjs()).format('D MMM YYYY')}
        </Typography>
      </Stack>

      <Grid container>
        <Grid
          size={{ xs: 12, md: 6 }}
          // Explicit colours: a responsive border shorthand is emitted after a
          // plain borderColor and would reset it to the text colour.
          sx={{
            p: 2.5,
            borderRight: { xs: 'none', md: `1px solid ${tokens.color.neutral.border}` },
            borderBottom: { xs: `1px solid ${tokens.color.neutral.border}`, md: 'none' },
          }}
        >
          <CardLabel>Workforce &amp; attendance</CardLabel>
          <Box sx={{ mt: 1.25 }}>
            <MetricRow loading={loading} icon={<PeopleAltOutlinedIcon />} label="Total employees" value={cards?.totalEmployees} color={palette.accent.main} />
            <MetricRow loading={loading} icon={<EventAvailableOutlinedIcon />} label="Present today" value={cards?.presentToday} color={palette.success.main} />
            <MetricRow loading={loading} icon={<EventBusyOutlinedIcon />} label="Absent today" value={cards?.absentToday} color={palette.error.main} />
            <MetricRow loading={loading} icon={<EventRepeatOutlinedIcon />} label="Unscheduled tomorrow" value={cards?.unscheduledTomorrow} color={palette.secondary.main} />
          </Box>
          <Box sx={{ mt: 1.5 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.75 }}>
              <Typography variant="body2" color="text.secondary">
                Attendance today
              </Typography>
              <Typography variant="body2" className="tabular-nums" sx={{ fontWeight: 600 }}>
                {loading ? '—' : `${rate}%`}
              </Typography>
            </Stack>
            <LinearProgress
              variant={loading ? 'indeterminate' : 'determinate'}
              value={rate}
              aria-label="Attendance today"
              color="success"
            />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} sx={{ p: 2.5 }}>
          <CardLabel>Leave &amp; payroll</CardLabel>
          <Box sx={{ mt: 1.25 }}>
            <MetricRow loading={loading} icon={<BeachAccessOutlinedIcon />} label="On leave today" value={cards?.employeesOnLeave} color={palette.info.main} />
            <MetricRow loading={loading} icon={<HourglassEmptyRoundedIcon />} label="Pending leave requests" value={cards?.pendingLeaveRequests} color={palette.warning.main} />
            <MetricRow loading={loading} icon={<PaymentsOutlinedIcon />} label="Payroll generated this month" value={cards?.payrollGeneratedThisMonth} color={palette.accent.dark} />
            <MetricRow
              loading={loading}
              icon={<CakeOutlinedIcon />}
              label="Upcoming birthdays"
              value={cards?.upcomingBirthdays?.length ?? (loading ? undefined : 0)}
              color="#8A6FED"
            />
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
}

function ChartCard({ title, height = 280, loading, children }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <CardLabel>{title}</CardLabel>
        <Box sx={{ height, mt: 2 }}>
          {loading ? (
            <Skeleton variant="rounded" width="100%" height="100%" />
          ) : (
            children
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// A donut with its legend beside it, values included - the numbers the old
// pie printed on its slices, now readable in a list.
function DonutWithLegend({ data, emptyText, emptyIcon }) {
  const total = data.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
  if (data.length === 0 || total === 0) {
    return <EmptyNote icon={emptyIcon} text={emptyText} />;
  }
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} sx={{ height: '100%', alignItems: 'center' }}>
      <Box sx={{ position: 'relative', width: 180, height: 180, flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={86}
              paddingAngle={data.length > 1 ? 2 : 0}
              cornerRadius={4}
              stroke="none"
            >
              {data.map((entry, idx) => (
                <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip {...TOOLTIP_PROPS} />
          </PieChart>
        </ResponsiveContainer>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            pointerEvents: 'none',
            textAlign: 'center',
          }}
        >
          <Box>
            <Typography className="tabular-nums" sx={{ fontSize: '1.375rem', fontWeight: 600, lineHeight: 1.1 }}>
              {Number.isInteger(total) ? total : total.toFixed(1)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total
            </Typography>
          </Box>
        </Box>
      </Box>
      <Stack spacing={1} sx={{ flexGrow: 1, minWidth: 0, width: '100%', maxHeight: '100%', overflowY: 'auto' }}>
        {data.map((entry, idx) => (
          <Stack key={entry.name} direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
            <Box
              sx={{ width: 10, height: 10, borderRadius: '3px', flexShrink: 0, bgcolor: PIE_COLORS[idx % PIE_COLORS.length] }}
            />
            <Typography variant="body2" noWrap sx={{ flexGrow: 1, minWidth: 0 }}>
              {entry.name}
            </Typography>
            <Typography variant="body2" className="tabular-nums" color="text.secondary" sx={{ fontWeight: 600 }}>
              {entry.value}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}

function EmptyNote({ icon, text }) {
  return (
    <Stack spacing={1.25} sx={{ alignItems: 'center', justifyContent: 'center', height: '100%', py: 3, textAlign: 'center' }}>
      <Box
        aria-hidden
        sx={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'ink.main',
          color: 'common.white',
          '& svg': { fontSize: 20 },
        }}
      >
        {icon}
      </Box>
      <Typography variant="body2" color="text.secondary">
        {text}
      </Typography>
    </Stack>
  );
}

function PersonList({ items, emptyText, emptyIcon, dateSuffix, loading }) {
  if (loading) {
    return (
      <Stack spacing={1.5} sx={{ py: 0.5 }}>
        {[0, 1, 2].map((i) => (
          <Stack key={i} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Skeleton variant="circular" width={36} height={36} />
            <Skeleton variant="text" width="70%" />
          </Stack>
        ))}
      </Stack>
    );
  }
  if (!items || items.length === 0) {
    return <EmptyNote icon={emptyIcon} text={emptyText} />;
  }
  return (
    <List dense disablePadding>
      {items.map((p) => (
        <ListItem
          key={`${p.userId}-${p.date}`}
          disableGutters
          sx={{ py: 0.75, borderBottom: 1, borderColor: 'divider', '&:last-child': { borderBottom: 0 } }}
        >
          <ListItemAvatar sx={{ minWidth: 48 }}>
            <Avatar sx={{ bgcolor: '#EEF1F5', color: 'text.primary', width: 36, height: 36, fontSize: 13 }}>
              {initialsOf(p.employeeName)}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={p.employeeName}
            secondary={p.years ? `${p.years} yr${dateSuffix}` : null}
            slotProps={{ primary: { sx: { fontWeight: 600, fontSize: '0.875rem' } } }}
          />
          <Box
            sx={{
              px: 1,
              py: 0.25,
              borderRadius: '8px',
              bgcolor: 'surfaceAlt',
              border: 1,
              borderColor: 'divider',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'text.secondary',
              flexShrink: 0,
            }}
          >
            {dayjs(p.date).format('DD MMM')}
          </Box>
        </ListItem>
      ))}
    </List>
  );
}

function PeopleCard({ title, icon, children }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
          <Box sx={{ color: 'text.tertiary', display: 'flex', '& svg': { fontSize: 20 } }}>{icon}</Box>
          <Typography variant="subtitle1" component="h2">
            {title}
          </Typography>
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { me, username } = useAuth();
  const [asOf, setAsOf] = useState(dayjs());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setLoadFailed(false);
    dashboardApi
      .get(asOf ? asOf.format('YYYY-MM-DD') : undefined)
      .then((res) => setData(res))
      .catch(() => {
        setData(null);
        setLoadFailed(true);
      })
      .finally(() => setLoading(false));
  }, [asOf]);

  useEffect(() => {
    load();
  }, [load]);

  const cards = data?.cards;
  const charts = data?.charts;

  const departmentPie = useMemo(
    () => (charts?.departmentStrength || []).map((p) => ({ name: p.label, value: p.value })),
    [charts]
  );
  const leaveUsagePie = useMemo(
    () => (charts?.leaveUsage || []).map((p) => ({ name: p.label, value: Number(p.value) })),
    [charts]
  );

  const name = me?.employeeName || username;
  const title = (
    <>
      {greetingFor(dayjs().hour())}
      {name ? `, ${name}` : ''}{' '}
      <Box component="span" role="img" aria-label="waving hand" sx={{ display: 'inline-block' }}>
        👋
      </Box>
    </>
  );
  const subtitle = me?.companyName
    ? `Here is how ${me.companyName} is doing - attendance, leave and payroll at a glance.`
    : 'Company-wide snapshot of attendance, leave and payroll.';

  if (loadFailed) {
    return (
      <Box>
        <PageHeader title={title} subtitle={subtitle} />
        <Card sx={{ p: 5, textAlign: 'center' }}>
          <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
            Couldn&apos;t load the dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Check your connection and try again.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon />}
            onClick={load}
            data-testid="dashboard-retry-button"
          >
            Try again
          </Button>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={title}
        subtitle={subtitle}
        actions={
          <DatePicker
            label="As of"
            value={asOf}
            onChange={setAsOf}
            slotProps={{ textField: { size: 'small', sx: { width: 180 } } }}
          />
        }
      />

      <SnapshotCard cards={cards} loading={loading} asOf={asOf} />

      <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
        Trends
      </Typography>
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <ChartCard title="14-day attendance trend" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.attendanceTrend || []} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={tokens.color.accent.main} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={tokens.color.accent.main} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={tokens.color.neutral.borderSoft} />
                <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis tick={AXIS_TICK} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_PROPS} />
                <Area
                  type="monotone"
                  dataKey="value"
                  name="Present"
                  stroke={tokens.color.accent.main}
                  strokeWidth={2.25}
                  fill="url(#attendanceFill)"
                  activeDot={{ r: 4, strokeWidth: 2, stroke: '#FFFFFF' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <ChartCard title="Department strength" loading={loading}>
            <DonutWithLegend
              data={departmentPie}
              emptyText="No departments to show yet."
              emptyIcon={<PeopleAltOutlinedIcon />}
            />
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 7 }}>
          <ChartCard title="Payroll cost (last 6 months)" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.payrollCost || []} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={tokens.color.neutral.borderSoft} />
                <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                <YAxis
                  tick={AXIS_TICK}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip {...TOOLTIP_PROPS} formatter={(v) => formatMoney(v)} />
                <Bar dataKey="value" name="Net payroll" fill={tokens.color.accent.main} radius={[8, 8, 0, 0]} maxBarSize={44} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <ChartCard title="Leave usage by type" loading={loading}>
            <DonutWithLegend
              data={leaveUsagePie}
              emptyText="No leave taken in this period."
              emptyIcon={<BeachAccessOutlinedIcon />}
            />
          </ChartCard>
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <PeopleCard title="Upcoming birthdays" icon={<CakeOutlinedIcon />}>
            <PersonList
              loading={loading}
              items={cards?.upcomingBirthdays}
              emptyText="No birthdays in the coming days."
              emptyIcon={<CakeOutlinedIcon />}
              dateSuffix="s old"
            />
          </PeopleCard>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <PeopleCard title="Upcoming work anniversaries" icon={<WorkspacePremiumOutlinedIcon />}>
            <PersonList
              loading={loading}
              items={cards?.upcomingWorkAnniversaries}
              emptyText="No anniversaries in the coming days."
              emptyIcon={<WorkspacePremiumOutlinedIcon />}
              dateSuffix=" with us"
            />
          </PeopleCard>
        </Grid>
      </Grid>
    </Box>
  );
}
