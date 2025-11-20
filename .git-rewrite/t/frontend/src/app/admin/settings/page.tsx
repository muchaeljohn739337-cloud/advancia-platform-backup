"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import { Settings, Save, RefreshCw } from "lucide-react";

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/admin/login");
    }
  }, [router]);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <AdminNav />
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
            <p className="text-gray-400">Configure system preferences</p>
          </div>

          <div className="space-y-6">
            {/* General Settings */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-6 h-6 text-purple-400" />
                <h2 className="text-xl font-bold text-white">General Settings</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Platform Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Advancia Pay Ledger"
                    className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Support Email
                  </label>
                  <input
                    type="email"
                    defaultValue="support@advancia.com"
                    className="w-full px-4 py-2 bg-slate-800 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="maintenance"
                    className="w-4 h-4 rounded border-purple-500/20 bg-slate-800"
                  />
                  <label htmlFor="maintenance" className="text-sm text-gray-300">
                    Enable maintenance mode
                  </label>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <RefreshCw className="w-6 h-6 text-green-400" />
                <h2 className="text-xl font-bold text-white">Security</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="2fa"
                    defaultChecked
                    className="w-4 h-4 rounded border-purple-500/20 bg-slate-800"
                  />
                  <label htmlFor="2fa" className="text-sm text-gray-300">
                    Require 2FA for admin login
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="ip-restrict"
                    className="w-4 h-4 rounded border-purple-500/20 bg-slate-800"
                  />
                  <label htmlFor="ip-restrict" className="text-sm text-gray-300">
                    Enable IP restriction
                  </label>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-500/50 text-white font-semibold rounded-lg transition-colors"
            >
              <Save className="w-5 h-5" />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
