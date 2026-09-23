import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TransactionList } from '../../../components/TransactionList';
import { OtpInput } from '../../../components/OtpInput';
import { useToast } from '../../../components/Toast/ToastProvider';
import { formatRupees } from '../../../utils/money';
import { accountDisplayName } from '../../../utils/accountDisplay';
import { IconUser, IconBuilding, IconLock } from '../../../components/icons';
import { accountService } from '../services/account.service';
import { dashboardService } from '../../dashboard/services/dashboard.service';
import { paymentService } from '../../payment/services/payment.service';
import type { Account } from '../types/account.types';
import type { TaggedEntry } from '../../dashboard/types/dashboard.types';
import styles from './AccountDetailPage.module.css';

export function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [account, setAccount] = useState<Account | null>(null);
  const [balanceMinor, setBalanceMinor] = useState<number | null>(null);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [balancePin, setBalancePin] = useState('');
  const [verifyingBalance, setVerifyingBalance] = useState(false);
  const [transactions, setTransactions] = useState<TaggedEntry[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [settingPrimary, setSettingPrimary] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [savingPin, setSavingPin] = useState(false);
  const [editingNickname, setEditingNickname] = useState(false);
  const [nickname, setNickname] = useState('');
  const [savingNickname, setSavingNickname] = useState(false);

  function load() {
    if (!id) return Promise.resolve();
    return Promise.all([
      accountService.list().then((accounts) => accounts.find((a) => a.id === id) ?? null),
      dashboardService.getTransactions({ accountId: id, limit: 50 }),
      dashboardService.getCategories(),
    ]).then(([acc, tx, cats]) => {
      setAccount(acc);
      setNickname(acc?.nickname ?? '');
      setTransactions(tx.transactions);
      setCategories(cats);
    });
  }

  useEffect(() => {
    load()
      .catch(() => showToast('Could not load account', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleTag(entryId: string, category: string) {
    const previous = transactions;
    setTransactions((prev) => prev.map((t) => (t.id === entryId ? { ...t, category } : t)));
    try {
      await dashboardService.tagTransaction(entryId, category);
    } catch {
      setTransactions(previous);
      showToast('Could not save tag', 'error');
    }
  }

  async function handleCheckBalance() {
    if (!id) return;
    setVerifyingBalance(true);
    try {
      const result = await accountService.checkBalance(id, balancePin);
      setBalanceMinor(result.balanceMinor);
      setCheckingBalance(false);
      setBalancePin('');
    } catch {
      showToast('Incorrect T-PIN', 'error');
    } finally {
      setVerifyingBalance(false);
    }
  }

  async function handleDeposit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setDepositing(true);
    try {
      const amountMinor = Math.round(Number(depositAmount) * 100);
      await paymentService.deposit(id, amountMinor);
      showToast('Money added', 'success');
      setDepositAmount('');
      setBalanceMinor(null); // re-check to see the new amount, don't guess it client-side
      await load();
    } catch {
      showToast('Could not add money', 'error');
    } finally {
      setDepositing(false);
    }
  }

  async function handleSetPrimary() {
    if (!id) return;
    setSettingPrimary(true);
    try {
      await accountService.setPrimary(id);
      showToast('Primary account updated', 'success');
      await load();
    } catch {
      showToast('Could not set primary account', 'error');
    } finally {
      setSettingPrimary(false);
    }
  }

  async function handleSavePin(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSavingPin(true);
    try {
      await accountService.setPin(id, newPin, currentPin || undefined);
      showToast('T-PIN saved', 'success');
      setCurrentPin('');
      setNewPin('');
    } catch {
      showToast('Could not save T-PIN — check your current PIN', 'error');
    } finally {
      setSavingPin(false);
    }
  }

  async function handleSaveNickname(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSavingNickname(true);
    try {
      await accountService.setNickname(id, nickname || null);
      showToast('Nickname updated', 'success');
      setEditingNickname(false);
      await load();
    } catch {
      showToast('Could not update nickname', 'error');
    } finally {
      setSavingNickname(false);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="container">
        <p className="text-muted">Account not found.</p>
        <Link to="/accounts" className="btn-link">
          Back to accounts
        </Link>
      </div>
    );
  }

  const isBusiness = account.type === 'merchant';

  return (
    <div className={`container ${styles.wrapper}`}>
      <div className={styles.headerRow}>
        <Link to="/accounts" className="btn-link">
          ← All accounts
        </Link>
        <div className={styles.headerActions}>
          {!account.isPrimary && (
            <button type="button" className="btn" onClick={handleSetPrimary} disabled={settingPrimary}>
              {settingPrimary ? 'Setting…' : 'Set as primary'}
            </button>
          )}
          <Link to="/send" className="btn btn-primary">
            Send money
          </Link>
        </div>
      </div>

      <div className={`${styles.balanceCard} ${isBusiness ? styles.balanceCardBusiness : styles.balanceCardPersonal}`}>
        <div className={styles.cardTop}>
          <span className={styles.cardType}>
            {isBusiness ? <IconBuilding width={18} height={18} /> : <IconUser width={18} height={18} />}
            {accountDisplayName(account)}
          </span>
          {account.isPrimary && <span className={styles.primaryPill}>Primary</span>}
        </div>
        <span className={styles.statusPill}>{account.status}</span>

        {editingNickname ? (
          <form className={styles.nicknameForm} onSubmit={handleSaveNickname}>
            <input
              className={`input ${styles.nicknameInput}`}
              placeholder="e.g. Shop takings"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={40}
              autoFocus
            />
            <button type="submit" className={styles.solidBtn} disabled={savingNickname}>
              {savingNickname ? 'Saving…' : 'Save'}
            </button>
            <button type="button" className={styles.ghostBtn} onClick={() => setEditingNickname(false)}>
              Cancel
            </button>
          </form>
        ) : (
          <button type="button" className={styles.renameLink} onClick={() => setEditingNickname(true)}>
            {account.nickname ? 'Rename' : 'Add a nickname'}
          </button>
        )}

        <div className={styles.balanceLabel}>Balance</div>
        <div className={styles.balanceMaskedRow}>
          <div className={styles.balanceValue}>{balanceMinor !== null ? formatRupees(balanceMinor) : '•••••••'}</div>
          {balanceMinor !== null ? (
            <button type="button" className={styles.checkBtn} onClick={() => setBalanceMinor(null)}>
              Hide
            </button>
          ) : (
            !checkingBalance && (
              <button type="button" className={styles.checkBtn} onClick={() => setCheckingBalance(true)}>
                Check balance
              </button>
            )
          )}
        </div>

        {checkingBalance && (
          <div className={styles.pinPrompt}>
            <div className={styles.pinPromptLabel}>Enter this account's T-PIN</div>
            <div className={styles.pinPromptRow}>
              <OtpInput value={balancePin} onChange={setBalancePin} length={4} masked />
              <div className={styles.pinPromptActions}>
                <button
                  type="button"
                  className={styles.solidBtn}
                  onClick={handleCheckBalance}
                  disabled={balancePin.length < 4 || verifyingBalance}
                >
                  {verifyingBalance ? 'Checking…' : 'Verify'}
                </button>
                <button
                  type="button"
                  className={styles.ghostBtn}
                  onClick={() => {
                    setCheckingBalance(false);
                    setBalancePin('');
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <form className={styles.depositRow} onSubmit={handleDeposit}>
          <span className={styles.prefix}>₹</span>
          <input
            type="number"
            min="1"
            step="0.01"
            className="input"
            placeholder="Amount to add"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary" disabled={depositing}>
            {depositing ? 'Adding…' : 'Add money'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className={styles.pinHeading}>
          <IconLock width={16} height={16} /> T-PIN
        </h2>
        <p className="text-muted">This PIN is required every time you send money or check the balance on this account.</p>
        <form className={styles.pinForm} onSubmit={handleSavePin}>
          <div className="field">
            <label>Current PIN (leave blank if none set yet)</label>
            <OtpInput value={currentPin} onChange={setCurrentPin} length={4} masked />
          </div>
          <div className="field">
            <label>New 4-digit PIN</label>
            <OtpInput value={newPin} onChange={setNewPin} length={4} masked />
          </div>
          <button type="submit" className="btn btn-primary" disabled={savingPin || newPin.length < 4}>
            {savingPin ? 'Saving…' : 'Save PIN'}
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Transaction history</h2>
        <TransactionList
          transactions={transactions}
          categories={categories}
          onTag={handleTag}
          emptyMessage="No transactions on this account yet."
        />
      </div>
    </div>
  );
}
