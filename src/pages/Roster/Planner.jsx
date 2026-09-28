import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Skeleton from '@mui/material/Skeleton';
import useMediaQuery from '@mui/material/useMediaQuery';
import { alpha, useTheme } from '@mui/material/styles';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import { useSnackbar } from 'notistack';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import PageHeader from '../../components/PageHeader';
import EmployeePicker from '../../components/EmployeePicker';
import ConfirmDialog from '../../components/ConfirmDialog';
import shiftSchedulesApi from '../../api/shiftSchedules';
import { useActingAs } from '../../context/ActingAsContext';
import { useAuth } from '../../context/AuthContext';
import {
  WEEK_OFF,
  initialWeek,
  matchesSearch,
  shiftStyles,
  shortCodes,
  weeksOf,
} from './plannerView';

const NO_DATES = [];
const NAME_WIDTH = { month: 164, week: 208, phone: 132 };
// Below these a cell stops shrinking and the grid scrolls sideways instead,
// with the employee column pinned so a row never loses its name.
const MIN_CELL = { month: 24, week: 92 };

function ShiftCell({ code, defaulted, label, style, week, title }) {
  if (!code) {
    return (
      <Box aria-hidden sx={{ textAlign: 'center', color: 'text.disabled', fontSize: 12 }}>
        ·
      </Box>
    );
  }
  // A defaulted day is the employee's usual shift, derived from their fixed
  // shift and weekly off rather than assigned by anyone. Outlined instead of
  // filled, so the grid still answers "what have I actually planned?" at a
  // glance - which is what HR opens it to find out.
  return (
    <Box
      title={title}
      sx={{
        mx: 'auto',
        height: week ? 30 : 26,
        maxWidth: week ? 150 : 40,
        px: week ? 1 : 0.25,
        borderRadius: '7px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: week ? '0.78rem' : label?.length > 1 ? '0.62rem' : '0.72rem',
        fontWeight: 700,
        letterSpacing: week ? '0.02em' : 0,
        color: style.fg,
        bgcolor: defaulted ? 'transparent' : style.bg,
        border: defaulted ? `1.5px dashed ${alpha(style.fg, 0.4)}` : '1.5px solid transparent',
        opacity: defaulted ? 0.8 : 1,
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
      }}
    >
      {week ? code : label}
    </Box>
  );
}

function Legend({ labels, styles }) {
  const shifts = Object.keys(labels).filter((c) => c !== WEEK_OFF).sort();
  if (shifts.length === 0 && !labels[WEEK_OFF]) return null;
  const swatch = (bg, fg, border) => ({
    minWidth: 26,
    height: 22,
    px: 0.5,
    borderRadius: '6px',
    display: 'grid',
    placeItems: 'center',
    fontSize: '0.7rem',
    fontWeight: 700,
    bgcolor: bg,
    color: fg,
    border,
  });
  return (
    <Stack direction="row" spacing={1.75} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
      {shifts.map((code) => (
        <Stack key={code} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
          <Box sx={swatch(styles[code].bg, styles[code].fg)}>{labels[code]}</Box>
          <Typography variant="caption" color="text.secondary">
            {code}
          </Typography>
        </Stack>
      ))}
      {labels[WEEK_OFF] && (
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
          <Box sx={swatch(styles[WEEK_OFF].bg, styles[WEEK_OFF].fg)}>WO</Box>
          <Typography variant="caption" color="text.secondary">
            Weekly off
          </Typography>
        </Stack>
      )}
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
        <Box sx={swatch('transparent', 'text.secondary', '1.5px dashed #B9C1CD')} />
        <Typography variant="caption" color="text.secondary">
          Usual shift, not assigned
        </Typography>
      </Stack>
    </Stack>
  );
}

function GridMessage({ title, description }) {
  return (
    <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center', py: 8, px: 3 }}>
      <Box
        aria-hidden
        sx={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'surfaceAlt',
          border: 1,
          borderColor: 'divider',
          color: 'text.tertiary',
        }}
      >
        <InboxOutlinedIcon fontSize="small" />
      </Box>
      <Typography variant="subtitle1">{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 380 }}>
          {description}
        </Typography>
      )}
    </Stack>
  );
}

