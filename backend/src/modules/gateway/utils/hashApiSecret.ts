import crypto from 'crypto';

// Not bcrypt, deliberately. bcrypt is for low-entropy secrets (PINs,
// passwords) where slow, salted hashing is the point — it resists
// brute-forcing "1234". An API secret here is 48+ random hex characters;
// it doesn't need protecting from guessing, and bcrypt's salt would make
// it impossible to look up by hash in a single indexed query anyway
// (same input hashes differently every time). SHA-256 is fast and
// deterministic — the same secret always hashes to the same value, so
// `WHERE secret_hash = ?` finds the right row directly, no separate
// "look up by keyId first" step needed.
export function hashApiSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex');
}
