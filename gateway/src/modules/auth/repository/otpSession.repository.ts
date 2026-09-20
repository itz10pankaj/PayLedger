import { redis } from '../../../config/redis';
import { env } from '../../../config/env';
import { User } from '../../user/models/user.model';
import { SessionData } from '../models/auth.model';

const otpKey = (phone: string) => `otp:${phone}`;
const sessionKey = (token: string) => `session:${token}`;

interface StoredOtp {
  otp: string;
  user: Omit<User, 'passwordHash'>;
}

export const otpSessionRepository = {
  // Stores the OTP alongside the already-verified user, so verify-otp
  // doesn't need the password again to know who's logging in.
  async saveOtp(phone: string, otp: string, user: Omit<User, 'passwordHash'>): Promise<void> {
    await redis.set(otpKey(phone), JSON.stringify({ otp, user }), 'EX', env.otpTtlSeconds);
  },

  async getOtp(phone: string): Promise<StoredOtp | null> {
    const raw = await redis.get(otpKey(phone));
    return raw ? (JSON.parse(raw) as StoredOtp) : null;
  },

  async deleteOtp(phone: string): Promise<void> {
    await redis.del(otpKey(phone));
  },

  async saveSession(token: string, data: SessionData): Promise<void> {
    await redis.set(sessionKey(token), JSON.stringify(data), 'EX', env.sessionTtlSeconds);
  },

  async getSession(token: string): Promise<SessionData | null> {
    const raw = await redis.get(sessionKey(token));
    return raw ? (JSON.parse(raw) as SessionData) : null;
  },
};
