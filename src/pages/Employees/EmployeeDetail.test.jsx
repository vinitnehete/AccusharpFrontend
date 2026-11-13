import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import EmployeeDetail from './EmployeeDetail';
import employeesApi from '../../api/employees';
import { useAuth } from '../../context/AuthContext';

// react-router v7 does not load under this Jest; the page needs the id, navigate and links.
jest.mock('react-router-dom', () => {
  const { forwardRef } = jest.requireActual('react');
  return {
    useParams: () => ({ id: '12' }),
    useNavigate: () => jest.fn(),
    Link: forwardRef(({ to, children, ...rest }, ref) => <a ref={ref} href={to} {...rest}>{children}</a>),
  };
});
jest.mock('../../api/employees', () => ({
  get: jest.fn(), team: jest.fn(), getSalaryRevisions: jest.fn(), updateSalaryStructure: jest.fn(),
}));
jest.mock('../../api/customRoles', () => ({ listForEmployee: jest.fn(), list: jest.fn() }));
jest.mock('../../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../context/ActingAsContext', () => ({ useActingAs: () => ({ employees: [], actingAs: null }) }));
jest.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: jest.fn() }) }));

const sunil = {
  id: 12,
  userId: 'EMP001',
  employeeCode: null,
  employeeName: 'Sunil Kadam',
  role: 'EMPLOYEE',
  recordStatus: 'ACTIVE',
  status: 'PERMANENT',
  grossSalary: 20000,
  grossSalaryWage: 20000,
  basicDA: 10000,
  hra: 4000,
  conveyanceAllowance: 2000,
  educationAllowance: 1000,
  medicalAllowance: 1000,
  otherAllowance: 2000,
  pfBasic: 15000,
  weekOffDays: ['SUNDAY'],
};

const renderAs = (permissions, session = {}) => {
  useAuth.mockReturnValue({ can: (code) => permissions.includes(code), ...session });
  render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <EmployeeDetail />
    </LocalizationProvider>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  employeesApi.get.mockResolvedValue(sunil);
  employeesApi.team.mockResolvedValue([]);
  employeesApi.getSalaryRevisions.mockResolvedValue([]);
  employeesApi.updateSalaryStructure.mockResolvedValue(sunil);
});

