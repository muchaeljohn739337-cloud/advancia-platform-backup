"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminNav from "@/components/AdminNav";

interface User {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  role: string;
  active: boolean;
  createdAt: string;
}

export default function AdminSubscribersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchUsers() {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const response = await fetch("http://localhost:4000/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold">Loading subscribers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <AdminNav />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Subscribers</h1>
            <p className="text-gray-400">
              All registered users on the platform ({users.length} total)
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Users Table */}
          <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-purple-900/20 border-b border-purple-500/20">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-300">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-300">
                      Username
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-300">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-300">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-300">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-purple-300">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-gray-400"
                      >
                        No subscribers found
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-purple-500/10 hover:bg-purple-900/10 transition-colors"
                      >
                        <td className="px-6 py-4 text-white">{user.email}</td>
                        <td className="px-6 py-4 text-gray-300">
                          {user.username || "-"}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              user.role === "ADMIN"
                                ? "bg-purple-500/20 text-purple-300"
                                : "bg-blue-500/20 text-blue-300"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              user.active
                                ? "bg-green-500/20 text-green-300"
                                : "bg-red-500/20 text-red-300"
                            }`}
                          >
                            {user.active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <h3 className="text-gray-400 text-sm mb-2">Total Subscribers</h3>
              <p className="text-3xl font-bold text-white">{users.length}</p>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <h3 className="text-gray-400 text-sm mb-2">Active Users</h3>
              <p className="text-3xl font-bold text-green-400">
                {users.filter((u) => u.active).length}
              </p>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <h3 className="text-gray-400 text-sm mb-2">Inactive Users</h3>
              <p className="text-3xl font-bold text-red-400">
                {users.filter((u) => !u.active).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
