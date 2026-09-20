import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../../components/AuthLayout';
import { OtpInput } from '../../../components/OtpInput';
import { useToast } from '../../../components/Toast/ToastProvider';
import { userService } from '../services/user.service';
import styles from './SignupPage.module.css';

const RESEND_COOLDOWN_SECONDS = 30;

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SignupPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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
    const { expiresInSeconds } = await userService.signupStart({ name, email, phone, password });
    setSecondsLeft(expiresInSeconds);
    setResendCooldown(RESEND_COOLDOWN_SECONDS);
    setOtp('');
  }

  async function handleDetailsSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await sendOtp();
      setStep('otp');
    } catch {
      showToast('Could not start signup — check your details and try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOtpSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await userService.signupVerify({ phone, otp });
      showToast('Phone verified — account created. Log in to continue.', 'success');
      navigate('/login');
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
        <h1>Verify your phone</h1>
        <p className={styles.subtitle}>Enter the 6-digit code sent to +91 {phone}.</p>
        <form className="form" onSubmit={handleOtpSubmit}>
          <div className="field">
            <label>One-time code</label>
            <OtpInput value={otp} onChange={setOtp} />
            <div className={styles.meta}>
              <span className="text-subtle">{secondsLeft > 0 ? `Expires in ${formatMmSs(secondsLeft)}` : 'Code expired'}</span>
              <button type="button" className="btn-link" onClick={handleResend} disabled={resendCooldown > 0}>
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting || otp.length < 6}>
            {submitting ? 'Verifying…' : 'Verify & create account'}
          </button>
        </form>
        <p className={styles.footer}>
          <button type="button" className="btn-link" onClick={() => setStep('details')}>
            Edit details
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <h1>Create account</h1>
      <p className={styles.subtitle}>Set up access to send and track payments.</p>
      <form className="form" onSubmit={handleDetailsSubmit}>
        <div className="field">
          <label htmlFor="name">Name</label>
          <input
            id="name"
            className="input"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
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
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Sending OTP…' : 'Send OTP'}
        </button>
      </form>
      <p className={styles.footer}>
        <span className="text-muted">Already have an account? </span>
        <Link to="/login" className="btn-link">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
