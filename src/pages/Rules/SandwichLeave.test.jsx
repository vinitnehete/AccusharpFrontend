import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import dayjs from 'dayjs';
import SandwichLeave from './SandwichLeave';
import attendancePolicyApi from '../../api/attendancePolicy';
import { useAuth } from '../../context/AuthContext';

jest.mock('../../api/attendancePolicy', () => ({ list: jest.fn(), create: jest.fn(), save: jest.fn(), remove: jest.fn() }));
jest.mock('../../context/AuthContext', () => ({ useAuth: jest.fn() }));
jest.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar: jest.fn() }) }));
// react-router v7 does not load under this Jest; a plain anchor is all a link needs.
jest.mock('react-router-dom', () => {
  const { forwardRef } = jest.requireActual('react');
  return { Link: forwardRef(({ to, children, ...rest }, ref) => <a ref={ref} href={to} {...rest}>{children}</a>) };
});
// The rule form has its own screen and tests; here it only has to open with the right rule.
jest.mock('../Attendance/PolicyRuleDialog', () => (props) =>
  props.open ? <div role="dialog">form for {props.preset.ruleType} / {props.preset.scope}</div> : null);

const companyRule = (overrides = {}) => ({
  id: 7,
  scope: 'COMPANY',
  scopeRef: '*',
  ruleType: 'SANDWICH_LEAVE',
  version: 1,
  effectiveFrom: '2026-08-01',
  enabled: true,
  params: '{"adjacentLeaveUnpaid":true}',
  ...overrides,
});

const renderPage = (rules, permissions = ['ATTENDANCE_POLICY_READ', 'ATTENDANCE_POLICY_MANAGE']) => {
  attendancePolicyApi.list.mockResolvedValue(rules);
  useAuth.mockReturnValue({ can: (code) => permissions.includes(code) });
  render(<SandwichLeave />);
};

beforeEach(() => {
  jest.clearAllMocks();
  attendancePolicyApi.create.mockResolvedValue({});
  attendancePolicyApi.remove.mockResolvedValue({});
});

describe('Sandwich leave tab', () => {
  it('says the rule is off until the company switches it on', async () => {
    renderPage([]);

    expect(await screen.findByText('Off')).toBeInTheDocument();
    expect(screen.getByText(/every public holiday is paid as usual/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Switch on' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('form for SANDWICH_LEAVE / COMPANY');
  });

  it('shows when it is on for everyone, and what it does', async () => {
    renderPage([companyRule(), { ...companyRule({ id: 8, ruleType: 'LATE_ARRIVAL' }) }]);

    expect(await screen.findByText('On for everyone')).toBeInTheDocument();
    expect(screen.getByText(/since 1 Aug 2026/)).toBeInTheDocument();
    expect(screen.getByText(/paid leave next to it too/i)).toBeInTheDocument();
  });

  it('switching off saves a new version that says off, from next month', async () => {
    renderPage([companyRule()]);

    fireEvent.click(await screen.findByRole('button', { name: 'Switch off' }));
    fireEvent.click(screen.getByRole('button', { name: 'Switch it off' }));

    await waitFor(() => expect(attendancePolicyApi.create).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: 'COMPANY',
        scopeRef: '*',
        ruleType: 'SANDWICH_LEAVE',
        enabled: false,
        effectiveFrom: dayjs().add(1, 'month').startOf('month').format('YYYY-MM-DD'),
        params: { adjacentLeaveUnpaid: true },
      })
    ));
  });

  it('a switch-on that has not started yet can be cancelled outright', async () => {
    renderPage([companyRule({ effectiveFrom: '2099-01-01' })]);

    expect(await screen.findByText(/Starts 1 Jan 2099/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel it' }));
    await waitFor(() => expect(attendancePolicyApi.remove).toHaveBeenCalledWith(7));
  });

  it('lists a group that is treated differently', async () => {
    renderPage([companyRule(), companyRule({ id: 9, scope: 'CATEGORY', scopeRef: 'MANAGER', enabled: false })]);

    expect(await screen.findByText(/A category \(grade\) MANAGER: off/)).toBeInTheDocument();
  });

  it('explains the rule with the 15 August examples', async () => {
    renderPage([]);

    expect(await screen.findByText('Leave 14th · Holiday 15th · Leave 16th')).toBeInTheDocument();
    expect(screen.getByText(/14th, 15th and 16th all unpaid/)).toBeInTheDocument();
    expect(screen.getByText(/the weekly off is looked past/)).toBeInTheDocument();
  });

  it('offers no switches to someone who may only read the rules', async () => {
    renderPage([], ['ATTENDANCE_POLICY_READ']);

    expect(await screen.findByText('Off')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Switch on' })).not.toBeInTheDocument();
  });
});
