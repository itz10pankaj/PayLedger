import crypto from 'crypto';
import { ApiError } from '../../../common/utils/ApiError';
import { env } from '../../../config/env';
import { pendingAccountRepository } from '../repository/pendingAccount.repository';
import { AccountType } from '../models/account.model';

const VALID_TYPES: AccountType[] = ['payer', 'merchant'];
const NICKNAME_MAX_LENGTH = 40;

export async function startAccountCreation(
  userId: string,
  phone: string,
  type: AccountType,
  nickname?: string
): Promise<{ message: string; expiresInSeconds: number }> {
  if (!VALID_TYPES.includes(type)) {
    throw ApiError.badRequest(`type must be one of: ${VALID_TYPES.join(', ')}`);
  }
  if (nickname && nickname.length > NICKNAME_MAX_LENGTH) {
    throw ApiError.badRequest(`nickname must be ${NICKNAME_MAX_LENGTH} characters or fewer`);
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  await pendingAccountRepository.save(userId, { otp, type, nickname: nickname?.trim() || null });

  // TODO: send via a real SMS provider. Logged here until one is wired up.
  console.log(`[DEV] Add-account OTP for ${phone}: ${otp}`);

  return { message: 'OTP sent', expiresInSeconds: env.accountOtpTtlSeconds };
}
