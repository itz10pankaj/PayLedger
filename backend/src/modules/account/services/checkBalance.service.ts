import bcrypt from 'bcryptjs';
import { ApiError } from '../../../common/utils/ApiError';
import { ledgerRepository } from '../../ledger/repository/ledger.repository';
import { getOwnedAccount } from './getAccount.service';

// This is the one place a balance number actually leaves the server —
// same "enter your UPI PIN to check balance" gate every real payment app
// uses. GET /accounts/:id (and the dashboard overview) deliberately never
// include a balance figure.
export async function checkBalance(accountId: string, userId: string, tPin: string): Promise<{ balanceMinor: number }> {
  const account = await getOwnedAccount(accountId, userId);

  if (!account.tPinHash) {
    throw ApiError.badRequest('Set a T-PIN for this account first');
  }
  if (!(await bcrypt.compare(tPin, account.tPinHash))) {
    throw ApiError.unauthorized('Incorrect T-PIN');
  }

  const balanceMinor = await ledgerRepository.sumByAccountId(account.id);
  return { balanceMinor };
}
