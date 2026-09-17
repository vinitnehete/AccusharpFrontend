import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Route-level defense-in-depth matching the sidebar: renders its child routes
 * only when the session passes `rule` - one of the ACCESS rules in
 * constants/access.js, the same rule the sidebar item for these pages uses -
 * and otherwise redirects to `/` rather than rendering a page that would fail
 * every data call it makes. The backend is still what actually enforces access
 * to the data.
 *
 * Checked against the permissions the server sent, so a custom role opens the
 * pages its permissions allow, not only the ones its fixed role name implies.
 */
export default function RequireAccess({ rule }) {
  const { canAccess } = useAuth();
  const location = useLocation();

  if (!canAccess(rule)) {
    return <Navigate to="/" replace state={{ blockedFrom: location.pathname }} />;
  }

  return <Outlet />;
}
