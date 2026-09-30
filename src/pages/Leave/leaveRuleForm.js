import dayjs from 'dayjs';
import { needsScopeRef } from '../../constants/scopes';

export { SCOPES, SCOPE_LABEL, SCOPE_REF_LABEL, needsScopeRef } from '../../constants/scopes';

// Only earned leave can be earned from attendance - mirrors LeaveRuleService.
// Everything else is open to any paid type: a year's worth up front, a few days
// credited each month, or nothing at all.
export const grantsFor = (leaveType) =>
  leaveType === 'EARNED_LEAVE'
    ? ['EARNED_BY_ATTENDANCE', 'YEARLY_GRANT', 'MONTHLY_ACCRUAL', 'NOT_ENTITLED']
    : ['YEARLY_GRANT', 'MONTHLY_ACCRUAL', 'NOT_ENTITLED'];

/** Switching the population it applies to clears what the old one named. */
export const withScope = (form, scope) => ({
  ...form,
  scope,
  scopeRef: scope === 'EMPLOYMENT_TYPE' ? 'PERMANENT' : '',
  scopeRefs: [],
});

/**
 * Who the rule names, as the server takes it. A new rule for employees names a
 * list - one rule is saved per person; an edit changes the one rule it opened.
 */
export const scopeFields = (form, isNew) => {
  if (isNew && form.scope === 'EMPLOYEE') {
    return { scope: form.scope, scopeRef: null, scopeRefs: form.scopeRefs };
  }
  return { scope: form.scope, scopeRef: needsScopeRef(form.scope) ? form.scopeRef.trim() : null };
};

// The OSH Code carry-forward limit for EL - prefilled on a new rule, and only
// meaningful for earned leave.
const EARNED_LEAVE_CARRY_FORWARD_DEFAULT = '30';

export const blankForm = () => ({
  scope: 'COMPANY',
  scopeRef: 'ANY',
  scopeRefs: [],
  leaveType: 'EARNED_LEAVE',
  grantMethod: 'EARNED_BY_ATTENDANCE',
  yearlyDays: '',
  fullMonthCredit: '1.5',
  upperStepDays: '20',
  upperStepCredit: '1.0',
  lowerStepDays: '10',
  lowerStepCredit: '0.5',
  daysPerStatutoryDay: '20',
  monthlyCredit: '',
  yearlyAccrualCap: '',
  carryForwardCap: EARNED_LEAVE_CARRY_FORWARD_DEFAULT,
  excessOverCap: 'PAY_OUT',
  effectiveFrom: dayjs().startOf('month'),
  enabled: true,
});

// Switching leave type can make the chosen grant invalid (only EL is earned),
// and leaves EL's prefilled carry-forward behind on a type it was never meant
// for - kept on CL or SL it would quietly let 30 days carry into next year. A
// value somebody typed themselves is theirs and stays.
export const withLeaveType = (form, leaveType) => {
  const allowed = grantsFor(leaveType);
  const grantMethod = allowed.includes(form.grantMethod) ? form.grantMethod : allowed[0];
  const leavingEarnedLeaveDefault = leaveType !== 'EARNED_LEAVE'
    && form.leaveType === 'EARNED_LEAVE'
    && form.carryForwardCap === EARNED_LEAVE_CARRY_FORWARD_DEFAULT;
  return {
    ...form,
    leaveType,
    grantMethod,
    carryForwardCap: leavingEarnedLeaveDefault ? '' : form.carryForwardCap,
  };
};
