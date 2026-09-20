import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../../components/AuthLayout';
import { OtpInput } from '../../../components/OtpInput';
import { useToast } from '../../../components/Toast/ToastProvider';
import { useAuth } from '../context/AuthContext';
import styles from './LoginPage.module.css';

const RESEND_COOLDOWN_SECONDS = 30;

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function LoginPage() {
  const { requestOtp, verifyOtp } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (step !== 'otp') return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
      setResendCooldown((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  async function sendOtp() {
    const { expiresInSeconds } = await requestOtp({ phone, password });
    setSecondsLeft(expiresInSeconds);
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    setOtp('');
  }

  async function handleCredentialsSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await sendOtp();
      setStep('otp');
    } catch {
      showToast('Invalid phone number or password', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOtpSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await verifyOtp({ phone, otp });
      navigate('/dashboard');
    } catch {
      showToast('Invalid or expired OTP', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    try {
      await sendOtp();
      showToast('A new code has been sent.', 'success');
    } catch {
      showToast('Could not resend the code — try again shortly.', 'error');
    }
  }

  if (step === 'otp') {
    return (
      <AuthLayout>
        <h1>Verify it&rsquo;s you</h1>
        <p className={styles.subtitle}>Enter the 6-digit code sent to +91 {phone}.</p>
        <form className="form" onSubmit={handleOtpSubmit}>
          <div className="field">
            <label>One-time code</label>
            <OtpInput value={otp} onChange={setOtp} />
            <div className={styles.meta}>
              <span className="text-subtle">{secondsLeft > 0 ? `Expires in ${formatMmSs(secondsLeft)}` : 'Code expired'}</span>
              <button
                type="button"
                className="btn-link"
                onClick={handleResend}
                disabled={resendCooldown > 0}
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting || otp.length < 6}>
            {submitting ? 'Verifying…' : 'Verify & continue'}
          </button>
        </form>
        <p className={styles.backRow}>
          <button type="button" className="btn-link" onClick={() => setStep('credentials')}>
            Use a different number
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1>Log in</h1>
      <p className={styles.subtitle}>Welcome back — enter your details to receive a one-time code.</p>
      <form className="form" onSubmit={handleCredentialsSubmit}>
        <div className="field">
          <label htmlFor="phone">Mobile number</label>
          <input
            id="phone"
            type="tel"
            className="input"
            placeholder="98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            pattern="[6-9][0-9]{9}"
            title="10-digit mobile number"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="input"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Sending OTP…' : 'Send OTP'}
        </button>
      </form>
      <p className={styles.footer}>
        <span className="text-muted">No account? </span>
        <Link to="/signup" className="btn-link">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
