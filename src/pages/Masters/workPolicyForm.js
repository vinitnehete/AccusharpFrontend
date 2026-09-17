import dayjs from 'dayjs';

// Mirrors RuleScope on the backend, most specific first - the order the
// resolver applies them in, so the list reads the way the rules resolve.
export const SCOPES = ['EMPLOYEE', 'DESIGNATION', 'CATEGORY', 'DEPARTMENT', 'EMPLOYMENT_TYPE', 'COMPANY'];

export const SCOPE_LABEL = {
  EMPLOYEE: 'One employee',
  DESIGNATION: 'A designation',
  CATEGORY: 'A category',
  DEPARTMENT: 'A department',
  EMPLOYMENT_TYPE: 'An employment type',
  COMPANY: 'Everyone in the company',
};

export const SCOPE_REF_LABEL = {
  EMPLOYEE: 'Employee user ID',
  DESIGNATION: 'Designation code',
  CATEGORY: 'Category code',
  DEPARTMENT: 'Department code',
  EMPLOYMENT_TYPE: 'Employment type',
};

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

/** COMPANY covers everybody, so it names nothing; every other scope names one thing. */
export const needsScopeRef = (scope) => scope !== 'COMPANY';

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
