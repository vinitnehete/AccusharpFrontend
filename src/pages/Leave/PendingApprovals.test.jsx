import { render, screen } from '@testing-library/react';
import PendingApprovals from './PendingApprovals';
import leavesApi from '../../api/leaves';
import { useAuth } from '../../context/AuthContext';

jest.mock('../../api/leaves', () => ({
  pendingFor: jest.fn(),
  byStatus: jest.fn(),
  supervisorApprove: jest.fn(),
  approve: jest.fn(),
  reject: jest.fn(),
}));
jest.mock('../../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('../../context/ActingAsContext', () => ({
  useActingAs: () => ({ actingAs: { userId: 'HR001', employeeName: 'Meera Joshi' } }),
}));
jest.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: jest.fn() }) }));

const leave = (id, userId, employeeName, status) => ({
  id, userId, employeeName, status, leaveType: 'CASUAL_LEAVE',
  fromDate: '2031-05-13', toDate: '2031-05-13', totalDays: 1, reason: '',
});

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ can: (code) => ['LEAVE_SUPERVISOR_APPROVE', 'LEAVE_APPROVE'].includes(code) });
  // Meera (HR, the signed-in user) has a request in each queue, and so does Nikhil.
  leavesApi.pendingFor.mockResolvedValue([
    leave(1, 'HR001', 'Meera Joshi', 'PENDING'),
    leave(2, 'EMP008', 'Nikhil Rao', 'PENDING'),
  ]);
  leavesApi.byStatus.mockResolvedValue([
    leave(3, 'HR001', 'Meera Joshi', 'SUPERVISOR_APPROVED'),
    leave(4, 'EMP008', 'Nikhil Rao', 'SUPERVISOR_APPROVED'),
  ]);
});

describe('Pending approvals', () => {
  it("offers no decision on your own leave - that is the admin's, or your supervisor's - but still on everyone else's", async () => {
    render(<PendingApprovals />);

    expect(await screen.findAllByText('Nikhil Rao')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /endorse/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /^approve/i })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: /reject/i })).toHaveLength(2);
    expect(screen.getAllByText(/not yours to decide/i)).toHaveLength(2);
  });
});
