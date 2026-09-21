import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../../components/Toast/ToastProvider';
import { formatRupees } from '../../../utils/money';
import { accountService } from '../../account/services/account.service';
import { paymentService } from '../services/payment.service';
import type { Account } from '../../account/types/account.types';
import type { CreatePaymentResult } from '../types/payment.types';
import styles from './SendMoneyPage.module.css';

export function SendMoneyPage() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [payerAccountId, setPayerAccountId] = useState('');
  const [toPhone, setToPhone] = useState('');
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [checkingRecipient, setCheckingRecipient] = useState(false);
  const [amount, setAmount] = useState('');
  const [tPin, setTPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreatePaymentResult | null>(null);

  useEffect(() => {
    accountService.list().then((list) => {
      setAccounts(list);
      const primary = list.find((a) => a.isPrimary);
      if (primary) setPayerAccountId(primary.id);
      else if (list.length > 0) setPayerAccountId(list[0].id);
    });
  }, []);

  // Look up who a phone number belongs to as soon as it's a full 10
  // digits, so the sender can confirm the recipient before committing
  // money — the same "Sending to: <name>" check every UPI app does.
  useEffect(() => {
    setRecipientName(null);
    setRecipientError(null);
    if (toPhone.length !== 10) return;

    let cancelled = false;
    setCheckingRecipient(true);
    paymentService
      .resolveRecipient(toPhone)
      .then((r) => {
        if (!cancelled) setRecipientName(r.name);
      })
      .catch(() => {
        if (!cancelled) setRecipientError('No PayLedger user with this number');
      })
      .finally(() => {
        if (!cancelled) setCheckingRecipient(false);
      });

    return () => {
      cancelled = true;
    };
  }, [toPhone]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setResult(null);
    setSubmitting(true);
    try {
      const amountMinor = Math.round(Number(amount) * 100);
      const payment = await paymentService.create({ payerAccountId, toPhone, amountMinor, tPin });
      setResult(payment);
      showToast('Payment sent', 'success');
      setAmount('');
      setTPin('');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        'Payment failed';
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = accounts.length > 0 && !!recipientName && tPin.length === 4;

  return (
    <div className={`container ${styles.wrapper}`}>
      <div className={`card ${styles.formCard}`}>
        <h1>Send money</h1>
        <p className={styles.subtitle}>Pay anyone on PayLedger using their mobile number.</p>
        <form className="form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="fromAccount">From account</label>
            <select
              id="fromAccount"
              className="input"
              value={payerAccountId}
              onChange={(e) => setPayerAccountId(e.target.value)}
              required
            >
              {accounts.length === 0 && <option value="">No accounts yet</option>}
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.type} account{a.isPrimary ? ' (primary)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="toPhone">To mobile number</label>
            <input
              id="toPhone"
              type="tel"
              className="input"
              placeholder="98765 43210"
              value={toPhone}
              onChange={(e) => setToPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              required
            />
            {checkingRecipient && <span className="text-subtle">Checking…</span>}
            {recipientName && <span className={styles.recipientFound}>Sending to {recipientName}</span>}
            {recipientError && <span className={styles.recipientError}>{recipientError}</span>}
          </div>
          <div className="field">
            <label htmlFor="amount">Amount</label>
            <div className={styles.amountPrefix}>
              <span className={styles.prefix}>₹</span>
              <input
                id="amount"
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
          </div>
          <div className="field">
            <label htmlFor="tPin">T-PIN for this account</label>
            <input
              id="tPin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              className={`input ${styles.pinInput}`}
              value={tPin}
              onChange={(e) => setTPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting || !canSubmit}>
            {submitting ? 'Sending…' : 'Send'}
          </button>
        </form>

        {result && (
          <div className={styles.resultCard}>
            <strong>Sent {formatRupees(result.amountMinor)}</strong>
            {result.feeMinor > 0 && <span> (fee {formatRupees(result.feeMinor)})</span>}
            <div>
              <button type="button" className="btn-link" onClick={() => navigate('/dashboard')}>
                Back to dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
