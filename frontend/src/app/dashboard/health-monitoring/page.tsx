"use client";

import {
  Activity,
  Brain,
  Calendar,
  Clock,
  Heart,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface HealthMetric {
  date: string;
  heartRate: number;
  bloodPressure: number;
  oxygenLevel: number;
  stressLevel: number;
  score: number;
}

interface VitalCard {
  name: string;
  value: string;
  unit: string;
  status: "good" | "warning" | "danger";
  change: number;
  icon: React.ElementType;
}

export default function HealthMonitoring() {
  const [selectedDate, setSelectedDate] = useState("today");

  const vitals: VitalCard[] = [
    {
      name: "Heart Rate",
      value: "72",
      unit: "BPM",
      status: "good",
      change: -3,
      icon: Heart,
    },
    {
      name: "Blood Pressure",
      value: "120/80",
      unit: "mmHg",
      status: "good",
      change: 0,
      icon: Activity,
    },
    {
      name: "Stress Level",
      value: "Low",
      unit: "Level",
      status: "good",
      change: -15,
      icon: Brain,
    },
    {
      name: "Energy Level",
      value: "High",
      unit: "Level",
      status: "good",
      change: 12,
      icon: Zap,
    },
    {
      name: "Health Score",
      value: "85",
      unit: "/100",
      status: "good",
      change: 5,
      icon: Shield,
    },
    {
      name: "Overall Trend",
      value: "Improving",
      unit: "",
      status: "good",
      change: 8,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Health Monitoring
            </h1>
            <p className="text-gray-600 mt-1">
              Track your health metrics and wellness journey
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Select time period"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Sync Data</span>
            </button>
          </div>
        </div>

        {/* Vital Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {vitals.map((vital, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-lg ${
                      vital.status === "good"
                        ? "bg-green-100"
                        : vital.status === "warning"
                        ? "bg-yellow-100"
                        : "bg-red-100"
                    }`}
                  >
                    <vital.icon
                      className={`h-5 w-5 ${
                        vital.status === "good"
                          ? "text-green-600"
                          : vital.status === "warning"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    />
                  </div>
                  <h3 className="font-medium text-gray-900">{vital.name}</h3>
                </div>
                <div
                  className={`text-sm font-medium ${
                    vital.change > 0
                      ? "text-green-600"
                      : vital.change < 0
                      ? "text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  {vital.change > 0 ? "+" : ""}
                  {vital.change !== 0 ? `${vital.change}%` : "—"}
                </div>
              </div>
              <div className="flex items-end space-x-2">
                <span className="text-2xl font-bold text-gray-900">
                  {vital.value}
                </span>
                <span className="text-sm text-gray-500 pb-1">{vital.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Chart Sections */}
        <div className="space-y-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Overall Health Score
            </h2>
            <div className="h-96 bg-gray-50 rounded-lg p-4 flex items-center justify-center">
              <div className="text-center">
                <h4 className="text-lg font-medium text-gray-600">
                  Charts Coming Soon
                </h4>
                <p className="text-sm text-gray-500 mt-2">
                  Health monitoring charts will be available in the next update
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Historical Trends
            </h2>
            <div className="h-72 bg-gray-50 rounded-lg p-4 flex items-center justify-center">
              <div className="text-center">
                <h4 className="text-lg font-medium text-gray-600">
                  Historical Data Coming Soon
                </h4>
                <p className="text-sm text-gray-500 mt-2">
                  Trend analysis will be available in the next update
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Heart Rate Trends
              </h3>
              <div className="h-72 bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                <div className="text-center">
                  <Heart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Heart rate monitoring coming soon
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Blood Pressure
              </h3>
              <div className="h-72 bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                <div className="text-center">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Blood pressure tracking coming soon
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
