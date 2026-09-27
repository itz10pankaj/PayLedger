import { app } from './app';
import { env } from './config/env';
import { processDueDeliveries } from './modules/gateway/services/webhookDelivery.service';

const WEBHOOK_POLL_INTERVAL_MS = 10_000;

app.listen(env.port, () => {
  console.log(`[backend] listening on port ${env.port} (${env.nodeEnv})`);
});

// Stands in for a real job queue (BullMQ, SQS) — a single in-process
// poller checking for due webhook deliveries every 10s. Same retry/
// backoff/dead-letter behavior a proper queue would give, just without
// the extra infrastructure a portfolio project doesn't need yet.
setInterval(() => {
  processDueDeliveries().catch((err) => console.error('[webhooks] delivery poll failed:', err));
}, WEBHOOK_POLL_INTERVAL_MS);
