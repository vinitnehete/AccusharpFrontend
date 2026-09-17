import ExcelJS from 'exceljs';

// Mirrors EmployeeCsvParser.java's expected header exactly (recordStatus
// included - the parser accepts it even though the old CSV template omitted
// it). Order here is cosmetic only: the parser matches columns by name, not
// position, so grouping "info" and "salary structure" columns together is
// purely to make the sheet easier to read.
const INFO_COLUMNS = [
  { field: 'userId', required: true },
  { field: 'employeeCode', required: true },
  { field: 'employeeName', required: true },
  { field: 'companyId', required: false },
  { field: 'departmentId', required: false },
  { field: 'designationId', required: false },
  { field: 'categoryId', required: false },
  { field: 'supervisorUserId', required: false },
  { field: 'joiningDate', required: false },
  { field: 'dateOfBirth', required: false },
  { field: 'gender', required: false },
  { field: 'status', required: true },
  { field: 'recordStatus', required: false },
  { field: 'role', required: false },
  { field: 'email', required: false },
  { field: 'phone', required: false },
  { field: 'uanNo', required: false },
  { field: 'esicIpNo', required: false },
  { field: 'bankAccountNo', required: false },
  { field: 'bankIfscNo', required: false },
];

const SALARY_COLUMNS = [
  { field: 'grossSalary', required: true },
  { field: 'pfBasic', required: true },
  { field: 'medicalAllowance', required: true },
  { field: 'otherAllowance', required: true },
  { field: 'overtimeEligible', required: false },
  { field: 'weekOffDays', required: false },
  { field: 'basicDA', required: false },
  { field: 'hra', required: false },
  { field: 'conveyanceAllowance', required: false },
  { field: 'educationAllowance', required: false },
];

const COLUMNS = [...INFO_COLUMNS, ...SALARY_COLUMNS];

const EXAMPLE_ROW = {
  userId: 'EMP010', employeeCode: 'AC010', employeeName: 'Jane Doe', companyId: '',
  departmentId: '1', designationId: '1', categoryId: '', supervisorUserId: 'SUP001',
  joiningDate: '2026-09-01', dateOfBirth: '1995-04-12', gender: 'FEMALE',
  status: 'PERMANENT', recordStatus: 'ACTIVE', role: 'EMPLOYEE',
  email: 'jane.doe@example.com', phone: '9876543210',
  uanNo: '', esicIpNo: '', bankAccountNo: '', bankIfscNo: '',
  grossSalary: '30000', pfBasic: '15000',
  medicalAllowance: '1250', otherAllowance: '1250', overtimeEligible: 'false',
  // Day names in any order and any case; SAT/SUN abbreviations work too. Blank
  // leaves the employee unconfigured: Sunday for permanent staff, no weekly off
  // for anyone else.
  // NONE is the explicit "this employee has no weekly off".
  weekOffDays: 'SUNDAY',
  // Left blank so the example row still derives from the salary rule, same as before -
  // fill in all four (never just some) on a row to pin its exact structure instead.
  basicDA: '', hra: '', conveyanceAllowance: '', educationAllowance: '',
};

const STATUS_OPTIONS = ['PERMANENT', 'DAY_WISE', 'CONTRACT', 'INTERN'];
const RECORD_STATUS_OPTIONS = ['ACTIVE', 'INACTIVE'];
const ROLE_OPTIONS = ['ADMIN', 'HR', 'SUPERVISOR', 'EMPLOYEE'];
const GENDER_OPTIONS = ['MALE', 'FEMALE'];
const BOOLEAN_OPTIONS = ['true', 'false'];

const HEADER_ROW = 6;
const EXAMPLE_ROW_NUMBER = 7;
const DATA_VALIDATION_ROW_COUNT = 200;

const RED = 'FFC62828';
const INFO_FILL = 'FF1565C0';
const SALARY_FILL = 'FF2E7D32';
const EXAMPLE_FILL = 'FFF5F5F5';

