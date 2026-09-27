import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Modal } from '../../../components/Modal';
import { useToast } from '../../../components/Toast/ToastProvider';
import { accountDisplayName } from '../../../utils/accountDisplay';
import { formatMinutesRemaining } from '../../../utils/date';
import { formatRupees } from '../../../utils/money';
import { accountService } from '../../account/services/account.service';
import { gatewayService } from '../services/gateway.service';
import type { Account } from '../../account/types/account.types';
import type { CreatedPaymentIntent } from '../types/gateway.types';
import styles from './RequestMoneyModal.module.css';

interface RequestMoneyModalProps {
  open: boolean;
  onClose: () => void;
}

// Only Business accounts can request payments — the same rule
// issueApiKey.service.ts enforces server-side. This modal just picks
// which one, then calls the exact same session-authenticated endpoint
// the Account Detail page's "Request a payment" form does.
export function RequestMoneyModal({ open, onClose }: RequestMoneyModalProps) {
  const { showToast } = useToast();
  const [merchantAccounts, setMerchantAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountId, setAccountId] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<CreatedPaymentIntent | null>(null);

  useEffect(() => {
    if (!open) return;
    setCreated(null);
    setPhone('');
    setAmount('');
    setLoadingAccounts(true);
    accountService
      .list()
      .then((accounts) => {
        const merchants = accounts.filter((a) => a.type === 'merchant');
        setMerchantAccounts(merchants);
        setAccountId(merchants[0]?.id ?? '');
      })
      .finally(() => setLoadingAccounts(false));
  }, [open]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accountId) return;
    setSubmitting(true);
    try {
      const amountMinor = Math.round(Number(amount) * 100);
      const intent = await gatewayService.createPaymentRequest(accountId, phone, amountMinor);
      setCreated(intent);
      showToast('Payment request sent', 'success');
    } catch {
      showToast('Could not send the request — check the phone number', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Request money">
      {loadingAccounts ? (
        <p className="text-muted">Loading your accounts…</p>
      ) : merchantAccounts.length === 0 ? (
        <p className="text-muted">
          You need a Business account to request payments — add one from the Accounts page.
        </p>
      ) : created ? (
        <div className={styles.confirm}>
          <p>
            Sent — {formatRupees(created.amountMinor)} requested from {created.payerPhone}, expires{' '}
            {formatMinutesRemaining(created.expiresAt)}.
          </p>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className="field">
            <label>Receive into</label>
            <select className="input" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {merchantAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {accountDisplayName(a)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Customer phone number</label>
            <input
              type="tel"
              className="input"
              placeholder="98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Amount (₹)</label>
            <input
              type="number"
              min="1"
              step="0.01"
              className="input"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className={styles.actions}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Sending…' : 'Send request'}
            </button>
            <button type="button" className="btn" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
