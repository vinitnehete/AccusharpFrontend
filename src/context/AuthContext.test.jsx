import { act, render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { refreshSession, registerSessionRefreshedHandler } from '../api/client';
import employeesApi from '../api/employees';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('../api/client', () => ({
  setAccessToken: jest.fn(),
  refreshSession: jest.fn(),
  registerAuthExpiredHandler: jest.fn(),
  registerSessionRefreshedHandler: jest.fn(),
}));
jest.mock('../api/auth', () => ({ login: jest.fn(), logout: jest.fn() }));
jest.mock('../api/employees', () => ({ getByUserId: jest.fn(), list: jest.fn() }));

function Probe() {
  const { role, can } = useAuth();
  return (
    <p>
      role:{role ?? 'none'} reports:{can('REPORT_READ') ? 'yes' : 'no'} payroll:{can('PAYROLL_PROCESS') ? 'yes' : 'no'}
    </p>
  );
}

// CRA resets mock implementations before every test, so they are set here.
const renderSignedIn = (session) => {
  employeesApi.getByUserId.mockResolvedValue({ userId: 'EMP1' });
  employeesApi.list.mockResolvedValue([]);
  refreshSession.mockResolvedValue({ principalType: 'EMPLOYEE', username: 'EMP1', ...session });
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
};

describe('AuthContext permissions', () => {
  it('trusts the permissions the server sent, custom roles included', async () => {
    renderSignedIn({ role: 'EMPLOYEE', permissions: ['LEAVE_APPLY', 'REPORT_READ'] });

    expect(await screen.findByText(/role:EMPLOYEE reports:yes payroll:no/)).toBeInTheDocument();
  });

  it('falls back to the fixed role when the server sent no permission list', async () => {
    renderSignedIn({ role: 'HR' });

    expect(await screen.findByText(/role:HR reports:yes payroll:yes/)).toBeInTheDocument();
  });

  it('picks up a changed role and permissions from a background token refresh, with no logout', async () => {
    renderSignedIn({ role: 'EMPLOYEE', permissions: ['LEAVE_APPLY'] });
    expect(await screen.findByText(/role:EMPLOYEE reports:no/)).toBeInTheDocument();

    const onRefreshed = registerSessionRefreshedHandler.mock.calls.at(-1)[0];
    await act(async () => {
      onRefreshed({ principalType: 'EMPLOYEE', username: 'EMP1', role: 'SUPERVISOR', permissions: ['REPORT_READ'] });
    });

    expect(await screen.findByText(/role:SUPERVISOR reports:yes/)).toBeInTheDocument();
  });
});
