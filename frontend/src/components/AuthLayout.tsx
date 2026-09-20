import type { ReactNode } from 'react';
import styles from './AuthLayout.module.css';

const FEATURES = [
  'Idempotent payments — never double-charged',
  'Double-entry ledger, auditable by design',
  'Real-time reconciliation against settlement',
];

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.brandPanel}>
        <div className={styles.brandMark}>PayLedger</div>
        <div className={styles.brandBody}>
          <h2>Payments infrastructure built for correctness.</h2>
          <p>A ledger and gateway designed around idempotency, atomicity and auditability — not just CRUD.</p>
          <ul className={styles.features}>
            {FEATURES.map((f) => (
              <li key={f}>
                <span className={styles.featureDot} />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className={styles.brandFooter}>© {new Date().getFullYear()} PayLedger</div>
      </aside>
      <div className={styles.formPanel}>
        <div className={styles.formPanelInner}>
          <div className={styles.mobileBrand}>PayLedger</div>
          {children}
        </div>
      </div>
    </div>
  );
}
