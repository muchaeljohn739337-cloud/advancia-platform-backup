'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminNav from '@/components/AdminNav';
import { BarChart3, TrendingUp, Users, Activity, Target, Calendar, UserCheck } from 'lucide-react';
// Temporarily disable analytics hook to avoid sessionStorage issues
// import { useAdminAnalytics } from "@/hooks/useAnalytics";

// Force dynamic rendering to avoid SSR issues
export const dynamic = 'force-dynamic';

interface AnalyticsData {
  userGrowth: Array<{ month: string; users: number }>;
  revenue: Array<{ month: string; amount: number }>;
  transactions: Array<{ date: string; count: number }>;
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  // const { getFunnels, getCohorts } = useAdminAnalytics();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [funnelData, setFunnelData] = useState<any>(null);
  const [cohortData, setCohortData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'funnels' | 'cohorts'>('overview');

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAnalytics() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      // Temporarily disable analytics calls
      // const [funnels, cohorts] = await Promise.all([
      //   getFunnels(),
      //   getCohorts()
      // ]);

      // setFunnelData(funnels);
      // setCohortData(cohorts);

      // Mock data for now
      setFunnelData({ mock: true });
      setCohortData({ mock: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <AdminNav />
        <div className="flex items-center justify-center p-20">
          <div className="text-white text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl font-semibold">Loading analytics...</p>
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
            <h1 className="text-4xl font-bold text-white mb-2">Amplitude Analytics</h1>
            <p className="text-gray-400">Advanced user behavior analytics and insights</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-8 bg-slate-900/50 p-1 rounded-lg backdrop-blur-sm">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'funnels', label: 'Conversion Funnels', icon: Target },
              { id: 'cohorts', label: 'Cohort Analysis', icon: Calendar },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <OverviewTab funnelData={funnelData} cohortData={cohortData} />
          )}

          {activeTab === 'funnels' && <FunnelsTab funnelData={funnelData} />}

          {activeTab === 'cohorts' && <CohortsTab cohortData={cohortData} />}
        </div>
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ funnelData, cohortData }: { funnelData: any; cohortData: any }) {
  return (
    <>
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          icon={Users}
          title="Total Users"
          value={cohortData?.cohorts?.reduce((sum: number, c: any) => sum + c.cohort_size, 0) || 0}
          subtitle="Across all cohorts"
          color="blue"
        />

        <MetricCard
          icon={Target}
          title="Conversion Rate"
          value={`${funnelData?.insights?.overallConversionRate || 0}%`}
          subtitle="Registration to transaction"
          color="green"
        />

        <MetricCard
          icon={TrendingUp}
          title="Retention (30d)"
          value={`${cohortData?.insights?.retentionTrend || 0}%`}
          subtitle="Average 30-day retention"
          color="purple"
        />

        <MetricCard
          icon={Activity}
          title="Active Cohorts"
          value={cohortData?.cohorts?.length || 0}
          subtitle="Monthly user groups"
          color="yellow"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
          <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
            <Target className="w-5 h-5 mr-2 text-purple-400" />
            Conversion Funnel
          </h3>
          {funnelData?.funnels ? (
            <div className="space-y-3">
              {funnelData.funnels.map((step: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">{step.step}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{
                          width: `${(step.users / funnelData.funnels[0]?.users || 1) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-white text-sm font-medium w-12 text-right">
                      {step.users}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-500">
              <p>Loading funnel data...</p>
            </div>
          )}
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
          <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-green-400" />
            Cohort Performance
          </h3>
          {cohortData?.cohorts ? (
            <div className="space-y-2">
              {cohortData.cohorts.slice(0, 5).map((cohort: any, index: number) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 border-b border-slate-700 last:border-b-0"
                >
                  <span className="text-gray-300 text-sm">
                    {new Date(cohort.cohort_month).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <div className="text-right">
                    <div className="text-white text-sm font-medium">{cohort.cohort_size} users</div>
                    <div className="text-gray-500 text-xs">
                      {cohort.retained_30d} retained (30d)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-500">
              <p>Loading cohort data...</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Funnels Tab Component
function FunnelsTab({ funnelData }: { funnelData: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
        <h3 className="text-white text-xl font-semibold mb-6 flex items-center">
          <Target className="w-6 h-6 mr-3 text-purple-400" />
          Conversion Funnel Analysis
        </h3>

        {funnelData?.funnels ? (
          <div className="space-y-4">
            {funnelData.funnels.map((step: any, index: number) => {
              const previousUsers = index > 0 ? funnelData.funnels[index - 1].users : step.users;
              const conversionRate = previousUsers > 0 ? (step.users / previousUsers) * 100 : 0;

              return (
                <div key={index} className="bg-slate-800/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">{step.step}</h4>
                    <span className="text-purple-400 font-semibold">{step.users} users</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                      Conversion: {conversionRate.toFixed(1)}%
                      {index > 0 && ` (${step.dropOff} dropped off)`}
                    </span>
                    <div className="w-32 bg-slate-700 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(step.users / funnelData.funnels[0]?.users || 1) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Loading funnel analysis...</p>
          </div>
        )}

        {funnelData?.insights && (
          <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <h4 className="text-purple-400 font-semibold mb-2">Key Insights</h4>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Best performing step: {funnelData.insights.bestPerformingStep}</li>
              <li>• Highest drop-off: {funnelData.insights.worstDropOff}</li>
              <li>• Overall conversion rate: {funnelData.insights.overallConversionRate}%</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// Cohorts Tab Component
function CohortsTab({ cohortData }: { cohortData: any }) {
  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
        <h3 className="text-white text-xl font-semibold mb-6 flex items-center">
          <Calendar className="w-6 h-6 mr-3 text-green-400" />
          Cohort Analysis
        </h3>

        {cohortData?.cohorts ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Cohort</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Size</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Active</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">30d Retention</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">90d Retention</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">
                    Avg Transactions
                  </th>
                </tr>
              </thead>
              <tbody>
                {cohortData.cohorts.map((cohort: any, index: number) => (
                  <tr key={index} className="border-b border-slate-800/50 hover:bg-slate-800/25">
                    <td className="py-3 px-4 text-white font-medium">
                      {new Date(cohort.cohort_month).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-300">{cohort.cohort_size}</td>
                    <td className="py-3 px-4 text-right text-gray-300">{cohort.active_users}</td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          cohort.retained_30d > 50
                            ? 'bg-green-500/20 text-green-400'
                            : cohort.retained_30d > 25
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {cohort.retained_30d}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          cohort.retained_90d > 30
                            ? 'bg-green-500/20 text-green-400'
                            : cohort.retained_90d > 15
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {cohort.retained_90d}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-300">
                      {cohort.avg_transactions_per_user.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Loading cohort analysis...</p>
          </div>
        )}

        {cohortData?.insights && (
          <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <h4 className="text-green-400 font-semibold mb-2">Cohort Insights</h4>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Best performing cohort: {cohortData.insights.bestCohort}</li>
              <li>• Retention trend: {cohortData.insights.retentionTrend}</li>
              <li>
                • Recommendations: {cohortData.insights.recommendations?.join(', ') || 'None'}
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  icon: Icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon: any;
  title: string;
  value: string | number;
  subtitle: string;
  color: string;
}) {
  const colorClasses = {
    blue: 'border-blue-500/20 text-blue-400',
    green: 'border-green-500/20 text-green-400',
    purple: 'border-purple-500/20 text-purple-400',
    yellow: 'border-yellow-500/20 text-yellow-400',
    red: 'border-red-500/20 text-red-400',
  };

  return (
    <div
      className={`bg-slate-900/50 backdrop-blur-sm border rounded-xl p-6 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}`}
    >
      <Icon className="w-8 h-8 mb-4" />
      <h3 className="text-gray-400 text-sm mb-2">{title}</h3>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}
