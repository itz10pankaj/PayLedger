import { sequelize } from '../../../config/db';
import { ApiError } from '../../../common/utils/ApiError';
import { Account } from '../../account/models/account.model';
import { accountRepository } from '../../account/repository/account.repository';
import { ledgerRepository } from '../../ledger/repository/ledger.repository';
import { transactionRepository } from '../repository/transaction.repository';
import { accountLockRepository } from '../repository/accountLock.repository';
import { calculateMdr } from './calculateMdr';

export interface ExecuteTransferInput {
  requestingUserId: string;
  payerAccount: Account;
  payeeAccount: Account;
  amountMinor: number;
  idempotencyKey: string;
}

export interface TransferResult {
  transactionId: string;
  payerAccountId: string;
  payeeAccountId: string;
  amountMinor: number;
  feeMinor: number;
  status: 'completed';
}

const LOCK_RETRY_ATTEMPTS = 3;
const LOCK_RETRY_DELAY_MS = 150;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The actual money movement — locking, balance check, fee calculation,
// the ledger writes — shared by every caller that has already resolved
// *which two accounts* are involved and confirmed the payer's T-PIN. A
// direct phone-to-phone payment and an approved payment-intent both end
// up here.
//
// Idempotency is deliberately NOT this function's concern — it just
// moves money once, honestly, when called. Each caller has its own
// uniqueness guarantee that decides whether to call this at all
// (createPayment: a Redis-cached response; an approved payment intent:
// the intent's own pending→approved state transition), and those
// guarantees are different enough that baking one into this shared
// function would leak one caller's assumptions into the other's.
export async function executeTransfer(input: ExecuteTransferInput): Promise<TransferResult> {
  let lockToken: string | null = null;
  for (let attempt = 0; attempt < LOCK_RETRY_ATTEMPTS && !lockToken; attempt++) {
    lockToken = await accountLockRepository.acquire(input.payerAccount.id);
    if (!lockToken) await sleep(LOCK_RETRY_DELAY_MS);
  }
  if (!lockToken) {
    throw ApiError.conflict('Payer account is busy with another request — try again');
  }

  try {
    const balanceMinor = await ledgerRepository.sumByAccountId(input.payerAccount.id);
    if (balanceMinor < input.amountMinor) {
      throw ApiError.badRequest('Insufficient balance');
    }

    const feeMinor = calculateMdr(input.amountMinor, input.payeeAccount.type);
    const payeeCreditMinor = input.amountMinor - feeMinor;
    const platformAccount = feeMinor > 0 ? await accountRepository.findOrCreatePlatformAccount() : null;

    const transaction = await sequelize.transaction(async (t) => {
      const tx = await transactionRepository.create(
        {
          idempotencyKey: input.idempotencyKey,
          requestingUserId: input.requestingUserId,
          payerAccountId: input.payerAccount.id,
          payeeAccountId: input.payeeAccount.id,
          amountMinor: input.amountMinor,
          feeMinor,
          createdBy: input.requestingUserId,
        },
        { transaction: t }
      );

      const entries = [
        { accountId: input.payerAccount.id, amountMinor: -input.amountMinor, createdBy: input.requestingUserId },
        { accountId: input.payeeAccount.id, amountMinor: payeeCreditMinor, createdBy: input.requestingUserId },
      ];
      if (platformAccount && feeMinor > 0) {
        entries.push({ accountId: platformAccount.id, amountMinor: feeMinor, createdBy: input.requestingUserId });
      }

      await ledgerRepository.insertEntries(
        entries.map((e) => ({ ...e, transactionId: tx.id })),
        { transaction: t }
      );

      return tx;
    });

    return {
      transactionId: transaction.id,
      payerAccountId: input.payerAccount.id,
      payeeAccountId: input.payeeAccount.id,
      amountMinor: input.amountMinor,
      feeMinor,
      status: 'completed',
    };
  } finally {
    await accountLockRepository.release(input.payerAccount.id, lockToken);
  }
}
