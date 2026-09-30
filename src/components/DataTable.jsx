import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';
import { DataGrid } from '@mui/x-data-grid';

function DefaultEmptyState({ title = 'No records found', description, action }) {
  return (
    <Stack
      sx={{ alignItems: 'center', justifyContent: 'center', height: '100%', p: 3, textAlign: 'center' }}
      spacing={1}
    >
      <Box
        aria-hidden
        sx={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'surfaceAlt',
          border: 1,
          borderColor: 'divider',
          color: 'text.tertiary',
          mb: 0.5,
        }}
      >
        <InboxOutlinedIcon fontSize="small" />
      </Box>
      <Typography variant="subtitle1">{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
          {description}
        </Typography>
      )}
      {action}
    </Stack>
  );
}

export default function DataTable({
  rows,
  columns,
  loading,
  getRowId,
  pageSize = 10,
  height = 560,
  density = 'standard',
  emptyState,
  sx,
  'data-testid': dataTestId,
  ...rest
}) {
  return (
    <Paper
      variant="outlined"
      sx={{ borderColor: 'divider', borderRadius: '14px', overflow: 'hidden' }}
      data-testid={dataTestId}
    >
      <Box sx={{ height, width: '100%' }}>
        <DataGrid
          rows={rows || []}
          columns={columns}
          loading={loading}
          getRowId={getRowId}
          density={density}
          disableRowSelectionOnClick
          initialState={{
            pagination: { paginationModel: { pageSize, page: 0 } },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          slots={{ noRowsOverlay: () => <DefaultEmptyState {...emptyState} /> }}
          sx={[
            { border: 'none', '--DataGrid-overlayHeight': '220px' },
            ...(Array.isArray(sx) ? sx : [sx]),
          ]}
          {...rest}
        />
      </Box>
    </Paper>
  );
}
