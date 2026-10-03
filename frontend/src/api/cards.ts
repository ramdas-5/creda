import { api } from './client';
export const cardsApi = {
  list: () => api.get<any>('/cards'),
  requests: () => api.get<any>('/card-requests'),
  request: (account_id: number, card_type = 'DEBIT') =>
    api.post<any>('/card-requests', { account_id, card_type }),
  setLimit: (id: string, spending_limit: number) => api.patch<any>(`/cards/${id}`, { spending_limit }),
};
