import client from './client';

const leaveBalances = {
  forEmployee: (userId, year) =>
    client.get(`/leave-balances/${userId}`, { params: { year } }).then((r) => r.data),
  setQuota: (userId, year, leaveType, quota) =>
    client
      .put(`/leave-balances/${userId}`, null, { params: { year, leaveType, quota } })
      .then((r) => r.data),
  // Every earned-leave credit and carry-forward posted onto the year, each with
  // the reason for it - what answers "why did I get 1.2 this month?".
  credits: (userId, year) =>
    client.get(`/leave-balances/${userId}/credits`, { params: { year } }).then((r) => r.data),
  // Carries each balance into the next year up to its rule's cap. Safe to rerun.
  closeYear: (year) =>
    client.post('/leave-balances/close-year', null, { params: { year } }).then((r) => r.data),
};

export default leaveBalances;
