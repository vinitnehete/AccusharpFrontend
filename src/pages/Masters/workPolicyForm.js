import dayjs from 'dayjs';
import { needsScopeRef } from '../../constants/scopes';

// The scope list is shared with the leave rule screen - one description of the
// populations a rule can name, for every engine that resolves by scope.
export { SCOPES, SCOPE_LABEL, SCOPE_REF_LABEL, needsScopeRef } from '../../constants/scopes';

export const TRACKING_LABEL = {
  TRACKED: 'Tracked - rostered, punched and generated',
  NOT_TRACKED: 'Not tracked - no roster, no punches, never absent',
};

export const PAYROLL_MODE_LABEL = {
  ATTENDANCE_BASED: 'From attendance - present days, LOP and overtime',
  FIXED_MONTHLY: 'Fixed monthly - the salary structure for the days employed',
};

export const LEAVE_APPROVAL_LABEL = {
  SUPERVISOR_THEN_HR: 'Supervisor endorses, then HR approves',
  HR_ONLY: 'HR approves directly - no endorsement step',
  AUTO_APPROVE: 'Approved automatically when applied for',
};

// The deductions payroll works out by itself. TDS, advances, loans and canteen
// are typed in per payroll run, so there is nothing to switch off for them.
export const DEDUCTION_LABEL = {
  PF: 'PF',
  ESIC: 'ESIC',
  PROFESSIONAL_TAX: 'Professional tax',
  MLWF: 'MLWF',
};

export const deductionsText = (deductions) => (deductions || []).map((d) => DEDUCTION_LABEL[d] || d).join(', ');

export const blankForm = () => ({
  scope: 'COMPANY',
  scopeRef: '',
  scopeRefs: [],
  excludedDeductions: [],
  attendanceTracking: 'TRACKED',
  payrollMode: 'ATTENDANCE_BASED',
  leaveApproval: 'SUPERVISOR_THEN_HR',
  effectiveFrom: dayjs().startOf('month'),
  enabled: true,
  notes: '',
});

/**
 * A change to a policy: what it says today, for the same people, as a new
 * version. It has to start after the version it follows - next month, or the
 * month after that version if it has not started yet.
 */
export const fromPolicy = (policy) => {
  const nextMonth = dayjs().add(1, 'month').startOf('month');
  const afterIt = dayjs(policy.effectiveFrom).add(1, 'month').startOf('month');
  const employees = policy.scope === 'EMPLOYEE';
  return {
    ...blankForm(),
    scope: policy.scope,
    scopeRef: employees || !needsScopeRef(policy.scope) ? '' : policy.scopeRef,
    scopeRefs: employees ? [policy.scopeRef] : [],
    attendanceTracking: policy.attendanceTracking,
    payrollMode: policy.payrollMode,
    leaveApproval: policy.leaveApproval,
    excludedDeductions: policy.excludedDeductions || [],
    enabled: policy.enabled,
    effectiveFrom: afterIt.isAfter(nextMonth) ? afterIt : nextMonth,
  };
};

/** Ids of the newest version of each policy - the only ones a change can follow. */
export const latestIds = (rows) =>
  new Set(
    Object.values(
      rows.reduce((heads, row) => {
        const key = `${row.scope}|${row.scopeRef}`;
        return !heads[key] || row.version > heads[key].version ? { ...heads, [key]: row } : heads;
      }, {})
    ).map((row) => row.id)
  );

/**
 * Pay cannot come from attendance nobody records - the server refuses that
 * combination - so turning tracking off moves the pay to a fixed salary rather
 * than leaving an impossible form to be rejected on save. Turning tracking back
 * on leaves the pay mode alone: tracked and paid a fixed salary is a real
 * combination, where attendance is recorded but does not decide the pay.
 */
export const withTracking = (form, attendanceTracking) => ({
  ...form,
  attendanceTracking,
  payrollMode: attendanceTracking === 'NOT_TRACKED' ? 'FIXED_MONTHLY' : form.payrollMode,
});

// Employees are picked in a list, one or several; every other scope names one code.
const isEmployees = (form) => form.scope === 'EMPLOYEE';

export const isValid = (form) =>
  !!form
  && !!form.effectiveFrom
  && (isEmployees(form)
    ? form.scopeRefs.length > 0
    : !needsScopeRef(form.scope) || !!form.scopeRef.trim());

/** `scopeRefs` is sent only for employees - the server then saves one version per person. */
export const toPayload = (form) => ({
  scope: form.scope,
  scopeRef: needsScopeRef(form.scope) && !isEmployees(form) ? form.scopeRef.trim() : null,
  ...(isEmployees(form) && { scopeRefs: form.scopeRefs }),
  attendanceTracking: form.attendanceTracking,
  payrollMode: form.payrollMode,
  leaveApproval: form.leaveApproval,
  excludedDeductions: form.excludedDeductions,
  effectiveFrom: form.effectiveFrom.format('YYYY-MM-DD'),
  enabled: form.enabled,
  notes: form.notes.trim() || null,
});
