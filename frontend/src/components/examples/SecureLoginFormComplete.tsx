/**
 * Example: Secure Login Form with Full Protection
 *
 * Demonstrates:
 * - Submit protection (no double-submit)
 * - Real-time validation
 * - Field encryption
 * - CSRF protection
 * - Rate limiting
 * - Input sanitization
 */

'use client';

import { usePasswordStrength, useSecureForm } from '@/hooks/useSecureForm';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SecureLoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  // Secure form hook with all protections
  const {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    hasErrors,
    isRateLimited,
    getRemainingAttempts,
  } = useSecureForm(
    // Submit handler
    async (data) => {
      const response = await axios.post('/api/auth/login', {
        email: data.email,
        password: data.password,
        _csrf: data._csrf, // CSRF token
      });
      return response.data;
    },
    // Options
    {
      formId: 'login-form',
      validationRules: {
        email: {
          required: true,
          email: true,
        },
        password: {
          required: true,
          minLength: 8,
        },
      },
      encryptFields: ['password'], // Encrypt password before sending
      enableCSRF: true,
      enableRateLimit: true,
      sanitizeInputs: true,
      onSuccess: (result) => {
        // Store token and redirect
        localStorage.setItem('token', result.token);
        router.push('/dashboard');
      },
      onError: (error) => {
        console.error('Login failed:', error);
      },
    }
  );

  // Password strength indicator
  const passwordStrength = usePasswordStrength(values.password || '');

  // Check if rate limited
  const rateLimited = isRateLimited();
  const remainingAttempts = getRemainingAttempts();

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6 text-center">Secure Login</h1>

      {/* Rate limit warning */}
      {rateLimited && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700 text-sm">
            ⚠️ Too many login attempts. Please try again later.
          </p>
        </div>
      )}

      {/* Remaining attempts indicator */}
      {!rateLimited && remainingAttempts < 3 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-700 text-sm">⚠️ {remainingAttempts} login attempts remaining</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Email Field */}
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={values.email || ''}
            onChange={(e) => handleChange('email', e.target.value, true)}
            className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 ${
              errors.email
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={isSubmitting || rateLimited}
            required
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>

        {/* Password Field */}
        <div className="mb-4">
          <label htmlFor="password" className="block text-sm font-medium mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={values.password || ''}
              onChange={(e) => handleChange('password', e.target.value, true)}
              className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 ${
                errors.password
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isSubmitting || rateLimited}
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}

          {/* Password strength indicator (for registration) */}
          {values.password && values.password.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center space-x-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      passwordStrength.strength === 'weak'
                        ? 'w-1/3 bg-red-500'
                        : passwordStrength.strength === 'medium'
                          ? 'w-2/3 bg-yellow-500'
                          : 'w-full bg-green-500'
                    }`}
                  />
                </div>
                <span
                  className={`text-xs font-medium ${
                    passwordStrength.strength === 'weak'
                      ? 'text-red-600'
                      : passwordStrength.strength === 'medium'
                        ? 'text-yellow-600'
                        : 'text-green-600'
                  }`}
                >
                  {passwordStrength.strength.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1">{passwordStrength.message}</p>
            </div>
          )}
        </div>

        {/* Remember Me */}
        <div className="mb-6 flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="rememberMe"
              checked={values.rememberMe || false}
              onChange={(e) => handleChange('rememberMe', e.target.checked)}
              className="mr-2"
              disabled={isSubmitting || rateLimited}
            />
            <span className="text-sm text-gray-700">Remember me</span>
          </label>
          <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
            Forgot password?
          </a>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || hasErrors || rateLimited}
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Logging in...
            </span>
          ) : (
            'Login'
          )}
        </button>
      </form>

      {/* Security Features Indicator */}
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm font-semibold text-green-800 mb-2">🔒 Protected by:</p>
        <ul className="space-y-1 text-xs text-green-700">
          <li>✅ Double-submit prevention</li>
          <li>✅ Real-time input validation</li>
          <li>✅ Password field encryption</li>
          <li>✅ CSRF token protection</li>
          <li>✅ Rate limiting (5 attempts/minute)</li>
          <li>✅ XSS input sanitization</li>
          <li>✅ Secure token storage</li>
        </ul>
      </div>

      {/* Register Link */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <a href="/register" className="text-blue-600 hover:underline font-medium">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
