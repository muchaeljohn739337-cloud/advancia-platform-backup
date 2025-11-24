'use client';

import Link from 'next/link';
import { useAnalytics } from '@/hooks/useAnalytics';

export default function QuickActions() {
  const { trackInteraction } = useAnalytics();

  const actions = [
    {
      title: 'Buy Crypto',
      description: 'Purchase cryptocurrency with USD',
      icon: '🛒',
      href: '/crypto/buy',
      color: 'bg-green-500 hover:bg-green-600',
      eventName: 'quick_action_buy_crypto',
    },
    {
      title: 'Withdraw Crypto',
      description: 'Send crypto to external wallet',
      icon: '📤',
      href: '/crypto/withdraw',
      color: 'bg-blue-500 hover:bg-blue-600',
      eventName: 'quick_action_withdraw_crypto',
    },
    {
      title: 'Transfer Tokens',
      description: 'Send tokens to another user',
      icon: '💸',
      href: '/tokens/transfer',
      color: 'bg-purple-500 hover:bg-purple-600',
      eventName: 'quick_action_transfer_tokens',
    },
    {
      title: 'Deposit USD',
      description: 'Add funds to your account',
      icon: '💳',
      href: '/payments/topup',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      eventName: 'quick_action_deposit_usd',
    },
    {
      title: 'View Orders',
      description: 'Track crypto purchase orders',
      icon: '📋',
      href: '/crypto/orders',
      color: 'bg-orange-500 hover:bg-orange-600',
      eventName: 'quick_action_view_orders',
    },
    {
      title: 'Transaction History',
      description: 'View all your transactions',
      icon: '📊',
      href: '/transactions',
      color: 'bg-pink-500 hover:bg-pink-600',
      eventName: 'quick_action_transaction_history',
    },
  ];

  const handleActionClick = (action: (typeof actions)[0]) => {
    trackInteraction('click', 'quick_action_button', {
      actionTitle: action.title,
      actionHref: action.href,
      eventName: action.eventName,
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {actions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            onClick={() => handleActionClick(action)}
            className={`${action.color} text-white rounded-lg p-4 transition-all transform hover:scale-105 shadow-md`}
          >
            <div className="flex items-start space-x-3">
              <div className="text-3xl">{action.icon}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{action.title}</h3>
                <p className="text-sm text-white/90">{action.description}</p>
              </div>
              <svg
                className="w-5 h-5 opacity-75"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
