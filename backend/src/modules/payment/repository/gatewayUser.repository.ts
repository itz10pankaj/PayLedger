import axios from 'axios';
import { env } from '../../../config/env';
import { ApiError } from '../../../common/utils/ApiError';

export interface GatewayUser {
  id: string;
  name: string;
  phone: string;
  role: 'payer' | 'payee' | 'merchant' | 'admin';
}

const gatewayClient = axios.create({ baseURL: env.gatewayUrl });

export const gatewayUserRepository = {
  async findByPhone(phone: string): Promise<GatewayUser> {
    try {
      const { data } = await gatewayClient.get(`/users/by-phone/${phone}`);
      return data.data as GatewayUser;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 404) {
        throw ApiError.notFound('No user with this phone number');
      }
      throw err;
    }
  },
};
