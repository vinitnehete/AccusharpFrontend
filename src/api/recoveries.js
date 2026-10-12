import client from './client';

// Loans, salary advances, fines and other recoverable amounts. Payroll reads
// these balances rather than being handed a figure - see RecoveryService on
// the backend for why the ledger, not the monthly number, is the source.
const recoveries = {
  // includeSettled brings back closed/cancelled rows too, for the history view.
  list: (includeSettled = false) =>
    client.get('/recoveries', { params: { includeSettled } }).then((r) => r.data),
  forEmployee: (employeeId) =>
    client.get(`/recoveries/employee/${employeeId}`).then((r) => r.data),
  // Balances by type plus every issue, repayment, reversal, waiver and adjustment.
  statement: (employeeId) =>
    client.get(`/recoveries/employee/${employeeId}/statement`).then((r) => r.data),
  // What payroll would recover this period - what the Generate screen pre-fills.
  schedule: (employeeId, month, year) =>
    client
      .get(`/recoveries/employee/${employeeId}/schedule`, { params: { month, year } })
      .then((r) => r.data),
  issue: (payload) => client.post('/recoveries', payload).then((r) => r.data),
  update: (id, payload) => client.put(`/recoveries/${id}`, payload).then((r) => r.data),
  waive: (id, payload) => client.post(`/recoveries/${id}/waive`, payload).then((r) => r.data),
  adjust: (id, payload) => client.post(`/recoveries/${id}/adjust`, payload).then((r) => r.data),
  cancel: (id, remarks) =>
    client.post(`/recoveries/${id}/cancel`, null, { params: { remarks } }).then((r) => r.data),
  // CSV: employeeId, type, principalAmount, installmentAmount, tenureMonths,
  // startMonth, startYear, issuedOn, reason, remarks. Returns BulkImportResult.
  bulkIssue: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return client
      .post('/recoveries/bulk', formData, { headers: { 'Content-Type': undefined } })
      .then((r) => r.data);
  },
};

export default recoveries;
