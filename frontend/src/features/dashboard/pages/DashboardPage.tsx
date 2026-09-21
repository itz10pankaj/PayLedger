import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TransactionList } from '../../../components/TransactionList';
import { useToast } from '../../../components/Toast/ToastProvider';
import { formatRupees } from '../../../utils/money';
import { dashboardService } from '../services/dashboard.service';
import type { DashboardOverview } from '../types/dashboard.types';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const { showToast } = useToast();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService
      .getOverview()
      .then(setOverview)
      .catch(() => showToast('Could not load dashboard', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  if (loading) {
    return (
      <div className="container">
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  if (!overview) {
    return null;
  }

  return (
    <div className={`container ${styles.wrapper}`}>
      <div className={styles.headerRow}>
        <h1>Dashboard</h1>
        <Link to="/send" className="btn btn-primary">
          Send money
        </Link>
      </div>

      <div className={styles.balanceCard}>
        <div className={styles.balanceLabel}>Total balance across all accounts</div>
        <div className={styles.balanceValue}>{formatRupees(overview.totalBalanceMinor)}</div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Your accounts</h2>
          <Link to="/accounts" className="btn-link">
            Manage accounts
          </Link>
        </div>
        <div className={styles.accountsGrid}>
          {overview.accounts.map((account) => (
            <Link key={account.id} to={`/accounts/${account.id}`} className={styles.accountCard}>
              <div className={styles.accountType}>{account.type}</div>
              <div className={styles.accountBalance}>{formatRupees(account.balanceMinor)}</div>
            </Link>
          ))}
          <Link to="/accounts" className={styles.addAccountCard}>
            + Add account
          </Link>
        </div>
      </div>

      <div className="card">
        <div className={styles.sectionHeader}>
          <h2>Recent transactions</h2>
          <Link to="/transactions" className="btn-link">
            View all
          </Link>
        </div>
        <TransactionList transactions={overview.recentTransactions} />
      </div>
    </div>
  );
}
