import { redis } from '../../../config/redis';
import { env } from '../../../config/env';
import { AccountType } from '../models/account.model';

const key = (userId: string) => `account-otp:${userId}`;

export interface PendingAccount {
  otp: string;
  type: AccountType;
}

// Nothing is written to Postgres until the phone OTP is verified — same
// pattern as gateway's pendingSignupRepository, just for adding an account
// to an already-existing user instead of creating the user itself.
export const pendingAccountRepository = {
  async save(userId: string, pending: PendingAccount): Promise<void> {
    await redis.set(key(userId), JSON.stringify(pending), 'EX', env.accountOtpTtlSeconds);
  },

  async get(userId: string): Promise<PendingAccount | null> {
    const raw = await redis.get(key(userId));
    return raw ? (JSON.parse(raw) as PendingAccount) : null;
  },

  async delete(userId: string): Promise<void> {
    await redis.del(key(userId));
  },
};
