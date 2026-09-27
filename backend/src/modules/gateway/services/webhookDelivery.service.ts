import axios from 'axios';
import { merchantWebhookConfigRepository } from '../repository/merchantWebhookConfig.repository';
import { paymentIntentRepository } from '../repository/paymentIntent.repository';
import { webhookDeliveryRepository } from '../repository/webhookDelivery.repository';
import { signWebhookPayload } from '../utils/signWebhookPayload';
import { WebhookDelivery } from '../models/webhookDelivery.model';

const MAX_ATTEMPTS = 6;
// 1m, 5m, 30m, 2h, 6h, 12h — each retry waits longer than the last, so a
// merchant server that's down for a minute barely notices, but one that's
// down for a day doesn't get hammered the whole time either.
const BACKOFF_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000, 6 * 60 * 60_000, 12 * 60 * 60_000];
const REQUEST_TIMEOUT_MS = 5000;

// Called from paymentIntent.service.ts whenever an intent's status
// changes. Does nothing if the merchant never configured a webhook —
// there's nowhere to deliver to. amountMinor/payerPhone are passed in
// explicitly rather than re-read from the intent, since callers often
// have a status/transactionId that's newer than what's on the row.
export async function enqueueWebhookDelivery(params: {
  merchantAccountId: string;
  paymentIntentId: string;
  event: string;
  payload: Record<string, unknown>;
}): Promise<void> {
  const config = await merchantWebhookConfigRepository.findByAccountId(params.merchantAccountId);
  if (!config) return;

  await webhookDeliveryRepository.create({
    paymentIntentId: params.paymentIntentId,
    url: config.webhookUrl,
    payload: { event: params.event, ...params.payload },
    nextAttemptAt: new Date(),
  });
}

// The worker side — call this on a timer (see server.ts). Picks up
// whatever's due and attempts each one once. A real system would run
// this as its own process behind a proper job queue (BullMQ, SQS); one
// in-process poller is the simplest thing that has the same retry/
// backoff/dead-letter behavior, which is the part actually worth
// demonstrating here.
export async function processDueDeliveries(limit = 20): Promise<void> {
  const due = await webhookDeliveryRepository.findDue(limit);
  for (const delivery of due) {
    await deliverOne(delivery);
  }
}

async function deliverOne(delivery: WebhookDelivery): Promise<void> {
  const intent = await paymentIntentRepository.findById(delivery.paymentIntentId);
  const config = intent ? await merchantWebhookConfigRepository.findByAccountId(intent.merchantAccountId) : null;

  // The merchant deleted their webhook config after this was queued —
  // there's no secret left to sign with and nowhere current to send it.
  if (!config) {
    await webhookDeliveryRepository.markDead(delivery.id, null);
    return;
  }

  const rawBody = JSON.stringify(delivery.payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signWebhookPayload(config.webhookSecret, timestamp, rawBody);

  try {
    const response = await axios.post(delivery.url, rawBody, {
      headers: {
        'Content-Type': 'application/json',
        'X-PayLedger-Signature': signature,
        'X-PayLedger-Timestamp': timestamp,
      },
      timeout: REQUEST_TIMEOUT_MS,
      validateStatus: () => true,
    });

    if (response.status >= 200 && response.status < 300) {
      await webhookDeliveryRepository.markDelivered(delivery.id, response.status);
    } else {
      await handleFailure(delivery, response.status);
    }
  } catch {
    await handleFailure(delivery, null);
  }
}

async function handleFailure(delivery: WebhookDelivery, responseStatus: number | null): Promise<void> {
  const attemptsAfter = delivery.attempts + 1;
  if (attemptsAfter >= MAX_ATTEMPTS) {
    await webhookDeliveryRepository.markDead(delivery.id, responseStatus);
    return;
  }
  const delayMs = BACKOFF_MS[Math.min(attemptsAfter - 1, BACKOFF_MS.length - 1)];
  await webhookDeliveryRepository.markRetry(delivery.id, new Date(Date.now() + delayMs), responseStatus);
}
