import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { initializing, isAuthenticated, mustChangePassword } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // An anonymous visitor landing on the site root gets the public home page
    // rather than a sign-in form; any other protected path still goes to
    // /login exactly as before.
    return <Navigate to={location.pathname === '/' ? '/home' : '/login'} replace />;
  }

  // A temporary password (fresh account, or an HR-triggered reset) must be
  // replaced before anything else - otherwise it can stay live indefinitely,
  // which is exactly the gap the audit's authentication review flagged.
  if (mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return <Outlet />;
}
