"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import { BarChart3, TrendingUp, Users, Activity } from "lucide-react";

interface AnalyticsData {
  userGrowth: Array<{ month: string; users: number }>;
  revenue: Array<{ month: string; amount: number }>;
  transactions: Array<{ date: string; count: number }>;
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAnalytics() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const response = await fetch(
        "http://localhost:4000/api/admin/analytics/overview",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
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
            <h1 className="text-4xl font-bold text-white mb-2">Analytics</h1>
            <p className="text-gray-400">Platform performance and insights</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <BarChart3 className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-gray-400 text-sm mb-2">Total Revenue</h3>
              <p className="text-2xl font-bold text-white">$0</p>
              <p className="text-xs text-gray-500 mt-2">All time</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <TrendingUp className="w-8 h-8 text-green-400 mb-4" />
              <h3 className="text-gray-400 text-sm mb-2">Growth Rate</h3>
              <p className="text-2xl font-bold text-white">0%</p>
              <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <Users className="w-8 h-8 text-blue-400 mb-4" />
              <h3 className="text-gray-400 text-sm mb-2">Active Users</h3>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-xs text-gray-500 mt-2">This month</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <Activity className="w-8 h-8 text-yellow-400 mb-4" />
              <h3 className="text-gray-400 text-sm mb-2">Transactions</h3>
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-xs text-gray-500 mt-2">Total processed</p>
            </div>
          </div>

          {/* Charts Placeholder */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <h3 className="text-white text-lg font-semibold mb-4">
                User Growth
              </h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <p>User growth chart will appear here</p>
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <h3 className="text-white text-lg font-semibold mb-4">
                Revenue Trend
              </h3>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <p>Revenue trend chart will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
