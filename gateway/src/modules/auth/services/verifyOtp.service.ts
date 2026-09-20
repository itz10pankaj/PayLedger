import crypto from 'crypto';
import { ApiError } from '../../../common/utils/ApiError';
import { otpSessionRepository } from '../repository/otpSession.repository';
import { VerifyOtpInput } from '../models/auth.model';

export async function verifyOtp(input: VerifyOtpInput): Promise<{ token: string }> {
  const stored = await otpSessionRepository.getOtp(input.phone);
  if (!stored || stored.otp !== input.otp) {
    throw ApiError.unauthorized('Invalid or expired OTP');
  }

  await otpSessionRepository.deleteOtp(input.phone);

  const token = crypto.randomBytes(32).toString('hex');
  await otpSessionRepository.saveSession(token, {
    userId: stored.user.id,
    phone: stored.user.phone,
    email: stored.user.email,
    role: stored.user.role,
  });

  return { token };
}
