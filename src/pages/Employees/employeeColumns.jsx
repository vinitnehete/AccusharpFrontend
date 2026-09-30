import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { labelize } from '../../constants/enums';

/** A cell of two lines: the value, and a quieter detail under it. */
function TwoLines({ main, sub, strong = false }) {
  return (
    <Stack sx={{ justifyContent: 'center', height: '100%', minWidth: 0, lineHeight: 1.3 }}>
      <Typography variant="body2" noWrap sx={{ fontWeight: strong ? 600 : 400 }}>
        {main || '-'}
      </Typography>
      {sub && (
        <Typography variant="caption" color="text.secondary" noWrap>
          {sub}
        </Typography>
      )}
    </Stack>
  );
}

// Related details share a cell - name over user id, department over
// designation, employment over category - so a list of people fits the screen
// instead of scrolling sideways. Shared by the Employees list and My Team.
export const personColumns = [
  {
    field: 'employeeName',
    headerName: 'Employee',
    flex: 1.6,
    minWidth: 180,
    renderCell: ({ row }) => <TwoLines main={row.employeeName} sub={row.userId} strong />,
  },
  {
    field: 'departmentName',
    headerName: 'Department',
    flex: 1.3,
    minWidth: 150,
    renderCell: ({ row }) => <TwoLines main={row.departmentName} sub={row.designationName} />,
  },
  {
    field: 'status',
    headerName: 'Type',
    flex: 1,
    minWidth: 110,
    renderCell: ({ row }) => <TwoLines main={labelize(row.status)} sub={row.categoryName} />,
  },
];

// Two-line rows, and a pointer that says the row opens the person.
export const personRowProps = { rowHeight: 58, sx: { '& .MuiDataGrid-row': { cursor: 'pointer' } } };
