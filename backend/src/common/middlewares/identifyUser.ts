import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';

export interface IdentifiedUser {
  userId: string;
  phone: string;
  email: string;
  role: 'payer' | 'payee' | 'merchant' | 'admin';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: IdentifiedUser;
    }
  }
}

// The gateway has already authenticated the caller and forwards who they
// are as headers — backend trusts that rather than re-verifying a session.
// This is only safe as long as backend is unreachable except through the
// gateway (not enforced yet — see README).
export function identifyUser(req: Request, _res: Response, next: NextFunction) {
  const userId = req.header('X-User-Id');
  const phone = req.header('X-User-Phone');
  const email = req.header('X-User-Email');
  const role = req.header('X-User-Role') as IdentifiedUser['role'] | undefined;

  if (!userId || !phone || !email || !role) {
    throw ApiError.unauthorized('Missing identity headers — request did not come through the gateway');
  }

  req.user = { userId, phone, email, role };
  next();
}
