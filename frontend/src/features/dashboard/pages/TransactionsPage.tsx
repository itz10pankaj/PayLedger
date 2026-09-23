import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../../../components/Toast/ToastProvider';
import { TransactionTable } from '../../../components/TransactionTable';
import { accountDisplayName } from '../../../utils/accountDisplay';
import { accountService } from '../../account/services/account.service';
import { dashboardService } from '../services/dashboard.service';
import type { Account } from '../../account/types/account.types';
import type { TaggedEntry } from '../types/dashboard.types';
import styles from './TransactionsPage.module.css';

export function TransactionsPage() {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<TaggedEntry[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [category, setCategory] = useState('');
  const [month, setMonth] = useState('');
  // An explicit date range takes over from the month picker — see
  // resolveDateRange on the backend for why the two aren't combined.
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  // Pre-filled from ?accountId=… so an account's "Transactions" link lands
  // straight on that account's history instead of the unfiltered list.
  const [accountId, setAccountId] = useState(searchParams.get('accountId') ?? '');
  const [loading, setLoading] = useState(true);

  function load() {
    return dashboardService
      .getTransactions({
        accountId: accountId || undefined,
        category: category || undefined,
        month: !fromDate && !toDate ? month || undefined : undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        limit: 100,
      })
      .then((res) => setTransactions(res.transactions));
  }

  useEffect(() => {
    dashboardService.getCategories().then(setCategories);
    accountService.list().then(setAccounts);
  }, []);

  useEffect(() => {
    setLoading(true);
    load()
      .catch(() => showToast('Could not load transactions', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, month, fromDate, toDate, accountId]);

  function handleMonthChange(value: string) {
    setMonth(value);
    if (value) {
      setFromDate('');
      setToDate('');
    }
  }

  function handleDateRangeChange(which: 'from' | 'to', value: string) {
    if (which === 'from') setFromDate(value);
    else setToDate(value);
    if (value) setMonth('');
  }

  async function handleTag(entryId: string, newCategory: string) {
    const previous = transactions;
    setTransactions((prev) => prev.map((t) => (t.id === entryId ? { ...t, category: newCategory } : t)));
    try {
      await dashboardService.tagTransaction(entryId, newCategory);
    } catch {
      setTransactions(previous);
      showToast('Could not save tag', 'error');
    }
  }

  return (
    <div className={`container ${styles.wrapper}`}>
      <h1>Transactions</h1>

      <div className={styles.filters}>
        <div className="field">
          <label htmlFor="account">Account</label>
          <select id="account" className="input" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">All accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {accountDisplayName(a)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="month">Month</label>
          <input
            id="month"
            type="month"
            className="input"
            value={month}
            onChange={(e) => handleMonthChange(e.target.value)}
          />
        </div>
        <div className={styles.dateRangeDivider}>or pick exact dates</div>
        <div className="field">
          <label htmlFor="fromDate">From</label>
          <input
            id="fromDate"
            type="date"
            className="input"
            value={fromDate}
            max={toDate || undefined}
            onChange={(e) => handleDateRangeChange('from', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="toDate">To</label>
          <input
            id="toDate"
            type="date"
            className="input"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => handleDateRangeChange('to', e.target.value)}
          />
        </div>
        {(fromDate || toDate) && (
          <button
            type="button"
            className="btn-link"
            onClick={() => {
              setFromDate('');
              setToDate('');
            }}
          >
            Clear dates
          </button>
        )}
      </div>

      <div className={styles.tableCard}>
        {loading ? (
          <p className="text-muted">Loading…</p>
        ) : (
          <TransactionTable
            transactions={transactions}
            accounts={accounts}
            categories={categories}
            onTag={handleTag}
            emptyMessage="No transactions match these filters."
          />
        )}
      </div>
    </div>
  );
}
