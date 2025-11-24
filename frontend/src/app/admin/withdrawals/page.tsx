'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/AdminNav';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  status: string;
  createdAt: string;
  user?: {
    email: string;
    username: string;
  };
}

export default function AdminWithdrawalsPage() {
  const router = useRouter();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWithdrawals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchWithdrawals() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      const response = await fetch('http://localhost:4000/api/admin/withdrawals', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch withdrawals');
      }

      const data = await response.json();
      setWithdrawals(data.withdrawals || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load withdrawals');
    } finally {
      setLoading(false);
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <AdminNav />
        <div className="flex items-center justify-center p-20">
          <div className="text-white text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl font-semibold">Loading withdrawals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <AdminNav />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Withdrawals</h1>
            <p className="text-gray-400">Manage withdrawal requests</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-purple-900/20 border-b border-purple-500/20">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-300">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-300">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-300">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-300">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                        No withdrawal requests found
                      </td>
                    </tr>
                  ) : (
                    withdrawals.map((withdrawal) => (
                      <tr
                        key={withdrawal.id}
                        className="border-b border-purple-500/10 hover:bg-purple-900/10 transition-colors"
                      >
                        <td className="px-6 py-4 text-white">
                          {withdrawal.user?.email || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 text-white font-semibold">
                          ${withdrawal.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(withdrawal.status)}
                            <span className="text-gray-300 capitalize">{withdrawal.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {new Date(withdrawal.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          {withdrawal.status === 'pending' && (
                            <div className="flex gap-2">
                              <button className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-sm transition-colors">
                                Approve
                              </button>
                              <button className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm transition-colors">
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <h3 className="text-gray-400 text-sm mb-2">Total Requests</h3>
              <p className="text-3xl font-bold text-white">{withdrawals.length}</p>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <h3 className="text-gray-400 text-sm mb-2">Pending</h3>
              <p className="text-3xl font-bold text-yellow-400">
                {withdrawals.filter((w) => w.status === 'pending').length}
              </p>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <h3 className="text-gray-400 text-sm mb-2">Total Amount</h3>
              <p className="text-3xl font-bold text-white">
                ${withdrawals.reduce((sum, w) => sum + w.amount, 0).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
