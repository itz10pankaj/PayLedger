import crypto from 'crypto';

// Signs the exact bytes being sent, not a re-serialization of the payload
// object — the merchant's server verifies against the raw body it
// actually received, so signing anything else would just never match.
// The timestamp is folded into the signed string (not sent unsigned
// alongside it) so an attacker can't replay an old, validly-signed
// payload by pairing it with a fresh timestamp.
export function signWebhookPayload(secret: string, timestamp: string, rawBody: string): string {
  return crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
}
