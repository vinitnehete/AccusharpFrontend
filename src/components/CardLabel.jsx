import Box from '@mui/material/Box';

// The small grey label chip that titles a card or a block inside one
// ("Workforce & attendance", "Earnings").
export default function CardLabel({ children, sx }) {
  return (
    <Box
      component="span"
      sx={[
        {
          display: 'inline-flex',
          alignItems: 'center',
          px: 1.25,
          py: 0.5,
          borderRadius: '8px',
          bgcolor: '#F1F3F7',
          color: 'text.primary',
          fontSize: '0.8125rem',
          fontWeight: 500,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Box>
  );
}
