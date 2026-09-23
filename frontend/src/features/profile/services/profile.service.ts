import { httpClient } from '../../../api/httpClient';
import type { Profile } from '../types/profile.types';

export const profileService = {
  async getMe(): Promise<Profile> {
    const { data } = await httpClient.get('/users/me');
    return data.data;
  },

  async updateMe(input: { name?: string; email?: string }): Promise<Profile> {
    const { data } = await httpClient.patch('/users/me', input);
    return data.data;
  },
};
