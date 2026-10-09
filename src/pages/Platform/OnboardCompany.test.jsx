import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import OnboardCompany from './OnboardCompany';
import companiesApi from '../../api/companies';

jest.mock('../../api/companies', () => ({ onboard: jest.fn() }));
jest.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: jest.fn() }) }));

const type = (label, value) => fireEvent.change(screen.getByLabelText(new RegExp(`^${label}`)), { target: { value } });

beforeEach(() => {
  jest.clearAllMocks();
  companiesApi.onboard.mockResolvedValue({ admin: { userId: 'ACME-ADMIN' }, temporaryPassword: 'x' });
});

describe('Onboard company', () => {
  it('asks for the admin account only - no salary, PF basic or employee code, since the admin is not an employee', () => {
    render(<OnboardCompany />);

    expect(screen.getByLabelText(/^User ID/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/gross salary/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/pf basic/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/employee code/i)).not.toBeInTheDocument();
  });

  it('onboards with just the company and the admin login, and sends no pay', async () => {
    render(<OnboardCompany />);
    const button = screen.getByRole('button', { name: /onboard company/i });
    expect(button).toBeDisabled();

    type('Company code', 'ACME');
    type('Company name', 'Acme Industries');
    type('User ID', 'ACME-ADMIN');
    type('Name', 'Acme Owner');
    expect(button).toBeEnabled();
    fireEvent.click(button);

    await waitFor(() => expect(companiesApi.onboard).toHaveBeenCalledTimes(1));
    const sent = companiesApi.onboard.mock.calls[0][0];
    expect(sent).toMatchObject({ companyCode: 'ACME', companyName: 'Acme Industries', adminUserId: 'ACME-ADMIN', adminName: 'Acme Owner' });
    expect(sent).not.toHaveProperty('adminGrossSalary');
    expect(sent).not.toHaveProperty('adminPfBasic');
    expect(sent).not.toHaveProperty('adminEmployeeCode');
  });
});
