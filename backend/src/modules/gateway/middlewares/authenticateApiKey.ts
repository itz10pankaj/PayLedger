import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../../common/utils/ApiError';
import { asyncHandler } from '../../../common/utils/asyncHandler';
import { merchantApiKeyRepository } from '../repository/merchantApiKey.repository';
import { hashApiSecret } from '../utils/hashApiSecret';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      merchantAccountId?: string;
    }
  }
}

// The public gateway API's equivalent of identifyUser — except the caller
// here is a merchant's server, not a logged-in person, so it authenticates
// by secret key instead of a session token.
export const authenticateApiKey = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.header('Authorization');
  const secret = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
  if (!secret) {
    throw ApiError.unauthorized('Missing API key');
  }

  const key = await merchantApiKeyRepository.findActiveBySecretHash(hashApiSecret(secret));
  if (!key) {
    throw ApiError.unauthorized('Invalid or revoked API key');
  }

  req.merchantAccountId = key.accountId;
  next();
});
