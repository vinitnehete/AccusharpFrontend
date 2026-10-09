import client from './client';
import { createCrudApi } from './crudFactory';

const companies = {
  ...createCrudApi('/companies'),
  // Platform-only: creates a company and its admin account (not an employee) together.
  // Returns { company, admin, temporaryPassword }.
  onboard: (payload) => client.post('/companies/onboard', payload).then((r) => r.data),
};

export default companies;
