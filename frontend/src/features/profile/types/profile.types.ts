export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'payer' | 'payee' | 'merchant' | 'admin';
  createdAt: string;
}
