import type { TaggedEntry } from '../features/dashboard/types/dashboard.types';
import type { Account } from '../features/account/types/account.types';
import { formatRupees } from '../utils/money';
import { formatDateTime } from '../utils/date';
import { accountDisplayName } from '../utils/accountDisplay';
import { colorForCategory } from '../utils/categoryColor';
import { IconArrowDownLeft, IconArrowUpRight, IconWallet } from './icons';
import styles from './TransactionTable.module.css';

interface TransactionTableProps {
  transactions: TaggedEntry[];
  accounts: Account[];
  categories?: string[];
  onTag?: (entryId: string, category: string) => void;
  emptyMessage?: string;
}

export function TransactionTable({ transactions, accounts, categories, onTag, emptyMessage }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className={styles.empty}>
        <IconWallet className={styles.emptyIcon} width={32} height={32} />
        <p className="text-muted">{emptyMessage ?? 'No transactions yet.'}</p>
      </div>
    );
  }

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Account</th>
            <th>Category</th>
            <th className={styles.amountHeader}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => {
            const isCredit = t.amountMinor > 0;
            const account = accounts.find((a) => a.id === t.accountId);
            const badgeColor = colorForCategory(t.category, categories ?? []);
            return (
              <tr key={t.id}>
                <td className={styles.dateCell}>{formatDateTime(t.createdAt)}</td>
                <td>
                  <span className={styles.typeCell}>
                    <span className={`${styles.avatar} ${isCredit ? styles.avatarCredit : styles.avatarDebit}`}>
                      {isCredit ? (
                        <IconArrowDownLeft width={14} height={14} />
                      ) : (
                        <IconArrowUpRight width={14} height={14} />
                      )}
                    </span>
                    {isCredit ? 'Money received' : 'Money sent'}
                  </span>
                </td>
                <td className={styles.accountCell}>{account ? accountDisplayName(account) : '—'}</td>
                <td>
                  {categories && onTag ? (
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
                  ) : (
                    <span className={styles.badge} style={{ background: badgeColor }}>
                      {t.category}
                    </span>
                  )}
                </td>
                <td className={`${styles.amountCell} ${isCredit ? styles.credit : styles.debit}`}>
                  {isCredit ? '+' : '−'}
                  {formatRupees(Math.abs(t.amountMinor))}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
