import { httpClient } from '../../../api/httpClient';
import type { Account, AccountType, LedgerEntry } from '../types/account.types';

export const accountService = {
  async list(): Promise<Account[]> {
    const { data } = await httpClient.get('/api/v1/accounts');
    return data.data;
  },

  async startCreate(type: AccountType): Promise<{ message: string; expiresInSeconds: number }> {
    const { data } = await httpClient.post('/api/v1/accounts/start', { type });
    return data.data;
  },

  async verifyCreate(otp: string, tPin: string): Promise<Account> {
    const { data } = await httpClient.post('/api/v1/accounts/verify', { otp, tPin });
    return data.data;
  },

  async getBalance(accountId: string): Promise<{ balanceMinor: number }> {
    const { data } = await httpClient.get(`/api/v1/accounts/${accountId}/balance`);
    return data.data;
  },

  async getLedger(accountId: string, params?: { limit?: number; offset?: number }): Promise<{ entries: LedgerEntry[] }> {
    const { data } = await httpClient.get(`/api/v1/accounts/${accountId}/ledger`, { params });
    return data.data;
  },

  async setPrimary(accountId: string): Promise<void> {
    await httpClient.patch(`/api/v1/accounts/${accountId}/primary`);
  },

  async setPin(accountId: string, newTPin: string, currentTPin?: string): Promise<void> {
    await httpClient.patch(`/api/v1/accounts/${accountId}/pin`, { newTPin, currentTPin });
  },
};
