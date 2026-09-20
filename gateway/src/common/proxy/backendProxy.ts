import { Request } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { nextBackendTarget } from './backendTargetPicker';

// Everything under /api/* that isn't handled by the gateway itself is
// forwarded to a backend instance chosen by nextBackendTarget(). The
// requesting user (attached by `authenticate`) rides along as headers,
// so the backend trusts identity instead of re-checking it.
//
// Express strips the '/api' mount prefix before this middleware ever sees
// the request (app.use('/api', ...) does that for every sub-middleware),
// so req.url here is already e.g. '/v1/accounts' — pathRewrite has to add
// '/api' back on, not match a prefix that's already gone.
export const backendProxy = createProxyMiddleware({
  router: () => nextBackendTarget(),
  changeOrigin: true,
  pathRewrite: { '^/': '/api/' },
  on: {
    proxyReq: (proxyReq, req) => {
      const user = (req as Request).user;
      if (user) {
        proxyReq.setHeader('X-User-Id', user.userId);
        proxyReq.setHeader('X-User-Phone', user.phone);
        proxyReq.setHeader('X-User-Email', user.email);
        proxyReq.setHeader('X-User-Role', user.role);
      }
    },
  },
});
