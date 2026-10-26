const { createProxyMiddleware } = require('http-proxy-middleware');

const target = process.env.LOCAL_API_PROXY_TARGET || 'http://localhost:8080';
const parsedTarget = new URL(target);

if (!['http:', 'https:'].includes(parsedTarget.protocol)) {
  throw new Error('LOCAL_API_PROXY_TARGET must be an http:// or https:// URL');
}

module.exports = function configureLocalApiProxy(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: parsedTarget.origin,
      changeOrigin: true,
      secure: true,
      xfwd: true,
      logLevel: 'warn',
      // This is a server-to-server development proxy. Removing the browser's
      // localhost Origin keeps production CORS narrow while the browser still
      // sees every request and refresh cookie as same-origin on localhost.
      onProxyReq(proxyRequest) {
        proxyRequest.removeHeader('origin');
      },
    })
  );
};
