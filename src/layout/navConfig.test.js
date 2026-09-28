import navConfig, { platformNavConfig, visibleNav } from './navConfig';
import { ROLE_PERMISSIONS } from '../constants/permissions';

const session = (role, extra = []) => ({ role, permissions: [...ROLE_PERMISSIONS[role], ...extra] });

const labels = (sections) => sections.flatMap((section) => section.items.map((item) => item.label));
const sectionLabels = (sections) => sections.map((section) => section.label);

describe('sidebar visibility', () => {
  it('shows a plain employee only their own workspace', () => {
    const visible = visibleNav(navConfig, session('EMPLOYEE'));

    expect(sectionLabels(visible)).toEqual(['My Workspace']);
    expect(labels(visible)).not.toContain('Dashboard');
  });

  it('shows a supervisor their team tools and team-scoped reports, not HR administration', () => {
    const shown = labels(visibleNav(navConfig, session('SUPERVISOR')));

    expect(shown).toEqual(expect.arrayContaining([
      'Dashboard', 'My Team', 'Pending Approvals', 'Roster Planner', 'Reports', 'Contractors',
    ]));
    expect(shown).not.toContain('Employees');
    expect(shown).not.toContain('Payroll');
    expect(shown).not.toContain('Attendance Console');
    expect(shown).not.toContain('Rules');
    expect(shown).not.toContain('Custom Roles');
  });

  it('shows HR the administration area but not role management or the audit log', () => {
    const shown = labels(visibleNav(navConfig, session('HR')));

    expect(shown).toEqual(expect.arrayContaining([
      'Employees', 'All Leaves', 'Attendance Console', 'Payroll', 'Salary Slips', 'Masters', 'Rules', 'Reports',
    ]));
    // Shifts and holidays are rules: they are tabs on the Rules page now, not sidebar items.
    expect(shown).not.toContain('Shifts');
    expect(shown).not.toContain('Holidays');
    expect(shown).not.toContain('Custom Roles');
    expect(shown).not.toContain('Audit Log');
  });

  it('shows an admin role management and the audit log', () => {
    expect(labels(visibleNav(navConfig, session('ADMIN')))).toEqual(expect.arrayContaining(['Custom Roles', 'Audit Log']));
  });

  it('opens exactly what a custom role grants, on top of the fixed role', () => {
    const shown = labels(visibleNav(navConfig, session('EMPLOYEE', ['ATTENDANCE_CORRECT', 'REPORT_READ'])));

    expect(shown).toEqual(expect.arrayContaining(['Attendance Console', 'Reports']));
    expect(shown).not.toContain('Payroll');
    // A capability is not a scope - these grant no team.
    expect(shown).not.toContain('My Team');
  });

  it('shows team screens to a director whose custom role grants the scope', () => {
    const shown = labels(visibleNav(navConfig, session('EMPLOYEE', ['SCOPE_ALL_REPORTS'])));

    expect(shown).toContain('My Team');
  });

  it('drops a section with nothing left in it', () => {
    const visible = visibleNav(navConfig, session('EMPLOYEE'));

    expect(sectionLabels(visible)).not.toContain('HR Admin');
    expect(sectionLabels(visible)).not.toContain('Security');
  });

  it('shows a platform owner the whole platform menu, audit log included', () => {
    const platform = { role: 'PLATFORM_OWNER', permissions: ROLE_PERMISSIONS.PLATFORM_OWNER };

    expect(labels(visibleNav(platformNavConfig, platform))).toEqual(['Companies', 'Onboard Company', 'Audit Log']);
  });
});
