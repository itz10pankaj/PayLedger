import { ApiError } from '../../../common/utils/ApiError';
import { userRepository, toSafeUser } from '../repository/user.repository';

export async function getUserById(id: string) {
  const user = await userRepository.findById(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return toSafeUser(user);
}
