import client from './client';

const attendance = {
  generate: (payload) => client.post('/attendance/generate', payload).then((r) => r.data),
  records: (userId, month) =>
    client.get(`/attendance/${userId}/records`, { params: { month } }).then((r) => r.data),
  correct: (userId, date, payload) =>
    client.put(`/attendance/${userId}/${date}`, payload).then((r) => r.data),
  unlock: (userId, month, actorId) =>
    client
      .post(`/attendance/${userId}/unlock`, null, { params: { month, actorId } })
      .then((r) => r.data),
  range: (userId, fromDate, toDate) =>
    client.get(`/attendance/${userId}`, { params: { fromDate, toDate } }).then((r) => r.data),
  monthly: (userId, month) =>
    client.get(`/attendance/${userId}/monthly`, { params: { month } }).then((r) => r.data),
  // Declares a stretch of days with no punch times, for staff who are not on
  // the biometric device (or any period a device outage left without punches).
  // Days it declines to write come back in `skipped` with a reason.
  bulkUpload: (payload) => client.post('/attendance/bulk-upload', payload).then((r) => r.data),
  // Same thing for many employees from one CSV:
  // userId, fromDate, toDate, status, remarks.
  bulkUploadCsv: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return client
      .post('/attendance/bulk-upload/csv', formData, { headers: { 'Content-Type': undefined } })
      .then((r) => r.data);
  },
  refreshSummaries: (month) =>
    client
      .post('/attendance/summaries/refresh', null, { params: { month } })
      .then((r) => r.data),
};

export default attendance;
