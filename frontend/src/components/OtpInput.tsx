import { useEffect, useRef, useState } from 'react';
import type { ClipboardEvent, KeyboardEvent } from 'react';
import styles from './OtpInput.module.css';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  masked?: boolean;
}

// Generalized beyond just OTP — also used as the boxed T-PIN input
// (length=4, masked) so PIN entry gets the same polished UI as a code.
export function OtpInput({ value, onChange, length = 6, masked = false }: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(() => Array.from({ length }, (_, i) => value[i] ?? ''));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // The parent resets `value` to '' after a resend — clear the boxes to match.
  useEffect(() => {
    if (value === '') {
      setDigits(Array(length).fill(''));
    }
  }, [value, length]);

  function commit(next: string[]) {
    setDigits(next);
    onChange(next.join('').trimEnd());
  }

  function handleChange(index: number, raw: string) {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    commit(next);
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length).split('');
    const next = Array(length).fill('');
    pasted.forEach((d, i) => {
      next[i] = d;
    });
    commit(next);
    inputRefs.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  return (
    <div className={styles.row} onPaste={handlePaste}>
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          className={styles.box}
          type={masked ? 'password' : 'text'}
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
        />
      ))}
    </div>
  );
}
