import { api } from './client';
export const loansApi = {
  list: (status = '') => api.get<any>(`/loans?status=${status}`),
  get: (id: string) => api.get<any>(`/loans/${id}`),
  apply: (body: any) => api.post<any>('/loans', body),
  pay: (id: string | number, amount: string) => api.post<any>(`/loans/${id}/pay`, { amount }),
};
