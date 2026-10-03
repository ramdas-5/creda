import { api } from './client';
export const transactionsApi = {
  list: (params: Record<string, string | number | undefined> = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') q.set(k, String(v)); });
    const s = q.toString();
    return api.get<any>(`/transactions${s ? `?${s}` : ''}`);
  },
  get: (id: string) => api.get<any>(`/transactions/${id}`),
};
