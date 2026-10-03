import { api } from './client';
export const supportApi = {
  list: () => api.get<any>('/support'),
  get: (id: string) => api.get<any>(`/support/${id}`),
  create: (body: any) => api.post<any>('/support', body),
  reply: (id: string, body: string) => api.post<any>(`/support/${id}/replies`, { body }),
};
