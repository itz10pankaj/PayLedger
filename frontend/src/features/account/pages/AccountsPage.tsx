import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { OtpInput } from '../../../components/OtpInput';
import { useToast } from '../../../components/Toast/ToastProvider';
import { accountService } from '../services/account.service';
import type { Account, AccountType } from '../types/account.types';
import styles from './AccountsPage.module.css';

const TYPE_OPTIONS: Array<{ value: AccountType; title: string; description: string }> = [
  { value: 'payer', title: 'Personal', description: 'For everyday sending and receiving money.' },
  {
    value: 'merchant',
    title: 'Business',
    description: 'For accepting payments — a small fee (0.4%, capped at ₹300) applies above ₹2,000.',
  },
];

const RESEND_COOLDOWN_SECONDS = 30;

export function AccountsPage() {
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<'pick' | 'verify'>('pick');
  const [selectedType, setSelectedType] = useState<AccountType>('payer');
  const [starting, setStarting] = useState(false);
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  function loadAccounts() {
    return accountService
      .list()
      .then(setAccounts)
      .catch(() => showToast('Could not load accounts', 'error'));
  }

  useEffect(() => {
    loadAccounts().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (step !== 'verify' || resendCooldown <= 0) return;
    const interval = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(interval);
  }, [step, resendCooldown]);

  async function sendOtp() {
    await accountService.startCreate(selectedType);
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    setOtp('');
  }

  async function handleContinue(e: FormEvent) {
    e.preventDefault();
    setStarting(true);
    try {
      await sendOtp();
      setStep('verify');
    } catch {
      showToast('Could not start account creation', 'error');
    } finally {
      setStarting(false);
    }
  }

  async function handleResend() {
    try {
      await sendOtp();
      showToast('A new code has been sent.', 'success');
    } catch {
      showToast('Could not resend the code', 'error');
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (pin !== confirmPin) {
      showToast('PINs do not match', 'error');
      return;
    }
    setVerifying(true);
    try {
      await accountService.verifyCreate(otp, pin);
      showToast('Account created', 'success');
      setStep('pick');
      setOtp('');
      setPin('');
      setConfirmPin('');
      await loadAccounts();
    } catch {
      showToast('Invalid OTP or PIN', 'error');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className={`container ${styles.wrapper}`}>
      <h1>Accounts</h1>

      <div className="card">
        {step === 'pick' ? (
          <>
            <h2>Add account</h2>
            <form onSubmit={handleContinue}>
              <div className={styles.typeOptions}>
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    className={`${styles.typeOption} ${selectedType === opt.value ? styles.typeOptionSelected : ''}`}
                    onClick={() => setSelectedType(opt.value)}
                  >
                    <div className={styles.typeOptionTitle}>{opt.title}</div>
                    <div className={styles.typeOptionDesc}>{opt.description}</div>
                  </button>
                ))}
              </div>
              <button type="submit" className={`btn btn-primary ${styles.continueBtn}`} disabled={starting}>
                {starting ? 'Sending OTP…' : 'Continue'}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2>Verify it&rsquo;s you</h2>
            <p className="text-muted">Enter the code we sent you, and set a 4-digit PIN for this account.</p>
            <form className="form" onSubmit={handleVerify}>
              <div className="field">
                <label>One-time code</label>
                <OtpInput value={otp} onChange={setOtp} />
                <button
                  type="button"
                  className={`btn-link ${styles.resendBtn}`}
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </button>
              </div>
              <div className={styles.pinRow}>
                <div className="field">
                  <label htmlFor="pin">Set T-PIN</label>
                  <input
                    id="pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    className={`input ${styles.pinInput}`}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="confirmPin">Confirm PIN</label>
                  <input
                    id="confirmPin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    className={`input ${styles.pinInput}`}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    required
                  />
                </div>
              </div>
              <div className={styles.verifyActions}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={verifying || otp.length < 6 || pin.length < 4}
                >
                  {verifying ? 'Creating…' : 'Create account'}
                </button>
                <button type="button" className="btn" onClick={() => setStep('pick')}>
                  Back
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : accounts.length === 0 ? (
        <p className="text-muted">No accounts yet — add one above.</p>
      ) : (
        <div className={styles.grid}>
          {accounts.map((account) => (
            <Link key={account.id} to={`/accounts/${account.id}`} className={styles.accountCard}>
              {account.isPrimary && <span className={styles.primaryBadge}>Primary</span>}
              <div className={styles.accountType}>{account.type}</div>
              <div className={styles.accountStatus}>{account.status}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
