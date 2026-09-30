import { useState } from 'react';
import { Link as RouterLink, Navigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../../context/AuthContext';
import { BRAND } from '../../constants/brand';
import { tokens } from '../../theme/theme';
import SoftGlow from '../../components/SoftGlow';

// Copy for the brand panel beside the form. Login-screen copy, deliberately
// kept here rather than in the marketing content file - this screen belongs to
// the application, not to the public site. The headline is set in two voices:
// a serif italic lead and a bold sans close.
const PANEL_HEADLINE_LEAD = 'The whole month,';
const PANEL_HEADLINE_CLOSE = 'in one place.';
const PANEL_SUB =
  'Review attendance, approve leave, run payroll and pull the registers your filing needs.';
const PANEL_POINTS = [
  'Punches reviewed, not just recorded',
  'Payroll you can reproduce months later',
  'PF, ESIC, PT and TDS from one rule',
];

function BrandLockup({ size = 36 }) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
      <Box
        aria-hidden
        sx={{
          width: size,
          height: size,
          borderRadius: '10px',
          display: 'grid',
          placeItems: 'center',
          color: 'common.white',
          fontWeight: 700,
          fontSize: size * 0.46,
          background: 'linear-gradient(140deg, #4F8BF9 0%, #2563EB 55%, #1D4ED8 100%)',
          boxShadow: `inset 0 1px 0 ${alpha('#FFFFFF', 0.25)}, 0 2px 6px ${alpha('#2563EB', 0.3)}`,
        }}
      >
        {BRAND.initial}
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
          {BRAND.name}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', letterSpacing: '0.04em' }}>
          HRMS
        </Typography>
      </Box>
    </Stack>
  );
}

// The story beside the form. Hidden below md, where the form stands alone.
function BrandPanel() {
  return (
    <Box sx={{ display: { xs: 'none', md: 'block' }, maxWidth: 480 }}>
      <Typography
        component="h2"
        sx={{
          fontSize: { md: '2.75rem', lg: '3.25rem' },
          lineHeight: 1.05,
          letterSpacing: '-0.03em',
          color: 'text.primary',
        }}
      >
        <Box
          component="span"
          sx={{ display: 'block', fontFamily: tokens.font.serif, fontStyle: 'italic', fontWeight: 400 }}
        >
          {PANEL_HEADLINE_LEAD}
        </Box>
        <Box component="span" sx={{ display: 'block', fontWeight: 700 }}>
          {PANEL_HEADLINE_CLOSE}
        </Box>
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mt: 2.5, fontSize: '1.0625rem', maxWidth: 420 }}>
        {PANEL_SUB}
      </Typography>
      <Stack spacing={1.5} sx={{ mt: 4 }}>
        {PANEL_POINTS.map((point) => (
          <Stack key={point} direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'background.paper',
                border: 1,
                borderColor: 'divider',
                color: 'primary.main',
                flexShrink: 0,
              }}
            >
              <CheckRoundedIcon sx={{ fontSize: 15 }} />
            </Box>
            <Typography variant="body1">{point}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

export default function Login() {
  const { login, isAuthenticated, initializing } = useAuth();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Identity is no longer seeded synchronously from storage - it is restored
  // by exchanging the httpOnly refresh cookie on boot. Without this branch a
  // returning user with a valid session sees the login form flash for the
  // length of that round trip before being redirected away from it.
  if (initializing) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={location.state?.from || '/'} replace />;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setSubmitting(true);
    // No imperative navigate() here - once login() resolves, isAuthenticated
    // flips true and the branch above re-renders into a declarative
    // <Navigate>. Racing an imperative navigate() against that (and against
    // RootRedirect's own <Navigate> at "/") caused an intermittent blank
    // landing page.
    login(username, password)
      .catch(() => {})
      .finally(() => setSubmitting(false));
  };

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', bgcolor: 'background.default', overflow: 'hidden' }}>
      <SoftGlow />

      <Container
        maxWidth="lg"
        sx={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', py: { xs: 2, md: 3 } }}
      >
        <Box
          component="header"
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 2,
            py: 1.25,
            borderRadius: 999,
            bgcolor: alpha('#FFFFFF', 0.72),
            backdropFilter: 'saturate(180%) blur(12px)',
            border: 1,
            borderColor: alpha('#FFFFFF', 0.9),
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
            alignSelf: 'stretch',
          }}
        >
          <Box component={RouterLink} to="/home" sx={{ textDecoration: 'none', color: 'inherit' }}>
            <BrandLockup size={32} />
          </Box>
        </Box>

        <Grid
          container
          spacing={{ xs: 4, md: 8 }}
          sx={{ flexGrow: 1, alignItems: 'center', py: { xs: 4, md: 6 } }}
        >
          <Grid size={{ xs: 12, md: 6 }}>
            <BrandPanel />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', justifyContent: 'center' }}>
            <Box sx={{ width: '100%', maxWidth: 440 }}>
              <Card
                sx={{
                  borderRadius: '24px',
                  borderColor: alpha('#FFFFFF', 0.9),
                  bgcolor: alpha('#FFFFFF', 0.86),
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 24px 60px rgba(30, 64, 175, 0.10), 0 2px 6px rgba(15, 23, 42, 0.04)',
                }}
              >
                <CardContent sx={{ p: { xs: 3, sm: 4.5 }, '&:last-child': { pb: { xs: 3, sm: 4.5 } } }}>
                  <Typography variant="h4" component="h1">
                    Sign in
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                    Use the User ID your HR team issued you.
                  </Typography>

                  <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3.5 }}>
                    <Stack spacing={2.5}>
                      <TextField
                        label="User ID"
                        placeholder="e.g. HR001"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoFocus
                        fullWidth
                        required
                        autoComplete="username"
                      />
                      <TextField
                        label="Password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        fullWidth
                        required
                        autoComplete="current-password"
                        slotProps={{
                          input: {
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                                  onClick={() => setShowPassword((visible) => !visible)}
                                  edge="end"
                                  size="small"
                                >
                                  {showPassword ? (
                                    <VisibilityOffOutlinedIcon fontSize="small" />
                                  ) : (
                                    <VisibilityOutlinedIcon fontSize="small" />
                                  )}
                                </IconButton>
                              </InputAdornment>
                            ),
                          },
                        }}
                      />
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={submitting}
                        endIcon={submitting ? null : <ArrowForwardRoundedIcon />}
                        sx={{ mt: 0.5 }}
                      >
                        {submitting ? 'Signing in…' : 'Sign in'}
                      </Button>
                    </Stack>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* There is no self-service password reset in this system - reset
                      is HR-mediated by design (see PRD non-goals). Say so, rather
                      than offering a "Forgot password?" link that goes nowhere. */}
                  <Typography variant="body2" color="text.secondary">
                    Forgotten your password? Your HR team can issue a new one from the employee record.
                  </Typography>
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5 }}>
                <Link
                  component={RouterLink}
                  to="/home"
                  underline="hover"
                  variant="body2"
                  sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}
                >
                  <ArrowBackRoundedIcon fontSize="inherit" />
                  Back to {BRAND.name}
                </Link>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          © {new Date().getFullYear()} {BRAND.legalName}
        </Typography>
      </Container>
    </Box>
  );
}
