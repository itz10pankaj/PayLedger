import crypto from 'crypto';
import { ApiError } from '../../../common/utils/ApiError';
import { env } from '../../../config/env';
import { pendingAccountRepository } from '../repository/pendingAccount.repository';
import { AccountType } from '../models/account.model';

const VALID_TYPES: AccountType[] = ['payer', 'merchant'];

export async function startAccountCreation(
  userId: string,
  phone: string,
  type: AccountType
): Promise<{ message: string; expiresInSeconds: number }> {
  if (!VALID_TYPES.includes(type)) {
    throw ApiError.badRequest(`type must be one of: ${VALID_TYPES.join(', ')}`);
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  await pendingAccountRepository.save(userId, { otp, type });

  // TODO: send via a real SMS provider. Logged here until one is wired up.
  console.log(`[DEV] Add-account OTP for ${phone}: ${otp}`);

  return { message: 'OTP sent', expiresInSeconds: env.accountOtpTtlSeconds };
}
