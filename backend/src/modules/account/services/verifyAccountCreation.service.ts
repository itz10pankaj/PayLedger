import bcrypt from 'bcryptjs';
import { ApiError } from '../../../common/utils/ApiError';
import { accountRepository, toSafeAccount } from '../repository/account.repository';
import { pendingAccountRepository } from '../repository/pendingAccount.repository';

const SALT_ROUNDS = 10;
const T_PIN_PATTERN = /^\d{4}$/;

export async function verifyAccountCreation(userId: string, otp: string, tPin: string) {
  if (!T_PIN_PATTERN.test(tPin)) {
    throw ApiError.badRequest('tPin must be exactly 4 digits');
  }

  const pending = await pendingAccountRepository.get(userId);
  if (!pending || pending.otp !== otp) {
    throw ApiError.unauthorized('Invalid or expired OTP');
  }

  await pendingAccountRepository.delete(userId);

  const tPinHash = await bcrypt.hash(tPin, SALT_ROUNDS);
  // A user's very first account is automatically their primary — there
  // must always be exactly one primary as soon as any account exists.
  const isFirstAccount = !(await accountRepository.hasAnyAccount(userId));

  const account = await accountRepository.create({
    userId,
    type: pending.type,
    tPinHash,
    isPrimary: isFirstAccount,
    createdBy: userId,
  });

  return toSafeAccount(account);
}
