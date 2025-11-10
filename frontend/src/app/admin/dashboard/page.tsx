"use client";"use client";



import { useState, useEffect } from "react";import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";import { useSession } from "next-auth/react";

import AdminNav from "@/components/AdminNav";import { useRouter } from "next/navigation";

import {import { motion } from "framer-motion";

  Users,import {

  DollarSign,  Users,

  Activity,  Shield,

  TrendingUp,  Activity,

  AlertCircle,  DollarSign,

  CheckCircle,  AlertCircle,

  ArrowUpRight,  CheckCircle,

  ArrowDownRight,  Lock,

} from "lucide-react";  Ban,

  Database,

interface DashboardStats {  UserCheck,

  totalUsers: number;  Bell,

  activeUsers: number;  Phone,

  totalRevenue: number;  Menu,

  totalTransactions: number;} from "lucide-react";

  pendingWithdrawals: number;import SidebarLayout from "@/components/SidebarLayout";

  recentSignups: number;

}type SessionUser = {

  id?: string;

export default function AdminDashboardPage() {  name?: string;

  const router = useRouter();  email?: string;

  const [stats, setStats] = useState<DashboardStats | null>(null);  role?: string;

  const [loading, setLoading] = useState(true);};

  const [error, setError] = useState("");

export default function AdminDashboardPage() {

  useEffect(() => {  const { data: session, status } = useSession();

    fetchDashboardStats();  const router = useRouter();

    // eslint-disable-next-line react-hooks/exhaustive-deps  const sessionUser = session?.user as SessionUser | undefined;

  }, []);  const [loading, setLoading] = useState(true);



  async function fetchDashboardStats() {  // Initialize stats

    try {  useEffect(() => {

      const token = localStorage.getItem("token");    // Simulate loading stats

      if (!token) {    setTimeout(() => {

        router.push("/admin/login");      setLoading(false);

        return;    }, 1000);

      }  }, []);



      const response = await fetch("http://localhost:4000/api/admin/dashboard/stats", {  // Check if user is admin

        headers: {  useEffect(() => {

          Authorization: `Bearer ${token}`,    if (status === "loading") return;

        },

      });    if (!session) {

      router.push("/auth/login");

      if (!response.ok) {      return;

        throw new Error("Failed to fetch stats");    }

      }

    const userRole = sessionUser?.role || sessionUser?.email;

      const data = await response.json();    const isAdmin =

      setStats(data);      userRole === "admin" ||

    } catch (err) {      sessionUser?.email === "admin@advancia.com" ||

      setError(err instanceof Error ? err.message : "Failed to load dashboard");      sessionUser?.email?.includes("admin");

    } finally {

      setLoading(false);    if (!isAdmin) {

    }      router.push("/dashboard");

  }    }

  }, [session, status, router, sessionUser]);

  if (loading) {

    return (  if (loading) {

      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">    return (

        <AdminNav />      <SidebarLayout>

        <div className="flex items-center justify-center p-20">        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">

          <div className="text-white text-center">          <div className="text-white text-center">

            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mb-4"></div>

            <p className="text-xl font-semibold">Loading dashboard...</p>            <p className="text-sm font-medium">Loading admin dashboard...</p>

          </div>          </div>

        </div>        </div>

      </div>      </SidebarLayout>

    );    );

  }  }



  return (  return (

    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">    <SidebarLayout>

      <AdminNav />      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">

      <div className="p-6">        {/* Mobile Header */}

        <div className="max-w-7xl mx-auto">        <div className="lg:hidden bg-white/10 backdrop-blur-lg border-b border-white/10 p-4">

          {/* Header */}          <div className="flex items-center justify-between">

          <div className="mb-8">            <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>

            <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>            <button

            <p className="text-gray-400">Overview of platform metrics and activity</p>              aria-label="Toggle menu"

          </div>              className="p-2 hover:bg-white/10 rounded-lg"

            >

          {error && (              <Menu className="h-6 w-6 text-white" />

            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">            </button>

              {error}          </div>

            </div>        </div>

          )}

        <div className="p-4 md:p-6 max-w-7xl mx-auto">

          {/* Stats Grid */}          {/* Desktop Header */}

          {stats && (          <div className="hidden lg:block mb-8">

            <>            <div className="flex items-center gap-3 mb-2">

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">              <Shield className="text-red-500" size={40} />

                {/* Total Users */}              <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>

                <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">            </div>

                  <div className="flex items-center justify-between mb-4">            <p className="text-slate-300">

                    <div className="p-3 bg-blue-500/20 rounded-lg">              System Overview - {new Date().toLocaleDateString()}

                      <Users className="w-6 h-6 text-blue-400" />            </p>

                    </div>          </div>

                    <span className="flex items-center text-green-400 text-sm">

                      <TrendingUp className="w-4 h-4 mr-1" />          {/* Stats Grid */}

                      {stats.recentSignups}          <motion.div

                    </span>            initial={{ opacity: 0, y: 20 }}

                  </div>            animate={{ opacity: 1, y: 0 }}

                  <h3 className="text-gray-400 text-sm mb-1">Total Users</h3>            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"

                  <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>          >

                  <p className="text-xs text-gray-500 mt-2">            <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded-xl p-4 text-white">

                    {stats.activeUsers} active              <div className="flex items-center gap-3 mb-3">

                  </p>                <Users className="h-6 w-6 opacity-80" />

                </div>                <h3 className="font-semibold">Users</h3>

              </div>

                {/* Total Revenue */}              <p className="text-3xl font-bold mb-2">1,247</p>

                <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">              <div className="flex items-center gap-2 text-sm">

                  <div className="flex items-center justify-between mb-4">                <UserCheck className="h-4 w-4" />

                    <div className="p-3 bg-green-500/20 rounded-lg">                <span>892 active</span>

                      <DollarSign className="w-6 h-6 text-green-400" />              </div>

                    </div>            </div>

                    <span className="flex items-center text-green-400 text-sm">

                      <ArrowUpRight className="w-4 h-4" />            <div className="bg-gradient-to-br from-green-600 to-green-400 rounded-xl p-4 text-white">

                    </span>              <div className="flex items-center gap-3 mb-3">

                  </div>                <Activity className="h-6 w-6 opacity-80" />

                  <h3 className="text-gray-400 text-sm mb-1">Total Revenue</h3>                <h3 className="font-semibold">Transactions</h3>

                  <p className="text-3xl font-bold text-white">              </div>

                    ${stats.totalRevenue.toLocaleString()}              <p className="text-3xl font-bold mb-2">15,680</p>

                  </p>              <div className="flex items-center gap-2 text-sm">

                  <p className="text-xs text-gray-500 mt-2">All time</p>                <DollarSign className="h-4 w-4" />

                </div>                <span>$2,456,789</span>

              </div>

                {/* Total Transactions */}            </div>

                <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">

                  <div className="flex items-center justify-between mb-4">            <div className="bg-gradient-to-br from-purple-600 to-purple-400 rounded-xl p-4 text-white">

                    <div className="p-3 bg-purple-500/20 rounded-lg">              <div className="flex items-center gap-3 mb-3">

                      <Activity className="w-6 h-6 text-purple-400" />                <Phone className="h-6 w-6 opacity-80" />

                    </div>                <h3 className="font-semibold">SMS Auth</h3>

                    <CheckCircle className="w-5 h-5 text-green-400" />              </div>

                  </div>              <p className="text-3xl font-bold mb-2">678</p>

                  <h3 className="text-gray-400 text-sm mb-1">Transactions</h3>              <div className="flex items-center gap-2 text-sm">

                  <p className="text-3xl font-bold text-white">                <AlertCircle className="h-4 w-4" />

                    {stats.totalTransactions.toLocaleString()}                <span>89 failed attempts</span>

                  </p>              </div>

                  <p className="text-xs text-gray-500 mt-2">Completed</p>            </div>

                </div>

            <div className="bg-gradient-to-br from-red-600 to-red-400 rounded-xl p-4 text-white">

                {/* Pending Withdrawals */}              <div className="flex items-center gap-3 mb-3">

                <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">                <Bell className="h-6 w-6 opacity-80" />

                  <div className="flex items-center justify-between mb-4">                <h3 className="font-semibold">Alerts</h3>

                    <div className="p-3 bg-yellow-500/20 rounded-lg">              </div>

                      <AlertCircle className="w-6 h-6 text-yellow-400" />              <p className="text-3xl font-bold mb-2">45</p>

                    </div>              <div className="flex items-center gap-2 text-sm">

                    {stats.pendingWithdrawals > 0 && (                <Ban className="h-4 w-4" />

                      <span className="flex items-center text-yellow-400 text-sm">                <span>23 suspended</span>

                        <ArrowDownRight className="w-4 h-4" />              </div>

                      </span>            </div>

                    )}          </motion.div>

                  </div>

                  <h3 className="text-gray-400 text-sm mb-1">Pending Withdrawals</h3>          {/* System Status */}

                  <p className="text-3xl font-bold text-white">          <motion.div

                    {stats.pendingWithdrawals}            initial={{ opacity: 0, y: 20 }}

                  </p>            animate={{ opacity: 1, y: 0 }}

                  <p className="text-xs text-gray-500 mt-2">Requires attention</p>            transition={{ delay: 0.2 }}

                </div>            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"

              </div>          >

            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 text-white">

              {/* Quick Actions */}              <Database className="h-8 w-8 mb-4 opacity-80" />

              <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">              <h3 className="text-lg font-semibold mb-2">System Health</h3>

                <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>              <div className="space-y-3">

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">                <div className="flex items-center justify-between">

                  <button                  <span className="text-slate-300">Database</span>

                    onClick={() => router.push("/admin/users")}                  <span className="flex items-center gap-1 text-green-400">

                    className="p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-blue-300 transition-all"                    <CheckCircle className="h-4 w-4" />

                  >                    Healthy

                    Manage Users                  </span>

                  </button>                </div>

                  <button                <div className="flex items-center justify-between">

                    onClick={() => router.push("/admin/withdrawals")}                  <span className="text-slate-300">API Response</span>

                    className="p-4 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg text-yellow-300 transition-all"                  <span className="text-green-400">243ms</span>

                  >                </div>

                    View Withdrawals                <div className="flex items-center justify-between">

                  </button>                  <span className="text-slate-300">Memory Usage</span>

                  <button                  <span className="text-green-400">67%</span>

                    onClick={() => router.push("/admin/analytics")}                </div>

                    className="p-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg text-purple-300 transition-all"              </div>

                  >            </div>

                    Analytics

                  </button>            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-6 text-white">

                  <button              <Shield className="h-8 w-8 mb-4 opacity-80" />

                    onClick={() => router.push("/admin/settings")}              <h3 className="text-lg font-semibold mb-2">Security Overview</h3>

                    className="p-4 bg-gray-500/10 hover:bg-gray-500/20 border border-gray-500/20 rounded-lg text-gray-300 transition-all"              <div className="space-y-3">

                  >                <div className="flex items-center justify-between">

                    Settings                  <span className="text-slate-300">SSL Certificate</span>

                  </button>                  <span className="flex items-center gap-1 text-green-400">

                </div>                    <Lock className="h-4 w-4" />

              </div>                    Valid

            </>                  </span>

          )}                </div>

        </div>                <div className="flex items-center justify-between">

      </div>                  <span className="text-slate-300">Last Backup</span>

    </div>                  <span className="text-green-400">2 hours ago</span>

  );                </div>

}                <div className="flex items-center justify-between">

                  <span className="text-slate-300">Active Sessions</span>
                  <span className="text-blue-400">126</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/5 backdrop-blur-lg rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold text-white mb-4">
              Recent Activity
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-white/10">
                    <th className="pb-3 text-slate-300 font-medium">Event</th>
                    <th className="pb-3 text-slate-300 font-medium">User</th>
                    <th className="pb-3 text-slate-300 font-medium">Time</th>
                    <th className="pb-3 text-slate-300 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr className="border-b border-white/5">
                    <td className="py-3">Admin Login</td>
                    <td>admin@advancia.com</td>
                    <td>2 mins ago</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        Success
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b border-white/5">
                    <td className="py-3">SMS Verification</td>
                    <td>+1 (555) 123-4567</td>
                    <td>15 mins ago</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-yellow-400">
                        <AlertCircle className="h-4 w-4" />
                        Pending
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3">System Backup</td>
                    <td>system</td>
                    <td>1 hour ago</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        Complete
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </SidebarLayout>
  );
}
