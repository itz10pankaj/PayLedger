import axios from 'axios';

// The frontend only ever talks to the gateway — never directly to the
// backend — so this is the single base URL for every feature's service file.
export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_GATEWAY_URL ?? 'http://localhost:5000',
});

httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('payledger_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
