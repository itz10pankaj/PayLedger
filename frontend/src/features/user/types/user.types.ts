export interface StartSignupInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: 'payer' | 'payee' | 'merchant' | 'admin';
}

export interface VerifySignupInput {
  phone: string;
  otp: string;
}
