// The population a rule attaches to - mirrors RuleScope on the server, most
// specific first, which is the order the resolvers apply them in. Shared by
// every rule screen (work policies, leave rules) so one list describes them all.
export const SCOPES = ['EMPLOYEE', 'DESIGNATION', 'CATEGORY', 'DEPARTMENT', 'EMPLOYMENT_TYPE', 'COMPANY'];

export const SCOPE_LABEL = {
  EMPLOYEE: 'One employee',
  DESIGNATION: 'A designation',
  CATEGORY: 'A category',
  DEPARTMENT: 'A department',
  EMPLOYMENT_TYPE: 'An employment type',
  COMPANY: 'Everyone in the company',
};

export const SCOPE_REF_LABEL = {
  EMPLOYEE: 'Employee user ID',
  DESIGNATION: 'Designation code',
  CATEGORY: 'Category code',
  DEPARTMENT: 'Department code',
  EMPLOYMENT_TYPE: 'Employment type',
};

/** COMPANY covers everybody, so it names nothing; every other scope names one thing. */
export const needsScopeRef = (scope) => scope !== 'COMPANY';
