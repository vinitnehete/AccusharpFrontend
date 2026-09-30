// Compact hero used at the top of the inner public pages (Services, About,
// Contact). The Home page has its own, larger one.
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { Eyebrow } from './ui';
import SoftGlow from '../../components/SoftGlow';
import { HEADER_OFFSET } from '../../layout/SiteLayout';

export default function PageHero({ eyebrow, title, subtitle, children }) {
  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', bgcolor: 'background.default' }}>
      <SoftGlow variant="hero" />
      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          pt: { xs: `${HEADER_OFFSET.xs + 48}px`, md: `${HEADER_OFFSET.md + 72}px` },
          pb: { xs: 6, md: 9 },
        }}
      >
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
