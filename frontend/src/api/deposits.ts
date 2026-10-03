import { api } from './client';
export const depositsApi = {
  fds: () => api.get<any>('/fixed-deposits'),
  createFd: (body: any) => api.post<any>('/fixed-deposits', body),
  requests: (status = '') => api.get<any>(`/deposit-requests${status ? `?status=${status}` : ''}`),
  createRequest: (account_id: number, amount: string, note = '') =>
    api.post<any>('/deposit-requests', { account_id, amount, note }),
};
