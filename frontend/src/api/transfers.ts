import { api } from './client';
export const transfersApi = {
  list: (params: Record<string, string | number | undefined> = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== '') q.set(k, String(v)); });
    const s = q.toString();
    return api.get<any>(`/transfers${s ? `?${s}` : ''}`);
  },
  create: (body: any) =>
    api.post<any>('/transfers', { ...body, idempotency_key: body.idempotency_key || crypto.randomUUID() }),
};
