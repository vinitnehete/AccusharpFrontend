import client from './client';

const get = (path, params) => client.get(path, { params }).then((r) => r.data);

// Server-rendered CSV as a blob, for utils/download.js#downloadBlob. Preferred
// over exporting the on-screen grid because the monthly sheet appends the
// contractor's own totals below the rows - the figure they invoice against
// travels in the same file as the rows it came from.
const getCsv = (path, params) =>
  client.get(path, { params, responseType: 'blob' }).then((r) => r.data);

/**
 * Labour contractors, the workforce they deploy, that workforce's attendance,
 * and the reports sent back to them.
 *
 * Deliberately a separate module from employees.js. These endpoints address a
 * population this company does not pay: no salary structure, no statutory
 * identifiers, no bank details, no login. Sharing employees.js would make it
 * far too easy to send a contractor worker down a payroll path by reflex.
 */
const contractors = {
  // ---- contractors --------------------------------------------------------
  list: (activeOnly = false) => get('/contractors', { activeOnly }),
  get: (id) => get(`/contractors/${id}`),
  create: (payload) => client.post('/contractors', payload).then((r) => r.data),
  update: (id, payload) => client.put(`/contractors/${id}`, payload).then((r) => r.data),
  // Deactivates, never deletes - a report already sent has to keep resolving
  // the contractor it went to. Refused (409) while workers are still deployed.
  deactivate: (id) => client.delete(`/contractors/${id}`).then((r) => r.data),
  reactivate: (id) => client.post(`/contractors/${id}/reactivate`).then((r) => r.data),

  // ---- the workforce ------------------------------------------------------
  // Omit contractorId for every contractor's workers at once; each row carries
  // its own contractorName, which is what makes the mixed list readable.
  workforce: (contractorId, activeOnly = false) =>
    get('/contractors/employees', { contractorId: contractorId || undefined, activeOnly }),
  employeesOf: (contractorId) => get(`/contractors/${contractorId}/employees`),
  getEmployee: (employeeId) => get(`/contractors/employees/${employeeId}`),
  addEmployee: (contractorId, payload) =>
    client.post(`/contractors/${contractorId}/employees`, payload).then((r) => r.data),
  updateEmployee: (employeeId, payload) =>
    client.put(`/contractors/employees/${employeeId}`, payload).then((r) => r.data),
  // Same person on site, different agency supplying them. Attendance already
  // generated stays where it is - it is keyed by userId, not by contractor.
  reassignEmployee: (employeeId, contractorId) =>
    client
      .patch(`/contractors/employees/${employeeId}/contractor`, null, { params: { contractorId } })
      .then((r) => r.data),
  deactivateEmployee: (employeeId) =>
    client.delete(`/contractors/employees/${employeeId}`).then((r) => r.data),
  reactivateEmployee: (employeeId) =>
    client.post(`/contractors/employees/${employeeId}/reactivate`).then((r) => r.data),

  // ---- attendance ---------------------------------------------------------
  // The same engine the company console runs, over one contractor's workers
  // only. includeUnrostered defaults to false here (it is true company-side):
  // contractor staff are rostered only for the days they are actually sent in,
  // so an unrostered day means "not deployed", not "absent".
  generateAttendance: (contractorId, { month, overwriteManual, dryRun, includeUnrostered }) =>
    client
      .post(`/contractors/${contractorId}/attendance/generate`, null, {
        params: { month, overwriteManual, dryRun, includeUnrostered },
      })
      .then((r) => r.data),

  // ---- reports ------------------------------------------------------------
  monthlyReport: (contractorId, month) =>
    get(`/contractors/${contractorId}/reports/attendance/monthly`, { month }),
  monthlyReportCsv: (contractorId, month) =>
    getCsv(`/contractors/${contractorId}/reports/attendance/monthly/export`, { month }),
  dailyRegister: (contractorId, from, to) =>
    get(`/contractors/${contractorId}/reports/attendance/daily`, { from, to }),
  dailyRegisterCsv: (contractorId, from, to) =>
    getCsv(`/contractors/${contractorId}/reports/attendance/daily/export`, { from, to }),
  // One line per contractor - the only place a company with several sees them
  // side by side.
  allContractorsSummary: (month) => get('/contractors/reports/attendance/summary', { month }),
  allContractorsSummaryCsv: (month) =>
    getCsv('/contractors/reports/attendance/summary/export', { month }),
};

export default contractors;
