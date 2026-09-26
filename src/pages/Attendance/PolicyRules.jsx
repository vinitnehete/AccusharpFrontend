import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { useSnackbar } from 'notistack';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import ConfirmDialog from '../../components/ConfirmDialog';
import PolicyRuleDialog from './PolicyRuleDialog';
import attendancePolicyApi from '../../api/attendancePolicy';
import { useAuth } from '../../context/AuthContext';
import {
  RULE_CATALOG,
  RULE_TYPES,
  SCOPE_LABEL,
  describeRule,
  parseParams,
  ruleLabel,
} from '../../constants/attendancePolicy';

// A "chain" is every version of one rule for one population. The API returns
// every version; the newest of each chain is the one in force, and the rest are
// history that still explains days already priced under them.
const chainKey = (rule) => `${rule.scope}|${rule.scopeRef}|${rule.ruleType}`;

const decorate = (rules) => {
  const heads = new Map();
  rules.forEach((rule) => {
    const key = chainKey(rule);
    const current = heads.get(key);
    if (!current || rule.version > current.version) heads.set(key, rule);
  });

  const today = dayjs().startOf('day');
  return rules.map((rule) => {
    const isHead = heads.get(chainKey(rule))?.id === rule.id;
    const starts = dayjs(rule.effectiveFrom);
    const future = starts.isAfter(today);
    return {
      ...rule,
      parsedParams: parseParams(rule.params),
      isHead,
      future,
      state: !isHead ? 'SUPERSEDED' : !rule.enabled ? 'STOPPED' : future ? 'SCHEDULED' : 'ACTIVE',
    };
  });
};

const STATE_CHIP = {
  ACTIVE: { label: 'In force', color: 'success' },
  SCHEDULED: { label: 'Starts later', color: 'info' },
  STOPPED: { label: 'Stopped', color: 'default' },
  SUPERSEDED: { label: 'Replaced', color: 'default' },
};

