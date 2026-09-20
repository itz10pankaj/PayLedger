import { ApiError } from '../../../common/utils/ApiError';
import { userRepository, toSafeUser } from '../repository/user.repository';

export interface UpdateUserInput {
  name?: string;
  email?: string;
}

export async function updateUser(id: string, input: UpdateUserInput, updatedBy: string) {
  const user = await userRepository.updateById(id, input, updatedBy);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return toSafeUser(user);
}
