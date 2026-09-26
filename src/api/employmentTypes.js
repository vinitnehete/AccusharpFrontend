import client from './client';
import { createCrudApi } from './crudFactory';

// GET/POST/PUT/DELETE follow the standard master shape; seed-defaults is the
// one extra verb - it creates the four types that reproduce today's built-in
// PERMANENT/DAY_WISE/CONTRACT/INTERN behaviour exactly, and is idempotent, so
// calling it twice never resets a type somebody has already customised.
const employmentTypes = {
  ...createCrudApi('/employment-types'),
  seedDefaults: () => client.post('/employment-types/seed-defaults').then((r) => r.data),
};

export default employmentTypes;
