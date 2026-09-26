import { createCrudApi } from './crudFactory';

// Who gets which leave, per employment type - see LeaveRule on the server.
export default createCrudApi('/leave-rules');
