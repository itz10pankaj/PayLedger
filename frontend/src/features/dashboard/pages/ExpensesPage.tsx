import { useEffect, useState } from 'react';
import { useToast } from '../../../components/Toast/ToastProvider';
import { formatRupees } from '../../../utils/money';
import { dashboardService } from '../services/dashboard.service';
import type { MonthlyExpenses } from '../types/dashboard.types';
import styles from './ExpensesPage.module.css';

const SERIES_COUNT = 8;

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function ExpensesPage() {
  const { showToast } = useToast();
  const [month, setMonth] = useState(currentMonth());
  const [categories, setCategories] = useState<string[]>([]);
  const [expenses, setExpenses] = useState<MonthlyExpenses | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    dashboardService
      .getExpenses(month)
      .then(setExpenses)
      .catch(() => showToast('Could not load expenses', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  // Color follows the category name, assigned once by its fixed position
  // in the categories list — never reassigned when the filter changes.
  // Categories past the 8 validated slots fall back to muted ink rather
  // than generating a new (unvalidated) hue.
  function colorFor(category: string): string {
    const index = categories.indexOf(category);
    if (index < 0 || index >= SERIES_COUNT) return 'var(--color-text-subtle)';
    return `var(--series-${index + 1})`;
  }

  const maxTotal = expenses ? Math.max(...expenses.byCategory.map((c) => c.totalMinor), 1) : 1;

  return (
    <div className={`container ${styles.wrapper} ${styles.chartRoot}`}>
      <div className={styles.headerRow}>
        <h1>Expenses</h1>
        <input
          type="month"
          className={`input ${styles.monthInput}`}
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>

      <div className="card">
        <div className={styles.heroLabel}>Total spent in {month}</div>
        <div className={styles.heroValue}>{formatRupees(expenses?.totalMinor ?? 0)}</div>
      </div>

      <div className="card">
        <h2>By category</h2>
        {loading ? (
          <p className="text-muted">Loading…</p>
        ) : !expenses || expenses.byCategory.length === 0 ? (
          <p className="text-muted">No expenses tagged for this month yet.</p>
        ) : (
          <div className={styles.barChart}>
            {expenses.byCategory.map((c) => (
              <div key={c.category} className={styles.barRow}>
                <span className={styles.barLabel}>{c.category}</span>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{
                      width: `${(c.totalMinor / maxTotal) * 100}%`,
                      background: colorFor(c.category),
                    }}
                  />
                </div>
                <span className={styles.barValue}>{formatRupees(c.totalMinor)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
