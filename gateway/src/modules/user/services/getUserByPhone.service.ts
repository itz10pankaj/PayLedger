import { ApiError } from '../../../common/utils/ApiError';
import { userRepository, toSafeUser } from '../repository/user.repository';

// Called by backend to resolve "who does this phone number belong to"
// when someone pays a phone number rather than an account id directly.
export async function getUserByPhone(phone: string) {
  const user = await userRepository.findByPhone(phone);
  if (!user) {
    throw ApiError.notFound('No user with this phone number');
  }
  return toSafeUser(user);
}
