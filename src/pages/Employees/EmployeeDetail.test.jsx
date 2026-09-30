import { render, screen } from '@testing-library/react';
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
jest.mock('../../api/employees', () => ({ get: jest.fn(), team: jest.fn(), getSalaryRevisions: jest.fn() }));
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
  weekOffDays: ['SUNDAY'],
};

const renderAs = (permissions) => {
  useAuth.mockReturnValue({ can: (code) => permissions.includes(code) });
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

  it('shows just the user id when the employee has no code', async () => {
    renderAs(['EMPLOYEE_READ', 'EMPLOYEE_UPDATE']);

    expect(await screen.findByText('EMP001')).toBeInTheDocument();
    expect(screen.queryByText(/null/)).not.toBeInTheDocument();
  });
});
