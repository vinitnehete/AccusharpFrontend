import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Generate from './Generate';
import payrollApi from '../../api/payroll';
import recoveriesApi from '../../api/recoveries';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('../../api/payroll', () => ({ generate: jest.fn(), regenerate: jest.fn() }));
jest.mock('../../api/recoveries', () => ({ schedule: jest.fn() }));
jest.mock('../../context/ActingAsContext', () => ({ useActingAs: () => ({ actingAs: { userId: 'HR001' } }) }));
jest.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: jest.fn() }) }));
jest.mock('../../components/EmployeePicker', () => ({ label = 'Employee', value, onChange }) => (
  <select aria-label={label} value={value || ''} onChange={(e) => onChange(e.target.value)}>
    <option value="">Choose</option><option value="EMP001">Sunil</option><option value="EMP002">Priya</option>
  </select>
));

const selectEmployee = (userId) => fireEvent.change(screen.getByLabelText('Employee'), { target: { value: userId } });
const scheduled = (loanDeduction) => ({ advanceDeduction: 0, loanDeduction, fine: 0, otherDeduction: 0, totalOutstanding: 0 });

beforeEach(() => {
  jest.clearAllMocks();
  payrollApi.generate.mockResolvedValue({ netSalary: 0 });
  recoveriesApi.schedule.mockResolvedValue(scheduled(500));
});

it('clears another employee’s prefills if the new recovery schedule cannot load', async () => {
  recoveriesApi.schedule.mockResolvedValueOnce(scheduled(500)).mockRejectedValueOnce(new Error('Unavailable'));
  render(<Generate />);
  selectEmployee('EMP001');
  await waitFor(() => expect(screen.getByLabelText('Loan deduction')).toHaveValue('500'));
  selectEmployee('EMP002');
  await waitFor(() => expect(screen.getByLabelText('Loan deduction')).toHaveValue(''));
  fireEvent.click(screen.getByRole('button', { name: /^Generate$/ }));

  await waitFor(() => expect(payrollApi.generate).toHaveBeenCalledWith(expect.objectContaining({
    employeeId: 'EMP002', loanDeduction: null, advanceDeduction: null, fine: null, otherDeduction: null,
  })));
});

it('ignores a late schedule response belonging to the previous employee', async () => {
  let resolvePrevious;
  recoveriesApi.schedule.mockReturnValueOnce(new Promise((resolve) => { resolvePrevious = resolve; }));
  render(<Generate />);
  selectEmployee('EMP001');
  selectEmployee('EMP002');
  await waitFor(() => expect(screen.getByLabelText('Loan deduction')).toHaveValue('500'));
  await act(async () => resolvePrevious(scheduled(2000)));

  expect(screen.getByLabelText('Loan deduction')).toHaveValue('500');
});

it('keeps an untouched prefill scheduled so each loan receives its own instalment', async () => {
  render(<Generate />);
  selectEmployee('EMP001');
  await waitFor(() => expect(screen.getByLabelText('Loan deduction')).toHaveValue('500'));
  fireEvent.click(screen.getByRole('button', { name: /^Generate$/ }));

  await waitFor(() => expect(payrollApi.generate).toHaveBeenCalledWith(expect.objectContaining({
    loanDeduction: null, advanceDeduction: null, fine: null, otherDeduction: null,
  })));
});

it.each([['', null], ['0', 0], ['600', 600]])('preserves the difference between a blank and zero recovery override', async (input, expected) => {
  render(<Generate />);
  selectEmployee('EMP001');
  await waitFor(() => expect(screen.getByLabelText('Loan deduction')).toHaveValue('500'));
  fireEvent.change(screen.getByLabelText('Loan deduction'), { target: { value: input } });
  fireEvent.click(screen.getByRole('button', { name: /^Generate$/ }));

  await waitFor(() => expect(payrollApi.generate).toHaveBeenCalledWith(expect.objectContaining({ loanDeduction: expected })));
});
