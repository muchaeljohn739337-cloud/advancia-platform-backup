"use client";

import { useState } from "react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Heart, Activity, Brain, TrendingUp, Calendar, Clock, Zap, Shield } from "lucide-react";

interface HealthMetric {
  date: string;
  heartRate: number;
  bloodPressure: number;
  oxygenLevel: number;
  stressLevel: number;
  sleepQuality: number;
  energyLevel: number;
}

interface VitalSign {
  name: string;
  value: number;
  unit: string;
  status: "good" | "warning" | "critical";
  change: number;
  icon: React.ElementType;
}

export default function HealthMonitoringPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("7d");

  // Mock health data - in production, fetch from API
  const healthHistory: HealthMetric[] = [
    { date: "Mon", heartRate: 72, bloodPressure: 120, oxygenLevel: 98, stressLevel: 35, sleepQuality: 85, energyLevel: 75 },
    { date: "Tue", heartRate: 75, bloodPressure: 118, oxygenLevel: 97, stressLevel: 40, sleepQuality: 80, energyLevel: 70 },
    { date: "Wed", heartRate: 68, bloodPressure: 115, oxygenLevel: 99, stressLevel: 25, sleepQuality: 90, energyLevel: 85 },
    { date: "Thu", heartRate: 70, bloodPressure: 117, oxygenLevel: 98, stressLevel: 30, sleepQuality: 88, energyLevel: 82 },
    { date: "Fri", heartRate: 73, bloodPressure: 119, oxygenLevel: 97, stressLevel: 45, sleepQuality: 75, energyLevel: 68 },
    { date: "Sat", heartRate: 65, bloodPressure: 112, oxygenLevel: 99, stressLevel: 20, sleepQuality: 95, energyLevel: 90 },
    { date: "Sun", heartRate: 67, bloodPressure: 114, oxygenLevel: 98, stressLevel: 22, sleepQuality: 92, energyLevel: 88 },
  ];

  const vitalSigns: VitalSign[] = [
    { name: "Heart Rate", value: 67, unit: "bpm", status: "good", change: -3, icon: Heart },
    { name: "Blood Pressure", value: 114, unit: "mmHg", status: "good", change: -2, icon: Activity },
    { name: "Oxygen Level", value: 98, unit: "%", status: "good", change: 0, icon: Brain },
    { name: "Energy Level", value: 88, unit: "%", status: "good", change: 8, icon: Zap },
    { name: "Sleep Quality", value: 92, unit: "%", status: "good", change: 7, icon: Shield },
    { name: "Stress Level", value: 22, unit: "%", status: "good", change: -13, icon: TrendingUp },
  ];

  const radarData = [
    { metric: "Cardiovascular", value: 92 },
    { metric: "Respiratory", value: 88 },
    { metric: "Mental Health", value: 85 },
    { metric: "Sleep Quality", value: 92 },
    { metric: "Energy", value: 88 },
    { metric: "Stress", value: 78 },
  ];

  const sessionHistory = [
    { date: "Dec 3", effectiveness: 95, duration: 90, type: "Recovery" },
    { date: "Dec 1", effectiveness: 88, duration: 60, type: "Enhancement" },
    { date: "Nov 28", effectiveness: 92, duration: 75, type: "Recovery" },
    { date: "Nov 25", effectiveness: 85, duration: 45, type: "Diagnostic" },
    { date: "Nov 22", effectiveness: 90, duration: 60, type: "Enhancement" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "bg-green-100 text-green-700 border-green-300";
      case "warning":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "critical":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Monitoring</h1>
            <p className="text-gray-600">Real-time health metrics and MedBed session tracking</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {["overview", "vitals", "sessions", "insights"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 text-sm font-medium capitalize whitespace-nowrap ${
                    activeTab === tab
                      ? "border-b-2 border-blue-500 text-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Vital Signs Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vitalSigns.map((vital) => {
                const Icon = vital.icon;
                return (
                  <div
                    key={vital.name}
                    className={`bg-white rounded-xl p-6 border-2 ${getStatusColor(vital.status)}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          vital.change > 0 ? "bg-green-100 text-green-700" : vital.change < 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {vital.change > 0 ? "+" : ""}{vital.change}%
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">{vital.name}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900">{vital.value}</span>
                      <span className="text-sm text-gray-500">{vital.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Health Score Bar Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Overall Health Score</h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={radarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "#6b7280" }} />
                  <YAxis dataKey="metric" type="category" tick={{ fill: "#6b7280", fontSize: 12 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Vitals Tab */}
        {activeTab === "vitals" && (
          <div className="space-y-6">
            {/* Heart Rate Chart */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                Heart Rate Trends
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={healthHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fill: "#6b7280" }} />
                  <YAxis tick={{ fill: "#6b7280" }} domain={[60, 80]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="heartRate" stroke="#ef4444" fill="#fee2e2" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Blood Pressure & Oxygen */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Blood Pressure</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={healthHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fill: "#6b7280" }} />
                    <YAxis tick={{ fill: "#6b7280" }} domain={[110, 125]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="bloodPressure" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Oxygen Level</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={healthHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fill: "#6b7280" }} />
                    <YAxis tick={{ fill: "#6b7280" }} domain={[95, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="oxygenLevel" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stress & Sleep */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Stress Level</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={healthHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fill: "#6b7280" }} />
                    <YAxis tick={{ fill: "#6b7280" }} domain={[0, 50]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="stressLevel" stroke="#f59e0b" fill="#fef3c7" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Sleep Quality</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={healthHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fill: "#6b7280" }} />
                    <YAxis tick={{ fill: "#6b7280" }} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="sleepQuality" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === "sessions" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Session Effectiveness</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sessionHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fill: "#6b7280" }} />
                  <YAxis tick={{ fill: "#6b7280" }} domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="effectiveness" fill="#10b981" radius={[8, 8, 0, 0]} name="Effectiveness %" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Session History Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Effectiveness</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sessionHistory.map((session, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {session.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{session.duration} min</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${session.effectiveness}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{session.effectiveness}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === "insights" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Improving Trends</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Sleep quality improved by 17% this week</li>
                      <li>• Stress levels decreased by 23%</li>
                      <li>• Energy levels up 13%</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Recommendations</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Schedule a Recovery session this week</li>
                      <li>• Consider Enhancement for energy boost</li>
                      <li>• Maintain current sleep schedule</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Optimal Times</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Best session time: 10 AM - 12 PM</li>
                      <li>• Peak recovery: Weekend mornings</li>
                      <li>• Avoid: Late evening sessions</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl p-6 border border-orange-200">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Zap className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Stats</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Total sessions: 24</li>
                      <li>• Avg effectiveness: 89%</li>
                      <li>• Health improvement: +18%</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
