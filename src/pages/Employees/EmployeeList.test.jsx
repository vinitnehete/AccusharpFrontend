import { fireEvent, render, screen } from '@testing-library/react';
import EmployeeList from './EmployeeList';
import employeesApi from '../../api/employees';
import { useAuth } from '../../context/AuthContext';

const mockNavigate = jest.fn();
// react-router v7 does not load under this Jest; the list only needs navigate.
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));
jest.mock('../../api/employees', () => ({ list: jest.fn(), deactivate: jest.fn() }));
jest.mock('../../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../context/ActingAsContext', () => ({ useActingAs: () => ({ reloadEmployees: jest.fn() }) }));
jest.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: jest.fn() }) }));

const meera = {
  id: 7,
  employeeCode: 'E-007',
  userId: 'HR001',
  employeeName: 'Meera Joshi',
  departmentName: 'Admin',
  designationName: 'HR Manager',
  categoryName: 'Staff',
  supervisorName: 'Rakesh Patil',
  role: 'HR',
  status: 'PERMANENT',
  recordStatus: 'ACTIVE',
};

const nikhil = { ...meera, id: 8, userId: 'EMP008', employeeName: 'Nikhil Rao', role: 'EMPLOYEE', supervisorName: null };

const renderList = (permissions = ['EMPLOYEE_UPDATE', 'EMPLOYEE_DELETE'], session = {}, rows = [meera]) => {
  useAuth.mockReturnValue({ can: (code) => permissions.includes(code), ...session });
  employeesApi.list.mockResolvedValue(rows);
  render(<EmployeeList />);
};

beforeEach(() => jest.clearAllMocks());

describe('Employees list', () => {
  it('fits each employee on one row - name over user id, department over designation, no employee code', async () => {
    renderList();

    expect(await screen.findByText('Meera Joshi')).toBeInTheDocument();
    expect(screen.getByText('HR001')).toBeInTheDocument();
    expect(screen.queryByText(/E-007/)).not.toBeInTheDocument();
    expect(screen.getByText('HR Manager')).toBeInTheDocument();
    expect(screen.getByText('Staff')).toBeInTheDocument();
  });

  it('opens the employee when their row is clicked', async () => {
    renderList();

    fireEvent.click(await screen.findByText('Rakesh Patil'));

    expect(mockNavigate).toHaveBeenCalledWith('/employees/7');
  });

  it('edit opens the edit form only, not the profile as well', async () => {
    renderList();

    fireEvent.click(await screen.findByRole('button', { name: 'Edit Meera Joshi' }));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/employees/7/edit');
  });

  it("offers HR no edit or deactivate on their own row, but on everyone else's", async () => {
    renderList(['EMPLOYEE_UPDATE', 'EMPLOYEE_DELETE'], { username: 'HR001', isAdmin: false }, [meera, nikhil]);

    expect(await screen.findByText('Nikhil Rao')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit Meera Joshi' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Deactivate Meera Joshi' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit Nikhil Rao' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deactivate Nikhil Rao' })).toBeInTheDocument();
  });

  it('gives an admin edit and deactivate on every row', async () => {
    renderList(['EMPLOYEE_UPDATE', 'EMPLOYEE_DELETE'], { username: 'HR001', isAdmin: true }, [meera, nikhil]);

    expect(await screen.findByRole('button', { name: 'Edit Meera Joshi' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Deactivate Meera Joshi' })).toBeInTheDocument();
  });

  it('offers no edit or deactivate without the permissions', async () => {
    renderList([]);

    expect(await screen.findByText('Meera Joshi')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit Meera Joshi' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Deactivate Meera Joshi' })).not.toBeInTheDocument();
  });
});
