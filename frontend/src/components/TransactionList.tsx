import type { TaggedEntry } from '../features/dashboard/types/dashboard.types';
import { formatRupees } from '../utils/money';
import { formatRelativeTime } from '../utils/date';
import { colorForCategory } from '../utils/categoryColor';
import { IconArrowDownLeft, IconArrowUpRight, IconWallet } from './icons';
import styles from './TransactionList.module.css';

interface TransactionListProps {
  transactions: TaggedEntry[];
  categories?: string[];
  onTag?: (entryId: string, category: string) => void;
  emptyMessage?: string;
}

export function TransactionList({ transactions, categories, onTag, emptyMessage }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className={styles.empty}>
        <IconWallet className={styles.emptyIcon} width={32} height={32} />
        <p className="text-muted">{emptyMessage ?? 'No transactions yet.'}</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {transactions.map((t) => {
        const isCredit = t.amountMinor > 0;
        const badgeColor = colorForCategory(t.category, categories ?? []);
        return (
          <div key={t.id} className={styles.row}>
            <div className={`${styles.avatar} ${isCredit ? styles.avatarCredit : styles.avatarDebit}`}>
              {isCredit ? <IconArrowDownLeft width={18} height={18} /> : <IconArrowUpRight width={18} height={18} />}
            </div>
            <div className={styles.middle}>
              <span className={styles.title}>{isCredit ? 'Money received' : 'Money sent'}</span>
              <div className={styles.metaRow}>
                <span className={styles.badge} style={{ background: badgeColor }}>
                  {t.category}
                </span>
                <span className={styles.date}>{formatRelativeTime(t.createdAt)}</span>
              </div>
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
                {isCredit ? '+' : '−'}
                {formatRupees(Math.abs(t.amountMinor))}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
