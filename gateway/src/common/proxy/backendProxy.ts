import { Request } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { nextBackendTarget } from './backendTargetPicker';

// Everything under /api/* that isn't handled by the gateway itself is
// forwarded to a backend instance chosen by nextBackendTarget(). The
// requesting user (attached by `authenticate`) rides along as headers,
// so the backend trusts identity instead of re-checking it.
export const backendProxy = createProxyMiddleware({
  router: () => nextBackendTarget(),
  changeOrigin: true,
  pathRewrite: { '^/api': '/api' },
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
