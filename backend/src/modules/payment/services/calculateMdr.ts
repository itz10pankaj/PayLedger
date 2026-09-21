import { AccountType } from '../../account/models/account.model';

const FREE_THRESHOLD_MINOR = 2000_00; // ₹2,000
const FEE_RATE = 0.004; // 0.4%
const FEE_CAP_MINOR = 300_00; // ₹300

// Mirrors the UPI MDR framework from the technical design doc. Our
// account types don't have a P2PM_MICRO/monthly-volume distinction yet —
// person-to-person transfers (payer/payee accounts) are always free,
// same as real UPI; only merchant accounts pay the tiered fee.
export function calculateMdr(amountMinor: number, payeeAccountType: AccountType): number {
  if (payeeAccountType !== 'merchant') {
    return 0;
  }
  if (amountMinor <= FREE_THRESHOLD_MINOR) {
    return 0;
  }
  const fee = Math.round(amountMinor * FEE_RATE);
  return Math.min(fee, FEE_CAP_MINOR);
}
