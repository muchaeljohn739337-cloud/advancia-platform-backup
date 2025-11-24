'use client';

import { useState } from 'react';

// ✅ MODERN HTML5 FEATURES DEMO
// Showcase of powerful native HTML features that require zero JavaScript libraries

export default function ModernHTMLFeatures() {
  const [editableContent, setEditableContent] = useState('Click me to edit this text!');
  const [selectedColor, setSelectedColor] = useState('#1890ff');
  const [selectedDate, setSelectedDate] = useState('');
  const [rangeValue, setRangeValue] = useState(50);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedBrowser, setSelectedBrowser] = useState('');

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">🚀 Modern HTML5 Features</h1>
        <div className="badge badge-secondary">Zero JavaScript Libraries Required</div>
      </div>

      {/* 1. CONTENTEDITABLE - Inline Text Editing */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">
            ✏️ ContentEditable - Inline Text Editor
            <div className="badge badge-primary">Native HTML</div>
          </h2>
          <p className="text-gray-600 mb-4">
            Click the text below to edit it directly. Perfect for notes, comments, or quick edits.
          </p>

          <div className="alert alert-info mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span>Use Case: User notes, transaction descriptions, inline comments</span>
          </div>

          <div
            contentEditable="true"
            suppressContentEditableWarning
            onBlur={(e) => setEditableContent(e.currentTarget.textContent || '')}
            className="p-4 border-2 border-dashed border-primary rounded-lg bg-base-200 min-h-[100px] focus:outline-none focus:border-solid focus:border-secondary cursor-text"
            style={{ outline: 'none' }}
          >
            {editableContent}
          </div>

          <div className="mt-4">
            <div className="text-sm text-gray-600">Current content:</div>
            <div className="font-mono text-sm bg-base-300 p-2 rounded">{editableContent}</div>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">💡 Real Use Cases:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>User transaction notes/descriptions</li>
              <li>Admin comments on support tickets</li>
              <li>Quick edit for account settings</li>
              <li>Inline editing in data tables</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 2. LAZY LOADING - Images */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">
            🖼️ Lazy Loading - Optimize Image Performance
            <div className="badge badge-success">Performance</div>
          </h2>
          <p className="text-gray-600 mb-4">
            Images load only when they're about to enter the viewport. Saves bandwidth and improves
            page speed.
          </p>

          <div className="alert alert-success mb-4">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Use Case: User avatars, transaction receipts, KYC documents</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <img
                src="https://via.placeholder.com/400x300/1890ff/ffffff?text=Lazy+Load+1"
                loading="lazy"
                alt="Lazy loaded image 1"
                className="rounded-lg shadow-lg w-full"
              />
              <div className="badge badge-primary absolute top-2 right-2">loading="lazy"</div>
            </div>
            <div className="relative">
              <img
                src="https://via.placeholder.com/400x300/13c2c2/ffffff?text=Lazy+Load+2"
                loading="lazy"
                alt="Lazy loaded image 2"
                className="rounded-lg shadow-lg w-full"
              />
              <div className="badge badge-secondary absolute top-2 right-2">loading="lazy"</div>
            </div>
            <div className="relative">
              <img
                src="https://via.placeholder.com/400x300/40a9ff/ffffff?text=Lazy+Load+3"
                loading="lazy"
                alt="Lazy loaded image 3"
                className="rounded-lg shadow-lg w-full"
              />
              <div className="badge badge-accent absolute top-2 right-2">loading="lazy"</div>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">💡 Real Use Cases:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>User profile avatars in long lists</li>
              <li>Transaction receipt images</li>
              <li>KYC document previews</li>
              <li>Payment gateway logos</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3. DATALIST - Autocomplete Dropdown */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">
            🔍 Datalist - Native Autocomplete
            <div className="badge badge-info">No Library</div>
          </h2>
          <p className="text-gray-600 mb-4">
            Built-in autocomplete dropdown with suggestions. Type to filter options.
          </p>

          <div className="alert alert-info mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span>Use Case: Bank selection, crypto currency picker, country selector</span>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Select Your Bank</span>
            </label>
            <input
              list="banks"
              className="input input-bordered w-full"
              placeholder="Type to search banks..."
              value={selectedBrowser}
              onChange={(e) => setSelectedBrowser(e.target.value)}
            />
            <datalist id="banks">
              <option value="Chase Bank" />
              <option value="Bank of America" />
              <option value="Wells Fargo" />
              <option value="Citibank" />
              <option value="Capital One" />
              <option value="TD Bank" />
              <option value="PNC Bank" />
              <option value="US Bank" />
            </datalist>
            <label className="label">
              <span className="label-text-alt">Selected: {selectedBrowser || 'None'}</span>
            </label>
          </div>

          <div className="form-control mt-4">
            <label className="label">
              <span className="label-text font-semibold">Select Cryptocurrency</span>
            </label>
            <input
              list="cryptocurrencies"
              className="input input-bordered w-full"
              placeholder="Type to search crypto..."
            />
            <datalist id="cryptocurrencies">
              <option value="Bitcoin (BTC)" />
              <option value="Ethereum (ETH)" />
              <option value="Tether (USDT)" />
              <option value="USD Coin (USDC)" />
              <option value="BNB" />
              <option value="Cardano (ADA)" />
              <option value="Solana (SOL)" />
              <option value="Polkadot (DOT)" />
            </datalist>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">💡 Real Use Cases:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Bank account selection during linking</li>
              <li>Cryptocurrency picker for withdrawals</li>
              <li>Country/region selector in KYC</li>
              <li>Payment method selection</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 4. DETAILS/SUMMARY - Collapsible Sections */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">
            📂 Details/Summary - Native Accordions
            <div className="badge badge-warning">Zero JS</div>
          </h2>
          <p className="text-gray-600 mb-4">
            Built-in collapsible sections without any JavaScript. Perfect for FAQs and hidden
            details.
          </p>

          <div className="alert alert-warning mb-4">
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
            <span>Use Case: Transaction details, FAQs, terms & conditions</span>
          </div>

          <div className="space-y-3">
            <details className="collapse collapse-arrow bg-base-200">
              <summary className="collapse-title text-lg font-medium cursor-pointer">
                📊 Transaction Fee Breakdown
              </summary>
              <div className="collapse-content">
                <div className="pt-2 space-y-2">
                  <div className="flex justify-between">
                    <span>Base Amount:</span>
                    <span className="font-semibold">$1,000.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Processing Fee (2%):</span>
                    <span className="font-semibold">$20.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network Fee:</span>
                    <span className="font-semibold">$2.50</span>
                  </div>
                  <div className="divider my-2"></div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-primary">$1,022.50</span>
                  </div>
                </div>
              </div>
            </details>

            <details className="collapse collapse-arrow bg-base-200">
              <summary className="collapse-title text-lg font-medium cursor-pointer">
                🔐 Security & Compliance Information
              </summary>
              <div className="collapse-content">
                <div className="pt-2">
                  <p className="mb-2">Your transaction is protected by:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>256-bit SSL encryption</li>
                    <li>Two-factor authentication</li>
                    <li>PCI DSS Level 1 compliance</li>
                    <li>Real-time fraud monitoring</li>
                  </ul>
                </div>
              </div>
            </details>

            <details className="collapse collapse-arrow bg-base-200">
              <summary className="collapse-title text-lg font-medium cursor-pointer">
                💳 Supported Payment Methods
              </summary>
              <div className="collapse-content">
                <div className="pt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="badge badge-primary">Credit Cards</div>
                    <div className="badge badge-secondary">Debit Cards</div>
                    <div className="badge badge-accent">Bitcoin</div>
                    <div className="badge badge-success">Ethereum</div>
                    <div className="badge badge-info">Bank Transfer</div>
                    <div className="badge badge-warning">PayPal</div>
                  </div>
                </div>
              </div>
            </details>

            <details className="collapse collapse-arrow bg-base-200">
              <summary className="collapse-title text-lg font-medium cursor-pointer">
                ❓ Frequently Asked Questions
              </summary>
              <div className="collapse-content">
                <div className="pt-2 space-y-3">
                  <div>
                    <p className="font-semibold">How long do withdrawals take?</p>
                    <p className="text-sm text-gray-600">
                      Typically 1-3 business days for bank transfers, 10-30 minutes for crypto.
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold">Are there any withdrawal limits?</p>
                    <p className="text-sm text-gray-600">
                      Standard: $10,000/day. Premium: $50,000/day.
                    </p>
                  </div>
                </div>
              </div>
            </details>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">💡 Real Use Cases:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Transaction fee breakdowns</li>
              <li>FAQ sections on payment pages</li>
              <li>Terms and conditions accordions</li>
              <li>Hidden transaction details</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 5. COLOR INPUT - Color Picker */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">
            🎨 Input Type="color" - Native Color Picker
            <div className="badge badge-primary">Built-in</div>
          </h2>
          <p className="text-gray-600 mb-4">Native color picker without any external libraries.</p>

          <div className="flex items-center gap-4">
            <div className="form-control">
              <label htmlFor="colorPicker" className="label">
                <span className="label-text font-semibold">Choose Theme Color</span>
              </label>
              <input
                id="colorPicker"
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-20 h-20 cursor-pointer rounded-lg border-4 border-base-300"
                aria-label="Color picker for theme selection"
              />
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-600">Selected Color:</div>
              <div className="text-2xl font-bold font-mono">{selectedColor}</div>
              <div
                className="mt-2 p-4 rounded-lg text-white text-center font-semibold"
                style={{ backgroundColor: selectedColor }}
              >
                Preview
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">💡 Real Use Cases:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Custom theme color picker for user profiles</li>
              <li>Category color coding in expense tracking</li>
              <li>Chart color customization</li>
              <li>Brand color selection for business accounts</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 6. DATE, RANGE, WEEK INPUTS */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">
            📅 Advanced Input Types
            <div className="badge badge-secondary">HTML5</div>
          </h2>
          <p className="text-gray-600 mb-4">
            Native date pickers, range sliders, and week selectors.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Picker */}
            <div className="form-control">
              <label htmlFor="datePicker" className="label">
                <span className="label-text font-semibold">📆 Transaction Date</span>
              </label>
              <input
                id="datePicker"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input input-bordered w-full"
                aria-label="Date picker for selecting transaction date"
              />
              <label className="label">
                <span className="label-text-alt">Selected: {selectedDate || 'None'}</span>
              </label>
            </div>

            {/* Week Picker */}
            <div className="form-control">
              <label htmlFor="weekPicker" className="label">
                <span className="label-text font-semibold">📊 Report Week</span>
                <span className="label-text-alt text-warning">⚠️ Chrome/Edge only</span>
              </label>
              <input
                id="weekPicker"
                type="week"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="input input-bordered w-full"
                aria-label="Week picker for selecting reporting period"
                title="Week picker - Not supported in Firefox/Safari"
              />
              <label className="label">
                <span className="label-text-alt">Selected: {selectedWeek || 'None'}</span>
              </label>
            </div>

            {/* Range Slider */}
            <div className="form-control col-span-full">
              <label htmlFor="amountSlider" className="label">
                <span className="label-text font-semibold">💰 Transaction Amount</span>
                <span className="label-text-alt font-bold">${rangeValue}</span>
              </label>
              <input
                id="amountSlider"
                type="range"
                min={0}
                max={10000}
                value={rangeValue}
                onChange={(e) => setRangeValue(Number(e.target.value))}
                className="range range-primary"
                aria-label="Slider to select transaction amount"
                aria-valuemin={0}
                aria-valuemax={10000}
                aria-valuenow={rangeValue}
              />
              <div className="w-full flex justify-between text-xs px-2 mt-2">
                <span>$0</span>
                <span>$2,500</span>
                <span>$5,000</span>
                <span>$7,500</span>
                <span>$10,000</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="font-semibold mb-2">💡 Real Use Cases:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>
                <strong>Date:</strong> Transaction filters, payment schedules, birth date in KYC
              </li>
              <li>
                <strong>Week:</strong> Weekly report generation, recurring payment schedules
              </li>
              <li>
                <strong>Range:</strong> Transaction amount filters, budget limits, fee sliders
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
        <div className="stat">
          <div className="stat-figure text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-8 h-8 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <div className="stat-title">Features Showcased</div>
          <div className="stat-value text-primary">6</div>
          <div className="stat-desc">Native HTML5 capabilities</div>
        </div>

        <div className="stat">
          <div className="stat-figure text-secondary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-8 h-8 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              ></path>
            </svg>
          </div>
          <div className="stat-title">External Libraries</div>
          <div className="stat-value text-secondary">0</div>
          <div className="stat-desc">Pure HTML & CSS</div>
        </div>

        <div className="stat">
          <div className="stat-figure text-accent">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-8 h-8 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              ></path>
            </svg>
          </div>
          <div className="stat-title">Browser Support</div>
          <div className="stat-value text-accent">95%+</div>
          <div className="stat-desc">All modern browsers</div>
        </div>
      </div>

      {/* Code Examples */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">📝 Code Examples</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. ContentEditable:</h3>
              <pre className="bg-base-300 p-3 rounded-lg overflow-x-auto text-sm">
                {`<div contentEditable="true">
  Click me, edit me
</div>`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. Lazy Loading:</h3>
              <pre className="bg-base-300 p-3 rounded-lg overflow-x-auto text-sm">
                {`<img
  src="bigimage.jpg"
  loading="lazy"
  alt="Description"
/>`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Datalist Autocomplete:</h3>
              <pre className="bg-base-300 p-3 rounded-lg overflow-x-auto text-sm">
                {`<input list="browsers" />
<datalist id="browsers">
  <option value="Chrome" />
  <option value="Firefox" />
  <option value="Edge" />
</datalist>`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">4. Collapsible Details:</h3>
              <pre className="bg-base-300 p-3 rounded-lg overflow-x-auto text-sm">
                {`<details>
  <summary>Click to expand</summary>
  <p>Hidden details here</p>
</details>`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold mb-2">5. Advanced Inputs:</h3>
              <pre className="bg-base-300 p-3 rounded-lg overflow-x-auto text-sm">
                {`<input type="color" />
<input type="date" />
<input type="range" />
<input type="week" />`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
