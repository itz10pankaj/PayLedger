import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { OtpInput } from '../../../components/OtpInput';
import { useToast } from '../../../components/Toast/ToastProvider';
import { IconUser, IconBuilding, IconPlus, IconSwap, IconChevronRight } from '../../../components/icons';
import { accountDisplayName } from '../../../utils/accountDisplay';
import { accountService } from '../services/account.service';
import type { Account, AccountType } from '../types/account.types';
import styles from './AccountsPage.module.css';

const TYPE_OPTIONS: Array<{ value: AccountType; title: string; description: string; icon: typeof IconUser }> = [
  { value: 'payer', title: 'Personal', description: 'For everyday sending and receiving money.', icon: IconUser },
  {
    value: 'merchant',
    title: 'Business',
    description: 'For accepting payments — a small fee (0.4%, capped at ₹300) applies above ₹2,000.',
    icon: IconBuilding,
  },
];

const RESEND_COOLDOWN_SECONDS = 30;

export function AccountsPage() {
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [step, setStep] = useState<'pick' | 'verify'>('pick');
  const [selectedType, setSelectedType] = useState<AccountType>('payer');
  const [nickname, setNickname] = useState('');
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
    await accountService.startCreate(selectedType, nickname || undefined);
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
      setNickname('');
      setShowAddForm(false);
      await loadAccounts();
    } catch {
      showToast('Invalid OTP or PIN', 'error');
    } finally {
      setVerifying(false);
    }
  }

  const isFormOpen = showAddForm || (!loading && accounts.length === 0);

  return (
    <div className={`container ${styles.wrapper}`}>
      <div className={styles.headerRow}>
        <h1>Accounts</h1>
        {!isFormOpen && (
          <button type="button" className="btn btn-primary" onClick={() => setShowAddForm(true)}>
            <IconPlus width={16} height={16} /> Add account
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        accounts.length > 0 && (
          <div className={styles.grid}>
            {accounts.map((account) => (
              <div
                key={account.id}
                className={`${styles.accountCard} ${
                  account.type === 'merchant' ? styles.accountCardBusiness : styles.accountCardPersonal
                }`}
              >
                <div className={styles.accountCardTop}>
                  {account.type === 'merchant' ? (
                    <IconBuilding className={styles.accountIcon} width={20} height={20} />
                  ) : (
                    <IconUser className={styles.accountIcon} width={20} height={20} />
                  )}
                  {account.isPrimary && <span className={styles.primaryPill}>Primary</span>}
                </div>
                <div className={styles.accountType}>{accountDisplayName(account)}</div>
                <div className={styles.accountMeta}>
                  <span className={`${styles.statusDot} ${styles[`status_${account.status}`]}`} />
                  {account.status}
                </div>
                <div className={styles.accountActions}>
                  <Link to={`/accounts/${account.id}`} className={styles.accountActionLink}>
                    Details <IconChevronRight width={14} height={14} />
                  </Link>
                  <Link to={`/transactions?accountId=${account.id}`} className={styles.accountActionLink}>
                    <IconSwap width={14} height={14} /> Transactions
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {isFormOpen && (
        <div className="card">
          {step === 'pick' ? (
            <>
              <div className={styles.formHeader}>
                <h2>Add account</h2>
                {accounts.length > 0 && (
                  <button type="button" className="btn-link" onClick={() => setShowAddForm(false)}>
                    Cancel
                  </button>
                )}
              </div>
              <form onSubmit={handleContinue}>
              <div className={styles.typeOptions}>
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    className={`${styles.typeOption} ${selectedType === opt.value ? styles.typeOptionSelected : ''}`}
                    onClick={() => setSelectedType(opt.value)}
                  >
                    <span className={styles.typeOptionIcon}>
                      <opt.icon width={18} height={18} />
                    </span>
                    <div>
                      <div className={styles.typeOptionTitle}>{opt.title}</div>
                      <div className={styles.typeOptionDesc}>{opt.description}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div className={`field ${styles.nicknameField}`}>
                <label htmlFor="nickname">Nickname (optional)</label>
                <input
                  id="nickname"
                  className="input"
                  placeholder="e.g. Shop takings, Rent account"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  maxLength={40}
                />
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
              <div className="field">
                <label>Set T-PIN</label>
                <OtpInput value={pin} onChange={setPin} length={4} masked />
              </div>
              <div className="field">
                <label>Confirm PIN</label>
                <OtpInput value={confirmPin} onChange={setConfirmPin} length={4} masked />
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
      )}
    </div>
  );
}
