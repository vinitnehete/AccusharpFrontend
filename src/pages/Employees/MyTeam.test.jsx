import { fireEvent, render, screen } from '@testing-library/react';
import MyTeam from './MyTeam';
import employeesApi from '../../api/employees';

const mockNavigate = jest.fn();
// react-router v7 does not load under this Jest; the page only needs navigate.
jest.mock('react-router-dom', () => ({ useNavigate: () => mockNavigate }));
jest.mock('../../api/employees', () => ({ team: jest.fn() }));
jest.mock('../../context/ActingAsContext', () => ({
  useActingAs: () => ({ actingAs: { userId: 'SUP001', employeeName: 'Rakesh Patil' } }),
}));

const sunil = {
  id: 12,
  employeeCode: 'E-012',
  userId: 'EMP001',
  employeeName: 'Sunil Kadam',
  departmentName: 'Production',
  designationName: 'Fitter',
  categoryName: 'Worker',
  status: 'DAY_WISE',
  recordStatus: 'ACTIVE',
};

beforeEach(() => {
  jest.clearAllMocks();
  employeesApi.team.mockResolvedValue([sunil]);
});

describe('My Team', () => {
  it('fits each person on one row, the same way as the Employees list', async () => {
    render(<MyTeam />);

    expect(await screen.findByText('Sunil Kadam')).toBeInTheDocument();
    expect(screen.getByText('EMP001')).toBeInTheDocument();
    expect(screen.getByText('Fitter')).toBeInTheDocument();
    expect(screen.getByText('Worker')).toBeInTheDocument();
    expect(screen.queryByText(/E-012/)).not.toBeInTheDocument();
  });

  it("opens the person's profile when their row is clicked", async () => {
    render(<MyTeam />);

    fireEvent.click(await screen.findByText('Fitter'));

    expect(mockNavigate).toHaveBeenCalledWith('/employees/12');
  });
});
