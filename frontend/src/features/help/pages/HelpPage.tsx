import { useState } from 'react';
import { IconChevronRight } from '../../../components/icons';
import styles from './HelpPage.module.css';

const FAQS = [
  {
    q: 'What is a T-PIN?',
    a: 'A 4-digit PIN, separate from your login password, tied to one specific account. You set it when you create the account, and it’s required every time you send money from it — your password alone is never enough to move money.',
  },
  {
    q: 'Why can’t I see my balance without entering a PIN?',
    a: 'Same reason every UPI app works this way — your balance is sensitive information, so viewing it is a deliberate, PIN-gated action rather than something shown automatically whenever the app is open.',
  },
  {
    q: 'What if I forget my T-PIN?',
    a: 'Open the account, go to the T-PIN section, and set a new one. If you already have a PIN set, changing it requires the current one — there’s no PIN reset flow yet, so keep it somewhere safe.',
  },
  {
    q: 'Can I have more than one account?',
    a: 'Yes — a Personal account for everyday use and a Business account for accepting payments, or several of either. Give each one a nickname so they’re easy to tell apart, and mark one as your Primary account — that’s the one people reach when they pay your phone number.',
  },
  {
    q: 'Is money transfer instant?',
    a: 'Yes. A transfer is a single atomic operation — either both the debit and credit happen together, or neither does. Retrying a payment that already went through never charges you twice.',
  },
];

export function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className={`container ${styles.wrapper}`}>
      <h1>Help & fees</h1>

      <div className="card">
        <h2>Transfer fees</h2>
        <p className="text-muted">
          Fees are always calculated by the server before a payment completes — never something you're trusted to
          self-report.
        </p>
        <table className={styles.feeTable}>
          <thead>
            <tr>
              <th>Sending to</th>
              <th>Fee</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Another person (Personal account)</td>
              <td>
                <span className={styles.freeTag}>Free</span>
              </td>
            </tr>
            <tr>
              <td>A Business account, up to ₹2,000</td>
              <td>
                <span className={styles.freeTag}>Free</span>
              </td>
            </tr>
            <tr>
              <td>A Business account, above ₹2,000</td>
              <td>0.4% of the amount, capped at ₹300</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Frequently asked questions</h2>
        {FAQS.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={item.q} className={styles.faqItem}>
              <button
                type="button"
                className={styles.faqQuestion}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
              >
                {item.q}
                <IconChevronRight
                  width={16}
                  height={16}
                  className={`${styles.faqChevron} ${isOpen ? styles.faqChevronOpen : ''}`}
                />
              </button>
              {isOpen && <p className={styles.faqAnswer}>{item.a}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
