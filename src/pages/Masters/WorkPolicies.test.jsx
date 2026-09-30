import { fireEvent, render, screen } from '@testing-library/react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import WorkPolicies from './WorkPolicies';
import workPoliciesApi from '../../api/workPolicies';
import { useAuth } from '../../context/AuthContext';

jest.mock('../../api/workPolicies', () => ({ list: jest.fn(), save: jest.fn(), effective: jest.fn() }));
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

  it('shows which deductions a policy leaves out of payroll', async () => {
    renderPage({ policies: [{ ...policy, excludedDeductions: ['PF', 'PROFESSIONAL_TAX'] }] });

    expect(await screen.findByText('PF, Professional tax')).toBeInTheDocument();
  });

  it('offers a change on each policy, which opens the form filled in and saves a new version', async () => {
    renderPage({ policies: [policy] });

    fireEvent.click(await screen.findByRole('button', { name: /change this policy/i }));

    expect(screen.getByText('Change work policy - saves version 2')).toBeInTheDocument();
    expect(screen.getByDisplayValue('DIRECTOR')).toBeDisabled();
  });

  it('offers no change without the manage permission', async () => {
    renderPage({ canManage: false, policies: [policy] });

    expect(await screen.findByText('A category: DIRECTOR')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /change this policy/i })).not.toBeInTheDocument();
  });
});
