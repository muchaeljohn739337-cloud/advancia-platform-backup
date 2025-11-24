'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

interface FormData {
  email: string;
  amount: string;
  paymentMethod: string;
  acceptTerms: boolean;
}

interface InteractionMetrics {
  mouseEnterCount: number;
  mouseLeaveCount: number;
  clicksOnButton: number;
  formFocusTime: number;
  lastInteraction: string;
}

export default function InteractiveFormDemo() {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    amount: '',
    paymentMethod: '',
    acceptTerms: false,
  });

  const [metrics, setMetrics] = useState<InteractionMetrics>({
    mouseEnterCount: 0,
    mouseLeaveCount: 0,
    clicksOnButton: 0,
    formFocusTime: 0,
    lastInteraction: 'None',
  });

  const [isMouseOverButton, setIsMouseOverButton] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const focusTimeRef = useRef<number>(0);
  const focusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track focus time
  useEffect(() => {
    return () => {
      if (focusIntervalRef.current) {
        clearInterval(focusIntervalRef.current);
      }
    };
  }, []);

  const handleFormFocus = () => {
    focusTimeRef.current = Date.now();
    focusIntervalRef.current = setInterval(() => {
      if (focusTimeRef.current) {
        const elapsed = Math.floor((Date.now() - focusTimeRef.current) / 1000);
        setMetrics((prev) => ({ ...prev, formFocusTime: elapsed }));
      }
    }, 1000);
    setMetrics((prev) => ({ ...prev, lastInteraction: 'Form focused' }));
  };

  const handleFormBlur = () => {
    if (focusIntervalRef.current) {
      clearInterval(focusIntervalRef.current);
      focusIntervalRef.current = null;
    }
  };

  const handleMouseEnterButton = () => {
    setIsMouseOverButton(true);
    setMetrics((prev) => ({
      ...prev,
      mouseEnterCount: prev.mouseEnterCount + 1,
      lastInteraction: 'Mouse entered submit button',
    }));
  };

  const handleMouseLeaveButton = () => {
    setIsMouseOverButton(false);
    setMetrics((prev) => ({
      ...prev,
      mouseLeaveCount: prev.mouseLeaveCount + 1,
      lastInteraction: 'Mouse left submit button',
    }));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsMouseDown(true);

    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);

    setMetrics((prev) => ({
      ...prev,
      lastInteraction: `Mouse down at (${Math.round(x)}, ${Math.round(y)})`,
    }));
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
    setMetrics((prev) => ({
      ...prev,
      lastInteraction: 'Mouse up',
    }));
  };

  const handleButtonClick = () => {
    setMetrics((prev) => ({
      ...prev,
      clicksOnButton: prev.clicksOnButton + 1,
      lastInteraction: 'Submit button clicked',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.amount || !formData.paymentMethod) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!formData.acceptTerms) {
      toast.error('Please accept terms and conditions');
      return;
    }

    toast.success(`Payment of $${formData.amount} submitted! (Demo)`);
    setMetrics((prev) => ({
      ...prev,
      lastInteraction: 'Form submitted successfully',
    }));

    // Reset form
    setFormData({
      email: '',
      amount: '',
      paymentMethod: '',
      acceptTerms: false,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🎯 Interactive Form with Mouse Tracking
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Watch real-time interaction metrics as you use the form
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Payment Form (Demo)
            </h2>

            <form
              onSubmit={handleSubmit}
              onFocus={handleFormFocus}
              onBlur={handleFormBlur}
              className="space-y-6"
            >
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    setMetrics((prev) => ({
                      ...prev,
                      lastInteraction: 'Email input changed',
                    }));
                  }}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="your@email.com"
                  required
                />
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount ($)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => {
                    setFormData({ ...formData, amount: e.target.value });
                    setMetrics((prev) => ({
                      ...prev,
                      lastInteraction: 'Amount input changed',
                    }));
                  }}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="100.00"
                  min="1"
                  step="0.01"
                  required
                />
              </div>

              {/* Payment Method Datalist */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method
                </label>
                <input
                  type="text"
                  value={formData.paymentMethod}
                  onChange={(e) => {
                    setFormData({ ...formData, paymentMethod: e.target.value });
                    setMetrics((prev) => ({
                      ...prev,
                      lastInteraction: 'Payment method selected',
                    }));
                  }}
                  list="payment-methods"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Select or type..."
                  required
                />
                <datalist id="payment-methods">
                  <option value="Credit Card" />
                  <option value="Debit Card" />
                  <option value="PayPal" />
                  <option value="Bank Transfer" />
                  <option value="Cryptocurrency" />
                </datalist>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) => {
                    setFormData({ ...formData, acceptTerms: e.target.checked });
                    setMetrics((prev) => ({
                      ...prev,
                      lastInteraction: e.target.checked ? 'Terms accepted' : 'Terms unchecked',
                    }));
                  }}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  required
                />
                <label className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                  I agree to the terms and conditions
                </label>
              </div>

              {/* Submit Button with Advanced Mouse Tracking */}
              <button
                type="submit"
                onClick={handleButtonClick}
                onMouseEnter={handleMouseEnterButton}
                onMouseLeave={handleMouseLeaveButton}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                className={`
                  relative overflow-hidden w-full py-4 rounded-lg font-semibold text-white
                  transition-all duration-200 transform
                  ${
                    isMouseOverButton
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 scale-105 shadow-xl'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg'
                  }
                  ${isMouseDown ? 'scale-95' : ''}
                  hover:shadow-2xl
                  focus:ring-4 focus:ring-blue-300 focus:outline-none
                  active:transform active:scale-95
                `}
              >
                {/* Ripple effects */}
                {ripples.map((ripple) => (
                  <span
                    key={ripple.id}
                    className="absolute animate-ripple bg-white/30 rounded-full"
                    style={{
                      left: ripple.x,
                      top: ripple.y,
                      width: '10px',
                      height: '10px',
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                ))}

                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isMouseDown ? '⬇️' : isMouseOverButton ? '👆' : '💳'}
                  Submit Payment
                </span>
              </button>
            </form>
          </div>

          {/* Metrics Section */}
          <div className="space-y-6">
            {/* Real-time Metrics */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                📊 Interaction Metrics
              </h2>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    Mouse Enters Button
                  </span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {metrics.mouseEnterCount}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    Mouse Leaves Button
                  </span>
                  <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {metrics.mouseLeaveCount}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    Button Clicks
                  </span>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {metrics.clicksOnButton}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    Form Focus Time
                  </span>
                  <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {metrics.formFocusTime}s
                  </span>
                </div>
              </div>
            </div>

            {/* Last Interaction */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-2xl p-8 text-white">
              <h3 className="text-xl font-bold mb-4">🎬 Last Interaction</h3>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                <p className="font-mono text-sm">{metrics.lastInteraction}</p>
                <p className="text-xs mt-2 opacity-75">{new Date().toLocaleTimeString()}</p>
              </div>
            </div>

            {/* Mouse State Indicators */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                🖱️ Mouse State
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`
                  p-4 rounded-lg text-center transition-all duration-200
                  ${
                    isMouseOverButton
                      ? 'bg-green-100 dark:bg-green-900/30 ring-2 ring-green-500'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }
                `}
                >
                  <div className="text-2xl mb-1">{isMouseOverButton ? '✅' : '⬜'}</div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hovering
                  </div>
                </div>

                <div
                  className={`
                  p-4 rounded-lg text-center transition-all duration-200
                  ${
                    isMouseDown
                      ? 'bg-red-100 dark:bg-red-900/30 ring-2 ring-red-500'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }
                `}
                >
                  <div className="text-2xl mb-1">{isMouseDown ? '⬇️' : '⬜'}</div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Pressing
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes ripple {
          to {
            width: 150px;
            height: 150px;
            opacity: 0;
          }
        }
        .animate-ripple {
          animation: ripple 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}
