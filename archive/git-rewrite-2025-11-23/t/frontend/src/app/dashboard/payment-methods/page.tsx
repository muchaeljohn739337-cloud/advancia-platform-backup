"use client";

import { useState, useEffect } from "react";
import AddPaymentMethodModal from "./AddPaymentMethodModal";

interface PaymentMethod {
  id: string;
  brand?: string;
  last4?: string;
  expMonth?: number;
  expYear?: number;
  isDefault?: boolean;
}

interface Subscription {
  id: string;
  status: string;
  planName: string;
  amount: number;
  interval?: string;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  created: number;
}

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("methods");
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchMethods();
    fetchSubscriptions();
  }, []);

  const fetchMethods = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/payments/methods", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setMethods(data.methods);
    } catch (error) {
      console.error("Fetch methods error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/payments/subscriptions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setSubscriptions(data.subscriptions);
    } catch (error) {
      console.error("Fetch subscriptions error:", error);
    }
  };

  const deleteMethod = async (id: string) => {
    if (!confirm("Remove this payment method?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/payments/methods/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        alert("Payment method removed");
        fetchMethods();
      } else {
        alert(data.error);
      }
    } catch {
      alert("Failed to remove payment method");
    }
  };

  const cancelSubscription = async (id: string, immediately = false) => {
    const msg = immediately
      ? "Cancel subscription immediately?"
      : "Cancel subscription at period end?";
    if (!confirm(msg)) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/payments/subscription/${id}/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ immediately }),
      });
      const data = await res.json();
      alert(data.message || data.error);
      if (data.success) fetchSubscriptions();
    } catch {
      alert("Failed to cancel subscription");
    }
  };

  const getCardIcon = (brand?: string) => {
    const icons: Record<string, string> = {
      visa: "💳",
      mastercard: "💳",
      amex: "💳",
      discover: "💳",
    };
    return icons[brand?.toLowerCase() || ""] || "💳";
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      active:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
      canceled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
      past_due:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200",
      incomplete:
        "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    };
    return badges[status] || badges.incomplete;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Payment Settings
        </h1>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab("methods")}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium ${
                  activeTab === "methods"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Payment Methods
              </button>
              <button
                onClick={() => setActiveTab("subscriptions")}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium ${
                  activeTab === "subscriptions"
                    ? "border-b-2 border-blue-500 text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Subscriptions
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {/* Payment Methods Tab */}
            {activeTab === "methods" && (
              <div>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : methods.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">💳</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No saved payment methods
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Add a payment method to make future payments easier
                    </p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-blue-700 transition"
                    >
                      Add Payment Method
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {methods.map((method) => (
                      <div
                        key={method.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="text-3xl">
                              {getCardIcon(method.brand)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 capitalize">
                                {method.brand} •••• {method.last4}
                              </div>
                              <div className="text-sm text-gray-600">
                                Expires {method.expMonth}/{method.expYear}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteMethod(method.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium px-4 py-2 border border-red-300 rounded-lg hover:bg-red-50 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Subscriptions Tab */}
            {activeTab === "subscriptions" && (
              <div>
                {subscriptions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">📅</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      No active subscriptions
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Subscribe to a plan to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subscriptions.map((sub) => (
                      <div
                        key={sub.id}
                        className="border border-gray-200 rounded-lg p-4 sm:p-6"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {sub.planName}
                              </h3>
                              <span
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(sub.status)}`}
                              >
                                {sub.status}
                              </span>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p>
                                <strong className="font-medium text-gray-900">
                                  ${sub.amount}
                                </strong>{" "}
                                / {sub.interval}
                              </p>
                              <p>
                                {sub.cancelAtPeriodEnd
                                  ? `Cancels on ${new Date(sub.currentPeriodEnd * 1000).toLocaleDateString()}`
                                  : `Renews on ${new Date(sub.currentPeriodEnd * 1000).toLocaleDateString()}`}
                              </p>
                              <p className="text-xs">
                                Started{" "}
                                {new Date(
                                  sub.created * 1000,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {sub.status === "active" &&
                            !sub.cancelAtPeriodEnd && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    cancelSubscription(sub.id, false)
                                  }
                                  className="text-yellow-600 hover:text-yellow-800 text-sm font-medium px-4 py-2 border border-yellow-300 rounded-lg hover:bg-yellow-50 transition"
                                >
                                  Cancel at Period End
                                </button>
                                <button
                                  onClick={() =>
                                    cancelSubscription(sub.id, true)
                                  }
                                  className="text-red-600 hover:text-red-800 text-sm font-medium px-4 py-2 border border-red-300 rounded-lg hover:bg-red-50 transition"
                                >
                                  Cancel Now
                                </button>
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">ℹ️</div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Payment Security
              </h3>
              <p className="text-sm text-blue-800">
                All payment information is securely stored and processed by
                Stripe. We never store your full card details on our servers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Payment Method Modal */}
      {showAddModal && (
        <AddPaymentMethodModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            fetchMethods();
          }}
        />
      )}
    </div>
  );
}
