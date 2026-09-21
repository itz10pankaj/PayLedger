import { redis } from '../../../config/redis';

const IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60; // 24h, per the technical design doc

const key = (userId: string, idempotencyKey: string) => `idem:${userId}:${idempotencyKey}`;

export interface CachedPaymentResponse {
  statusCode: number;
  body: unknown;
}

export const idempotencyRepository = {
  async get(userId: string, idempotencyKey: string): Promise<CachedPaymentResponse | null> {
    const raw = await redis.get(key(userId, idempotencyKey));
    return raw ? (JSON.parse(raw) as CachedPaymentResponse) : null;
  },

  async save(userId: string, idempotencyKey: string, response: CachedPaymentResponse): Promise<void> {
    await redis.set(key(userId, idempotencyKey), JSON.stringify(response), 'EX', IDEMPOTENCY_TTL_SECONDS);
  },
};
