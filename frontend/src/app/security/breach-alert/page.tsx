'use client';

import DashboardRouteGuard from '@/components/DashboardRouteGuard';
import {
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  CreditCard,
  FileText,
  Info,
  Mail,
  Phone,
  Shield,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface DataBreach {
  email: string;
  breachCount: number;
  sources: { name: string; leakCount: number; date?: string; icon?: string }[];
}

export default function BreachAlertPage() {
  const [breaches, setBreaches] = useState<DataBreach[]>([]);
  const [totalBreaches, setTotalBreaches] = useState(0);
  const [loading, setLoading] = useState(true);
  const [monitoring, setMonitoring] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchBreachData();
  }, []);

  async function fetchBreachData() {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;

      const response = await fetch('/api/security/breach-check', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setBreaches(data.breaches || []);
        setTotalBreaches(data.totalBreaches || 0);
        setMonitoring(data.monitoring || false);
      }
    } catch (error) {
      console.error('Breach check error:', error);
      // Demo data for testing
      setBreaches([
        {
          email: 'jerry.gossett2@gmail.com',
          breachCount: 11,
          sources: [
            {
              name: 'forum.btcsec.com',
              leakCount: 2,
              date: '2024-03',
              icon: '🔓',
            },
            {
              name: 'modbsolutions.com',
              leakCount: 8,
              date: '2023-11',
              icon: '💳',
            },
          ],
        },
        {
          email: 'bigkelly@gmail.com',
          breachCount: 15,
          sources: [
            {
              name: 'rivercitymediaonline.com',
              leakCount: 4,
              date: '2024-01',
              icon: '📧',
            },
            { name: 'Exploit.In', leakCount: 2, date: '2023-09', icon: '🔐' },
            {
              name: 'dailymotion.com',
              leakCount: 3,
              date: '2023-07',
              icon: '🎥',
            },
            {
              name: 'pemiblanc.com',
              leakCount: 2,
              date: '2024-02',
              icon: '🔓',
            },
            {
              name: 'Kayo.moe Credential Stuffing List',
              leakCount: 4,
              date: '2023-12',
              icon: '📋',
            },
          ],
        },
        {
          email: 'perrenialspatcouli@gmail.com',
          breachCount: 3,
          sources: [
            {
              name: 'LinkedIn Data Leak 2021',
              leakCount: 1,
              date: '2021-06',
              icon: '💼',
            },
            {
              name: 'Collection #1',
              leakCount: 2,
              date: '2019-01',
              icon: '📦',
            },
          ],
        },
        {
          email: 'admin@advancia.com',
          breachCount: 1,
          sources: [
            {
              name: 'Test Breach Database',
              leakCount: 1,
              date: '2024-11',
              icon: '⚠️',
            },
          ],
        },
      ]);
      setTotalBreaches(317);
    } finally {
      setLoading(false);
    }
  }

  async function activateMonitoring() {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;

      const response = await fetch('/api/security/activate-monitoring', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setMonitoring(true);
      }
    } catch (error) {
      console.error('Activation error:', error);
    }
  }

  const selectedBreach = breaches.find((b) => b.email === selectedEmail);

  return (
    <DashboardRouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-red-100 p-3 rounded-xl">
                <Shield className="h-8 w-8 text-red-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-slate-900">Breach Alert</h1>
                <p className="text-slate-600">Monitor your data for security breaches</p>
              </div>
              {monitoring && (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">24/7 Active</span>
                </div>
              )}
            </div>

            {/* Alert Banner */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 p-6 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-red-600 mb-2">
                    {totalBreaches} data breaches detected
                  </h2>
                  <p className="text-slate-700">Take a look for leaks you should review</p>
                </div>
                {!monitoring && (
                  <button
                    onClick={activateMonitoring}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg transition-colors flex items-center gap-2 shadow-lg"
                  >
                    <Shield className="h-5 w-5" />
                    Activate
                  </button>
                )}
              </div>

              <div className="mt-6 flex items-center gap-3 text-sm text-slate-700">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg">
                  <Info className="h-4 w-4 text-orange-500" />
                  <span className="font-semibold">Turn on 24/7 Breach Monitoring</span>
                </div>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border-2 border-slate-200 rounded-lg hover:border-blue-500 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-2">
                  <Mail className="h-6 w-6 text-blue-600" />
                  <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
                    Premium
                  </span>
                </div>
                <div className="font-bold text-slate-900">Email</div>
                <div className="text-2xl font-bold text-red-600">
                  {breaches.length} data breaches
                </div>
              </div>

              <div className="p-4 border-2 border-slate-200 rounded-lg hover:border-blue-500 transition-colors cursor-pointer opacity-60">
                <div className="flex items-center justify-between mb-2">
                  <Phone className="h-6 w-6 text-blue-600" />
                  <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
                    Premium
                  </span>
                </div>
                <div className="font-bold text-slate-900">Phone number</div>
                <div className="text-2xl font-bold text-slate-400">–</div>
              </div>

              <div className="p-4 border-2 border-slate-200 rounded-lg hover:border-blue-500 transition-colors cursor-pointer opacity-60">
                <div className="flex items-center justify-between mb-2">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                  <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
                    Premium
                  </span>
                </div>
                <div className="font-bold text-slate-900">Credit card</div>
                <div className="text-2xl font-bold text-slate-400">–</div>
              </div>

              <div className="p-4 border-2 border-slate-200 rounded-lg hover:border-blue-500 transition-colors cursor-pointer opacity-60">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <span className="text-xs font-semibold text-orange-500 bg-orange-50 px-2 py-1 rounded-full">
                    Premium
                  </span>
                </div>
                <div className="font-bold text-slate-900">SSN/ID</div>
                <div className="text-2xl font-bold text-slate-400">–</div>
              </div>
            </div>
          </div>

          {/* Breach List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Email List */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-lg text-slate-900 mb-4">Email Breaches</h3>

              {loading ? (
                <div className="text-center py-8 text-slate-500">Loading breach data...</div>
              ) : (
                <div className="space-y-3">
                  {breaches.map((breach, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedEmail(breach.email)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedEmail === breach.email
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 truncate mb-1">
                            {breach.email}
                          </div>
                          <div className="text-sm text-red-600 font-semibold">
                            {breach.breachCount} data breaches
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {breach.breachCount > 5 && (
                            <div className="bg-red-100 text-red-700 rounded-full p-1">
                              <AlertTriangle className="h-4 w-4" />
                            </div>
                          )}
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Breach Details */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="font-bold text-lg text-slate-900 mb-4">Breach Sources</h3>

              {selectedBreach ? (
                <div className="space-y-3">
                  <div className="bg-slate-50 p-4 rounded-lg mb-4">
                    <div className="text-sm text-slate-600 mb-1">Selected email</div>
                    <div className="font-semibold text-slate-900 break-all">
                      {selectedBreach.email}
                    </div>
                    <div className="text-sm text-red-600 font-semibold mt-2">
                      {selectedBreach.breachCount} total leaks
                    </div>
                  </div>

                  {selectedBreach.sources.map((source, index) => (
                    <div
                      key={index}
                      className="p-4 border-2 border-slate-200 rounded-lg hover:border-blue-500 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{source.icon}</span>
                          <div className="font-semibold text-slate-900">{source.name}</div>
                        </div>
                        <div className="text-red-600 font-bold">{source.leakCount} leaks</div>
                      </div>
                      {source.date && (
                        <div className="text-xs text-slate-500">Breach date: {source.date}</div>
                      )}
                      <button className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                        View details <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <Mail className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p>Select an email to view breach sources</p>
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 mt-6 text-white">
            <h3 className="text-2xl font-bold mb-4">🛡️ Protect Your Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <CheckCircle className="h-8 w-8 mb-2" />
                <h4 className="font-bold mb-2">Change Passwords</h4>
                <p className="text-sm text-blue-100">
                  Update passwords for all affected accounts immediately
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <Shield className="h-8 w-8 mb-2" />
                <h4 className="font-bold mb-2">Enable 2FA</h4>
                <p className="text-sm text-blue-100">
                  Add two-factor authentication for extra security
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-lg">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <h4 className="font-bold mb-2">Monitor Activity</h4>
                <p className="text-sm text-blue-100">
                  Watch for suspicious activity on your accounts
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardRouteGuard>
  );
}
