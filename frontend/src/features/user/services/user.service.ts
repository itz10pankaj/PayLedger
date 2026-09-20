import { httpClient } from '../../../api/httpClient';
import type { StartSignupInput, VerifySignupInput } from '../types/user.types';

export const userService = {
  async signupStart(input: StartSignupInput): Promise<{ message: string; expiresInSeconds: number }> {
    const { data } = await httpClient.post('/users/signup/start', input);
    return data.data;
  },

  async signupVerify(input: VerifySignupInput) {
    const { data } = await httpClient.post('/users/signup/verify', input);
    return data.data;
  },
};
