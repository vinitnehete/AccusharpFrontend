import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import IssueRecovery from './Issue';
import recoveriesApi from '../../api/recoveries';
import { useAuth } from '../../context/AuthContext';

jest.mock('react-router-dom', () => ({ useNavigate: () => jest.fn() }));
jest.mock('../../api/recoveries', () => ({ statement: jest.fn(), issue: jest.fn() }));
jest.mock('../../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('./RecoveryBalances', () => ({ statement }) => <div>{statement.employeeId}</div>);
jest.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: jest.fn() }) }));
jest.mock('../../components/EmployeePicker', () => ({ label, value, onChange }) => (
  <label>{label}<select aria-label={label} value={value || ''} onChange={(e) => onChange(e.target.value)}>
    <option value="">Choose</option><option value="EMP001">Sunil</option>
  </select></label>
));
jest.mock('@mui/x-date-pickers/DatePicker', () => ({
  DatePicker: ({ label, value, onChange }) => {
    const dayjs = require('dayjs');
    return <input aria-label={label} value={value?.isValid() ? value.format('YYYY-MM-DD') : ''}
      onChange={(e) => onChange(e.target.value ? dayjs(e.target.value) : null)} />;
  },
}));

const enter = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const fillLoan = () => {
  enter('Employee', 'EMP001');
  enter(/Loan amount/, '60000');
  enter('Monthly instalment', '5000');
};

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ can: (code) => code === 'RECOVERY_MANAGE' });
  recoveriesApi.statement.mockResolvedValue(null);
  recoveriesApi.issue.mockResolvedValue({ type: 'LOAN', principalAmount: 60000, installmentAmount: 5000, startMonth: 10, startYear: 2026 });
});

describe('Issue loan', () => {
  it('ignores a pending balance when the employee selection is cleared', async () => {
    let resolveStatement;
    recoveriesApi.statement.mockReturnValueOnce(new Promise((resolve) => { resolveStatement = resolve; }));
    render(<IssueRecovery />);
    enter('Employee', 'EMP001');
    enter('Employee', '');
    await act(async () => resolveStatement({ employeeId: 'EMP001' }));

    expect(screen.queryByText('EMP001')).not.toBeInTheDocument();
  });

  it.each(['2025-03-15', '2026-10-10', '2027-02-20'])('allows a loan dated %s without requiring payroll', async (issuedOn) => {
    render(<IssueRecovery />);
    fillLoan();
    enter('Disbursed on', issuedOn);
    fireEvent.click(screen.getByRole('button', { name: 'Issue' }));

    await waitFor(() => expect(recoveriesApi.issue).toHaveBeenCalledWith(expect.objectContaining({
      employeeId: 'EMP001', type: 'LOAN', principalAmount: 60000, installmentAmount: 5000,
      issuedOn, startMonth: null, startYear: null,
    })));
  });

  it('allows an explicit recovery start in the issue month', async () => {
    render(<IssueRecovery />);
    fillLoan();
    enter('Disbursed on', '2025-03-15');
    enter('Start month', '3');
    enter('Start year', '2025');
    fireEvent.click(screen.getByRole('button', { name: 'Issue' }));

    await waitFor(() => expect(recoveriesApi.issue).toHaveBeenCalledWith(expect.objectContaining({ startMonth: 3, startYear: 2025 })));
  });

  it('requires the start month and year together and refuses an earlier recovery period', () => {
    render(<IssueRecovery />);
    fillLoan();
    enter('Disbursed on', '2026-10-10');
    enter('Start month', '9');
    expect(screen.getByRole('button', { name: 'Issue' })).toBeDisabled();
    enter('Start year', '2026');
    expect(screen.getByRole('button', { name: 'Issue' })).toBeDisabled();
    enter('Start month', '10');
    expect(screen.getByRole('button', { name: 'Issue' })).toBeEnabled();
    enter('Start year', '');
    expect(screen.getByRole('button', { name: 'Issue' })).toBeDisabled();
  });

  it('rejects invalid optional amounts, tenure and period ranges before submitting', () => {
    render(<IssueRecovery />);
    fillLoan();
    const issue = screen.getByRole('button', { name: 'Issue' });
    enter('Monthly instalment', '0');
    expect(issue).toBeDisabled();
    enter('Monthly instalment', '');
    enter('Tenure (months)', '601');
    expect(issue).toBeDisabled();
    enter('Tenure (months)', '12');
    enter('Start month', '13');
    enter('Start year', '2026');
    expect(issue).toBeDisabled();
    enter('Start month', '10');
    enter('Start year', '1999');
    expect(issue).toBeDisabled();
    expect(recoveriesApi.issue).not.toHaveBeenCalled();
  });

  it('requires positive rounded amounts and an instalment no larger than the loan', () => {
    render(<IssueRecovery />);
    fillLoan();
    const issue = screen.getByRole('button', { name: 'Issue' });
    enter('Monthly instalment', '60000.01');
    expect(issue).toBeDisabled();
    enter('Monthly instalment', '0.004');
    expect(issue).toBeDisabled();
    enter('Monthly instalment', '');
    enter(/Loan amount/, '0.004');
    expect(issue).toBeDisabled();
    enter(/Loan amount/, '0.005');
    expect(issue).toBeEnabled();
    enter(/Loan amount/, '1.005');
    enter('Monthly instalment', '1.006');
    expect(issue).toBeEnabled();
  });

  it('requires a valid date when supplied', () => {
    render(<IssueRecovery />);
    fillLoan();
    enter('Disbursed on', 'invalid');
    expect(screen.getByRole('button', { name: 'Issue' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Issue' }));
    expect(recoveriesApi.issue).not.toHaveBeenCalled();
  });

  it('does not let a read-only viewer issue a loan', () => {
    useAuth.mockReturnValue({ can: () => false });
    render(<IssueRecovery />);
    fillLoan();
    expect(screen.getByRole('button', { name: 'Issue' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Issue' }));
    expect(recoveriesApi.issue).not.toHaveBeenCalled();
  });
});
