import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { ApiError } from '../../../common/utils/ApiError';
import { getOwnedAccount } from '../../account/services/getAccount.service';
import { accountRepository } from '../../account/repository/account.repository';
import { gatewayUserRepository } from '../../payment/repository/gatewayUser.repository';
import { executeTransfer } from '../../payment/services/executeTransfer.service';
import { paymentIntentRepository } from '../repository/paymentIntent.repository';
import { enqueueWebhookDelivery } from './webhookDelivery.service';
import { PaymentIntent } from '../models/paymentIntent.model';

const EXPIRY_MINUTES = 15;

export interface CreatePaymentIntentInput {
  merchantAccountId: string;
  payerPhone: string;
  amountMinor: number;
  idempotencyKey: string;
}

export async function createPaymentIntent(input: CreatePaymentIntentInput): Promise<PaymentIntent> {
  if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
    throw ApiError.badRequest('amountMinor must be a positive integer');
  }

  // Same key + same merchant → replay the existing intent, don't create
  // a second one. A merchant's server retrying a timed-out request is
  // the expected case this guards, not an edge case.
  const existing = await paymentIntentRepository.findByIdempotencyKey(input.merchantAccountId, input.idempotencyKey);
  if (existing) {
    return existing;
  }

  // Fail fast — no point creating a request nobody will ever be able to approve.
  await gatewayUserRepository.findByPhone(input.payerPhone);

  const merchantAccount = await accountRepository.findById(input.merchantAccountId);
  if (!merchantAccount) {
    throw ApiError.notFound('Merchant account not found');
  }

  return paymentIntentRepository.create({
    merchantAccountId: input.merchantAccountId,
    payerPhone: input.payerPhone,
    amountMinor: input.amountMinor,
    idempotencyKey: input.idempotencyKey,
    expiresAt: new Date(Date.now() + EXPIRY_MINUTES * 60_000),
    createdBy: merchantAccount.userId,
  });
}

// The other door into createPaymentIntent — a merchant creating a request
// by hand from inside their own PayLedger dashboard, session-authenticated,
// instead of their server calling in with an API key. Real gateways offer
// both: an API for your own integration, and a manual "create one" button
// for testing or one-off requests. Ownership has to be checked here
// explicitly, unlike the API-key path, where possessing a valid secret
// for that account already proves it.
export async function createPaymentIntentAsOwner(
  accountId: string,
  requestingUserId: string,
  payerPhone: string,
  amountMinor: number
): Promise<PaymentIntent> {
  const account = await getOwnedAccount(accountId, requestingUserId);
  if (account.type !== 'merchant') {
    throw ApiError.badRequest('Only Business accounts can request payments');
  }

  return createPaymentIntent({
    merchantAccountId: accountId,
    payerPhone,
    amountMinor,
    idempotencyKey: crypto.randomUUID(),
  });
}

export interface PendingPaymentIntentSummary {
  id: string;
  amountMinor: number;
  merchantName: string;
  expiresAt: Date;
  createdAt: Date;
}

// The customer's own view — "who's asking me for money right now."
// Sweeps stale rows to `expired` first so a request that timed out five
// minutes ago never shows up as something still waiting on an answer.
export async function listPendingForPhone(phone: string): Promise<PendingPaymentIntentSummary[]> {
  const justExpired = await paymentIntentRepository.expireAllStale();
  await Promise.all(
    justExpired.map((intent) =>
      enqueueWebhookDelivery({
        merchantAccountId: intent.merchantAccountId,
        paymentIntentId: intent.id,
        event: 'payment_intent.expired',
        payload: { paymentIntentId: intent.id, status: 'expired', amountMinor: intent.amountMinor, payerPhone: intent.payerPhone },
      })
    )
  );

  const intents = await paymentIntentRepository.listPendingByPhone(phone);

  return Promise.all(
    intents.map(async (intent) => {
      const merchantAccount = await accountRepository.findById(intent.merchantAccountId);
      return {
        id: intent.id,
        amountMinor: intent.amountMinor,
        merchantName: merchantAccount?.nickname ?? 'Merchant',
        expiresAt: intent.expiresAt,
        createdAt: intent.createdAt,
      };
    })
  );
}

export interface ApprovePaymentIntentResult {
  id: string;
  status: 'approved';
  transactionId: string;
}

