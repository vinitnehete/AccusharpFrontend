import client from './client';

// The attendance policy engine (backend AttendancePolicyController).
//
// There is deliberately no `update`: a rule is never edited. Changing one
// appends a version with a later effective date, and stopping one appends a
// version with enabled=false. `remove` only accepts a version that has not
// taken effect yet - anything that has ever priced a day is superseded, never
// deleted, because a payslip may already depend on it.
const attendancePolicy = {
  list: (params) => client.get('/attendance-policy/rules', { params }).then((r) => r.data),
  create: (payload) => client.post('/attendance-policy/rules', payload).then((r) => r.data),
  remove: (id) => client.delete(`/attendance-policy/rules/${id}`).then((r) => r.data),
  // What actually applies to one employee on one date - the winning rule per
  // type, why it won, and the rules it beat.
  effective: (userId, date) =>
    client.get('/attendance-policy/effective', { params: { userId, date } }).then((r) => r.data),
  // Re-runs a past month under a proposed rule set and returns the difference.
  // Writes nothing - not a day, not a summary, not a trace row.
  preview: (payload) => client.post('/attendance-policy/preview', payload).then((r) => r.data),
};

export default attendancePolicy;
