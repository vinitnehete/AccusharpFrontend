import { activePath, activeTrail, greetingFor, initialsOf, isActivePath } from './shell';

const sections = [
  { label: 'Overview', items: [{ label: 'Dashboard', path: '/' }] },
  {
    label: 'My Workspace',
    items: [
      { label: 'My Attendance', path: '/attendance/me' },
      { label: 'Apply Leave', path: '/leave/apply' },
      { label: 'My Salary Slip', path: '/salary-slips/me' },
    ],
  },
  {
    label: 'HR Admin',
    items: [
      { label: 'Employees', path: '/employees' },
      { label: 'Attendance Console', path: '/attendance/generate' },
      { label: 'Salary Slips', path: '/salary-slips' },
      { label: 'Masters', path: '/masters/companies' },
    ],
  },
];

describe('greetingFor', () => {
  test.each([
    [0, 'Good morning'],
    [11, 'Good morning'],
    [12, 'Good afternoon'],
    [16, 'Good afternoon'],
    [17, 'Good evening'],
    [23, 'Good evening'],
  ])('hour %i reads "%s"', (hour, expected) => {
    expect(greetingFor(hour)).toBe(expected);
  });
});

describe('initialsOf', () => {
  test('two words give two letters', () => {
    expect(initialsOf('Vinit Nehete')).toBe('VN');
  });
  test('only the first and last word count', () => {
    expect(initialsOf('Asha Rani Kulkarni')).toBe('AK');
  });
  test('one word gives one letter, upper-cased', () => {
    expect(initialsOf('hr001')).toBe('H');
  });
  test('nothing gives a placeholder', () => {
    expect(initialsOf('  ')).toBe('?');
    expect(initialsOf(undefined)).toBe('?');
  });
});

describe('isActivePath - the rule the sidebar always used', () => {
  test('root only matches itself', () => {
    expect(isActivePath('/', '/')).toBe(true);
    expect(isActivePath('/', '/employees')).toBe(false);
  });
  test('any other item matches its sub-pages too', () => {
    expect(isActivePath('/employees', '/employees/42')).toBe(true);
    expect(isActivePath('/salary-slips', '/salary-slips/me')).toBe(true);
  });
});

describe('activePath - the one sidebar item for the current page', () => {
  test('an item matches itself and its sub-pages', () => {
    expect(activePath(sections, '/employees/42')).toBe('/employees');
  });
  test('the most specific item wins, so only one lights up', () => {
    expect(activePath(sections, '/salary-slips/me')).toBe('/salary-slips/me');
  });
  test('a sibling tab falls back to the only item of its module', () => {
    expect(activePath(sections, '/masters/departments')).toBe('/masters/companies');
  });
  test('no guess when the module has several items', () => {
    expect(activePath(sections, '/attendance/records')).toBeNull();
  });
  test('a page outside the sidebar has none', () => {
    expect(activePath(sections, '/change-password')).toBeNull();
  });
});

describe('activeTrail', () => {
  test('names the section and item for the current page', () => {
    expect(activeTrail(sections, '/employees/42')).toEqual({ section: 'HR Admin', item: 'Employees' });
  });
  test('prefers the most specific item when two match', () => {
    expect(activeTrail(sections, '/salary-slips/me')).toEqual({
      section: 'My Workspace',
      item: 'My Salary Slip',
    });
  });
  test('covers a sibling tab through its module item', () => {
    expect(activeTrail(sections, '/masters/departments')).toEqual({ section: 'HR Admin', item: 'Masters' });
  });
  test('is empty for a page that is not in the sidebar', () => {
    expect(activeTrail(sections, '/change-password')).toBeNull();
  });
});
