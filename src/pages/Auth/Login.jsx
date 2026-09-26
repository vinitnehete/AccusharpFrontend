import { useState } from 'react';
import { Link as RouterLink, Navigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { alpha } from '@mui/material/styles';
import { useAuth } from '../../context/AuthContext';
import { BRAND } from '../../constants/brand';

// Copy for the brand panel beside the form. Login-screen copy, deliberately
// kept here rather than in the marketing content file - this screen belongs to
// the application, not to the public site.
const PANEL_HEADLINE = 'The whole month, in one place.';
const PANEL_SUB =
  'Review attendance, approve leave, run payroll and pull the registers your filing needs.';
const PANEL_POINTS = [
  'Punches reviewed, not just recorded',
  'Payroll you can reproduce months later',
  'PF, ESIC, PT and TDS from one rule',
];

function BrandLockup({ onDark = false, size = 40 }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
      <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 700, width: size, height: size }}>
        {BRAND.initial}
      </Avatar>
      <Box>
        <Typography
          sx={{ fontWeight: 800, lineHeight: 1.1, color: onDark ? 'common.white' : 'text.primary' }}
        >
          {BRAND.name}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: onDark ? alpha('#FFFFFF', 0.6) : 'text.secondary', letterSpacing: '0.04em' }}
        >
          HRMS
        </Typography>
      </Box>
    </Stack>
  );
}

// The navy half. Hidden below md, where the compact lockup above the card
// carries the branding instead.
function BrandPanel() {
  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        width: { md: '46%', lg: '42%' },
        p: { md: 6, lg: 8 },
        bgcolor: 'ink.main',
      }}
    >
      <Box
        aria-hidden
        sx={(theme) => ({
          position: 'absolute',
          top: -160,
          left: -120,
          width: 560,
          height: 560,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.28)} 0%, transparent 66%)`,
          pointerEvents: 'none',
        })}
      />

      <Box sx={{ position: 'relative' }}>
        <BrandLockup onDark />
      </Box>

      <Box sx={{ position: 'relative', maxWidth: 420 }}>
        <Typography variant="h3" sx={{ color: 'common.white', fontSize: { md: '2rem', lg: '2.25rem' } }}>
          {PANEL_HEADLINE}
        </Typography>
        <Typography variant="body1" sx={{ mt: 2, color: alpha('#FFFFFF', 0.7) }}>
          {PANEL_SUB}
        </Typography>
        <Stack spacing={1.75} sx={{ mt: 4 }}>
          {PANEL_POINTS.map((point) => (
            <Stack key={point} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <CheckCircleRoundedIcon fontSize="small" sx={{ color: 'primary.light' }} />
              <Typography variant="body2" sx={{ color: alpha('#FFFFFF', 0.82) }}>
                {point}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      <Typography variant="caption" sx={{ position: 'relative', color: alpha('#FFFFFF', 0.4) }}>
        © {new Date().getFullYear()} {BRAND.legalName}
      </Typography>
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
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }}>
      <BrandPanel />

      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2.5, sm: 4 },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          {/* Below md the navy panel is gone, so the lockup comes along here. */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 3 }}>
            <BrandLockup />
          </Box>

          <Card>
            <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
              <Typography variant="h4">Sign in</Typography>
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
                  <Button type="submit" variant="contained" size="large" disabled={submitting}>
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
      </Box>
    </Box>
  );
}
