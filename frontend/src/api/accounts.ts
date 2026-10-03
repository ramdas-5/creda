import { api } from './client';
import type { Account, Paginated } from '../types';
export const accountsApi = {
  list: () => api.get<Account[] | Paginated<Account>>('/accounts'),
  get: (id: string) => api.get<Account>(`/accounts/${id}`),
  withdraw: (account_id: number, amount: string, description = '') =>
    api.post<any>('/accounts/withdraw', { account_id, amount, method: 'CASH' }),
};
