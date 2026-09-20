import { env } from '../../config/env';

// Round-robin over BACKEND_TARGETS. With a single target (today) this
// always returns the same URL; add more comma-separated entries to the
// env var later and requests start fanning out across them.
let cursor = 0;

export function nextBackendTarget(): string {
  const target = env.backendTargets[cursor % env.backendTargets.length];
  cursor += 1;
  return target;
}
