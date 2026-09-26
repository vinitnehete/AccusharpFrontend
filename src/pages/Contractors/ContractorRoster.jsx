import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import ContractorPicker from '../../components/ContractorPicker';
import contractorsApi from '../../api/contractors';
import shiftSchedulesApi from '../../api/shiftSchedules';
import shiftsApi from '../../api/shifts';
import { DAYS_OF_WEEK, labelize } from '../../constants/enums';
import { useActingAs } from '../../context/ActingAsContext';
import { useAuth } from '../../context/AuthContext';

/**
 * Rosters a contractor's workforce onto the company's own shifts.
 *
 * This is the one place the two populations genuinely share something: the
 * shift catalog. A contractor's fitter on the night shift is on the *same*
 * night shift — same punch window, same grace period, same break — as
 * everyone else on that line, which is exactly why the attendance figures are
 * comparable and why this reuses `/api/shift-schedules` rather than inventing
 * a contractor roster of its own.
 *
 * Contractor workers get no automatic roster (see DefaultRosterService): they
 * are on site only for the days their contractor sends them, so every day has
 * to be assigned deliberately. That is what the assign panel above the grid is
 * for.
 */
export default function ContractorRoster() {
  const { enqueueSnackbar } = useSnackbar();
  const { actingAs } = useActingAs();
  const { can } = useAuth();
  const canManage = can('SHIFT_SCHEDULE_MANAGE');

  const [contractorId, setContractorId] = useState(null);
  const [month, setMonth] = useState(dayjs());
  const [planner, setPlanner] = useState(null);
  const [loading, setLoading] = useState(false);

  const [workers, setWorkers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [shiftCode, setShiftCode] = useState('');
  const [fromDate, setFromDate] = useState(dayjs().startOf('month'));
  const [toDate, setToDate] = useState(dayjs().endOf('month'));
  const [weekOffDays, setWeekOffDays] = useState(['SUNDAY']);
  const [skipHolidays, setSkipHolidays] = useState(true);
  const [overwriteExisting, setOverwriteExisting] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    shiftsApi.list().then(setShifts).catch(() => setShifts([]));
  }, []);

  const loadPlanner = useCallback(() => {
    if (!contractorId || !month?.isValid()) {
      setPlanner(null);
      return;
    }
    setLoading(true);
    shiftSchedulesApi
      .planner(month.format('YYYY-MM'), undefined, contractorId)
      .then(setPlanner)
      .catch(() => setPlanner(null))
      .finally(() => setLoading(false));
  }, [contractorId, month]);

  useEffect(loadPlanner, [loadPlanner]);

  useEffect(() => {
    if (!contractorId) {
      setWorkers([]);
      setSelectedUserIds([]);
      return;
    }
    contractorsApi
      .workforce(contractorId, true)
      .then((rows) => {
        setWorkers(rows);
        setSelectedUserIds([]);
      })
      .catch(() => setWorkers([]));
  }, [contractorId]);

  const columns = useMemo(() => {
    if (!planner) return [];
    const dateCols = planner.dates.map((d) => ({
      field: d,
      headerName: dayjs(d).format('DD'),
      width: 64,
      sortable: false,
      renderCell: ({ value }) => {
        if (!value) return null;
        if (value === 'WO') return <Chip label="WO" size="small" />;
        return <Chip label={value} size="small" color="primary" variant="outlined" />;
      },
    }));
    return [
      { field: 'employeeName', headerName: 'Worker', width: 180 },
      { field: 'userId', headerName: 'Device ID', width: 110 },
      ...dateCols,
    ];
  }, [planner]);

  const rows = useMemo(
    () =>
      (planner?.rows ?? []).map((r) => ({
        id: r.userId,
        userId: r.userId,
        employeeName: r.employeeName,
        ...r.shiftByDate,
      })),
    [planner]
  );

  const selectAll = () => setSelectedUserIds(workers.map((w) => w.userId));

  const canAssign =
    canManage && contractorId && selectedUserIds.length > 0 && shiftCode && fromDate && toDate;

  const handleAssign = () => {
    setSaving(true);
    shiftSchedulesApi
      .bulkAssign({
        userIds: selectedUserIds,
        fromDate: fromDate.format('YYYY-MM-DD'),
        toDate: toDate.format('YYYY-MM-DD'),
        shiftCode,
        weekOffDays,
        skipHolidays,
        overwriteExisting,
        assignedBy: actingAs?.userId,
      })
      .then((res) => {
        enqueueSnackbar(`Assigned ${res.length} shift-day(s)`, { variant: 'success' });
        loadPlanner();
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  return (
    <>
      <PageHeader
        title="Contractor Roster"
        subtitle="Assign your shifts to a contractor's workers. Same shift catalog as your own staff — which is what makes the hours comparable — but a separate roster, so the two are never planned in one grid."
        actions={
          <Stack direction="row" spacing={1.5}>
            <ContractorPicker value={contractorId} onChange={setContractorId} autoSelectFirst />
            <DatePicker
              label="Month"
              views={['year', 'month']}
              value={month}
              onChange={setMonth}
              slotProps={{ textField: { size: 'small' } }}
            />
          </Stack>
        }
      />

      {!contractorId ? (
        <Alert severity="info">Pick a contractor to plan their roster.</Alert>
      ) : (
        <>
          {canManage && (
            <Card sx={{ mb: 2.5 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                  Assign a shift
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                      <Autocomplete
                        multiple
                        size="small"
                        sx={{ flex: 1 }}
                        options={workers}
                        value={workers.filter((w) => selectedUserIds.includes(w.userId))}
                        getOptionLabel={(opt) => `${opt.employeeName} (${opt.userId})`}
                        isOptionEqualToValue={(opt, val) => opt.userId === val?.userId}
                        onChange={(_, value) => setSelectedUserIds(value.map((v) => v.userId))}
                        renderInput={(params) => <TextField {...params} label="Workers" />}
                      />
                      <Button
                        size="small"
                        onClick={selectAll}
                        disabled={workers.length === 0}
                        sx={{ mt: 0.5 }}
                      >
                        Select all ({workers.length})
                      </Button>
                    </Stack>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <DatePicker
                      label="From date"
                      value={fromDate}
                      onChange={setFromDate}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <DatePicker
                      label="To date"
                      value={toDate}
                      onChange={setToDate}
                      slotProps={{ textField: { size: 'small', fullWidth: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Shift"
                      value={shiftCode}
                      onChange={(e) => setShiftCode(e.target.value)}
                    >
                      {shifts.map((s) => (
                        <MenuItem key={s.id} value={s.shiftCode}>
                          {s.shiftName} ({s.shiftCode})
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                      multiple
                      size="small"
                      options={DAYS_OF_WEEK}
                      value={weekOffDays}
                      getOptionLabel={labelize}
                      onChange={(_, v) => setWeekOffDays(v)}
                      renderInput={(params) => <TextField {...params} label="Week off days" />}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={skipHolidays}
                            onChange={(e) => setSkipHolidays(e.target.checked)}
                          />
                        }
                        label="Skip holidays"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={overwriteExisting}
                            onChange={(e) => setOverwriteExisting(e.target.checked)}
                          />
                        }
                        label="Overwrite existing days"
                      />
                    </Stack>
                  </Grid>
                  <Grid size={12}>
                    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                      <Button variant="contained" onClick={handleAssign} disabled={!canAssign || saving}>
                        Assign
                      </Button>
                      <Typography variant="body2" color="text.secondary">
                        Contractor workers are never rostered automatically — they are on site only
                        for the days their contractor sends them, so an unrostered day means "not
                        deployed", not "absent".
                      </Typography>
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          <DataTable
            rows={rows}
            columns={columns}
            loading={loading}
            height={560}
            pageSize={25}
            density="compact"
            emptyState={{
              title: 'No roster for this month',
              description:
                workers.length === 0
                  ? 'This contractor has no workers on site yet — add them under the Workforce tab first.'
                  : 'Nothing has been scheduled for these workers this month. Use the panel above to assign a shift.',
            }}
          />
        </>
      )}
    </>
  );
}
