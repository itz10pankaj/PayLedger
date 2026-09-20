import crypto from 'crypto';
import { env } from '../../../config/env';
import { verifyCredentials } from '../../user/services';
import { otpSessionRepository } from '../repository/otpSession.repository';
import { LoginInput } from '../models/auth.model';

export async function requestOtp(input: LoginInput): Promise<{ message: string; expiresInSeconds: number }> {
  // Throws 401 if the password is wrong — no OTP is sent for an invalid login.
  const user = await verifyCredentials(input.phone, input.password);

  const otp = crypto.randomInt(100000, 999999).toString();
  await otpSessionRepository.saveOtp(input.phone, otp, user);

  // TODO: send via a real SMS provider. Logged here until one is wired up.
  console.log(`[DEV] Login OTP for ${input.phone}: ${otp}`);

  return { message: 'OTP sent', expiresInSeconds: env.otpTtlSeconds };
}
