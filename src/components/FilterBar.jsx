import Stack from '@mui/material/Stack';

// The row of search / filter fields above a table. Uses real flex gaps, so
// fields that wrap onto a second line start flush left instead of inheriting
// a sibling margin, and on a phone every field takes the full width.
export default function FilterBar({ children, sx }) {
  return (
    <Stack
      direction="row"
      spacing={1.5}
      useFlexGap
      sx={[
        {
          mb: 2.5,
          flexWrap: 'wrap',
          alignItems: 'center',
          '& > .MuiFormControl-root, & > .MuiAutocomplete-root': {
            flex: { xs: '1 1 100%', sm: '0 1 auto' },
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Stack>
  );
}
