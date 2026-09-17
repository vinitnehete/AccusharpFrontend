import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  // The refresh token is an httpOnly cookie now, so the browser has to be told
  // to attach it. This does not widen what ordinary requests carry: the cookie
  // is Path=/api/auth server-side, so business calls still send nothing extra.
  withCredentials: true,
});

// ---------------------------------------------------------------------------
// Access token - held in memory, deliberately never in localStorage.
//
// Both tokens used to live in localStorage under 'accusharp.auth', which meant
// a single XSS anywhere in this bundle handed an attacker a seven-day session
// (the refresh token) on an app holding salary and bank data. The refresh token
// is now an httpOnly cookie that JavaScript cannot read at all, and the access
// token lives in this module variable: it dies with the tab, is never
// serialised anywhere a script can enumerate, and is worth only 15 minutes even
// if it is somehow read.
//
// Losing it on page refresh is not a regression - AuthContext silently
// exchanges the cookie for a new one during boot, so the user stays signed in.
// ---------------------------------------------------------------------------
let accessToken = null;

export const getAccessToken = () => accessToken;

export const setAccessToken = (token) => {
  accessToken = token ?? null;
};

let onError = null;

export const registerErrorHandler = (handler) => {
  onError = handler;
};

// Fired when a 401 survives a refresh attempt (or there's no session to
// refresh) - AuthContext registers this to clear its state and redirect to
// /login.
let onAuthExpired = null;

export const registerAuthExpiredHandler = (handler) => {
  onAuthExpired = handler;
};

// Fired with the new session whenever a request silently refreshed an expired
// access token. AuthContext registers this so a role or permission changed
// server-side - a custom role assigned, a promotion to SUPERVISOR - reaches
// the UI within one token lifetime instead of waiting for a logout.
let onSessionRefreshed = null;

export const registerSessionRefreshedHandler = (handler) => {
  onSessionRefreshed = handler;
};

const isAuthEndpoint = (url) =>
  typeof url === 'string' && (url.includes('/auth/login') || url.includes('/auth/refresh'));

client.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Shared in-flight refresh so concurrent 401s trigger exactly one /auth/refresh
// call.
let refreshPromise = null;

// Bare axios rather than `client`, so this call cannot recurse through the
// response interceptor below. No body: the refresh token travels as a cookie,
// which is the point - nothing here can read or forward it.
const doRefresh = () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post('/api/auth/refresh', null, { withCredentials: true })
      .then((r) => {
        setAccessToken(r.data.accessToken);
        return r.data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

// Exported so AuthContext can restore a session on boot using the same
// single-flight path the interceptor uses.
export const refreshSession = doRefresh;

const normalizeError = (error) => {
  const apiError = error.response?.data;
  const message =
    (apiError && typeof apiError === 'object' && apiError.message) ||
    error.message ||
    'Something went wrong while talking to the server.';
  const normalized = {
    message,
    status: error.response?.status,
    path: apiError?.path,
    raw: error,
  };
  if (onError) onError(normalized);
  return normalized;
};

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const original = error.config;
    const status = error.response?.status;

    // Exactly one silent refresh-and-retry per request; never for the auth
    // endpoints themselves, which would otherwise recurse.
    if (status === 401 && original && !original._retried && !isAuthEndpoint(original.url)) {
      original._retried = true;
      return doRefresh()
        .then((updated) => {
          if (onSessionRefreshed) onSessionRefreshed(updated);
          original.headers = { ...original.headers, Authorization: `Bearer ${updated.accessToken}` };
          return client(original);
        })
        .catch(() => {
          setAccessToken(null);
          if (onAuthExpired) onAuthExpired();
          return Promise.reject({
            message: 'Your session has expired. Please sign in again.',
            status: 401,
            raw: error,
          });
        });
    }

    return Promise.reject(normalizeError(error));
  }
);

export default client;
