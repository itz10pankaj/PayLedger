import { ApiError } from '../../../common/utils/ApiError';
import { userRepository, toSafeUser } from '../repository/user.repository';
import { pendingSignupRepository } from '../repository/pendingSignup.repository';

export async function verifySignup(phone: string, otp: string) {
  const pending = await pendingSignupRepository.get(phone);
  if (!pending || pending.otp !== otp) {
    throw ApiError.unauthorized('Invalid or expired OTP');
  }

  await pendingSignupRepository.delete(phone);

  // Self-registered — no one else created this account, so createdBy stays null.
  const user = await userRepository.create({
    name: pending.name,
    email: pending.email,
    phone: pending.phone,
    passwordHash: pending.passwordHash,
    role: pending.role,
  });

  return toSafeUser(user);
}
