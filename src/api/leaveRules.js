import client from './client';
import { createCrudApi } from './crudFactory';

// Who gets which leave, per employment type - see LeaveRule on the server.
const leaveRules = createCrudApi('/leave-rules');

// A new rule for several employees is saved as one rule each - all or none.
leaveRules.save = (payload) =>
  client.post(`/leave-rules${payload.scopeRefs ? '/batch' : ''}`, payload).then((r) => r.data);

export default leaveRules;
