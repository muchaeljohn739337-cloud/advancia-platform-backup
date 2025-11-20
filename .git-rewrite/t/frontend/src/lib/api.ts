import apiClient from './apiClient';

// Admin API calls
export const adminApi = {
  // Dashboard stats
  getDashboardStats: () => apiClient.get('/api/admin/dashboard/stats'),
  
  // Users
  getUsers: () => apiClient.get('/api/admin/users'),
  getUserById: (id: string) => apiClient.get(`/api/admin/users/${id}`),
  updateUser: (id: string, data: any) => apiClient.put(`/api/admin/users/${id}`, data),
  deleteUser: (id: string) => apiClient.delete(`/api/admin/users/${id}`),
  
  // Withdrawals
  getWithdrawals: () => apiClient.get('/api/admin/withdrawals'),
  approveWithdrawal: (id: string) => apiClient.post(`/api/admin/withdrawals/${id}/approve`),
  rejectWithdrawal: (id: string, reason: string) => 
    apiClient.post(`/api/admin/withdrawals/${id}/reject`, { reason }),
  
  // Analytics
  getAnalytics: () => apiClient.get('/api/admin/analytics/overview'),
  
  // System health
  getSystemHealth: () => apiClient.get('/api/admin/system/health'),
  
  // Logs
  getLogs: (params?: any) => apiClient.get('/api/admin/logs', { params }),
  
  // Settings
  getSettings: () => apiClient.get('/api/admin/settings'),
  updateSettings: (data: any) => apiClient.put('/api/admin/settings', data),
  
  // Sessions
  getSessions: () => apiClient.get('/api/admin/sessions'),
  revokeSession: (sessionId: string) => apiClient.delete(`/api/admin/sessions/${sessionId}`),
};

// User API calls
export const userApi = {
  // Profile
  getProfile: () => apiClient.get('/api/profile'),
  updateProfile: (data: any) => apiClient.put('/api/profile', data),
  
  // Transactions
  getTransactions: () => apiClient.get('/api/transactions'),
  getTransactionById: (id: string) => apiClient.get(`/api/transactions/${id}`),
  
  // Crypto
  getCryptoBalance: () => apiClient.get('/api/crypto/balance'),
  createWithdrawal: (data: any) => apiClient.post('/api/withdrawals', data),
  
  // Payments
  createPayment: (data: any) => apiClient.post('/api/payments', data),
  
  // Debit card
  getDebitCards: () => apiClient.get('/api/debit-card'),
  orderDebitCard: (data: any) => apiClient.post('/api/debit-card/order', data),
};

// Auth API calls (no interceptor needed - uses fetch)
export const authApi = {
  login: (email: string, password: string) =>
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then((res) => res.json()),
  
  register: (data: any) =>
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((res) => res.json()),
  
  adminLogin: (email: string, password: string, phoneNumber?: string) =>
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, phoneNumber }),
    }).then((res) => res.json()),
  
  verifyOtp: (email: string, otpCode: string) =>
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/admin/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otpCode }),
    }).then((res) => res.json()),
};

export default apiClient;
