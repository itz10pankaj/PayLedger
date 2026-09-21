import bcrypt from 'bcryptjs';
import { sequelize } from '../../../config/db';
import { ApiError } from '../../../common/utils/ApiError';
import { accountRepository } from '../../account/repository/account.repository';
import { getOwnedAccount } from '../../account/services/getAccount.service';
import { ledgerRepository } from '../../ledger/repository/ledger.repository';
import { transactionRepository } from '../repository/transaction.repository';
import { idempotencyRepository, CachedPaymentResponse } from '../repository/idempotency.repository';
import { accountLockRepository } from '../repository/accountLock.repository';
import { resolveRecipientAccount } from './resolveRecipient.service';
import { calculateMdr } from './calculateMdr';

export interface CreatePaymentInput {
  requestingUserId: string;
  payerAccountId: string;
  toPhone: string;
  amountMinor: number;
  idempotencyKey: string;
  tPin: string;
}

const LOCK_RETRY_ATTEMPTS = 3;
const LOCK_RETRY_DELAY_MS = 150;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function createPayment(input: CreatePaymentInput): Promise<CachedPaymentResponse> {
  if (input.amountMinor <= 0) {
    throw ApiError.badRequest('amountMinor must be positive');
  }

  // Same idempotency key + same user → replay whatever we returned last
  // time, no reprocessing. This is what makes retried requests safe.
  const cached = await idempotencyRepository.get(input.requestingUserId, input.idempotencyKey);
  if (cached) {
    return cached;
  }

  const payerAccount = await getOwnedAccount(input.payerAccountId, input.requestingUserId);
  if (payerAccount.status !== 'active') {
    throw ApiError.badRequest('Payer account is not active');
  }

  if (!payerAccount.tPinHash) {
    throw ApiError.badRequest('Set a T-PIN for this account before sending money');
  }
  if (!(await bcrypt.compare(input.tPin, payerAccount.tPinHash))) {
    throw ApiError.unauthorized('Incorrect T-PIN');
  }

  const payeeAccount = await resolveRecipientAccount(input.toPhone);
  if (payeeAccount.id === payerAccount.id) {
    throw ApiError.badRequest('Cannot pay your own account');
  }

  let lockToken: string | null = null;
  for (let attempt = 0; attempt < LOCK_RETRY_ATTEMPTS && !lockToken; attempt++) {
    lockToken = await accountLockRepository.acquire(payerAccount.id);
    if (!lockToken) await sleep(LOCK_RETRY_DELAY_MS);
  }
  if (!lockToken) {
    throw new ApiError(409, 'Payer account is busy with another request — try again');
  }

  try {
    const balanceMinor = await ledgerRepository.sumByAccountId(payerAccount.id);
    if (balanceMinor < input.amountMinor) {
      throw ApiError.badRequest('Insufficient balance');
    }

    const feeMinor = calculateMdr(input.amountMinor, payeeAccount.type);
    const payeeCreditMinor = input.amountMinor - feeMinor;
    const platformAccount = feeMinor > 0 ? await accountRepository.findOrCreatePlatformAccount() : null;

    const result = await sequelize.transaction(async (t) => {
      const transaction = await transactionRepository.create(
        {
          idempotencyKey: input.idempotencyKey,
          requestingUserId: input.requestingUserId,
          payerAccountId: payerAccount.id,
          payeeAccountId: payeeAccount.id,
          amountMinor: input.amountMinor,
          feeMinor,
          createdBy: input.requestingUserId,
        },
        { transaction: t }
      );

      const entries = [
        { accountId: payerAccount.id, amountMinor: -input.amountMinor, createdBy: input.requestingUserId },
        { accountId: payeeAccount.id, amountMinor: payeeCreditMinor, createdBy: input.requestingUserId },
      ];
      if (platformAccount && feeMinor > 0) {
        entries.push({ accountId: platformAccount.id, amountMinor: feeMinor, createdBy: input.requestingUserId });
      }

      await ledgerRepository.insertEntries(
        entries.map((e) => ({ ...e, transactionId: transaction.id })),
        { transaction: t }
      );

      return transaction;
    });

    const response: CachedPaymentResponse = {
      statusCode: 201,
      body: {
        transactionId: result.id,
        payerAccountId: payerAccount.id,
        payeeAccountId: payeeAccount.id,
        amountMinor: input.amountMinor,
        feeMinor,
        status: 'completed',
      },
    };

    await idempotencyRepository.save(input.requestingUserId, input.idempotencyKey, response);
    return response;
  } finally {
    await accountLockRepository.release(payerAccount.id, lockToken);
  }
}
