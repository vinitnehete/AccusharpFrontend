// Compact hero used at the top of the inner public pages (Services, About,
// Contact). The Home page has its own, larger one.
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';
import { Eyebrow } from './ui';

export default function PageHero({ eyebrow, title, subtitle, children }) {
  return (
    <Box
      sx={(theme) => ({
        borderBottom: 1,
        borderColor: 'divider',
        background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.07)} 0%, ${
          theme.palette.background.paper
        } 100%)`,
      })}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 9 } }}>
        <Box sx={{ maxWidth: 760 }}>
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <Typography variant="h2" sx={{ mt: 1, fontSize: { xs: '2rem', md: '2.5rem' } }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mt: 2, fontSize: '1.0625rem' }}
            >
              {subtitle}
            </Typography>
          )}
          {children && <Box sx={{ mt: 3.5 }}>{children}</Box>}
        </Box>
      </Container>
    </Box>
  );
}
