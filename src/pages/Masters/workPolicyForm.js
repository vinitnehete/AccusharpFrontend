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

export const blankForm = () => ({
  scope: 'COMPANY',
  scopeRef: '',
  attendanceTracking: 'TRACKED',
  payrollMode: 'ATTENDANCE_BASED',
  leaveApproval: 'SUPERVISOR_THEN_HR',
  effectiveFrom: dayjs().startOf('month'),
  enabled: true,
  notes: '',
});

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

export const isValid = (form) =>
  !!form
  && !!form.effectiveFrom
  && (!needsScopeRef(form.scope) || !!form.scopeRef.trim());

export const toPayload = (form) => ({
  scope: form.scope,
  scopeRef: needsScopeRef(form.scope) ? form.scopeRef.trim() : null,
  attendanceTracking: form.attendanceTracking,
  payrollMode: form.payrollMode,
  leaveApproval: form.leaveApproval,
  effectiveFrom: form.effectiveFrom.format('YYYY-MM-DD'),
  enabled: form.enabled,
  notes: form.notes.trim() || null,
});
