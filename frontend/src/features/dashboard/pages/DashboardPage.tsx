import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TransactionList } from '../../../components/TransactionList';
import { OtpInput } from '../../../components/OtpInput';
import { useToast } from '../../../components/Toast/ToastProvider';
import { formatRupees } from '../../../utils/money';
import { accountDisplayName } from '../../../utils/accountDisplay';
import { colorForCategory } from '../../../utils/categoryColor';
import {
  IconSend,
  IconPlus,
  IconWallet,
  IconBuilding,
  IconUser,
  IconEye,
  IconEyeOff,
  IconPieChart,
  IconCheckCircle,
  IconAlertTriangle,
  IconX,
} from '../../../components/icons';
import { accountService } from '../../account/services/account.service';
import { dashboardService } from '../services/dashboard.service';
import type { BudgetOverview, DashboardOverview, FinancialHealth, MonthlyExpenses } from '../types/dashboard.types';
import styles from './DashboardPage.module.css';

const QUICK_ACTIONS = [
  { to: '/send', label: 'Send', icon: IconSend },
  { to: '/accounts', label: 'Add money', icon: IconPlus },
  { to: '/accounts', label: 'Accounts', icon: IconWallet },
  { to: '/expenses', label: 'Expenses', icon: IconBuilding },
];

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const MAX_INLINE_ACCOUNTS = 3;

