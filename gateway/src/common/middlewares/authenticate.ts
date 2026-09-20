import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import { otpSessionRepository } from '../../modules/auth/repository/otpSession.repository';
import { SessionData } from '../../modules/auth/models/auth.model';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: SessionData;
    }
  }
}

// Verifies the bearer token issued by /auth/verify-otp against the
// session stored in Redis before a request is allowed through to the
// proxy layer (see common/proxy).
export const authenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Missing bearer token');
  }

  const token = header.slice('Bearer '.length);
  const session = await otpSessionRepository.getSession(token);
  if (!session) {
    throw ApiError.unauthorized('Invalid or expired session');
  }

  req.user = session;
  next();
});
