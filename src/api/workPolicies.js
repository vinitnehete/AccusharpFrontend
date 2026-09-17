import client from './client';

// Who follows the attendance process and who is simply paid - see WorkPolicy on
// the server. Create-only: a change appends a version, and ending a policy is a
// version with enabled: false.
const workPolicies = {
  list: () => client.get('/work-policies').then((r) => r.data),
  create: (payload) => client.post('/work-policies', payload).then((r) => r.data),
  effective: (userId, date) =>
    client.get('/work-policies/effective', { params: { userId, date } }).then((r) => r.data),
};

export default workPolicies;
