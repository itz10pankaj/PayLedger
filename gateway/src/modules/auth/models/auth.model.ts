export interface LoginInput {
  phone: string;
  password: string;
}

export interface VerifyOtpInput {
  phone: string;
  otp: string;
}

// What gets stored in Redis under session:<token>, and attached to req.user.
export interface SessionData {
  userId: string;
  phone: string;
  email: string;
  role: 'payer' | 'payee' | 'merchant' | 'admin';
}
