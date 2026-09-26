import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import DomainDisabledRoundedIcon from '@mui/icons-material/DomainDisabledRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusChip from '../../components/StatusChip';
import ConfirmDialog from '../../components/ConfirmDialog';
import ContractorFormDialog from './ContractorFormDialog';
import contractorsApi from '../../api/contractors';
import { RECORD_STATUS_COLOR } from '../../constants/enums';
import { useAuth } from '../../context/AuthContext';

export default function ContractorList() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { can } = useAuth();
  const canManage = can('CONTRACTOR_MANAGE');

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    contractorsApi
      .list()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        const term = search.toLowerCase();
        const matchesSearch =
          !search ||
          r.contractorName?.toLowerCase().includes(term) ||
          r.contractorCode?.toLowerCase().includes(term) ||
          r.contactPerson?.toLowerCase().includes(term);
        return matchesSearch && (statusFilter === 'ALL' || r.recordStatus === statusFilter);
      }),
    [rows, search, statusFilter]
  );

  const handleSubmit = (values) => {
    setSaving(true);
    const action = editing
      ? contractorsApi.update(editing.id, values)
      : contractorsApi.create(values);
    action
      .then(() => {
        enqueueSnackbar(`Contractor ${editing ? 'updated' : 'onboarded'}`, { variant: 'success' });
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
      .deactivate(deactivateTarget.id)
      .then(() => {
        enqueueSnackbar('Contractor deactivated', { variant: 'success' });
        setDeactivateTarget(null);
        load();
      })
      .catch(() => {})
      .finally(() => setBusy(false));
  };

  const handleReactivate = (row) => {
    contractorsApi
      .reactivate(row.id)
      .then(() => {
        enqueueSnackbar('Contractor reactivated', { variant: 'success' });
        load();
      })
      .catch(() => {});
  };

  const columns = [
    { field: 'contractorCode', headerName: 'Code', width: 120 },
    { field: 'contractorName', headerName: 'Contractor', flex: 1, minWidth: 200 },
    { field: 'contactPerson', headerName: 'Contact Person', width: 170 },
    { field: 'email', headerName: 'Email', width: 210 },
    { field: 'phone', headerName: 'Phone', width: 130 },
    {
      field: 'activeEmployeeCount',
      headerName: 'Workers',
      width: 100,
      type: 'number',
      description: 'Active workers currently deployed under this contractor',
    },
    {
      field: 'agreementEndDate',
      headerName: 'Agreement Ends',
      width: 140,
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
      width: 130,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View workforce">
            <IconButton
              size="small"
              onClick={() => navigate(`/contractors/workforce?contractorId=${row.id}`)}
            >
              <VisibilityRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {canManage && (
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
          )}
          {canManage &&
            (row.recordStatus === 'ACTIVE' ? (
              <Tooltip title="Deactivate">
                <IconButton size="small" onClick={() => setDeactivateTarget(row)}>
                  <DomainDisabledRoundedIcon fontSize="small" color="error" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title="Reactivate">
                <IconButton size="small" onClick={() => handleReactivate(row)}>
                  <RestartAltRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ))}
        </Stack>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Contractors"
        subtitle="The labour contractors engaged by this company. Their workers are onboarded under the Workforce tab — they never appear in the employee master or in payroll."
        actions={
          canManage && (
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              data-testid="contractor-create-button"
            >
              Onboard Contractor
            </Button>
          )
        }
      />

      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          label="Search"
          placeholder="Name, code or contact"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 240 }}
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
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="INACTIVE">Inactive</MenuItem>
        </TextField>
      </Stack>

      <DataTable
        rows={filtered}
        columns={columns}
        loading={loading}
        height={560}
        data-testid="contractor-table"
        emptyState={
          rows.length > 0
            ? {
                title: 'No contractors found',
                description: 'No contractor matches your current search or filter.',
                action: (
                  <Button
                    size="small"
                    onClick={() => {
                      setSearch('');
                      setStatusFilter('ALL');
                    }}
                  >
                    Clear filters
                  </Button>
                ),
              }
            : {
                title: 'No contractors yet',
                description: canManage
                  ? 'Onboard a contractor first, then add the workers they deploy on your site.'
                  : 'No contractor has been onboarded for this company yet.',
                action: canManage && (
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => {
                      setEditing(null);
                      setFormOpen(true);
                    }}
                  >
                    Onboard Contractor
                  </Button>
                ),
              }
        }
      />

      <ContractorFormDialog
        open={formOpen}
        contractor={editing}
        saving={saving}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        title="Deactivate contractor?"
        description={`"${deactivateTarget?.contractorName}" will be marked inactive. Attendance already generated for their workers is preserved — this does not delete anything. Workers must be taken off site first.`}
        confirmLabel="Deactivate"
        confirmColor="error"
        loading={busy}
        onConfirm={handleDeactivate}
        onClose={() => setDeactivateTarget(null)}
      />
    </>
  );
}
