import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/auth.service';
import type { AuthUser, LoginInput, VerifyOtpInput } from '../types/auth.types';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  requestOtp: (input: LoginInput) => Promise<{ expiresInSeconds: number }>;
  verifyOtp: (input: VerifyOtpInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const TOKEN_KEY = 'payledger_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    authService
      .me()
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  async function requestOtp(input: LoginInput) {
    const { expiresInSeconds } = await authService.login(input);
    return { expiresInSeconds };
  }

  async function verifyOtp(input: VerifyOtpInput) {
    const { token } = await authService.verifyOtp(input);
    localStorage.setItem(TOKEN_KEY, token);
    setUser(await authService.me());
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, requestOtp, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
