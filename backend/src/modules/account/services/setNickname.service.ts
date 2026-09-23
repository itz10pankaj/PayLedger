import { ApiError } from '../../../common/utils/ApiError';
import { accountRepository } from '../repository/account.repository';
import { getOwnedAccount } from './getAccount.service';

const NICKNAME_MAX_LENGTH = 40;

export async function setNickname(accountId: string, userId: string, nickname: string | null) {
  if (nickname && nickname.length > NICKNAME_MAX_LENGTH) {
    throw ApiError.badRequest(`nickname must be ${NICKNAME_MAX_LENGTH} characters or fewer`);
  }
  const account = await getOwnedAccount(accountId, userId);
  await accountRepository.setNickname(account.id, nickname?.trim() || null, userId);
}
