import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { OtpInput } from '../../../components/OtpInput';
import { useToast } from '../../../components/Toast/ToastProvider';
import { formatRupees } from '../../../utils/money';
import { formatMinutesRemaining, formatDateTime } from '../../../utils/date';
import { accountDisplayName } from '../../../utils/accountDisplay';
import { accountService } from '../../account/services/account.service';
import { gatewayService } from '../services/gateway.service';
import type { Account } from '../../account/types/account.types';
import type { PaymentIntentHistoryItem, PaymentIntentStatus, PendingPaymentIntent, SentPaymentIntentItem } from '../types/gateway.types';
import styles from './PaymentRequestsPage.module.css';

const STATUS_LABEL: Record<PaymentIntentStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  declined: 'Declined',
  expired: 'Expired',
};

type Tab = 'received' | 'sent';

export function PaymentRequestsPage() {
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(searchParams.get('tab') === 'sent' ? 'sent' : 'received');

  const [requests, setRequests] = useState<PendingPaymentIntent[]>([]);
  const [history, setHistory] = useState<PaymentIntentHistoryItem[]>([]);
  const [sent, setSent] = useState<SentPaymentIntentItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState('');
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [decliningId, setDecliningId] = useState<string | null>(null);

  function load() {
    return Promise.all([
      gatewayService.listPendingPaymentRequests(),
      gatewayService.listPaymentRequestHistory(),
      gatewayService.listSentPaymentRequests(),
      accountService.list(),
    ]).then(([reqs, hist, sentReqs, accts]) => {
      setRequests(reqs);
      setHistory(hist);
      setSent(sentReqs);
      setAccounts(accts);
    });
  }

  useEffect(() => {
    load()
      .catch(() => showToast('Could not load payment requests', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startApprove(request: PendingPaymentIntent) {
    setActingId(request.id);
    const primary = accounts.find((a) => a.isPrimary);
    setAccountId(primary?.id ?? accounts[0]?.id ?? '');
    setPin('');
  }

  function cancelApprove() {
    setActingId(null);
    setPin('');
  }

  async function handleApprove(requestId: string) {
    if (!accountId) return;
    setSubmitting(true);
    try {
      await gatewayService.approvePaymentRequest(requestId, accountId, pin);
      showToast('Payment approved', 'success');
      setActingId(null);
      setPin('');
      await load();
    } catch {
      showToast('Could not approve — check your T-PIN', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDecline(requestId: string) {
    setDecliningId(requestId);
    try {
      await gatewayService.declinePaymentRequest(requestId);
      showToast('Payment request declined', 'success');
      await load();
    } catch {
      showToast('Could not decline the request', 'error');
    } finally {
      setDecliningId(null);
    }
  }

  return (
    <div className={`container ${styles.wrapper}`}>
      <h1>Payment requests</h1>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'received' ? styles.tabActive : ''}`}
          onClick={() => setTab('received')}
        >
          Received
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === 'sent' ? styles.tabActive : ''}`}
          onClick={() => setTab('sent')}
        >
          Sent
        </button>
      </div>

      {tab === 'received' ? (
        <>
          <p className="text-muted">
            Merchants that have asked to collect money from you — nothing is paid until you approve it with a T-PIN.
          </p>

          {loading ? (
            <p className="text-muted">Loading…</p>
          ) : requests.length === 0 ? (
            <p className="text-muted">No payment requests right now.</p>
          ) : (
            <div className={styles.list}>
              {requests.map((request) => (
                <div key={request.id} className={styles.card}>
                  <div className={styles.top}>
                    <div>
                      <div className={styles.merchant}>{request.merchantName}</div>
                      <div className={styles.sub}>Expires {formatMinutesRemaining(request.expiresAt)}</div>
                    </div>
                    <div className={styles.amount}>{formatRupees(request.amountMinor)}</div>
                  </div>

                  {actingId === request.id ? (
                    <div className={styles.approveForm}>
                      <div className="field">
                        <label>Pay from</label>
                        <select className="input" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                              {accountDisplayName(a)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field">
                        <label>T-PIN for this account</label>
                        <OtpInput value={pin} onChange={setPin} length={4} masked />
                      </div>
                      <div className={styles.formActions}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => handleApprove(request.id)}
                          disabled={submitting || pin.length < 4 || !accountId}
                        >
                          {submitting ? 'Approving…' : 'Confirm & Pay'}
                        </button>
                        <button type="button" className="btn" onClick={cancelApprove} disabled={submitting}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.actions}>
                      <button type="button" className="btn btn-primary" onClick={() => startApprove(request)}>
                        Approve
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => handleDecline(request.id)}
                        disabled={decliningId === request.id}
                      >
                        {decliningId === request.id ? 'Declining…' : 'Decline'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className={styles.section}>
            <h2>History</h2>
            {loading ? (
              <p className="text-muted">Loading…</p>
            ) : history.length === 0 ? (
              <p className="text-muted">Nothing approved, declined, or expired yet.</p>
            ) : (
              <div className={styles.rowList}>
                {history.map((item) => (
                  <div key={item.id} className={styles.row}>
                    <div>
                      <div className={styles.merchant}>{item.merchantName}</div>
                      <div className={styles.sub}>{formatDateTime(item.createdAt)}</div>
                    </div>
                    <span className={`${styles.badge} ${styles[`badge_${item.status}`]}`}>
                      {STATUS_LABEL[item.status]}
                    </span>
                    <div className={styles.amount}>{formatRupees(item.amountMinor)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className={styles.section}>
          <p className="text-muted">Payment requests you've sent from any of your Business accounts.</p>
          {loading ? (
            <p className="text-muted">Loading…</p>
          ) : sent.length === 0 ? (
            <p className="text-muted">
              You haven't requested any payments yet — open a Business account's page to send one.
            </p>
          ) : (
            <div className={styles.rowList}>
              {sent.map((item) => (
                <div key={item.id} className={styles.row}>
                  <div>
                    <div className={styles.merchant}>{item.payerPhone}</div>
                    <div className={styles.sub}>
                      {item.accountName} · {formatDateTime(item.createdAt)}
                    </div>
                  </div>
                  <span className={`${styles.badge} ${styles[`badge_${item.status}`]}`}>{STATUS_LABEL[item.status]}</span>
                  <div className={styles.amount}>{formatRupees(item.amountMinor)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
