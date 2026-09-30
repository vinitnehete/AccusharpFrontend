import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{
        mb: { xs: 3, md: 3.5 },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'center' },
      }}
    >
      <Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
        <Typography variant="h4" component="h1" sx={{ color: 'text.primary' }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack
          direction="row"
          spacing={1.25}
          useFlexGap
          // Actions keep their natural width (the title's text wraps first) and
          // only wrap past two-thirds of the row - then as whole buttons, never
          // as three-line pills, also when a page passes its own row Stack.
          sx={{
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: { sm: 'flex-end' },
            flexShrink: 0,
            maxWidth: { xs: '100%', sm: '66%' },
            '& .MuiButton-root': { whiteSpace: 'nowrap' },
            '& > .MuiStack-root': {
              flexWrap: 'wrap',
              gap: 1.25,
              '& > :not(style) ~ :not(style)': { ml: 0 },
            },
          }}
        >
          {actions}
        </Stack>
      )}
    </Stack>
  );
}
