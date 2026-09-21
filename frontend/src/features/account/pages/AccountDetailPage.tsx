import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TransactionList } from '../../../components/TransactionList';
import { useToast } from '../../../components/Toast/ToastProvider';
import { formatRupees } from '../../../utils/money';
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
  const [balanceMinor, setBalanceMinor] = useState(0);
  const [transactions, setTransactions] = useState<TaggedEntry[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [settingPrimary, setSettingPrimary] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [savingPin, setSavingPin] = useState(false);

  function load() {
    if (!id) return Promise.resolve();
    return Promise.all([
      accountService.list().then((accounts) => accounts.find((a) => a.id === id) ?? null),
      accountService.getBalance(id),
      dashboardService.getTransactions({ accountId: id, limit: 50 }),
      dashboardService.getCategories(),
    ]).then(([acc, balance, tx, cats]) => {
      setAccount(acc);
      setBalanceMinor(balance.balanceMinor);
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

  async function handleDeposit(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setDepositing(true);
    try {
      const amountMinor = Math.round(Number(depositAmount) * 100);
      await paymentService.deposit(id, amountMinor);
      showToast('Money added', 'success');
      setDepositAmount('');
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

  return (
    <div className={`container ${styles.wrapper}`}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.meta}>
            {account.type} account {account.isPrimary && <span className={styles.primaryBadge}>Primary</span>}
          </h1>
          <span className="text-muted">{account.status}</span>
        </div>
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

      <div className={styles.balanceCard}>
        <div className={styles.balanceLabel}>Balance</div>
        <div className={styles.balanceValue}>{formatRupees(balanceMinor)}</div>
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
        <h2>T-PIN</h2>
        <p className="text-muted">This PIN is required every time you send money from this account.</p>
        <form className={styles.pinForm} onSubmit={handleSavePin}>
          <div className="field">
            <label htmlFor="currentPin">Current PIN (leave blank if none set yet)</label>
            <input
              id="currentPin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              className="input"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
          </div>
          <div className="field">
            <label htmlFor="newPin">New 4-digit PIN</label>
            <input
              id="newPin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              className="input"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              required
            />
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
