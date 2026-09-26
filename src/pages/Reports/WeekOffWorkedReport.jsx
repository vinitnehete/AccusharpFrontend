import ExceptionReport from './ExceptionReport';
import reportsApi from '../../api/reports';

export default function WeekOffWorkedReport() {
  return (
    <ExceptionReport
      title="Worked on Weekly Off"
      subtitle="Who worked their weekly off - and who punched in on it with no shift assigned, which is either a missing roster or a day worked unpaid"
      fetchFn={reportsApi.weekOffWorked}
    />
  );
}
