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
  port: Number(required('PORT', '5000')),
  // Comma-separated list — one entry today, more later for round-robin load balancing.
  backendTargets: required('BACKEND_TARGETS', 'http://localhost:4000')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  databaseUrl: required('DATABASE_URL'),
  redisUrl: required('REDIS_URL', 'redis://localhost:6379'),
  otpTtlSeconds: Number(required('OTP_TTL_SECONDS', '600')),
  sessionTtlSeconds: Number(required('SESSION_TTL_SECONDS', '3600')),
};
