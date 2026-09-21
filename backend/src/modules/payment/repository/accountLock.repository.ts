import crypto from 'crypto';
import { redis } from '../../../config/redis';

const LOCK_TTL_MS = 5000;
const key = (accountId: string) => `lock:acct:${accountId}`;

// Release script: only deletes the lock if it still holds OUR token —
// avoids releasing a lock some other request acquired after ours expired.
const RELEASE_SCRIPT = `
  if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
  else
    return 0
  end
`;

export const accountLockRepository = {
  // Returns a token to release with, or null if someone else holds the lock.
  async acquire(accountId: string): Promise<string | null> {
    const token = crypto.randomUUID();
    const result = await redis.set(key(accountId), token, 'PX', LOCK_TTL_MS, 'NX');
    return result === 'OK' ? token : null;
  },

  async release(accountId: string, token: string): Promise<void> {
    await redis.eval(RELEASE_SCRIPT, 1, key(accountId), token);
  },
};
