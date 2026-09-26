import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import { useSnackbar } from 'notistack';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import EmployeePicker from '../../components/EmployeePicker';
import ConfirmDialog from '../../components/ConfirmDialog';
import shiftSchedulesApi from '../../api/shiftSchedules';
import { useActingAs } from '../../context/ActingAsContext';
import { useAuth } from '../../context/AuthContext';

export default function Planner() {
  const { enqueueSnackbar } = useSnackbar();
  const { isSupervisor, actingAs } = useActingAs();
  const { can } = useAuth();
  const canManage = can('SHIFT_SCHEDULE_MANAGE');
  const [month, setMonth] = useState(dayjs());
  const [supervisorUserId, setSupervisorUserId] = useState(
    isSupervisor ? actingAs?.userId : null
  );
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overriding, setOverriding] = useState(false);
  const [overrideConfirmOpen, setOverrideConfirmOpen] = useState(false);

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

  const columns = useMemo(() => {
    if (!data) return [];
    const dateCols = data.dates.map((d) => ({
      field: d,
      headerName: dayjs(d).format('DD'),
      width: 64,
      sortable: false,
      renderCell: (params) => {
        const value = params.value;
        if (!value) return null;
        // A defaulted day is the employee's usual shift, derived from their
        // fixed shift and weekly off rather than assigned by anyone. Shown
        // faded so this screen still answers "what have I actually planned?"
        // at a glance - which is what HR opens it to find out.
        const defaulted = params.row.defaultedByDate?.[params.field];
        const sx = defaulted ? { opacity: 0.45 } : undefined;
        if (value === 'WO') return <Chip label="WO" size="small" sx={sx} />;
        return (
          <Chip
            label={value}
            size="small"
            color="primary"
            variant="outlined"
            sx={sx}
          />
        );
      },
    }));
    return [
      { field: 'employeeName', headerName: 'Employee', width: 170 },
      { field: 'userId', headerName: 'User ID', width: 100 },
      ...dateCols,
    ];
  }, [data]);

  const rows = useMemo(() => {
    if (!data) return [];
    return data.rows.map((r) => ({
      id: r.userId,
      userId: r.userId,
      employeeName: r.employeeName,
      // Kept as a whole map rather than spread, so it cannot collide with the
      // date-keyed shift columns above.
      defaultedByDate: r.defaultedByDate ?? {},
      ...r.shiftByDate,
    }));
  }, [data]);

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

  return (
    <>
      <PageHeader
        title="Roster Planner"
        subtitle="One row per employee, one column per date — shift code or WO for weekly off. Faded cells are the employee’s usual shift, not an assignment."
        actions={
          <>
            <DatePicker
              label="Month"
              views={['year', 'month']}
              value={month}
              onChange={setMonth}
              slotProps={{ textField: { size: 'small' } }}
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
      <DataTable
        rows={rows}
        columns={columns}
        loading={loading}
        height={620}
        pageSize={25}
        density="compact"
        emptyState={{
          title: 'No roster for this month',
          description: 'No shifts have been scheduled for this month or filter yet.',
        }}
      />

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
