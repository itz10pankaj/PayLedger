import { ApiError } from '../../../common/utils/ApiError';
import { gatewayUserRepository } from '../repository/gatewayUser.repository';
import { accountRepository } from '../../account/repository/account.repository';
import { Account } from '../../account/models/account.model';

// A payer pays a phone number, not an account id — this resolves who that
// phone belongs to (via gateway, which owns user data) and picks their
// primary account to credit.
export async function resolveRecipientAccount(phone: string): Promise<Account> {
  const user = await gatewayUserRepository.findByPhone(phone);
  const account = await accountRepository.findPrimaryOrFirstActiveByUserId(user.id);
  if (!account) {
    throw ApiError.badRequest('This phone number has no account to receive payments yet');
  }
  return account;
}

// Lets the sender see who they're about to pay before committing money —
// same "Sending to: <name>" check every real UPI app shows.
export async function previewRecipient(phone: string): Promise<{ name: string; phone: string }> {
  const user = await gatewayUserRepository.findByPhone(phone);
  return { name: user.name, phone: user.phone };
}