// Base-26 Excel column letters (A, B, ... Z, AA, AB, ...) - a plain
// String.fromCharCode(65 + index) only holds up to column Z (index 25),
// which the sheet now exceeds with 29 columns.
function colLetter(index) {
  let n = index + 1;
  let letters = '';
  while (n > 0) {
    const remainder = (n - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

function addDropdown(sheet, field, options) {
  const colIndex = COLUMNS.findIndex((c) => c.field === field);
  if (colIndex === -1) return;
  const letter = colLetter(colIndex);
  for (let row = EXAMPLE_ROW_NUMBER + 1; row <= EXAMPLE_ROW_NUMBER + DATA_VALIDATION_ROW_COUNT; row += 1) {
    sheet.getCell(`${letter}${row}`).dataValidation = {
      type: 'list',
      allowBlank: true,
      formulae: [`"${options.join(',')}"`],
      showErrorMessage: true,
      errorTitle: 'Invalid value',
      error: `Must be one of: ${options.join(', ')}`,
    };
  }
}

export async function downloadEmployeeTemplate() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Employees');
  const lastCol = colLetter(COLUMNS.length - 1);

  sheet.mergeCells(`A1:${lastCol}1`);
  sheet.getCell('A1').value = 'Employee Bulk Import Template';
  sheet.getCell('A1').font = { bold: true, size: 14 };

  sheet.mergeCells(`A2:${lastCol}2`);
  sheet.getCell('A2').value =
    'Fill in one row per employee starting at row 8 (the example row can be overwritten or deleted). ' +
    'Dates must be yyyy-MM-dd. When finished, use File → Save As → CSV (Comma delimited) (.csv) ' +
    'before uploading — the upload only accepts .csv files.';
  sheet.getCell('A2').alignment = { wrapText: true };
  sheet.getCell('A2').font = { italic: true, color: { argb: 'FF555555' } };
  sheet.getRow(2).height = 30;

  sheet.getCell('A3').value = 'Required field';
  sheet.getCell('A3').font = { bold: true, color: { argb: RED } };
  sheet.getCell('B3').value = 'Optional field';
  sheet.getCell('B3').font = { color: { argb: 'FF000000' } };

  sheet.mergeCells(`A5:${colLetter(INFO_COLUMNS.length - 1)}5`);
  sheet.getCell('A5').value = 'Employee Information';
  sheet.mergeCells(`${colLetter(INFO_COLUMNS.length)}5:${lastCol}5`);
  sheet.getCell(`${colLetter(INFO_COLUMNS.length)}5`).value = 'Salary Structure';
  ['A5', colLetter(INFO_COLUMNS.length) + '5'].forEach((ref, i) => {
    const cell = sheet.getCell(ref);
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i === 0 ? INFO_FILL : SALARY_FILL } };
    cell.alignment = { horizontal: 'center' };
  });

  COLUMNS.forEach((col, i) => {
    const cell = sheet.getRow(HEADER_ROW).getCell(i + 1);
    cell.value = col.required ? `${col.field} *` : col.field;
    cell.font = col.required ? { bold: true, color: { argb: RED } } : { bold: true };
    cell.alignment = { horizontal: 'left' };
    sheet.getColumn(i + 1).width = Math.max(14, col.field.length + 4);
  });

  const exampleRow = sheet.getRow(EXAMPLE_ROW_NUMBER);
  COLUMNS.forEach((col, i) => {
    const cell = exampleRow.getCell(i + 1);
    cell.value = EXAMPLE_ROW[col.field] ?? '';
    cell.font = { italic: true, color: { argb: 'FF999999' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: EXAMPLE_FILL } };
  });

  addDropdown(sheet, 'status', STATUS_OPTIONS);
  addDropdown(sheet, 'recordStatus', RECORD_STATUS_OPTIONS);
  addDropdown(sheet, 'role', ROLE_OPTIONS);
  addDropdown(sheet, 'gender', GENDER_OPTIONS);
  addDropdown(sheet, 'overtimeEligible', BOOLEAN_OPTIONS);

  sheet.views = [{ state: 'frozen', ySplit: HEADER_ROW }];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'employee-bulk-import-template.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const EMPLOYEE_TEMPLATE_COLUMNS = COLUMNS.map((c) => c.field);
