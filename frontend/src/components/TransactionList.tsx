import type { TaggedEntry } from '../features/dashboard/types/dashboard.types';
import { formatRupees } from '../utils/money';
import styles from './TransactionList.module.css';

interface TransactionListProps {
  transactions: TaggedEntry[];
  categories?: string[];
  onTag?: (entryId: string, category: string) => void;
  emptyMessage?: string;
}

export function TransactionList({ transactions, categories, onTag, emptyMessage }: TransactionListProps) {
  if (transactions.length === 0) {
    return <p className={styles.empty}>{emptyMessage ?? 'No transactions yet.'}</p>;
  }

  return (
    <div className={styles.list}>
      {transactions.map((t) => {
        const isCredit = t.amountMinor > 0;
        return (
          <div key={t.id} className={styles.row}>
            <div className={styles.left}>
              <span className={styles.badge}>{t.category}</span>
              <span className={styles.date}>{new Date(t.createdAt).toLocaleString('en-IN')}</span>
            </div>
            <div className={styles.right}>
              {categories && onTag && (
                <select
                  className={styles.categorySelect}
                  value={t.category === 'Uncategorized' ? '' : t.category}
                  onChange={(e) => onTag(t.id, e.target.value)}
                >
                  <option value="" disabled>
                    Tag…
                  </option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
              <span className={`${styles.amount} ${isCredit ? styles.credit : styles.debit}`}>
                {isCredit ? '+' : ''}
                {formatRupees(t.amountMinor)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
