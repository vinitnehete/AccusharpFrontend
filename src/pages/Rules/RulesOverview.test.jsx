import { render, screen } from '@testing-library/react';
import RulesOverview from './RulesOverview';
import salaryRulesApi from '../../api/salaryRules';
import attendanceRulesApi from '../../api/attendanceRules';
import attendancePolicyApi from '../../api/attendancePolicy';
import workPoliciesApi from '../../api/workPolicies';
import leaveRulesApi from '../../api/leaveRules';
import leaveSettingsApi from '../../api/leaveSettings';
import employmentTypesApi from '../../api/employmentTypes';
import shiftsApi from '../../api/shifts';
import holidaysApi from '../../api/holidays';
import { useAuth } from '../../context/AuthContext';
import { ROLE_PERMISSIONS } from '../../constants/permissions';

jest.mock('../../api/salaryRules', () => ({ get: jest.fn() }));
jest.mock('../../api/attendanceRules', () => ({ get: jest.fn() }));
jest.mock('../../api/attendancePolicy', () => ({ list: jest.fn() }));
jest.mock('../../api/workPolicies', () => ({ list: jest.fn() }));
jest.mock('../../api/leaveRules', () => ({ list: jest.fn() }));
jest.mock('../../api/leaveSettings', () => ({ get: jest.fn() }));
jest.mock('../../api/employmentTypes', () => ({ list: jest.fn() }));
jest.mock('../../api/shifts', () => ({ list: jest.fn() }));
jest.mock('../../api/holidays', () => ({ list: jest.fn() }));
jest.mock('../../context/AuthContext', () => ({ useAuth: jest.fn() }));
// react-router v7 does not load under this Jest; a plain anchor is all a card link needs.
jest.mock('react-router-dom', () => {
  const { forwardRef } = jest.requireActual('react');
  return { Link: forwardRef(({ to, ...rest }, ref) => <a ref={ref} href={to} {...rest} />) };
});

const renderOverview = (permissions) => {
  useAuth.mockReturnValue({ permissions, can: (code) => permissions.includes(code) });
  render(<RulesOverview />);
};

beforeEach(() => {
  jest.clearAllMocks();
  salaryRulesApi.get.mockResolvedValue({
    basicDaPercent: 50, basicDaMinimumThreshold: 0, hraPercent: 40, conveyancePercent: 10,
    educationPercent: 10, pfPercent: 12, esicPercent: 0.75, esicWageCeiling: 21000,
    ptUpperThreshold: 10001, ptUpperAmount: 200, ptLowerThreshold: 7501, ptLowerAmount: 175,
    dayWiseDaysInMonth: 26, standardHoursPerDay: 8, overtimeRateMultiplier: 1, mlwfAmount: 0,
  });
  attendanceRulesApi.get.mockResolvedValue({
    entryWindowBufferMinutes: 60, fullDayThresholdPercent: 75, halfDayThresholdPercent: 40,
  });
  attendancePolicyApi.list.mockResolvedValue([]);
  workPoliciesApi.list.mockResolvedValue([]);
  leaveRulesApi.list.mockResolvedValue([]);
  leaveSettingsApi.get.mockResolvedValue({ leaveYearStartMonth: 1, currentLeaveYearLabel: '2026' });
  employmentTypesApi.list.mockResolvedValue([]);
  shiftsApi.list.mockResolvedValue([
    { id: 1, shiftCode: 'GENERAL', startTime: '09:00:00', endTime: '18:00:00', graceMinutes: 10 },
  ]);
  holidaysApi.list.mockResolvedValue([]);
});

describe('Rules overview', () => {
  it('shows every rule of the company on one page, with what it says today', async () => {
    renderOverview(ROLE_PERMISSIONS.HR);

    expect(await screen.findByText('50% of gross')).toBeInTheDocument();
    expect(await screen.findByText('75% of the shift or more')).toBeInTheDocument();
    expect(await screen.findByText(/everyone gets CL 12 and SL 8/)).toBeInTheDocument();
    expect(await screen.findByText(/Leave year: 2026/)).toBeInTheDocument();
    expect(await screen.findByText(/GENERAL 09:00–18:00/)).toBeInTheDocument();
    expect(await screen.findByText(/No holidays for/)).toBeInTheDocument();
    expect(await screen.findByText('Every employee is tracked and paid from attendance')).toBeInTheDocument();
  });

  it('links each area to the tab where it is changed', async () => {
    renderOverview(ROLE_PERMISSIONS.HR);

    const salaryLink = await screen.findByRole('link', { name: /open salary/i });
    expect(salaryLink).toHaveAttribute('href', '/rules/salary');
  });

  it('asks the server only for the rules this person may read', async () => {
    renderOverview([...ROLE_PERMISSIONS.EMPLOYEE, 'SALARY_RULE_READ']);

    expect(await screen.findByText('50% of gross')).toBeInTheDocument();
    expect(attendanceRulesApi.get).not.toHaveBeenCalled();
    expect(leaveRulesApi.list).not.toHaveBeenCalled();
    expect(workPoliciesApi.list).not.toHaveBeenCalled();
    expect(screen.queryByText(/Leave year/)).not.toBeInTheDocument();
  });

  it('keeps the other cards when one area fails to load', async () => {
    attendanceRulesApi.get.mockRejectedValue(new Error('down'));
    renderOverview(ROLE_PERMISSIONS.HR);

    expect(await screen.findByText('50% of gross')).toBeInTheDocument();
    expect(await screen.findByText('Could not load this rule')).toBeInTheDocument();
  });
});
