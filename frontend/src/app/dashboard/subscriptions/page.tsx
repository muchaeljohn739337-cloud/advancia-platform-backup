'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Calendar, DollarSign, X, Plus, CheckCircle } from 'lucide-react';

interface Subscription {
  id: string;
  status: string;
  planName: string;
  amount: number;
  currency: string;
  interval: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
}

const AVAILABLE_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic_monthly',
    name: 'Basic Plan',
    description: 'Perfect for individuals getting started',
    price: 9.99,
    interval: 'month',
    features: [
      'Up to 10 transactions per month',
      'Basic crypto wallet',
      'Email support',
      'Standard processing times',
    ],
  },
  {
    id: 'pro_monthly',
    name: 'Pro Plan',
    description: 'For professionals and small businesses',
    price: 29.99,
    interval: 'month',
    features: [
      'Unlimited transactions',
      'Advanced crypto features',
      'Priority support',
      'Instant processing',
      'Lower fees',
      'API access',
    ],
  },
  {
    id: 'enterprise_monthly',
    name: 'Enterprise Plan',
    description: 'For large organizations',
    price: 99.99,
    interval: 'month',
    features: [
      'Everything in Pro',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
      'Advanced analytics',
      'White-label options',
    ],
  },
];

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewSubscription, setShowNewSubscription] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/payments/subscriptions', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch {
      // Error handled
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (plan: SubscriptionPlan) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/payments/subscription/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: plan.id,
          priceId: plan.id, // In production, use actual Stripe Price ID
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.clientSecret) {
          // Redirect to Stripe checkout
          alert('Subscription created! Redirecting to payment...');
          // In production, use Stripe Checkout or Elements
          await fetchSubscriptions();
          setShowNewSubscription(false);
        }
      } else {
        alert('Failed to create subscription');
      }
    } catch {
      alert('Error creating subscription');
    }
  };

  const cancelSubscription = async (id: string) => {
    if (
      !confirm(
        "Cancel this subscription? You'll still have access until the end of the billing period."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/payments/subscription/${id}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        alert('Subscription cancelled successfully');
        await fetchSubscriptions();
      } else {
        alert('Failed to cancel subscription');
      }
    } catch {
      alert('Error cancelling subscription');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Subscription Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your active subscriptions and explore available plans
          </p>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-blue-500" />
              Active Subscriptions
            </h2>
            <button
              onClick={() => setShowNewSubscription(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              Add Subscription
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading subscriptions...</div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No active subscriptions
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Subscribe to a plan to unlock premium features
              </p>
              <button
                onClick={() => setShowNewSubscription(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                View Available Plans
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                          {sub.planName}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            sub.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : sub.status === 'canceled'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <DollarSign className="w-4 h-4" />
                          <span>
                            ${sub.amount / 100} / {sub.interval}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>Renews {new Date(sub.currentPeriodEnd).toLocaleDateString()}</span>
                        </div>
                        {sub.cancelAtPeriodEnd && (
                          <div className="flex items-center gap-2 text-orange-600">
                            <X className="w-4 h-4" />
                            <span>Cancels at period end</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {sub.status === 'active' && !sub.cancelAtPeriodEnd && (
                        <button
                          onClick={() => cancelSubscription(sub.id)}
                          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Available Plans Modal */}
        {showNewSubscription && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Choose Your Plan
                </h2>
                <button
                  onClick={() => setShowNewSubscription(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {AVAILABLE_PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`border-2 rounded-xl p-6 transition cursor-pointer ${
                      selectedPlan?.id === plan.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                    }`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                      {plan.description}
                    </p>

                    <div className="mb-6">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        ${plan.price}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">/{plan.interval}</span>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                        >
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        createSubscription(plan);
                      }}
                      className={`w-full py-3 rounded-lg font-medium transition ${
                        selectedPlan?.id === plan.id
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      Subscribe
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
