import { ApiError } from '../../../common/utils/ApiError';
import { userRepository } from '../repository/user.repository';
import { User } from '../models/user.model';

export async function getUserById(id: string): Promise<Omit<User, 'passwordHash'>> {
  const user = await userRepository.findById(id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}
