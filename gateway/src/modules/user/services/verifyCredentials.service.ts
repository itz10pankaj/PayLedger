import bcrypt from 'bcryptjs';
import { ApiError } from '../../../common/utils/ApiError';
import { userRepository, toSafeUser } from '../repository/user.repository';

// Called by the auth module before it sends a login OTP.
export async function verifyCredentials(phone: string, password: string) {
  const user = await userRepository.findByPhone(phone);
  if (!user) {
    throw ApiError.unauthorized('Invalid phone number or password');
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw ApiError.unauthorized('Invalid phone number or password');
  }

  return toSafeUser(user);
}
