import { ApiError } from '../../../common/utils/ApiError';
import { userRepository } from '../repository/user.repository';
import { pendingSignupRepository } from '../repository/pendingSignup.repository';
import { User } from '../models/user.model';

export async function verifySignup(phone: string, otp: string): Promise<Omit<User, 'passwordHash'>> {
  const pending = await pendingSignupRepository.get(phone);
  if (!pending || pending.otp !== otp) {
    throw ApiError.unauthorized('Invalid or expired OTP');
  }

  await pendingSignupRepository.delete(phone);

  const user = await userRepository.create({
    name: pending.name,
    email: pending.email,
    phone: pending.phone,
    passwordHash: pending.passwordHash,
    role: pending.role,
  });

  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}
