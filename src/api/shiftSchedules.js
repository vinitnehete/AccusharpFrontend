import client from './client';

const shiftSchedules = {
  assignOne: (payload) => client.post('/shift-schedules', payload).then((r) => r.data),
  bulkAssign: (payload) => client.post('/shift-schedules/bulk', payload).then((r) => r.data),
  autoRotate: (payload) => client.post('/shift-schedules/auto-rotate', payload).then((r) => r.data),
  copyMonth: (payload) => client.post('/shift-schedules/copy-month', payload).then((r) => r.data),
  swap: (payload) => client.post('/shift-schedules/swap', payload).then((r) => r.data),
  holidayOverride: (month) =>
    client
      .post('/shift-schedules/holiday-override', null, { params: { month } })
      .then((r) => r.data),
  forUser: (userId, fromDate, toDate) =>
    client
      .get(`/shift-schedules/${userId}`, { params: { fromDate, toDate } })
      .then((r) => r.data),
  // contractorId switches the population to that contractor's deployed
  // workforce instead of the company's own staff. The two are never merged
  // into one grid - the shift catalog is shared, the roster screens are not.
  planner: (month, supervisorUserId, contractorId) =>
    client
      .get('/shift-schedules/planner', { params: { month, supervisorUserId, contractorId } })
      .then((r) => r.data),
  deleteRange: (userId, fromDate, toDate) =>
    client
      .delete(`/shift-schedules/${userId}`, { params: { fromDate, toDate } })
      .then((r) => r.data),
  // CSV roster upload, one row per employee-day-shift - unlike bulkAssign(), each row can
  // carry its own shift code, so one file can roster a whole team across different shifts
  // and days. Every row applies independently; returns BulkImportResult<ShiftScheduleResponse>.
  bulkImportCsv: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return client
      .post('/shift-schedules/bulk/csv', formData, { headers: { 'Content-Type': undefined } })
      .then((r) => r.data);
  },
};

export default shiftSchedules;
