import bcrypt from 'bcryptjs';
import { ApiError } from '../../../common/utils/ApiError';
import { accountRepository } from '../repository/account.repository';
import { getOwnedAccount } from './getAccount.service';

const SALT_ROUNDS = 10;
const T_PIN_PATTERN = /^\d{4}$/;

// Setting a PIN for the first time (accounts created before this feature
// existed) just needs account ownership. Changing an already-set PIN
// needs the current one too — otherwise anyone with the session could
// silently take over the PIN.
export async function setTPin(
  accountId: string,
  userId: string,
  input: { newTPin: string; currentTPin?: string }
) {
  if (!T_PIN_PATTERN.test(input.newTPin)) {
    throw ApiError.badRequest('newTPin must be exactly 4 digits');
  }

  const account = await getOwnedAccount(accountId, userId);

  if (account.tPinHash) {
    if (!input.currentTPin || !(await bcrypt.compare(input.currentTPin, account.tPinHash))) {
      throw ApiError.unauthorized('Current T-PIN is incorrect');
    }
  }

  const tPinHash = await bcrypt.hash(input.newTPin, SALT_ROUNDS);
  await accountRepository.setTPinHash(account.id, tPinHash, userId);
}
