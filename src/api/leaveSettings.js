import client from './client';

// The caller's company's leave year: January (calendar) or April (financial).
const leaveSettings = {
  get: () => client.get('/leave-settings').then((r) => r.data),
  update: (leaveYearStartMonth) =>
    client.put('/leave-settings', { leaveYearStartMonth }).then((r) => r.data),
};

export default leaveSettings;
