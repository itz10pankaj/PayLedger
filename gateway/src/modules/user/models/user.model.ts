// Shape of a `users` row as stored in Postgres — table schema only.
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: 'payer' | 'payee' | 'merchant' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}
