import { api } from './client';
export const notificationsApi = {
  list: () => api.get<any>('/notifications'),
  markRead: (id: string) => api.patch<any>(`/notifications/${id}/read`, {}),
  markAll: () => api.post<any>('/notifications/read-all', {}),
};
