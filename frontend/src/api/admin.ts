import { api } from './client';

export const adminApi = {
  overview: () => api.get<any>('/admin/overview'),
  dashboard: () => api.get<any>('/admin/dashboard'),
  requestSummary: () => api.get<any>('/admin/requests/summary'),
  depositRequests: (status = '') => api.get<any>(`/admin/deposit-requests${status ? `?status=${status}` : ''}`),
  approveDeposit: (id: string | number, note = '') => api.post<any>(`/admin/deposit-requests/${id}/approve`, { note }),
  rejectDeposit: (id: string | number, reason = '') => api.post<any>(`/admin/deposit-requests/${id}/reject`, { reason }),
  loanApplications: (status = '') => api.get<any>(`/admin/loan-applications${status ? `?status=${status}` : ''}`),
  approveLoan: (id: string | number, approved_amount: string, note = '') =>
    api.post<any>(`/admin/loan-applications/${id}/approve`, { approved_amount, note }),
  rejectLoan: (id: string | number, reason = '') =>
    api.post<any>(`/admin/loan-applications/${id}/reject`, { reason }),
  cardRequests: (status = '') => api.get<any>(`/admin/card-requests${status ? `?status=${status}` : ''}`),
  approveCard: (id: string | number) => api.post<any>(`/admin/card-requests/${id}/approve`, {}),
  rejectCard: (id: string | number, reason = '') => api.post<any>(`/admin/card-requests/${id}/reject`, { reason }),
  users: (p = 1) => api.get<any>(`/users?page=${p}&size=20`),
  suspendUser: (id: string | number) => api.post<any>(`/admin/users/${id}/suspend`, {}),
  activateUser: (id: string | number) => api.post<any>(`/admin/users/${id}/activate`, {}),
  customers: (p = 1, q = '') => api.get<any>(`/admin/customers?page=${p}&size=20&search=${encodeURIComponent(q)}`),
  setKyc: (id: string | number, kyc_status: string) =>
    api.patch<any>(`/admin/customers/${id}/kyc`, { kyc_status }),
  accounts: (p = 1) => api.get<any>(`/admin/accounts?page=${p}&size=20`),
  setAccountStatus: (id: string | number, status: string) =>
    api.patch<any>(`/admin/accounts/${id}/status`, { status }),
  transactions: (p = 1) => api.get<any>(`/admin/transactions?page=${p}&size=20`),
  reverseTxn: (id: string | number) => api.post<any>(`/admin/transactions/${id}/reverse`, {}),
  tellerDeposit: (account_id: number, amount: string, method = 'CASH') =>
    api.post<any>('/admin/teller/deposit', { account_id, amount, method }),
  tellerWithdraw: (account_id: number, amount: string, method = 'CASH') =>
    api.post<any>('/admin/teller/withdraw', { account_id, amount, method }),
  branches: () => api.get<any>('/admin/branches'),
  createBranch: (b: any) => api.post<any>('/admin/branches', b),
  auditLogs: (p = 1) => api.get<any>(`/audit?page=${p}&size=20`),
  reports: () => api.get<any>('/admin/reports'),
  settings: () => api.get<any>('/admin/settings'),
  saveSettings: (b: any) => api.put<any>('/admin/settings', b),
};
