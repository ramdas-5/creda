import { api } from './client';
export const beneficiariesApi = {
  list: () => api.get<any>('/beneficiaries'),
  create: (body: any) => api.post<any>('/beneficiaries', body),
  update: (id: string, body: any) => api.patch<any>(`/beneficiaries/${id}`, body),
  remove: (id: string) => api.del<any>(`/beneficiaries/${id}`),
};
