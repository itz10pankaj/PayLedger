import { ApiError } from '../../../common/utils/ApiError';
import { userRepository } from '../repository/user.repository';
import { User } from '../models/user.model';

export interface UpdateUserInput {
  name?: string;
  email?: string;
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<Omit<User, 'passwordHash'>> {
  const user = await userRepository.updateById(id, input);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}
