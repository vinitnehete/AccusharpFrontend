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

const renderList = (permissions = ['EMPLOYEE_UPDATE', 'EMPLOYEE_DELETE']) => {
  useAuth.mockReturnValue({ can: (code) => permissions.includes(code) });
  employeesApi.list.mockResolvedValue([meera]);
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

  it('offers no edit or deactivate without the permissions', async () => {
    renderList([]);

    expect(await screen.findByText('Meera Joshi')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit Meera Joshi' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Deactivate Meera Joshi' })).not.toBeInTheDocument();
  });
});
