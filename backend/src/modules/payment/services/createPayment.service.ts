import bcrypt from 'bcryptjs';
import { ApiError } from '../../../common/utils/ApiError';
import { getOwnedAccount } from '../../account/services/getAccount.service';
import { idempotencyRepository, CachedPaymentResponse } from '../repository/idempotency.repository';
import { resolveRecipientAccount } from './resolveRecipient.service';
import { executeTransfer } from './executeTransfer.service';

export interface CreatePaymentInput {
  requestingUserId: string;
  payerAccountId: string;
  toPhone: string;
  amountMinor: number;
  idempotencyKey: string;
  tPin: string;
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

  const transfer = await executeTransfer({
    requestingUserId: input.requestingUserId,
    payerAccount,
    payeeAccount,
    amountMinor: input.amountMinor,
    idempotencyKey: input.idempotencyKey,
  });

  const response: CachedPaymentResponse = { statusCode: 201, body: transfer };
  await idempotencyRepository.save(input.requestingUserId, input.idempotencyKey, response);
  return response;
}
