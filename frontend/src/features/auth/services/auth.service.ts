import { httpClient } from '../../../api/httpClient';
import type { LoginInput, VerifyOtpInput } from '../types/auth.types';

export const authService = {
  async login(input: LoginInput): Promise<{ message: string; expiresInSeconds: number }> {
    const { data } = await httpClient.post('/auth/login', input);
    return data.data;
  },

  async verifyOtp(input: VerifyOtpInput): Promise<{ token: string }> {
    const { data } = await httpClient.post('/auth/verify-otp', input);
    return data.data;
  },

  async me() {
    const { data } = await httpClient.get('/auth/me');
    return data.data;
  },
};
