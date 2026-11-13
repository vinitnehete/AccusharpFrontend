import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import RecoveryStatement from './Statement';
import recoveriesApi from '../../api/recoveries';
import { useAuth } from '../../context/AuthContext';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('../../api/recoveries', () => ({ statement: jest.fn() }));
jest.mock('../../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../components/EmployeePicker', () => ({ label, value, onChange }) => (
  <select aria-label={label} value={value || ''} onChange={(e) => onChange(e.target.value)}>
    <option value="">Choose</option><option value="EMP002">Priya</option>
  </select>
));
jest.mock('../../components/DataTable', () => () => <div>Records</div>);
jest.mock('./RecoveryBalances', () => ({ statement }) => <div>{statement.employeeId}</div>);

beforeEach(() => {
  jest.clearAllMocks();
  recoveriesApi.statement.mockResolvedValue({ recoveries: [], transactions: [], balances: [], totalOutstanding: 0 });
});

it('opens a viewer without pay access on their own statement and hides the picker', async () => {
  useAuth.mockReturnValue({ username: 'EMP001', can: () => false });
  render(<RecoveryStatement />);

  await waitFor(() => expect(recoveriesApi.statement).toHaveBeenCalledWith('EMP001'));
  expect(screen.queryByLabelText('Employee')).not.toBeInTheDocument();
});

it('lets a viewer with pay access choose an employee for a scoped statement', async () => {
  useAuth.mockReturnValue({ username: 'HR001', can: (code) => code === 'PAY_READ' });
  render(<RecoveryStatement />);
  fireEvent.change(screen.getByLabelText('Employee'), { target: { value: 'EMP002' } });

  await waitFor(() => expect(recoveriesApi.statement).toHaveBeenCalledWith('EMP002'));
});

it('ignores a pending statement after the employee selection is cleared', async () => {
  let resolveStatement;
  recoveriesApi.statement.mockReturnValueOnce(new Promise((resolve) => { resolveStatement = resolve; }));
  useAuth.mockReturnValue({ username: 'HR001', can: (code) => code === 'PAY_READ' });
  render(<RecoveryStatement />);
  fireEvent.change(screen.getByLabelText('Employee'), { target: { value: 'EMP002' } });
  fireEvent.change(screen.getByLabelText('Employee'), { target: { value: '' } });
  await act(async () => resolveStatement({ employeeId: 'EMP002', recoveries: [], transactions: [] }));

  expect(screen.queryByText('EMP002')).not.toBeInTheDocument();
});
