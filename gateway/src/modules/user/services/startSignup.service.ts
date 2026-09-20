import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ApiError } from '../../../common/utils/ApiError';
import { env } from '../../../config/env';
import { userRepository } from '../repository/user.repository';
import { pendingSignupRepository } from '../repository/pendingSignup.repository';
import { User } from '../models/user.model';

const SALT_ROUNDS = 10;
const PHONE_PATTERN = /^[6-9]\d{9}$/; // Indian mobile numbers — 10 digits, starts 6-9

export interface StartSignupInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: User['role'];
}

export async function startSignup(input: StartSignupInput): Promise<{ message: string; expiresInSeconds: number }> {
  if (!PHONE_PATTERN.test(input.phone)) {
    throw ApiError.badRequest('phone must be a valid 10-digit mobile number');
  }

  const [existingEmail, existingPhone] = await Promise.all([
    userRepository.findByEmail(input.email),
    userRepository.findByPhone(input.phone),
  ]);
  if (existingEmail) {
    throw ApiError.conflict('A user with this email already exists');
  }
  if (existingPhone) {
    throw ApiError.conflict('A user with this phone number already exists');
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const otp = crypto.randomInt(100000, 999999).toString();

  await pendingSignupRepository.save(input.phone, {
    otp,
    name: input.name,
    email: input.email,
    phone: input.phone,
    passwordHash,
    role: input.role,
  });

  // TODO: send via a real SMS provider. Logged here until one is wired up.
  console.log(`[DEV] Signup OTP for ${input.phone}: ${otp}`);

  return { message: 'OTP sent', expiresInSeconds: env.otpTtlSeconds };
}