describe('Salary structure override', () => {
  const mismatchMessage = 'Gross salary and Gross wage (proration base) do not match.';
  const openOverride = async () => {
    renderAs(['EMPLOYEE_READ', 'EMPLOYEE_UPDATE'], { username: 'HR001' });
    fireEvent.click(await screen.findByRole('button', { name: /^override$/i }));
    return within(screen.getByRole('dialog', { name: 'Override salary structure' }));
  };

  it('prefills all salary components and saves edited allowances and PF basic with the structure', async () => {
    employeesApi.get.mockResolvedValueOnce(sunil).mockResolvedValue({
      ...sunil, medicalAllowance: 1500.25, otherAllowance: 2500.50, pfBasic: 18000, grossSalaryWage: 21000.75,
    });
    const dialog = await openOverride();
    expect(dialog.getByRole('textbox', { name: /medical allowance/i })).toHaveValue('1000');
    expect(dialog.getByRole('textbox', { name: /other allowance/i })).toHaveValue('2000');
    expect(dialog.getByRole('textbox', { name: /pf basic/i })).toHaveValue('15000');

    fireEvent.change(dialog.getByRole('textbox', { name: /medical allowance/i }), { target: { value: '1500.25' } });
    fireEvent.change(dialog.getByRole('textbox', { name: /other allowance/i }), { target: { value: '2500.50' } });
    fireEvent.change(dialog.getByRole('textbox', { name: /pf basic/i }), { target: { value: '18000' } });
    fireEvent.click(dialog.getByRole('button', { name: 'Save override' }));

    await waitFor(() => expect(employeesApi.updateSalaryStructure).toHaveBeenCalledWith(12, {
      basicDA: 10000,
      hra: 4000,
      conveyanceAllowance: 2000,
      educationAllowance: 1000,
      medicalAllowance: '1500.25',
      otherAllowance: '2500.50',
      pfBasic: '18000',
    }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Override salary structure' })).not.toBeInTheDocument());
    expect(await screen.findByRole('alert')).toHaveTextContent(mismatchMessage);
  });

  it.each(['Medical allowance', 'Other allowance', 'PF basic'])(
    'requires a valid %s amount and accepts zero', async (label) => {
      const dialog = await openOverride();
      const input = dialog.getByRole('textbox', { name: new RegExp(label, 'i') });
      const save = dialog.getByRole('button', { name: 'Save override' });

      fireEvent.change(input, { target: { value: '' } });
      expect(save).toBeDisabled();
      fireEvent.change(input, { target: { value: '1..5' } });
      expect(save).toBeDisabled();
      fireEvent.change(input, { target: { value: '-1' } });
      expect(save).toBeDisabled();
      fireEvent.change(input, { target: { value: '0' } });
      expect(save).toBeEnabled();
    }
  );

  it('keeps missing amounts blank until supplied and does not warn for an unavailable gross wage', async () => {
    employeesApi.get.mockResolvedValue({ ...sunil, grossSalaryWage: null, medicalAllowance: null, otherAllowance: undefined, pfBasic: null });
    const dialog = await openOverride();

    expect(screen.queryByText(mismatchMessage)).not.toBeInTheDocument();
    for (const label of ['Medical allowance', 'Other allowance', 'PF basic']) {
      expect(dialog.getByRole('textbox', { name: new RegExp(label, 'i') })).toHaveValue('');
    }
    expect(dialog.getByRole('button', { name: 'Save override' })).toBeDisabled();
  });

  it('shows an error warning on the salary card when the gross wage differs by one paisa', async () => {
    employeesApi.get.mockResolvedValue({ ...sunil, grossSalaryWage: '19999.99' });
    renderAs(['EMPLOYEE_READ', 'EMPLOYEE_UPDATE']);

    expect(await screen.findByRole('alert')).toHaveTextContent(mismatchMessage);
  });

  it.each([
    { grossSalary: '20000.00', grossSalaryWage: 20000 },
    { grossSalary: 0.3, grossSalaryWage: 0.1 + 0.2 },
    { grossSalary: 0, grossSalaryWage: '0.00' },
    { grossSalary: null, grossSalaryWage: 20000 },
    { grossSalary: 20000, grossSalaryWage: undefined },
  ])('does not warn for equal monetary amounts or unavailable totals: %o', async (totals) => {
    employeesApi.get.mockResolvedValue({ ...sunil, ...totals });
    renderAs(['EMPLOYEE_READ', 'EMPLOYEE_UPDATE']);

    await screen.findByText('Salary structure');
    expect(screen.queryByText(mismatchMessage)).not.toBeInTheDocument();
  });

  it('updates the warning as allowances change, excludes PF basic from gross wage and allows saving a mismatch', async () => {
    const dialog = await openOverride();
    const medical = dialog.getByRole('textbox', { name: /medical allowance/i });
    expect(dialog.queryByText(mismatchMessage)).not.toBeInTheDocument();

    fireEvent.change(dialog.getByRole('textbox', { name: /pf basic/i }), { target: { value: '18000' } });
    expect(dialog.queryByText(mismatchMessage)).not.toBeInTheDocument();
    fireEvent.change(medical, { target: { value: '1000.01' } });
    expect(dialog.getByRole('alert')).toHaveTextContent(mismatchMessage);
    expect(dialog.getByRole('button', { name: 'Save override' })).toBeEnabled();
    fireEvent.change(medical, { target: { value: '1000' } });
    expect(dialog.queryByText(mismatchMessage)).not.toBeInTheDocument();
  });

  it('rounds each component to paisa before comparing the live gross wage', async () => {
    employeesApi.get.mockResolvedValue({ ...sunil, grossSalary: 20000.02, grossSalaryWage: 20000.02, medicalAllowance: '1000.005', otherAllowance: '2000.005' });
    const dialog = await openOverride();

    expect(dialog.getByText('Gross wage (proration base):')).toHaveTextContent('20,000.02');
    expect(dialog.queryByText(mismatchMessage)).not.toBeInTheDocument();
  });
});

describe('Employee profile', () => {
  it("shows a supervisor their team member's details, but not their pay or bank details", async () => {
    renderAs(['EMPLOYEE_READ', 'SCOPE_DIRECT_REPORTS']);

    expect(await screen.findByText('Sunil Kadam')).toBeInTheDocument();
    expect(screen.queryByText('Salary structure')).not.toBeInTheDocument();
    expect(screen.queryByText('Statutory & bank details')).not.toBeInTheDocument();
    expect(screen.queryByText('Salary revision history')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reassign supervisor/i })).not.toBeInTheDocument();
    expect(employeesApi.getSalaryRevisions).not.toHaveBeenCalled();
  });

  it('shows HR the pay and bank details as before', async () => {
    renderAs(['EMPLOYEE_READ', 'EMPLOYEE_UPDATE', 'SCOPE_COMPANY']);

    expect(await screen.findByText('Salary structure')).toBeInTheDocument();
    expect(screen.getByText('Statutory & bank details')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reassign supervisor/i })).toBeInTheDocument();
  });

  it("offers HR no way to change their own record - their pay and account are the admin's to change", async () => {
    // Sunil is HR here, looking at himself.
    renderAs(['EMPLOYEE_READ', 'EMPLOYEE_UPDATE', 'SCOPE_COMPANY'], { username: 'EMP001', isAdmin: false });

    // Their own pay is still theirs to read...
    expect(await screen.findByText('Salary structure')).toBeInTheDocument();
    // ...but nothing on the page writes to it.
    for (const name of [/^edit$/i, /reset password/i, /reassign supervisor/i, /revise salary/i, /^override$/i]) {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
    }
  });

  it("gives HR every edit action on someone else's record", async () => {
    renderAs(['EMPLOYEE_READ', 'EMPLOYEE_UPDATE', 'SCOPE_COMPANY'], { username: 'HR001', isAdmin: false });

    expect(await screen.findByRole('button', { name: /^edit$/i })).toBeInTheDocument();
    for (const name of [/reset password/i, /reassign supervisor/i, /revise salary/i, /^override$/i]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
  });

  it('lets an admin change any record, even one that happens to be their own username', async () => {
    renderAs(['EMPLOYEE_READ', 'EMPLOYEE_UPDATE', 'SCOPE_COMPANY'], { username: 'EMP001', isAdmin: true });

    expect(await screen.findByRole('button', { name: /^edit$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /revise salary/i })).toBeInTheDocument();
  });

  it('shows just the user id when the employee has no code', async () => {
    renderAs(['EMPLOYEE_READ', 'EMPLOYEE_UPDATE']);

    expect(await screen.findByText('EMP001')).toBeInTheDocument();
    expect(screen.queryByText(/null/)).not.toBeInTheDocument();
  });
});
