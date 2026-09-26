import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import FormControlLabel from '@mui/material/FormControlLabel';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useSnackbar } from 'notistack';
import EmployeePicker from '../../components/EmployeePicker';
import attendancePolicyApi from '../../api/attendancePolicy';
import categoriesApi from '../../api/categories';
import departmentsApi from '../../api/departments';
import designationsApi from '../../api/designations';
import { labelize } from '../../constants/enums';
import {
  EMPLOYEE_STATUS_SCOPE_REFS,
  RULE_CATALOG,
  RULE_SCOPES,
  RULE_TYPES,
  dangerFor,
  defaultParamsFor,
  toParamsPayload,
  toPreviewRule,
  validateParams,
} from '../../constants/attendancePolicy';

// A month with attendance already generated is the only useful thing to test
// against, so the test defaults to last month rather than this one, which may
// be half-empty.
const lastMonth = () => dayjs().subtract(1, 'month');

function StepHeading({ number, title, hint }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.5, mt: 1 }}>
      <Box
        sx={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {number}
      </Box>
      <Box>
        <Typography variant="subtitle2">{title}</Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

/** The month test - the whole point of the preview endpoint, inlined into the save flow. */
function PreviewPanel({ draft, existingRules, disabled }) {
  const { enqueueSnackbar } = useSnackbar();
  const [month, setMonth] = useState(lastMonth);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  // The preview replaces the stored rule set rather than merging with it, so
  // the honest test is "everything currently in force, with this rule added or
  // replacing its predecessor" - not the draft on its own.
  const rulesForTest = useMemo(() => {
    const draftKey = `${draft.scope}|${draft.scopeRef}|${draft.ruleType}`;
    const others = existingRules
      .filter((r) => `${r.scope}|${r.scopeRef}|${r.ruleType}` !== draftKey)
      .map(toPreviewRule);
    return [...others, draft];
  }, [draft, existingRules]);

  const run = () => {
    setRunning(true);
    setResult(null);
    attendancePolicyApi
      .preview({ month: month.format('YYYY-MM'), rules: rulesForTest })
      .then((res) => {
        setResult(res);
        if (!res.employeesEvaluated) {
          enqueueSnackbar('No attendance was generated for that month — pick another one', {
            variant: 'info',
          });
        }
      })
      .catch(() => {})
      .finally(() => setRunning(false));
  };

  const lopDelta = Number(result?.lopDelta ?? 0);

  return (
    <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider' }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: 'center' }}>
        <DatePicker
          label="Test against month"
          views={['year', 'month']}
          value={month}
          onChange={setMonth}
          slotProps={{ textField: { size: 'small' } }}
        />
        <Button
          variant="outlined"
          startIcon={running ? <CircularProgress size={16} /> : <ScienceRoundedIcon />}
          onClick={run}
          disabled={disabled || running || !month}
        >
          Run the test
        </Button>
        <Typography variant="caption" color="text.secondary">
          Nothing is saved or changed by this — it only re-does the sums.
        </Typography>
      </Stack>

      {result && (
        <Box sx={{ mt: 2 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
            <Chip size="small" label={`${result.employeesEvaluated} employee(s) checked`} />
            <Chip
              size="small"
              color={result.employeesAffected ? 'warning' : 'default'}
              label={`${result.employeesAffected} affected`}
            />
            <Chip
              size="small"
              color={lopDelta > 0 ? 'error' : lopDelta < 0 ? 'success' : 'default'}
              label={`${lopDelta > 0 ? '+' : ''}${result.lopDelta} unpaid day(s)`}
            />
            <Chip size="small" label={`${result.overtimeHoursDelta} overtime hour(s)`} />
          </Stack>

          {(result.warnings || []).map((w) => (
            <Alert key={w} severity="warning" sx={{ mb: 1 }}>
              {w}
            </Alert>
          ))}

          {result.employeesAffected === 0 && !(result.warnings || []).length && (
            <Alert severity="success">
              This rule changes nothing for {month.format('MMMM YYYY')}.
            </Alert>
          )}

          {(result.employees || []).slice(0, 8).map((emp) => (
            <Box key={emp.userId} sx={{ mt: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {emp.employeeName} ({emp.userId}) — unpaid days {emp.lopBefore} → {emp.lopAfter}
              </Typography>
              {(emp.dayChanges || []).slice(0, 5).map((d) => (
                <Typography key={d.date} variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {dayjs(d.date).format('DD MMM')}: {labelize(d.before)} → {labelize(d.after)} — {d.reason}
                </Typography>
              ))}
              {(emp.dayChanges || []).length > 5 && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  …and {emp.dayChanges.length - 5} more day(s)
                </Typography>
              )}
              {(emp.monthOutcomes || []).map((o) => (
                <Typography key={o} variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {o}
                </Typography>
              ))}
            </Box>
          ))}
          {(result.employees || []).length > 8 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              …and {result.employees.length - 8} more employee(s) affected.
            </Typography>
          )}
        </Box>
      )}
    </Paper>
  );
}

export default function PolicyRuleDialog({ open, basedOn, existingRules, saving, onClose, onSubmit }) {
  const [ruleType, setRuleType] = useState('LATE_ARRIVAL');
  const [scope, setScope] = useState('CATEGORY');
  const [scopeRef, setScopeRef] = useState('');
  const [params, setParams] = useState(() => defaultParamsFor('LATE_ARRIVAL'));
  const [effectiveFrom, setEffectiveFrom] = useState(() => dayjs().add(1, 'month').startOf('month'));
  const [enabled, setEnabled] = useState(true);
  const [notes, setNotes] = useState('');

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      departmentsApi.list().catch(() => []),
      designationsApi.list().catch(() => []),
      categoriesApi.list().catch(() => []),
    ]).then(([dep, des, cat]) => {
      setDepartments(dep);
      setDesignations(des);
      setCategories(cat);
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (basedOn) {
      // "Change this rule" - same rule, same population, new settings. The
      // effective date is deliberately NOT copied: a new version has to start
      // somewhere new, and back-dating it into a paid month is refused anyway.
      setRuleType(basedOn.ruleType);
      setScope(basedOn.scope);
      setScopeRef(basedOn.scopeRef === '*' ? '' : basedOn.scopeRef);
      setParams({ ...defaultParamsFor(basedOn.ruleType), ...basedOn.parsedParams });
      setEnabled(basedOn.enabled);
      setNotes('');
    } else {
      setRuleType('LATE_ARRIVAL');
      setScope('CATEGORY');
      setScopeRef('');
      setParams(defaultParamsFor('LATE_ARRIVAL'));
      setEnabled(true);
      setNotes('');
    }
    setEffectiveFrom(dayjs().add(1, 'month').startOf('month'));
  }, [open, basedOn]);

  const entry = RULE_CATALOG[ruleType];
  const scopeMeta = RULE_SCOPES.find((s) => s.value === scope) || RULE_SCOPES[0];
  const needsRef = scopeMeta.refKind !== 'NONE';

  const paramError = validateParams(ruleType, params);
  const danger = dangerFor(ruleType, params);
  const canSubmit = !!effectiveFrom && !paramError && (!needsRef || !!scopeRef);

  const draft = useMemo(
    () => ({
      scope,
      scopeRef: needsRef ? scopeRef : '*',
      ruleType,
      effectiveFrom: effectiveFrom ? effectiveFrom.format('YYYY-MM-DD') : null,
      enabled,
      params: toParamsPayload(ruleType, params),
    }),
    [scope, scopeRef, needsRef, ruleType, effectiveFrom, enabled, params]
  );

  const changeRuleType = (value) => {
    setRuleType(value);
    setParams(defaultParamsFor(value));
  };

  const setParam = (name, value) => setParams((prev) => ({ ...prev, [name]: value }));

  const refOptions = {
    DEPARTMENT: departments.map((d) => ({ value: d.departmentCode, label: `${d.departmentName} (${d.departmentCode})` })),
    DESIGNATION: designations.map((d) => ({ value: d.designationCode, label: `${d.designationName} (${d.designationCode})` })),
    CATEGORY: categories.map((c) => ({ value: c.categoryCode, label: `${c.categoryName} (${c.categoryCode})` })),
    EMPLOYEE_STATUS: EMPLOYEE_STATUS_SCOPE_REFS.map((s) => ({ value: s, label: labelize(s) })),
  }[scopeMeta.refKind];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>{basedOn ? `Change: ${entry.label}` : 'Add an attendance rule'}</DialogTitle>
      <DialogContent dividers>
        {basedOn && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>This adds version {basedOn.version + 1} — it does not edit version {basedOn.version}</AlertTitle>
            Days already worked out under the old version keep their result. The new version takes
            over from the date you set below, so an employee can always be told which rule priced
            which day.
          </Alert>
        )}

        <StepHeading number={1} title="Which rule?" hint="Each one does exactly one thing." />
        <TextField
          select
          fullWidth
          size="small"
          label="Rule"
          value={ruleType}
          disabled={!!basedOn}
          onChange={(e) => changeRuleType(e.target.value)}
        >
          {RULE_TYPES.map((t) => (
            <MenuItem key={t} value={t}>
              {RULE_CATALOG[t].label}
            </MenuItem>
          ))}
        </TextField>
        <Paper variant="outlined" sx={{ p: 1.5, mt: 1.5, bgcolor: 'action.hover', borderColor: 'divider' }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {entry.summary}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            {entry.detail}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
            <strong>What it changes:</strong> {entry.effect}
          </Typography>
          {entry.note && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
              <strong>Note:</strong> {entry.note}
            </Typography>
          )}
          <Chip
            size="small"
            sx={{ mt: 1 }}
            label={
              entry.evaluationScope === 'MONTH'
                ? 'Worked out once per month'
                : 'Worked out day by day'
            }
          />
          {entry.evaluationScope === 'MONTH' && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
              A monthly rule is picked on the 1st of each month, so a start date in the middle of a
              month means it governs from the <strong>following</strong> month.
            </Typography>
          )}
        </Paper>

        <Divider sx={{ my: 2.5 }} />
        <StepHeading
          number={2}
          title="Who does it apply to?"
          hint="The most specific rule wins outright — an employee rule beats a category rule, which beats a company rule."
        />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Applies to"
              value={scope}
              disabled={!!basedOn}
              onChange={(e) => {
                setScope(e.target.value);
                setScopeRef('');
              }}
              helperText={scopeMeta.help}
              slotProps={{ formHelperText: { sx: { mx: 0 } } }}
            >
              {RULE_SCOPES.map((s) => (
                <MenuItem key={s.value} value={s.value}>
                  {s.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            {scopeMeta.refKind === 'EMPLOYEE' ? (
              <EmployeePicker
                label="Employee"
                value={scopeRef || null}
                onChange={(v) => setScopeRef(v || '')}
                disabled={!!basedOn}
                required
              />
            ) : needsRef ? (
              <TextField
                select
                fullWidth
                size="small"
                required
                label={scopeMeta.refLabel}
                value={scopeRef}
                disabled={!!basedOn}
                onChange={(e) => setScopeRef(e.target.value)}
              >
                {(refOptions || []).map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
          </Grid>
        </Grid>

        <Divider sx={{ my: 2.5 }} />
        <StepHeading number={3} title="Settings" />
        <Grid container spacing={2}>
          {entry.fields.map((field) => {
            const dimmed = field.dependsOn && !params[field.dependsOn];
            if (field.type === 'boolean') {
              return (
                <Grid key={field.name} size={{ xs: 12 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!!params[field.name]}
                        onChange={(e) => setParam(field.name, e.target.checked)}
                      />
                    }
                    label={
                      <span>
                        <Typography variant="body2">{field.label}</Typography>
                        {field.help && (
                          <Typography variant="caption" color="text.secondary">
                            {field.help}
                          </Typography>
                        )}
                      </span>
                    }
                  />
                </Grid>
              );
            }
            if (field.type === 'choice') {
              return (
                <Grid key={field.name} size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label={field.label}
                    value={params[field.name] ?? ''}
                    onChange={(e) => setParam(field.name, e.target.value)}
                    helperText={field.help}
                    slotProps={{ formHelperText: { sx: { mx: 0 } } }}
                  >
                    {field.options.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              );
            }
            return (
              <Grid key={field.name} size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={field.label}
                  value={params[field.name] ?? ''}
                  disabled={dimmed}
                  onChange={(e) =>
                    setParam(
                      field.name,
                      field.type === 'number'
                        ? e.target.value.replace(/[^0-9]/g, '')
                        : e.target.value.replace(/[^0-9.]/g, '')
                    )
                  }
                  helperText={field.help}
                  slotProps={{
                    input: field.unit
                      ? { endAdornment: <InputAdornment position="end">{field.unit}</InputAdornment> }
                      : undefined,
                    formHelperText: { sx: { mx: 0 } },
                  }}
                />
              </Grid>
            );
          })}
        </Grid>

        {paramError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {paramError}
          </Alert>
        )}
        {danger && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <AlertTitle>Read this before saving</AlertTitle>
            {danger}
          </Alert>
        )}

        <Divider sx={{ my: 2.5 }} />
        <StepHeading
          number={4}
          title="From when?"
          hint="A rule prices a day using the version that was in force on that date."
        />
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 5 }}>
            <DatePicker
              label="Starts on"
              value={effectiveFrom}
              onChange={setEffectiveFrom}
              slotProps={{
                textField: {
                  size: 'small',
                  fullWidth: true,
                  helperText: 'A date inside a month payroll has already locked is refused.',
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 7 }}>
            <TextField
              fullWidth
              size="small"
              label="Note (optional)"
              placeholder="Why this changed, and who asked for it"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              inputProps={{ maxLength: 500 }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
              label={
                <span>
                  <Typography variant="body2">Rule is on</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Switch off to say “this rule does not apply to these people”. That is an answer,
                    not a gap — a broader rule will not take over for them.
                  </Typography>
                </span>
              }
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2.5 }} />
        <StepHeading
          number={5}
          title="Test it on a past month"
          hint="A wrong rule is invisible until somebody reads the numbers. This is how to read them first."
        />
        <PreviewPanel draft={draft} existingRules={existingRules} disabled={!canSubmit} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!canSubmit || saving}
          onClick={() => onSubmit({ ...draft, notes: notes || null })}
        >
          {basedOn ? 'Save as a new version' : 'Save rule'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