function previousMonth(month: string): string {
  const [year, m] = month.split('-').map(Number);
  const d = new Date(year, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function DashboardPage() {
  const { showToast } = useToast();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);
  const [checking, setChecking] = useState(false);
  const [pin, setPin] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [expenses, setExpenses] = useState<MonthlyExpenses | null>(null);
  const [prevExpenses, setPrevExpenses] = useState<MonthlyExpenses | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [budgetOverview, setBudgetOverview] = useState<BudgetOverview | null>(null);
  const [health, setHealth] = useState<FinancialHealth | null>(null);
  const [editingBudgets, setEditingBudgets] = useState(false);
  const [newBudgetCategory, setNewBudgetCategory] = useState('');
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  const [savingBudget, setSavingBudget] = useState(false);

  const month = currentMonth();

  function refreshBudgetsAndHealth() {
    dashboardService.getBudgetOverview(month).then(setBudgetOverview);
    dashboardService.getFinancialHealth(month).then(setHealth);
  }

  useEffect(() => {
    dashboardService
      .getOverview()
      .then(setOverview)
      .catch(() => showToast('Could not load dashboard', 'error'))
      .finally(() => setLoading(false));
    dashboardService.getCategories().then(setCategories);
    dashboardService.getExpenses(month).then(setExpenses);
    dashboardService.getExpenses(previousMonth(month)).then(setPrevExpenses);
    refreshBudgetsAndHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToast]);

  async function handleAddBudget() {
    if (!newBudgetCategory || !newBudgetAmount) return;
    const limitMinor = Math.round(Number(newBudgetAmount) * 100);
    if (!Number.isFinite(limitMinor) || limitMinor <= 0) {
      showToast('Enter a valid budget amount', 'error');
      return;
    }
    setSavingBudget(true);
    try {
      await dashboardService.setBudget(newBudgetCategory, limitMinor);
      setNewBudgetCategory('');
      setNewBudgetAmount('');
      refreshBudgetsAndHealth();
    } catch {
      showToast('Could not save budget', 'error');
    } finally {
      setSavingBudget(false);
    }
  }

  async function handleRemoveBudget(category: string) {
    try {
      await dashboardService.removeBudget(category);
      refreshBudgetsAndHealth();
    } catch {
      showToast('Could not remove budget', 'error');
    }
  }

  const primary = overview?.accounts.find((a) => a.isPrimary) ?? null;

  async function handleCheckBalance() {
    if (!primary) return;
    setVerifying(true);
    try {
      const result = await accountService.checkBalance(primary.id, pin);
      setBalance(result.balanceMinor);
      setChecking(false);
      setPin('');
    } catch {
      showToast('Incorrect T-PIN', 'error');
    } finally {
      setVerifying(false);
    }
  }

  function hideBalance() {
    setBalance(null);
  }

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

  // Primary always shows first — it's the one whose balance the total
  // balance card actually reveals, so it can't be the one that gets
  // bumped into "+N more" when there are several accounts.
  const orderedAccounts = [...overview.accounts].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  const visibleAccounts = orderedAccounts.slice(0, MAX_INLINE_ACCOUNTS);
  const hasMoreAccounts = orderedAccounts.length > MAX_INLINE_ACCOUNTS;

  const sortedByCategory = [...(expenses?.byCategory ?? [])].sort((a, b) => b.totalMinor - a.totalMinor);
  const topCategory = sortedByCategory[0] ?? null;
  const totalSpent = expenses?.totalMinor ?? 0;
  const prevTotalSpent = prevExpenses?.totalMinor ?? 0;
  const trendPct = prevTotalSpent > 0 ? Math.round(((totalSpent - prevTotalSpent) / prevTotalSpent) * 100) : null;

  const topSlices = sortedByCategory.slice(0, 5);
  const otherTotal = sortedByCategory.slice(5).reduce((sum, c) => sum + c.totalMinor, 0);
  const legendItems: Array<{ category: string; totalMinor: number; color: string }> = topSlices.map((c) => ({
    category: c.category,
    totalMinor: c.totalMinor,
    color: colorForCategory(c.category, categories),
  }));
  if (otherTotal > 0) {
    legendItems.push({ category: 'Other', totalMinor: otherTotal, color: 'var(--color-text-subtle)' });
  }

  const donutStops = legendItems.reduce<{ cumulative: number; stops: string[] }>(
    (acc, item) => {
      const pct = totalSpent > 0 ? (item.totalMinor / totalSpent) * 100 : 0;
      const end = acc.cumulative + pct;
      acc.stops.push(`${item.color} ${acc.cumulative}% ${end}%`);
      return { cumulative: end, stops: acc.stops };
    },
    { cumulative: 0, stops: [] }
  ).stops;
  const donutBackground = donutStops.length > 0 ? `conic-gradient(${donutStops.join(', ')})` : 'var(--color-surface-sunken)';

  const healthColor =
    health?.label === 'Good'
      ? 'var(--color-success)'
      : health?.label === 'Fair'
        ? '#eda100'
        : health?.label === 'Needs attention'
          ? 'var(--color-danger)'
          : 'var(--color-text-subtle)';
  const healthHint =
    health?.label === 'Good'
      ? "You're on track"
      : health?.label === 'Fair'
        ? 'Almost there'
        : health?.label === 'Needs attention'
          ? 'Keep an eye on spending'
          : 'Set a budget to get started';

  const overallBudgetPct =
    budgetOverview && budgetOverview.totalLimitMinor > 0
      ? Math.round((budgetOverview.totalSpentMinor / budgetOverview.totalLimitMinor) * 100)
      : 0;
  const unbudgetedCategories = categories.filter(
    (c) => !budgetOverview?.categories.some((b) => b.category === c)
  );

  return (
    <div className={`container ${styles.wrapper}`}>
      <div className={styles.headerRow}>
        <h1>Dashboard</h1>
      </div>

      <div className={styles.topGrid}>
        <div className={styles.balanceCard}>
          <div className={styles.balanceTop}>
            <span className={styles.balanceLabel}>
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => (balance !== null ? hideBalance() : setChecking(true))}
                aria-label={balance !== null ? 'Hide balance' : 'Check balance'}
              >
                {balance !== null ? <IconEye width={15} height={15} /> : <IconEyeOff width={15} height={15} />}
              </button>
              Total balance
            </span>
            {primary &&
              (balance !== null ? (
                <button type="button" className={styles.checkBtn} onClick={hideBalance}>
                  Hide
                </button>
              ) : (
                !checking && (
                  <button type="button" className={styles.checkBtn} onClick={() => setChecking(true)}>
                    Check balance
                  </button>
                )
              ))}
          </div>
          <div className={styles.balanceValue}>{balance !== null ? formatRupees(balance) : '•••••••'}</div>
          <div className={styles.balanceSub}>{primary ? accountDisplayName(primary) : 'No primary account yet'}</div>

          {checking && primary && (
            <div className={styles.pinPrompt}>
              <div className={styles.pinPromptLabel}>Enter {accountDisplayName(primary)}'s T-PIN to check balance</div>
              <div className={styles.pinPromptRow}>
                <OtpInput value={pin} onChange={setPin} length={4} masked />
                <div className={styles.pinPromptActions}>
                  <button
                    type="button"
                    className={styles.solidBtn}
                    onClick={handleCheckBalance}
                    disabled={pin.length < 4 || verifying}
                  >
                    {verifying ? 'Checking…' : 'Verify'}
                  </button>
                  <button
                    type="button"
                    className={styles.ghostBtn}
                    onClick={() => {
                      setChecking(false);
                      setPin('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.quickActions}>
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.label} to={action.to} className={styles.quickAction}>
              <span className={styles.quickActionIcon}>
                <action.icon width={18} height={18} />
              </span>
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Your accounts</h2>
          <Link to="/accounts" className="btn-link">
            Manage accounts
          </Link>
        </div>
        <div className={styles.accountsRow}>
          {visibleAccounts.map((account) => (
            <Link
              key={account.id}
              to={`/accounts/${account.id}`}
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
              <div className={styles.accountName}>{accountDisplayName(account)}</div>
              <div className={styles.accountSub}>{account.type === 'merchant' ? 'Business' : 'Personal'}</div>
            </Link>
          ))}
          {hasMoreAccounts ? (
            <Link to="/accounts" className={styles.moreAccountsCard}>
              <span className={styles.moreAccountsCount}>+{overview.accounts.length - MAX_INLINE_ACCOUNTS}</span>
              Manage accounts
            </Link>
          ) : (
            <Link to="/accounts" className={styles.addAccountCard}>
              <IconPlus width={20} height={20} />
              Add account
            </Link>
          )}
        </div>
      </div>

      <div className={styles.pairGrid}>
        <div className={`${styles.widgetCard} ${styles.grow}`}>
          <div className={styles.sectionHeader}>
            <h2>Recent transactions</h2>
            <Link to="/transactions" className="btn-link">
              View all
            </Link>
          </div>
          <div className={styles.recentTransactionsScroll}>
            <TransactionList transactions={overview.recentTransactions} />
          </div>
        </div>

        <div className={`${styles.widgetCard} ${styles.grow}`}>
          <div className={styles.sectionHeader}>
            <h2>Financial health</h2>
          </div>
          {health?.score !== null && health?.score !== undefined ? (
            <div className={styles.healthTop}>
              <div
                className={styles.healthRing}
                style={{ background: `conic-gradient(${healthColor} ${health.score * 3.6}deg, var(--color-surface-sunken) 0deg)` }}
              >
                <div className={styles.healthRingHole}>
                  <span className={styles.healthScore}>{health.score}</span>
                </div>
              </div>
              <div>
                <div className={styles.healthLabel} style={{ color: healthColor }}>
                  {health.label}
                </div>
                <div className={styles.healthHint}>{healthHint}</div>
              </div>
            </div>
          ) : (
            <p className="text-muted">{health?.label ?? 'Loading…'}</p>
          )}
          <div className={styles.healthInsights}>
            {health?.insights.map((insight, i) => (
              <div key={i} className={styles.healthInsightRow}>
                {insight.tone === 'good' ? (
                  <IconCheckCircle className={styles.insightGood} width={16} height={16} />
                ) : (
                  <IconAlertTriangle className={styles.insightWarning} width={16} height={16} />
                )}
                <span>{insight.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.pairGrid}>
        <div className={styles.stackCol}>
          <div className={styles.widgetCard}>
            <div className={styles.spendHeader}>
              <span className={styles.spendIcon}>
                <IconPieChart width={18} height={18} />
              </span>
              <div>
                <div className={styles.sectionLabel}>This month's spending</div>
                <div className={styles.spendTotal}>{formatRupees(totalSpent)}</div>
              </div>
              {trendPct !== null && (
                <span className={`${styles.trendPill} ${trendPct <= 0 ? styles.trendDown : styles.trendUp}`}>
                  {trendPct <= 0 ? '↓' : '↑'} {Math.abs(trendPct)}% vs last month
                </span>
              )}
            </div>
            {topCategory && (
              <div className={styles.topCategoryRow}>
                <div className={styles.topCategoryLabel}>
                  <span>{topCategory.category}</span>
                  <span>{formatRupees(topCategory.totalMinor)}</span>
                </div>
                <div className={styles.miniChartTrack}>
                  <div
                    className={styles.miniChartFill}
                    style={{
                      width: `${totalSpent > 0 ? (topCategory.totalMinor / totalSpent) * 100 : 0}%`,
                      background: colorForCategory(topCategory.category, categories),
                    }}
                  />
                </div>
              </div>
            )}
            {!topCategory && <p className="text-muted">No spending tagged this month yet.</p>}
          </div>

          {legendItems.length > 0 && (
            <div className={`${styles.widgetCard} ${styles.grow}`}>
              <div className={styles.sectionHeader}>
                <h2>Spending breakdown</h2>
              </div>
              <div className={styles.breakdownRow}>
                <div className={styles.donut} style={{ background: donutBackground }}>
                  <div className={styles.donutHole}>
                    <span className={styles.donutHoleValue}>{formatRupees(totalSpent)}</span>
                    <span className={styles.donutHoleLabel}>Total spent</span>
                  </div>
                </div>
                <div className={styles.legend}>
                  {legendItems.map((item) => (
                    <div key={item.category} className={styles.legendRow}>
                      <span className={styles.legendDot} style={{ background: item.color }} />
                      <span className={styles.legendName}>{item.category}</span>
                      <span className={styles.legendValue}>{formatRupees(item.totalMinor)}</span>
                      <span className={styles.legendPct}>
                        {totalSpent > 0 ? Math.round((item.totalMinor / totalSpent) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={`${styles.widgetCard} ${styles.grow}`}>
          <div className={styles.sectionHeader}>
            <h2>Monthly budget</h2>
            <button type="button" className="btn-link" onClick={() => setEditingBudgets((v) => !v)}>
              {editingBudgets ? 'Done' : 'Edit'}
            </button>
          </div>

          {budgetOverview && budgetOverview.categories.length > 0 && (
            <>
              <div className={styles.budgetOverallRow}>
                <span>
                  {formatRupees(budgetOverview.totalSpentMinor)} / {formatRupees(budgetOverview.totalLimitMinor)}
                </span>
                <span className={styles.budgetOverallPct}>{overallBudgetPct}%</span>
              </div>
              <div className={styles.miniChartTrack}>
                <div
                  className={styles.miniChartFill}
                  style={{
                    width: `${Math.min(100, overallBudgetPct)}%`,
                    background: overallBudgetPct > 100 ? 'var(--color-danger)' : 'var(--color-primary)',
                  }}
                />
              </div>

              <div className={styles.budgetCategoryList}>
                {budgetOverview.categories.map((c) => {
                  const pct = c.limitMinor > 0 ? Math.round((c.spentMinor / c.limitMinor) * 100) : 0;
                  return (
                    <div key={c.category} className={styles.budgetCategoryRow}>
                      <div className={styles.budgetCategoryTop}>
                        <span>{c.category}</span>
                        <span className={styles.budgetCategoryAmounts}>
                          {formatRupees(c.spentMinor)} / {formatRupees(c.limitMinor)}
                          {editingBudgets && (
                            <button
                              type="button"
                              className={styles.budgetRemoveBtn}
                              onClick={() => handleRemoveBudget(c.category)}
                              aria-label={`Remove ${c.category} budget`}
                            >
                              <IconX width={12} height={12} />
                            </button>
                          )}
                        </span>
                      </div>
                      <div className={styles.miniChartTrack}>
                        <div
                          className={styles.miniChartFill}
                          style={{
                            width: `${Math.min(100, pct)}%`,
                            background: pct > 100 ? 'var(--color-danger)' : colorForCategory(c.category, categories),
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {(!budgetOverview || budgetOverview.categories.length === 0) && !editingBudgets && (
            <p className="text-muted">No budgets set yet — click Edit to set one.</p>
          )}

          {editingBudgets && unbudgetedCategories.length > 0 && (
            <div className={styles.budgetForm}>
              <select
                className="input"
                value={newBudgetCategory}
                onChange={(e) => setNewBudgetCategory(e.target.value)}
              >
                <option value="">Category…</option>
                {unbudgetedCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <input
                className="input"
                type="number"
                min="1"
                placeholder="Limit (₹)"
                value={newBudgetAmount}
                onChange={(e) => setNewBudgetAmount(e.target.value)}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={handleAddBudget}
                disabled={!newBudgetCategory || !newBudgetAmount || savingBudget}
              >
                {savingBudget ? 'Saving…' : 'Set'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
