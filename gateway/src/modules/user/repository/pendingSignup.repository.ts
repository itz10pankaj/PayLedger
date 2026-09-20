import { redis } from '../../../config/redis';
import { env } from '../../../config/env';
import { User } from '../models/user.model';

const key = (phone: string) => `signup:${phone}`;

export interface PendingSignup {
  otp: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: User['role'];
}

// Nothing is written to Postgres until the phone OTP is verified — this
// is where the not-yet-created account lives in the meantime.
export const pendingSignupRepository = {
  async save(phone: string, pending: PendingSignup): Promise<void> {
    await redis.set(key(phone), JSON.stringify(pending), 'EX', env.otpTtlSeconds);
  },

  async get(phone: string): Promise<PendingSignup | null> {
    const raw = await redis.get(key(phone));
    return raw ? (JSON.parse(raw) as PendingSignup) : null;
  },

  async delete(phone: string): Promise<void> {
    await redis.del(key(phone));
  },
};
