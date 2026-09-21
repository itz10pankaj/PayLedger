import { sequelize } from '../../../config/db';
import { ApiError } from '../../../common/utils/ApiError';
import { getOwnedAccount } from '../../account/services/getAccount.service';
import { ledgerRepository } from '../../ledger/repository/ledger.repository';
import { transactionRepository } from '../repository/transaction.repository';
import { idempotencyRepository, CachedPaymentResponse } from '../repository/idempotency.repository';
import { accountLockRepository } from '../repository/accountLock.repository';

export interface CreateDepositInput {
  requestingUserId: string;
  accountId: string;
  amountMinor: number;
  idempotencyKey: string;
}

// Standing in for "the user put cash into their account" until there's a
// real bank/UPI integration. No counterparty exists in the system for
// that cash, so the account is recorded as both payer and payee of its
// own funding transaction — keeps the transactions/ledger schema
// unchanged (still exactly one entry per side) instead of inventing a
// fictional external account.
export async function createDeposit(input: CreateDepositInput): Promise<CachedPaymentResponse> {
  if (input.amountMinor <= 0) {
    throw ApiError.badRequest('amountMinor must be positive');
  }

  const cached = await idempotencyRepository.get(input.requestingUserId, input.idempotencyKey);
  if (cached) {
    return cached;
  }

  const account = await getOwnedAccount(input.accountId, input.requestingUserId);
  if (account.status !== 'active') {
    throw ApiError.badRequest('Account is not active');
  }

  const lockToken = await accountLockRepository.acquire(account.id);
  if (!lockToken) {
    throw new ApiError(409, 'Account is busy with another request — try again');
  }

  try {
    const result = await sequelize.transaction(async (t) => {
      const transaction = await transactionRepository.create(
        {
          idempotencyKey: input.idempotencyKey,
          requestingUserId: input.requestingUserId,
          payerAccountId: account.id,
          payeeAccountId: account.id,
          amountMinor: input.amountMinor,
          feeMinor: 0,
          createdBy: input.requestingUserId,
        },
        { transaction: t }
      );

      await ledgerRepository.insertEntries(
        [
          {
            accountId: account.id,
            transactionId: transaction.id,
            amountMinor: input.amountMinor,
            createdBy: input.requestingUserId,
          },
        ],
        { transaction: t }
      );

      return transaction;
    });

    const response: CachedPaymentResponse = {
      statusCode: 201,
      body: {
        transactionId: result.id,
        accountId: account.id,
        amountMinor: input.amountMinor,
        status: 'completed',
      },
    };

    await idempotencyRepository.save(input.requestingUserId, input.idempotencyKey, response);
    return response;
  } finally {
    await accountLockRepository.release(account.id, lockToken);
  }
}
