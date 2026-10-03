import { api } from './client';
export const authApi = {
  login: (identifier: string, password: string) =>
    api.post<any>('/auth/login', { identifier, password }),
  register: (body: any) => api.post<any>('/auth/register', body),
  me: () => api.get<any>('/auth/me'),
  logout: () => api.post<any>('/auth/logout', {}),
  logoutAll: () => api.post<any>('/auth/logout-all', {}),
  changePassword: (old_password: string, new_password: string) =>
    api.post<any>('/auth/change-password', { old_password, new_password }),
  forgot: (email: string) => api.post<any>('/auth/forgot-password', { email }),
  reset: (token: string, new_password: string) => api.post<any>('/auth/reset-password', { token, new_password }),
};
