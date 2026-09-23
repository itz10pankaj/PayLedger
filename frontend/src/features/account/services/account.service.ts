import { httpClient } from '../../../api/httpClient';
import type { Account, AccountType, LedgerEntry } from '../types/account.types';

export const accountService = {
  async list(): Promise<Account[]> {
    const { data } = await httpClient.get('/api/v1/accounts');
    return data.data;
  },

  async startCreate(type: AccountType, nickname?: string): Promise<{ message: string; expiresInSeconds: number }> {
    const { data } = await httpClient.post('/api/v1/accounts/start', { type, nickname });
    return data.data;
  },

  async verifyCreate(otp: string, tPin: string): Promise<Account> {
    const { data } = await httpClient.post('/api/v1/accounts/verify', { otp, tPin });
    return data.data;
  },

  // The only way a balance figure ever reaches the client — requires
  // this specific account's T-PIN, same as a real UPI "Check Balance".
  async checkBalance(accountId: string, tPin: string): Promise<{ balanceMinor: number }> {
    const { data } = await httpClient.post(`/api/v1/accounts/${accountId}/check-balance`, { tPin });
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

  async setNickname(accountId: string, nickname: string | null): Promise<void> {
    await httpClient.patch(`/api/v1/accounts/${accountId}/nickname`, { nickname });
  },
};