export default function PolicyRules() {
  const { enqueueSnackbar } = useSnackbar();
  const { can } = useAuth();
  const canManage = can('ATTENDANCE_POLICY_MANAGE');

  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ruleTypeFilter, setRuleTypeFilter] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [basedOn, setBasedOn] = useState(null);
  const [saving, setSaving] = useState(false);
  const [stopTarget, setStopTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  // Deliberately unfiltered: the rule-type filter is applied to the table
  // below, not to the fetch. The dialog's month test needs *every* rule
  // currently in force to answer honestly, and a server-side filter would
  // quietly leave the others out of the comparison.
  const load = useCallback(() => {
    setLoading(true);
    attendancePolicyApi
      .list()
      .then((res) => setRules(decorate(res)))
      .catch(() => setRules([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const visible = useMemo(
    () =>
      rules
        .filter((r) => showHistory || r.isHead)
        .filter((r) => !ruleTypeFilter || r.ruleType === ruleTypeFilter),
    [rules, showHistory, ruleTypeFilter]
  );

  // What the preview inside the dialog treats as "everything currently in
  // force" - superseded versions and stopped rules would both misreport it.
  const rulesInForce = useMemo(
    () => rules.filter((r) => r.isHead && r.enabled),
    [rules]
  );

  const handleSubmit = (payload) => {
    setSaving(true);
    attendancePolicyApi
      .create(payload)
      .then(() => {
        enqueueSnackbar('Rule saved', { variant: 'success' });
        setDialogOpen(false);
        setBasedOn(null);
        load();
      })
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  // Stopping a rule is appending a version that says "this rule type does not
  // apply to these people" - never a delete, because the version being stopped
  // may already have priced days on a payslip.
  const handleStop = () => {
    if (!stopTarget) return;
    setBusy(true);
    attendancePolicyApi
      .create({
        scope: stopTarget.scope,
        scopeRef: stopTarget.scopeRef,
        ruleType: stopTarget.ruleType,
        effectiveFrom: dayjs().format('YYYY-MM-DD'),
        enabled: false,
        params: stopTarget.parsedParams,
        notes: 'Stopped from the Attendance Policy screen',
      })
      .then(() => {
        enqueueSnackbar('Rule stopped from today', { variant: 'success' });
        setStopTarget(null);
        load();
      })
      .catch(() => setStopTarget(null))
      .finally(() => setBusy(false));
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setBusy(true);
    attendancePolicyApi
      .remove(deleteTarget.id)
      .then(() => {
        enqueueSnackbar('Rule removed', { variant: 'success' });
        setDeleteTarget(null);
        load();
      })
      .catch(() => setDeleteTarget(null))
      .finally(() => setBusy(false));
  };

  const columns = [
    {
      field: 'ruleType',
      headerName: 'Rule',
      flex: 1.4,
      minWidth: 260,
      renderCell: (params) => (
        <Box sx={{ py: 0.75, lineHeight: 1.35 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {ruleLabel(params.value)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {describeRule(params.value, params.row.params) || 'Settings could not be read'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'scope',
      headerName: 'Applies to',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ py: 0.75, lineHeight: 1.35 }}>
          <Typography variant="body2">{SCOPE_LABEL[params.value] || params.value}</Typography>
          {params.row.scopeRef !== '*' && (
            <Typography variant="caption" color="text.secondary">
              {params.row.scopeRef}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      field: 'effectiveFrom',
      headerName: 'From',
      width: 120,
      valueFormatter: (v) => (v ? dayjs(v).format('DD MMM YYYY') : ''),
    },
    {
      field: 'state',
      headerName: 'Status',
      width: 140,
      renderCell: (params) => {
        const chip = STATE_CHIP[params.value];
        return (
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Chip size="small" label={chip.label} color={chip.color} />
            <Typography variant="caption" color="text.secondary">
              v{params.row.version}
            </Typography>
          </Stack>
        );
      },
    },
    {
      field: 'evaluationScope',
      headerName: 'Worked out',
      width: 120,
      valueFormatter: (v) => (v === 'MONTH' ? 'Once a month' : 'Day by day'),
    },
    { field: 'notes', headerName: 'Note', flex: 1, minWidth: 140 },
    ...(canManage
      ? [
          {
            field: 'actions',
            headerName: '',
            sortable: false,
            filterable: false,
            width: 130,
            renderCell: (params) => {
              const row = params.row;
              if (!row.isHead) return null;
              return (
                <Stack direction="row" spacing={0.5}>
                  <Tooltip title="Change — saves a new version, keeps the old one">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setBasedOn(row);
                        setDialogOpen(true);
                      }}
                    >
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {row.enabled && !row.future && (
                    <Tooltip title="Stop this rule from today">
                      <IconButton size="small" onClick={() => setStopTarget(row)}>
                        <BlockRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {row.future && (
                    <Tooltip title="Remove — it has not started yet, so nothing has been priced by it">
                      <IconButton size="small" onClick={() => setDeleteTarget(row)}>
                        <DeleteRoundedIcon fontSize="small" color="error" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              );
            },
          },
        ]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Attendance Policy"
        subtitle="Different rules for different groups — lateness, short hours, overtime and comp-off"
        actions={
          <>
            <TextField
              select
              size="small"
              label="Rule"
              value={ruleTypeFilter}
              onChange={(e) => setRuleTypeFilter(e.target.value)}
              sx={{ minWidth: 220 }}
            >
              <MenuItem value="">All rules</MenuItem>
              {RULE_TYPES.map((t) => (
                <MenuItem key={t} value={t}>
                  {RULE_CATALOG[t].label}
                </MenuItem>
              ))}
            </TextField>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={showHistory}
                  onChange={(e) => setShowHistory(e.target.checked)}
                />
              }
              label={<Typography variant="body2">Show past versions</Typography>}
            />
            {canManage && (
              <Button
                variant="contained"
                startIcon={<AddRoundedIcon />}
                onClick={() => {
                  setBasedOn(null);
                  setDialogOpen(true);
                }}
              >
                Add rule
              </Button>
            )}
          </>
        }
      />

      <Alert severity="info" sx={{ mb: 2.5 }}>
        <AlertTitle>Nothing here is switched on until you add a rule</AlertTitle>
        With no rules, attendance works exactly as it always has — the company-wide settings under{' '}
        <strong>Masters → Attendance Rule</strong> apply to everybody. Add a rule only where a group
        needs to be treated differently, and always run the test on a past month before saving.
        Rules are never edited: changing one saves a new version, so any day can be traced to the
        exact rule that priced it.
      </Alert>

      <DataTable
        rows={visible}
        columns={columns}
        loading={loading}
        height={560}
        getRowHeight={() => 'auto'}
        sx={{ '& .MuiDataGrid-cell': { alignItems: 'center', py: 0.5 } }}
        emptyState={{
          title: 'No rules yet',
          description:
            'Everyone is treated the same, using the company-wide attendance settings. Add a rule when one group needs different treatment.',
          action: canManage && (
            <Button
              size="small"
              variant="contained"
              onClick={() => {
                setBasedOn(null);
                setDialogOpen(true);
              }}
            >
              Add rule
            </Button>
          ),
        }}
      />

      <PolicyRuleDialog
        open={dialogOpen}
        basedOn={basedOn}
        existingRules={rulesInForce}
        saving={saving}
        onClose={() => {
          setDialogOpen(false);
          setBasedOn(null);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!stopTarget}
        title="Stop this rule?"
        description={`From today, "${ruleLabel(stopTarget?.ruleType)}" no longer applies to ${
          SCOPE_LABEL[stopTarget?.scope] || ''
        }${stopTarget?.scopeRef && stopTarget.scopeRef !== '*' ? ` ${stopTarget.scopeRef}` : ''}. Days already worked out under it keep their result, and a wider rule will not take over for these employees. This is saved as a new version — the old one stays in the history.`}
        confirmLabel="Stop the rule"
        confirmColor="warning"
        loading={busy}
        onConfirm={handleStop}
        onClose={() => setStopTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove this rule?"
        description="It has not started yet, so no day has been priced by it and nothing is lost. Rules that have already taken effect cannot be removed — stop them instead."
        confirmLabel="Remove"
        confirmColor="error"
        loading={busy}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