export async function approvePaymentIntent(
  intentId: string,
  requestingUserId: string,
  requestingUserPhone: string,
  payerAccountId: string,
  tPin: string
): Promise<ApprovePaymentIntentResult> {
  const intent = await paymentIntentRepository.findById(intentId);
  if (!intent) {
    throw ApiError.notFound('Payment request not found');
  }
  // Someone can only approve a request addressed to their own phone —
  // otherwise anyone who guessed an intent id could pay someone else's bill.
  if (intent.payerPhone !== requestingUserPhone) {
    throw ApiError.forbidden('This payment request is not for you');
  }
  if (intent.expiresAt.getTime() < Date.now()) {
    const justExpired = await paymentIntentRepository.expireIfPending(intent.id);
    if (justExpired) {
      await enqueueWebhookDelivery({
        merchantAccountId: intent.merchantAccountId,
        paymentIntentId: intent.id,
        event: 'payment_intent.expired',
        payload: { paymentIntentId: intent.id, status: 'expired', amountMinor: intent.amountMinor, payerPhone: intent.payerPhone },
      });
    }
    throw ApiError.badRequest('This payment request has expired');
  }
  if (intent.status !== 'pending') {
    throw ApiError.badRequest(`This payment request is already ${intent.status}`);
  }

  const payerAccount = await getOwnedAccount(payerAccountId, requestingUserId);
  if (payerAccount.status !== 'active') {
    throw ApiError.badRequest('Payer account is not active');
  }
  if (!payerAccount.tPinHash) {
    throw ApiError.badRequest('Set a T-PIN for this account before approving payments');
  }
  if (!(await bcrypt.compare(tPin, payerAccount.tPinHash))) {
    throw ApiError.unauthorized('Incorrect T-PIN');
  }

  const merchantAccount = await accountRepository.findById(intent.merchantAccountId);
  if (!merchantAccount || merchantAccount.status !== 'active') {
    throw ApiError.badRequest('This merchant account is not available');
  }
  if (merchantAccount.id === payerAccount.id) {
    throw ApiError.badRequest('Cannot pay your own account');
  }

  // Claim it *after* every check above but *before* moving any money —
  // late enough that a doomed request never blocks a slot it can't use,
  // early enough that two concurrent approvals can't both slip through.
  const claimed = await paymentIntentRepository.claimPending(intent.id);
  if (!claimed) {
    throw ApiError.conflict('This payment request was just handled — refresh and try again');
  }

  const transfer = await executeTransfer({
    requestingUserId,
    payerAccount,
    payeeAccount: merchantAccount,
    amountMinor: intent.amountMinor,
    idempotencyKey: `intent:${intent.id}`,
  });

  await paymentIntentRepository.setTransactionId(intent.id, transfer.transactionId);

  await enqueueWebhookDelivery({
    merchantAccountId: intent.merchantAccountId,
    paymentIntentId: intent.id,
    event: 'payment_intent.approved',
    payload: {
      paymentIntentId: intent.id,
      status: 'approved',
      amountMinor: intent.amountMinor,
      payerPhone: intent.payerPhone,
      transactionId: transfer.transactionId,
    },
  });

  return { id: intent.id, status: 'approved', transactionId: transfer.transactionId };
}

export async function declinePaymentIntent(intentId: string, requestingUserPhone: string): Promise<void> {
  const intent = await paymentIntentRepository.findById(intentId);
  if (!intent) {
    throw ApiError.notFound('Payment request not found');
  }
  if (intent.payerPhone !== requestingUserPhone) {
    throw ApiError.forbidden('This payment request is not for you');
  }

  const declined = await paymentIntentRepository.declineIfPending(intent.id);
  if (!declined) {
    throw ApiError.badRequest(`This payment request is already ${intent.status}`);
  }

  await enqueueWebhookDelivery({
    merchantAccountId: intent.merchantAccountId,
    paymentIntentId: intent.id,
    event: 'payment_intent.declined',
    payload: { paymentIntentId: intent.id, status: 'declined', amountMinor: intent.amountMinor, payerPhone: intent.payerPhone },
  });
}

export interface PaymentIntentHistoryItem {
  id: string;
  amountMinor: number;
  merchantName: string;
  status: 'approved' | 'declined' | 'expired';
  transactionId: string | null;
  createdAt: Date;
}

// "What did I approve or reject" — the other half of the pending list.
// Once an intent leaves `pending` it disappears from listPendingForPhone
// forever; without this, there'd be no way to look back at it at all.
export async function listHistoryForPhone(phone: string, limit = 30): Promise<PaymentIntentHistoryItem[]> {
  const intents = await paymentIntentRepository.listResolvedByPhone(phone, limit);

  return Promise.all(
    intents.map(async (intent) => {
      const merchantAccount = await accountRepository.findById(intent.merchantAccountId);
      return {
        id: intent.id,
        amountMinor: intent.amountMinor,
        merchantName: merchantAccount?.nickname ?? 'Merchant',
        status: intent.status as 'approved' | 'declined' | 'expired',
        transactionId: intent.transactionId,
        createdAt: intent.createdAt,
      };
    })
  );
}

export interface SentPaymentIntentItem {
  id: string;
  payerPhone: string;
  amountMinor: number;
  status: PaymentIntent['status'];
  transactionId: string | null;
  accountName: string;
  createdAt: Date;
}

// "What have I requested" — every collect request sent from *any* of this
// user's Business accounts, not scoped to one. One person can run more
// than one merchant account (a shop and a side project, say), and this is
// their single accountability view across all of them — the "Sent" tab
// next to the customer-facing "Received" one.
export async function listSentForUser(requestingUserId: string, limit = 30): Promise<SentPaymentIntentItem[]> {
  const accounts = await accountRepository.listByUserId(requestingUserId);
  const merchantAccounts = accounts.filter((a) => a.type === 'merchant');
  if (merchantAccounts.length === 0) {
    return [];
  }

  const intents = await paymentIntentRepository.listByMerchantAccountIds(
    merchantAccounts.map((a) => a.id),
    limit
  );

  return intents.map((intent) => {
    const account = merchantAccounts.find((a) => a.id === intent.merchantAccountId);
    return {
      id: intent.id,
      payerPhone: intent.payerPhone,
      amountMinor: intent.amountMinor,
      status: intent.status,
      transactionId: intent.transactionId,
      accountName: account?.nickname ?? 'Business account',
      createdAt: intent.createdAt,
    };
  });
}
