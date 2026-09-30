import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import PersonOffRoundedIcon from '@mui/icons-material/PersonOffRounded';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import FilterBar from '../../components/FilterBar';
import StatusChip from '../../components/StatusChip';
import ConfirmDialog from '../../components/ConfirmDialog';
import employeesApi from '../../api/employees';
import { RECORD_STATUS_COLOR, ROLE_COLOR } from '../../constants/enums';
import { useActingAs } from '../../context/ActingAsContext';
import { useAuth } from '../../context/AuthContext';
import { personColumns, personRowProps } from './employeeColumns';

export default function EmployeeList() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { reloadEmployees } = useActingAs();
  const { can } = useAuth();
  const canCreate = can('EMPLOYEE_CREATE');
  const canUpdate = can('EMPLOYEE_UPDATE');
  const canDelete = can('EMPLOYEE_DELETE');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    employeesApi
      .list()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const departments = useMemo(
    () => Array.from(new Set(rows.map((r) => r.departmentName).filter(Boolean))),
    [rows]
  );

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const matchesSearch =
          !search ||
          r.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
          r.userId?.toLowerCase().includes(search.toLowerCase());
        const matchesDept = deptFilter === 'ALL' || r.departmentName === deptFilter;
        const matchesStatus = statusFilter === 'ALL' || r.recordStatus === statusFilter;
        return matchesSearch && matchesDept && matchesStatus;
      }),
    [rows, search, deptFilter, statusFilter]
  );

  const handleDeactivate = () => {
    if (!deactivateTarget) return;
    setBusy(true);
    employeesApi
      .deactivate(deactivateTarget.id)
      .then(() => {
        enqueueSnackbar('Employee deactivated', { variant: 'success' });
        setDeactivateTarget(null);
        reloadEmployees();
        load();
      })
      .catch(() => {})
      .finally(() => setBusy(false));
  };

  // A click anywhere on the row opens the employee.
  const columns = [
    ...personColumns,
    { field: 'supervisorName', headerName: 'Supervisor', flex: 1, minWidth: 120 },
    {
      field: 'role',
      headerName: 'Role',
      width: 110,
      renderCell: (params) => <StatusChip value={params.value} colorMap={ROLE_COLOR} />,
    },
    {
      field: 'recordStatus',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => <StatusChip value={params.value} colorMap={RECORD_STATUS_COLOR} />,
    },
    ...(canUpdate || canDelete
      ? [
        {
          field: 'actions',
          headerName: '',
          sortable: false,
          filterable: false,
          width: 90,
          // The buttons act on their own; the click must not also open the row.
          renderCell: ({ row }) => (
            <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
              {canUpdate && (
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    aria-label={`Edit ${row.employeeName}`}
                    onClick={() => navigate(`/employees/${row.id}/edit`)}
                  >
                    <EditRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {canDelete && (
                <Tooltip title="Deactivate">
                  <IconButton
                    size="small"
                    aria-label={`Deactivate ${row.employeeName}`}
                    onClick={() => setDeactivateTarget(row)}
                  >
                    <PersonOffRoundedIcon fontSize="small" color="error" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          ),
        },
      ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle="Employee master — identity, org placement and salary structure"
        actions={
          canCreate && (
            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                startIcon={<UploadFileRoundedIcon />}
                onClick={() => navigate('/employees/bulk-import')}
              >
                Bulk Import
              </Button>
              <Button
                variant="outlined"
                startIcon={<UploadFileRoundedIcon />}
                onClick={() => navigate('/employees/bulk-salary-revision')}
              >
                Bulk Salary Revision
              </Button>
              <Button
                variant="outlined"
                startIcon={<UploadFileRoundedIcon />}
                onClick={() => navigate('/employees/bulk-salary-structure')}
              >
                Bulk Salary Structure
              </Button>
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={() => navigate('/employees/new')}
                data-testid="employee-create-button"
              >
                Add Employee
              </Button>
            </Stack>
          )
        }
      />
      <FilterBar>
        <TextField
          size="small"
          label="Search"
          placeholder="Name or user id"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 240 }}
          slotProps={{ htmlInput: { 'data-testid': 'employee-search-input' } }}
        />
        <TextField
          select
          size="small"
          label="Department"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="ALL">All departments</MenuItem>
          {departments.map((d) => (
            <MenuItem key={d} value={d}>
              {d}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="ALL">All</MenuItem>
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="INACTIVE">Inactive</MenuItem>
        </TextField>
      </FilterBar>
      <DataTable
        rows={filtered}
        columns={columns}
        loading={loading}
        height={600}
        {...personRowProps}
        onRowClick={({ row }) => navigate(`/employees/${row.id}`)}
        data-testid="employee-table"
        emptyState={
          rows.length > 0
            ? {
                title: 'No employees found',
                description: 'There are no employees matching your current search or filters.',
                action: (
                  <Button
                    size="small"
                    onClick={() => {
                      setSearch('');
                      setDeptFilter('ALL');
                      setStatusFilter('ALL');
                    }}
                  >
                    Clear filters
                  </Button>
                ),
              }
            : {
                title: 'No employees yet',
                description: canCreate
                  ? 'Add your first employee to get started.'
                  : 'No employees have been added to this company yet.',
                action: canCreate && (
                  <Button size="small" variant="contained" onClick={() => navigate('/employees/new')}>
                    Add Employee
                  </Button>
                ),
              }
        }
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        title="Deactivate employee?"
        description={`"${deactivateTarget?.employeeName}" will be marked inactive. Payroll history is preserved — this does not delete the record.`}
        confirmLabel="Deactivate"
        confirmColor="error"
        loading={busy}
        onConfirm={handleDeactivate}
        onClose={() => setDeactivateTarget(null)}
      />
    </>
  );
}
