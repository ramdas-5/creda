import { api } from './client';
export const statementsApi = {
  get: (params: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) q.set(k, v); });
    return api.get<any>(`/statements?${q.toString()}`);
  },
};
