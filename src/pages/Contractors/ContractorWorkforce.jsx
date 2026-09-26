import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import PersonOffRoundedIcon from '@mui/icons-material/PersonOffRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SwapHorizRoundedIcon from '@mui/icons-material/SwapHorizRounded';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusChip from '../../components/StatusChip';
import ConfirmDialog from '../../components/ConfirmDialog';
import ContractorPicker from '../../components/ContractorPicker';
import ContractorWorkerFormDialog from './ContractorWorkerFormDialog';
import ReassignContractorDialog from './ReassignContractorDialog';
import contractorsApi from '../../api/contractors';
import { RECORD_STATUS_COLOR } from '../../constants/enums';
import { useAuth } from '../../context/AuthContext';
import { downloadCsv } from '../../utils/csv';

/**
 * Every contractor's workers in one table, grouped by the contractor column.
 *
 * The "All contractors" default is the point: a company with three agencies on
 * site wants to see the whole deployed headcount at once and narrow from
 * there, not pick an agency before it can see anything.
 */
export default function ContractorWorkforce() {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = useAuth();
  const canManage = can('CONTRACTOR_MANAGE');
  const [searchParams, setSearchParams] = useSearchParams();

  // Deep-linked from the contractor list's "View workforce" action.
  const contractorParam = searchParams.get('contractorId');
  const [contractorId, setContractorId] = useState(contractorParam ? Number(contractorParam) : null);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [reassignTarget, setReassignTarget] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    contractorsApi
      .workforce(contractorId, false)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [contractorId]);

  useEffect(load, [load]);

  const handleContractorChange = (value) => {
    setContractorId(value);
    // Keeps the URL shareable and the back button meaningful.
    if (value) setSearchParams({ contractorId: String(value) });
    else setSearchParams({});
  };

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const term = search.toLowerCase();
        const matchesSearch =
          !search ||
          r.employeeName?.toLowerCase().includes(term) ||
          r.userId?.toLowerCase().includes(term) ||
          r.employeeCode?.toLowerCase().includes(term) ||
          r.contractorName?.toLowerCase().includes(term);
        return matchesSearch && (statusFilter === 'ALL' || r.recordStatus === statusFilter);
      }),
    [rows, search, statusFilter]
  );

  const handleSubmit = (targetContractorId, payload) => {
    setSaving(true);
    const action = editing
      ? contractorsApi.updateEmployee(editing.id, payload)
      : contractorsApi.addEmployee(targetContractorId, payload);
    action
      .then(() => {
        enqueueSnackbar(`Worker ${editing ? 'updated' : 'added'}`, { variant: 'success' });
        setFormOpen(false);
        load();
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  const handleDeactivate = () => {
    if (!deactivateTarget) return;
    setBusy(true);
    contractorsApi
      .deactivateEmployee(deactivateTarget.id)
      .then(() => {
        enqueueSnackbar('Worker taken off site', { variant: 'success' });
        setDeactivateTarget(null);
        load();
      })
      .catch(() => {})
      .finally(() => setBusy(false));
  };

  const handleReactivate = (row) => {
    contractorsApi
      .reactivateEmployee(row.id)
      .then(() => {
        enqueueSnackbar('Worker back on site', { variant: 'success' });
        load();
      })
      .catch(() => {});
  };

  const handleReassign = (targetContractorId) => {
    if (!reassignTarget) return;
    setBusy(true);
    contractorsApi
      .reassignEmployee(reassignTarget.id, targetContractorId)
      .then(() => {
        enqueueSnackbar('Worker moved to the new contractor', { variant: 'success' });
        setReassignTarget(null);
        load();
      })
      .catch(() => {})
      .finally(() => setBusy(false));
  };

  const columns = [
    { field: 'contractorName', headerName: 'Contractor', width: 180 },
    { field: 'employeeCode', headerName: 'Worker Code', width: 130 },
    { field: 'employeeName', headerName: 'Name', flex: 1, minWidth: 170 },
    { field: 'userId', headerName: 'Device ID', width: 120 },
    { field: 'designationName', headerName: 'Trade', width: 150 },
    { field: 'supervisorName', headerName: 'Supervisor', width: 160 },
    {
      field: 'joiningDate',
      headerName: 'On Site From',
      width: 130,
      valueFormatter: (value) => value || '—',
    },
    {
      field: 'recordStatus',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => <StatusChip value={params.value} colorMap={RECORD_STATUS_COLOR} />,
    },
    {
      field: 'actions',
      headerName: '',
      sortable: false,
      filterable: false,
      width: 140,
      renderCell: ({ row }) =>
        canManage && (
          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => {
                  setEditing(row);
                  setFormOpen(true);
                }}
              >
                <EditRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Move to another contractor">
              <IconButton size="small" onClick={() => setReassignTarget(row)}>
                <SwapHorizRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {row.recordStatus === 'ACTIVE' ? (
              <Tooltip title="Take off site">
                <IconButton size="small" onClick={() => setDeactivateTarget(row)}>
                  <PersonOffRoundedIcon fontSize="small" color="error" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Put back on site">
                <IconButton size="small" onClick={() => handleReactivate(row)}>
                  <RestartAltRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        ),
    },
  ];

  const activeCount = rows.filter((r) => r.recordStatus === 'ACTIVE').length;

  return (
    <>
      <PageHeader
        title="Contractor Workforce"
        subtitle="The people your contractors have deployed on site. They are rostered and their attendance is generated here — they never enter the employee master, payroll or the statutory returns."
        actions={
          <Stack direction="row" spacing={1.5}>
            <Button
              startIcon={<DownloadRoundedIcon />}
              onClick={() => downloadCsv('contractor-workforce.csv', columns.slice(0, -1), filtered)}
              disabled={filtered.length === 0}
            >
              Export CSV
            </Button>
            {canManage && (
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
                data-testid="contractor-worker-create-button"
              >
                Add Worker
              </Button>
            )}
          </Stack>
        }
      />

      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <ContractorPicker
          value={contractorId}
          onChange={handleContractorChange}
          includeAll
          activeOnly={false}
        />
        <TextField
          size="small"
          label="Search"
          placeholder="Name, code, device id or contractor"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 260 }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="ALL">All</MenuItem>
          <MenuItem value="ACTIVE">On site</MenuItem>
          <MenuItem value="INACTIVE">Off site</MenuItem>
        </TextField>
        <Chip label={`${activeCount} on site`} color="primary" variant="outlined" />
      </Stack>

      <DataTable
        rows={filtered}
        columns={columns}
        loading={loading}
        height={600}
        data-testid="contractor-workforce-table"
        emptyState={{
          title: rows.length > 0 ? 'No workers found' : 'No workers deployed yet',
          description:
            rows.length > 0
              ? 'No worker matches your current search or filter.'
              : canManage
                ? 'Add the workers your contractor has deployed. All you need is the biometric device user ID and a name.'
                : 'No contractor workers have been onboarded yet.',
        }}
      />

      <ContractorWorkerFormDialog
        open={formOpen}
        worker={editing}
        defaultContractorId={contractorId}
        saving={saving}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ReassignContractorDialog
        open={!!reassignTarget}
        worker={reassignTarget}
        loading={busy}
        onClose={() => setReassignTarget(null)}
        onConfirm={handleReassign}
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        title="Take worker off site?"
        description={`"${deactivateTarget?.employeeName}" will be marked off site and stop appearing in ${deactivateTarget?.contractorName}'s attendance runs. Attendance already generated is preserved.`}
        confirmLabel="Take off site"
        confirmColor="error"
        loading={busy}
        onConfirm={handleDeactivate}
        onClose={() => setDeactivateTarget(null)}
      />
    </>
  );
}
