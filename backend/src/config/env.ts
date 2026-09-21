import dotenv from 'dotenv';

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: required('NODE_ENV', 'development'),
  port: Number(required('PORT', '4000')),
  databaseUrl: required('DATABASE_URL'),
  redisUrl: required('REDIS_URL', 'redis://localhost:6379'),
  gatewayUrl: required('GATEWAY_URL', 'http://localhost:5000'),
  accountOtpTtlSeconds: Number(required('ACCOUNT_OTP_TTL_SECONDS', '600')),
};
