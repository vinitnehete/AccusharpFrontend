import { ROLE, ASSIGNABLE_ROLE } from './enums';

describe('roles', () => {
  it('has one admin per company, made at onboarding - ADMIN is a role someone can have, never one to give', () => {
    expect(ROLE).toContain('ADMIN');
    expect(ASSIGNABLE_ROLE).toEqual(['HR', 'SUPERVISOR', 'EMPLOYEE']);
  });
});
