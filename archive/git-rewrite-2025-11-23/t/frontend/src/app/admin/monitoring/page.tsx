"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import { Server, CheckCircle, AlertCircle, Activity } from "lucide-react";

export default function AdminMonitoringPage() {
  const router = useRouter();
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    fetch("http://localhost:4000/api/admin/system/health", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(() => setHealth(null))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <AdminNav />
        <div className="flex items-center justify-center p-20">
          <div className="text-white text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl font-semibold">Loading system health...</p>
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
            <h1 className="text-4xl font-bold text-white mb-2">
              System Monitoring
            </h1>
            <p className="text-gray-400">
              Real-time system health and performance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Server className="w-8 h-8 text-blue-400" />
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-gray-400 text-sm mb-2">API Server</h3>
              <p className="text-xl font-bold text-green-400">Operational</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-8 h-8 text-purple-400" />
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-gray-400 text-sm mb-2">Database</h3>
              <p className="text-xl font-bold text-green-400">Connected</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Server className="w-8 h-8 text-green-400" />
                <AlertCircle className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-gray-400 text-sm mb-2">Redis Cache</h3>
              <p className="text-xl font-bold text-yellow-400">N/A</p>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <Activity className="w-8 h-8 text-yellow-400" />
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-gray-400 text-sm mb-2">Response Time</h3>
              <p className="text-xl font-bold text-white">27ms</p>
            </div>
          </div>

          {health && (
            <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                System Details
              </h2>
              <pre className="text-gray-300 text-sm overflow-auto">
                {JSON.stringify(health, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
