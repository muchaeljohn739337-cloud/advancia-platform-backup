import apiClient from './apiClient';/**

 * API Configuration

// Admin API calls * Centralized API endpoint configuration for frontend

export const adminApi = { */

  // Dashboard stats

  getDashboardStats: () => apiClient.get('/api/admin/dashboard/stats'),// Get API URL from environment or fallback to localhost

  export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Usersexport const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

  getUsers: () => apiClient.get('/api/admin/users'),

  getUserById: (id: string) => apiClient.get(`/api/admin/users/${id}`),// API endpoints

  updateUser: (id: string, data: any) => apiClient.put(`/api/admin/users/${id}`, data),export const API_ENDPOINTS = {

  deleteUser: (id: string) => apiClient.delete(`/api/admin/users/${id}`),  // Auth

    LOGIN: `${API_URL}/api/auth/login`,

  // Withdrawals  REGISTER: `${API_URL}/api/auth/register`,

  getWithdrawals: () => apiClient.get('/api/admin/withdrawals'),  LOGOUT: `${API_URL}/api/auth/logout`,

  approveWithdrawal: (id: string) => apiClient.post(`/api/admin/withdrawals/${id}/approve`),  VERIFY_EMAIL: `${API_URL}/api/auth/verify-email`,

  rejectWithdrawal: (id: string, reason: string) =>   FORGOT_PASSWORD: `${API_URL}/api/auth/forgot-password`,

    apiClient.post(`/api/admin/withdrawals/${id}/reject`, { reason }),  RESET_PASSWORD: `${API_URL}/api/auth/reset-password`,

    ME: `${API_URL}/api/auth/me`,

  // Analytics  

  getAnalytics: () => apiClient.get('/api/admin/analytics/overview'),  // Payments

    PAYMENTS: `${API_URL}/api/payments`,

  // System health  PAYMENT_SESSION: (id: string) => `${API_URL}/api/payments/session/${id}`,

  getSystemHealth: () => apiClient.get('/api/admin/system/health'),  STRIPE_WEBHOOK: `${API_URL}/api/payments/webhook`,

    

  // Logs  // Crypto Payments

  getLogs: (params?: any) => apiClient.get('/api/admin/logs', { params }),  CRYPTO_INVOICE: `${API_URL}/api/cryptomus/create-invoice`,

    CRYPTO_STATUS: (id: string) => `${API_URL}/api/cryptomus/status/${id}`,

  // Settings  CRYPTO_HISTORY: `${API_URL}/api/cryptomus/history`,

  getSettings: () => apiClient.get('/api/admin/settings'),  

  updateSettings: (data: any) => apiClient.put('/api/admin/settings', data),  // Tokens

    TOKEN_WALLET: `${API_URL}/api/tokens/wallet`,

  // Sessions  TOKEN_BALANCE: `${API_URL}/api/tokens/balance`,

  getSessions: () => apiClient.get('/api/admin/sessions'),  TOKEN_TRANSFER: `${API_URL}/api/tokens/transfer`,

  revokeSession: (sessionId: string) => apiClient.delete(`/api/admin/sessions/${sessionId}`),  TOKEN_WITHDRAW: `${API_URL}/api/tokens/withdraw`,

};  TOKEN_CASHOUT: `${API_URL}/api/tokens/cashout`,

  TOKEN_HISTORY: `${API_URL}/api/tokens/history`,

// User API calls  

export const userApi = {  // Rewards

  // Profile  REWARDS: `${API_URL}/api/rewards`,

  getProfile: () => apiClient.get('/api/profile'),  CLAIM_REWARD: (id: string) => `${API_URL}/api/rewards/claim/${id}`,

  updateProfile: (data: any) => apiClient.put('/api/profile', data),  USER_TIER: `${API_URL}/api/rewards/tier`,

    

  // Transactions  // Withdrawals

  getTransactions: () => apiClient.get('/api/transactions'),  WITHDRAWALS: `${API_URL}/api/withdrawals`,

  getTransactionById: (id: string) => apiClient.get(`/api/transactions/${id}`),  WITHDRAWAL_REQUEST: `${API_URL}/api/withdrawals/request`,

    

  // Crypto  // Admin

  getCryptoBalance: () => apiClient.get('/api/crypto/balance'),  ADMIN_USERS: `${API_URL}/api/admin/users`,

  createWithdrawal: (data: any) => apiClient.post('/api/withdrawals', data),  ADMIN_APPROVE: (id: string) => `${API_URL}/api/admin/users/${id}/approve`,

    ADMIN_REJECT: (id: string) => `${API_URL}/api/admin/users/${id}/reject`,

  // Payments  ADMIN_DASHBOARD: `${API_URL}/api/admin/dashboard`,

  createPayment: (data: any) => apiClient.post('/api/payments', data),  

    // Security Admin

  // Debit card  BLOCKED_IPS: `${API_URL}/api/admin/security-management/blocked-ips`,

  getDebitCards: () => apiClient.get('/api/debit-card'),  BLOCK_IP: `${API_URL}/api/admin/security-management/block-ip`,

  orderDebitCard: (data: any) => apiClient.post('/api/debit-card/order', data),  UNBLOCK_IP: (id: string) => `${API_URL}/api/admin/security-management/unblock-ip/${id}`,

};  SECURITY_ALERTS: `${API_URL}/api/admin/security-management/alerts`,

  FAILED_LOGINS: `${API_URL}/api/admin/security-management/failed-logins`,

// Auth API calls (no interceptor needed - uses fetch)  UNLOCK_ACCOUNT: `${API_URL}/api/admin/security-management/unlock-account`,

export const authApi = {  

  login: (email: string, password: string) =>  // Transactions

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {  TRANSACTIONS: `${API_URL}/api/transactions`,

      method: 'POST',  

      headers: { 'Content-Type': 'application/json' },  // MedBeds

      body: JSON.stringify({ email, password }),  MEDBEDS: `${API_URL}/api/medbeds`,

    }).then((res) => res.json()),  MEDBEDS_BOOK: `${API_URL}/api/medbeds/book`,

  };

  register: (data: any) =>

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {/**

      method: 'POST', * API request helper with authentication

      headers: { 'Content-Type': 'application/json' }, */

      body: JSON.stringify(data),export async function apiRequest<T = any>(

    }).then((res) => res.json()),  endpoint: string,

    options: RequestInit = {}

  adminLogin: (email: string, password: string, phoneNumber?: string) =>): Promise<T> {

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/admin/login`, {  const token = localStorage.getItem('token');

      method: 'POST',  

      headers: { 'Content-Type': 'application/json' },  const headers: HeadersInit = {

      body: JSON.stringify({ email, password, phoneNumber }),    'Content-Type': 'application/json',

    }).then((res) => res.json()),    ...(options.headers || {}),

    };

  verifyOtp: (email: string, otpCode: string) =>  

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/admin/verify-otp`, {  if (token) {

      method: 'POST',    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;

      headers: { 'Content-Type': 'application/json' },  }

      body: JSON.stringify({ email, otpCode }),  

    }).then((res) => res.json()),  const response = await fetch(endpoint, {

};    ...options,

    headers,

export default apiClient;  });

  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }
  
  return response.json();
}

/**
 * WebSocket connection helper
 */
export function connectWebSocket(token?: string) {
  const url = token ? `${WS_URL}?token=${token}` : WS_URL;
  return new WebSocket(url);
}

export default {
  API_URL,
  WS_URL,
  API_ENDPOINTS,
  apiRequest,
  connectWebSocket,
};