export default function Planner() {
  const { enqueueSnackbar } = useSnackbar();
  const { isSupervisor, actingAs } = useActingAs();
  const { can } = useAuth();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'), { noSsr: true });
  // Below lg the whole month no longer fits beside the sidebar.
  const monthFits = useMediaQuery(theme.breakpoints.up('lg'), { noSsr: true });
  const canManage = can('SHIFT_SCHEDULE_MANAGE');
  const [month, setMonth] = useState(dayjs());
  const [supervisorUserId, setSupervisorUserId] = useState(
    isSupervisor ? actingAs?.userId : null
  );
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overriding, setOverriding] = useState(false);
  const [overrideConfirmOpen, setOverrideConfirmOpen] = useState(false);
  // A whole month only fits a wide screen; anything narrower opens on one week.
  const [view, setView] = useState(monthFits ? 'month' : 'week');
  const [weekIndex, setWeekIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const load = () => {
    if (!month) return;
    setLoading(true);
    shiftSchedulesApi
      .planner(month.format('YYYY-MM'), supervisorUserId || undefined)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(load, [month, supervisorUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  const dates = data?.dates || NO_DATES;
  const weeks = useMemo(() => weeksOf(dates), [dates]);
  useEffect(() => {
    setWeekIndex(initialWeek(weeks, dayjs().format('YYYY-MM-DD')));
  }, [weeks]);
  const isWeek = view === 'week';
  const visibleDates = isWeek ? weeks[weekIndex] || NO_DATES : dates;

  const { labels, styles } = useMemo(() => {
    const codes = (data?.rows || []).flatMap((r) => Object.values(r.shiftByDate || {}).filter(Boolean));
    return { labels: shortCodes(codes), styles: shiftStyles(codes) };
  }, [data]);

  const filtered = useMemo(
    () => (data?.rows || []).filter((row) => matchesSearch(row, search)),
    [data, search]
  );
  useEffect(() => setPage(0), [search, data]);
  const pageRows = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const today = dayjs().format('YYYY-MM-DD');
  const nameWidth = isPhone ? NAME_WIDTH.phone : NAME_WIDTH[view];
  const minCell = MIN_CELL[view];
  const weekend = (d) => [0, 6].includes(dayjs(d).day());
  const weekRange =
    isWeek && visibleDates.length
      ? `${dayjs(visibleDates[0]).format('D MMM')} – ${dayjs(visibleDates[visibleDates.length - 1]).format('D MMM')}`
      : '';

  const handleHolidayOverride = () => {
    setOverriding(true);
    shiftSchedulesApi
      .holidayOverride(month.format('YYYY-MM'))
      .then((res) => {
        enqueueSnackbar(`Holiday override applied to ${res.updatedDays ?? 0} day(s)`, {
          variant: 'success',
        });
        setOverrideConfirmOpen(false);
        load();
      })
      .catch(() => {})
      .finally(() => setOverriding(false));
  };

  const dayCellSx = (d) => ({
    px: isWeek ? 0.75 : 0.25,
    py: 0.75,
    bgcolor: d === today ? alpha(theme.palette.primary.main, 0.05) : weekend(d) ? '#FAFBFD' : 'background.paper',
  });

  let body;
  if (loading) {
    body = (
      <Box sx={{ p: 2 }}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="rounded" height={32} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  } else if (!data || data.rows.length === 0) {
    body = (
      <GridMessage
        title="No roster for this month"
        description="No shifts have been scheduled for this month or filter yet."
      />
    );
  } else if (filtered.length === 0) {
    body = <GridMessage title={`No one matches “${search.trim()}”`} description="Try a name or a user ID." />;
  } else {
    body = (
      <TableContainer sx={{ maxHeight: { xs: 560, md: 'calc(100vh - 360px)' }, minHeight: 280 }}>
        <Table
          stickyHeader
          size="small"
          aria-label={`Roster for ${month.format('MMMM YYYY')}`}
          sx={{
            tableLayout: 'fixed',
            width: '100%',
            minWidth: nameWidth + visibleDates.length * minCell,
            '& th, & td': { borderBottomColor: 'divider' },
            '& tbody tr:hover td': { bgcolor: 'action.hover' },
          }}
        >
          <colgroup>
            <col style={{ width: nameWidth }} />
            {visibleDates.map((d) => (
              <col key={d} />
            ))}
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell sx={{ left: 0, zIndex: 3, bgcolor: 'surfaceAlt', borderRight: 1, borderRightColor: 'divider' }}>
                Employee
              </TableCell>
              {visibleDates.map((d) => {
                const isToday = d === today;
                return (
                  <TableCell
                    key={d}
                    align="center"
                    sx={{ px: 0, py: 0.75, bgcolor: weekend(d) ? '#F1F4F9' : 'surfaceAlt' }}
                  >
                    <Typography
                      component="div"
                      sx={{ fontSize: '0.68rem', fontWeight: 600, color: weekend(d) ? 'text.secondary' : 'text.tertiary', lineHeight: 1.2 }}
                    >
                      {isWeek ? dayjs(d).format('ddd') : dayjs(d).format('dd').charAt(0)}
                    </Typography>
                    <Box
                      sx={{
                        mx: 'auto',
                        mt: 0.25,
                        width: 24,
                        height: 22,
                        borderRadius: '6px',
                        display: 'grid',
                        placeItems: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: isToday ? 'common.white' : 'text.primary',
                        bgcolor: isToday ? 'primary.main' : 'transparent',
                      }}
                    >
                      {dayjs(d).format('D')}
                    </Box>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.map((row) => (
              <TableRow key={row.userId}>
                <TableCell
                  sx={{
                    position: 'sticky',
                    left: 0,
                    zIndex: 1,
                    bgcolor: 'background.paper',
                    borderRight: 1,
                    borderRightColor: 'divider',
                    py: 0.75,
                  }}
                >
                  <Typography noWrap sx={{ fontSize: '0.84rem', fontWeight: 600 }}>
                    {row.employeeName}
                  </Typography>
                  <Typography noWrap variant="caption" color="text.secondary" component="div">
                    {row.userId}
                  </Typography>
                </TableCell>
                {visibleDates.map((d) => {
                  const code = row.shiftByDate?.[d];
                  const defaulted = !!row.defaultedByDate?.[d];
                  return (
                    <TableCell key={d} sx={dayCellSx(d)}>
                      <ShiftCell
                        code={code}
                        defaulted={defaulted}
                        label={labels[code]}
                        style={styles[code]}
                        week={isWeek}
                        title={
                          code &&
                          `${row.employeeName} · ${dayjs(d).format('ddd D MMM')} · ${
                            code === WEEK_OFF ? 'Weekly off' : code
                          }${defaulted ? ' (usual shift, not assigned)' : ''}`
                        }
                      />
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
    <>
      <PageHeader
        title="Roster Planner"
        subtitle="Who works which shift on each day. Filled cells are assigned shifts; outlined ones are the employee’s usual shift."
        actions={
          <>
            <DatePicker
              label="Month"
              views={['year', 'month']}
              value={month}
              onChange={setMonth}
              slotProps={{ textField: { size: 'small', sx: { width: 190 } } }}
            />
            <EmployeePicker
              label="Supervisor filter"
              value={supervisorUserId}
              onChange={setSupervisorUserId}
              filterRole="SUPERVISOR"
            />
            {canManage && (
              <Button variant="outlined" onClick={() => setOverrideConfirmOpen(true)}>
                Apply holiday override
              </Button>
            )}
          </>
        }
      />

      <Paper variant="outlined" sx={{ borderRadius: '14px', overflow: 'hidden' }}>
        <Stack
          direction="row"
          spacing={1.5}
          useFlexGap
          sx={{
            flexWrap: 'wrap',
            alignItems: 'center',
            px: 2,
            py: 1.5,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <TextField
            size="small"
            placeholder="Search employee or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ width: { xs: '100%', sm: 240 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
              htmlInput: { 'aria-label': 'Search employee or ID' },
            }}
          />
          <ToggleButtonGroup
            exclusive
            size="small"
            value={view}
            onChange={(_, next) => next && setView(next)}
            aria-label="Planner view"
          >
            <ToggleButton value="month" sx={{ px: 1.75 }}>
              Month
            </ToggleButton>
            <ToggleButton value="week" sx={{ px: 1.75 }}>
              Week
            </ToggleButton>
          </ToggleButtonGroup>
          {isWeek && weeks.length > 0 && (
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <IconButton
                size="small"
                aria-label="Previous week"
                disabled={weekIndex === 0}
                onClick={() => setWeekIndex((i) => i - 1)}
              >
                <ChevronLeftRoundedIcon />
              </IconButton>
              <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 104, textAlign: 'center' }}>
                {weekRange}
              </Typography>
              <IconButton
                size="small"
                aria-label="Next week"
                disabled={weekIndex >= weeks.length - 1}
                onClick={() => setWeekIndex((i) => i + 1)}
              >
                <ChevronRightRoundedIcon />
              </IconButton>
            </Stack>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Legend labels={labels} styles={styles} />
        </Stack>

        {body}

        {!loading && filtered.length > 0 && (
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, next) => setPage(next)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[25, 50, 100]}
            sx={{ borderTop: 1, borderColor: 'divider' }}
          />
        )}
      </Paper>

      <ConfirmDialog
        open={overrideConfirmOpen}
        title="Apply holiday override?"
        description={`Marks every mandatory holiday in ${month.format('MMMM YYYY')} as a week off across the whole roster shown here, replacing any shift already assigned on those dates. This can be re-run safely, but it does overwrite existing assignments on the affected days.`}
        confirmLabel="Apply override"
        loading={overriding}
        onConfirm={handleHolidayOverride}
        onClose={() => setOverrideConfirmOpen(false)}
      />
    </>
  );
}
