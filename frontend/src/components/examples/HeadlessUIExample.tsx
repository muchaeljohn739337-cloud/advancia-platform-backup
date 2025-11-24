'use client';

import { Dialog, Listbox, Switch, Tab, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';

// ✅ HEADLESS UI EXAMPLE - Accessible components that work perfectly with Tailwind
// Benefits: Keyboard navigation, ARIA, screen reader support, zero styling conflicts

export default function HeadlessUIExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState({
    name: 'Bitcoin',
    symbol: 'BTC',
  });
  const [notifications, setNotifications] = useState(true);

  const cryptoOptions = [
    { name: 'Bitcoin', symbol: 'BTC' },
    { name: 'Ethereum', symbol: 'ETH' },
    { name: 'Tether', symbol: 'USDT' },
    { name: 'USD Coin', symbol: 'USDC' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">🎯 Headless UI Demo</h1>
        <div className="badge badge-accent">Accessible + Unstyled Components</div>
      </div>

      {/* Modal Example */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Dialog/Modal Component</h2>
          <p className="text-gray-600">Fully accessible modal with focus trapping and backdrop</p>

          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary mt-4">
            Open Withdrawal Confirmation
          </button>

          <Transition appear show={isModalOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
              </Transition.Child>

              <div className="fixed inset-0 overflow-y-auto">
                <div className="flex min-h-full items-center justify-center p-4 text-center">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        💸 Confirm Withdrawal
                      </Dialog.Title>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          You are about to withdraw{' '}
                          <strong className="text-primary">$5,000 USD</strong> to your Ethereum
                          wallet. This action cannot be undone.
                        </p>
                        <div className="alert alert-warning mt-4">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="stroke-current shrink-0 h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                          <span>Processing may take 10-30 minutes</span>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-3">
                        <button
                          type="button"
                          className="btn btn-primary flex-1"
                          onClick={() => setIsModalOpen(false)}
                        >
                          Confirm Withdrawal
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost flex-1"
                          onClick={() => setIsModalOpen(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </Dialog.Panel>
                  </Transition.Child>
                </div>
              </div>
            </Dialog>
          </Transition>
        </div>
      </div>

      {/* Listbox (Dropdown) Example */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Listbox/Select Component</h2>
          <p className="text-gray-600">Accessible dropdown with keyboard navigation</p>

          <div className="mt-4">
            <label className="label">
              <span className="label-text font-semibold">Select Cryptocurrency</span>
            </label>
            <Listbox value={selectedCrypto} onChange={setSelectedCrypto}>
              <div className="relative mt-1">
                <Listbox.Button className="input input-bordered w-full text-left flex items-center justify-between">
                  <span>
                    {selectedCrypto.name} ({selectedCrypto.symbol})
                  </span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </Listbox.Button>
                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    {cryptoOptions.map((crypto, idx) => (
                      <Listbox.Option
                        key={idx}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                            active ? 'bg-primary text-white' : 'text-gray-900'
                          }`
                        }
                        value={crypto}
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected ? 'font-medium' : 'font-normal'
                              }`}
                            >
                              {crypto.name} ({crypto.symbol})
                            </span>
                            {selected ? (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </span>
                            ) : null}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
            <div className="mt-2 text-sm text-gray-600">
              Selected: <span className="badge badge-primary">{selectedCrypto.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Switch (Toggle) Example */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Switch/Toggle Component</h2>
          <p className="text-gray-600">Accessible toggle for settings</p>

          <div className="mt-4">
            <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
              <div>
                <div className="font-semibold">Push Notifications</div>
                <div className="text-sm text-gray-600">Receive alerts for transactions</div>
              </div>
              <Switch
                checked={notifications}
                onChange={setNotifications}
                className={`${
                  notifications ? 'bg-primary' : 'bg-gray-300'
                } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
              >
                <span
                  className={`${
                    notifications ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </Switch>
            </div>
            <div className="mt-2">
              {notifications ? (
                <div className="alert alert-success">
                  <span>✓ Notifications enabled</span>
                </div>
              ) : (
                <div className="alert alert-warning">
                  <span>⚠ Notifications disabled</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Example */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Tab Component</h2>
          <p className="text-gray-600">Accessible tabs for organizing content</p>

          <Tab.Group>
            <Tab.List className="tabs tabs-boxed mt-4">
              <Tab className={({ selected }) => `tab ${selected ? 'tab-active' : ''}`}>
                Overview
              </Tab>
              <Tab className={({ selected }) => `tab ${selected ? 'tab-active' : ''}`}>
                Transactions
              </Tab>
              <Tab className={({ selected }) => `tab ${selected ? 'tab-active' : ''}`}>
                Settings
              </Tab>
            </Tab.List>
            <Tab.Panels className="mt-4">
              <Tab.Panel className="p-4 bg-base-200 rounded-lg">
                <h3 className="font-semibold mb-2">Account Overview</h3>
                <div className="stats shadow w-full">
                  <div className="stat">
                    <div className="stat-title">Balance</div>
                    <div className="stat-value text-primary">$25,600</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">This Month</div>
                    <div className="stat-value text-secondary">+$3,200</div>
                  </div>
                </div>
              </Tab.Panel>
              <Tab.Panel className="p-4 bg-base-200 rounded-lg">
                <h3 className="font-semibold mb-2">Recent Transactions</h3>
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>2024-01-15</td>
                        <td>Deposit</td>
                        <td className="text-success">+$1,000</td>
                      </tr>
                      <tr>
                        <td>2024-01-14</td>
                        <td>Withdrawal</td>
                        <td className="text-error">-$500</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Tab.Panel>
              <Tab.Panel className="p-4 bg-base-200 rounded-lg">
                <h3 className="font-semibold mb-2">Account Settings</h3>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="input input-bordered"
                  />
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>
    </div>
  );
}
