export interface LoginInput {
  phone: string;
  password: string;
}

export interface VerifyOtpInput {
  phone: string;
  otp: string;
}

export interface AuthUser {
  userId: string;
  phone: string;
  email: string;
  role: 'payer' | 'payee' | 'merchant' | 'admin';
}
