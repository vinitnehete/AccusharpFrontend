import { render, screen } from '@testing-library/react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import WorkPolicies from './WorkPolicies';
import workPoliciesApi from '../../api/workPolicies';
import { useAuth } from '../../context/AuthContext';

jest.mock('../../api/workPolicies', () => ({ list: jest.fn(), create: jest.fn(), effective: jest.fn() }));
jest.mock('../../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../context/ActingAsContext', () => ({ useActingAs: () => ({ employees: [] }) }));
jest.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: jest.fn() }) }));

const renderPage = ({ canManage = true, policies = [] } = {}) => {
  useAuth.mockReturnValue({ can: () => canManage });
  workPoliciesApi.list.mockResolvedValue(policies);
  render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <WorkPolicies />
    </LocalizationProvider>
  );
};

const policy = {
  id: 1,
  scope: 'CATEGORY',
  scopeRef: 'DIRECTOR',
  version: 1,
  effectiveFrom: '2031-04-01',
  enabled: true,
  attendanceTracking: 'NOT_TRACKED',
  payrollMode: 'FIXED_MONTHLY',
  leaveApproval: 'AUTO_APPROVE',
  summary: 'Attendance is not tracked; paid the salary structure for the days employed.',
};

describe('Work Policies screen', () => {
  it('lists a policy with the population it covers', async () => {
    renderPage({ policies: [policy] });

    expect(await screen.findByText('A category: DIRECTOR')).toBeInTheDocument();
    expect(screen.getByText('Fixed Monthly')).toBeInTheDocument();
    expect(screen.getByText('Auto Approve')).toBeInTheDocument();
  });

  it('says plainly that no policy means business as usual', async () => {
    renderPage();

    expect(await screen.findByText('No work policies')).toBeInTheDocument();
    expect(screen.getByText('Every employee is tracked and paid from attendance.')).toBeInTheDocument();
  });

  it('offers no way to write one without the manage permission', async () => {
    renderPage({ canManage: false, policies: [policy] });

    expect(await screen.findByText('A category: DIRECTOR')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /new policy/i })).not.toBeInTheDocument();
  });
});
