'use client';

import { ErrorMessage, Field, Form, Formik } from 'formik';
import { useState } from 'react';
import * as Yup from 'yup';

// ✅ FORMIK EXAMPLE - For your KYC, payment, and registration forms
// Benefits: Auto validation, error handling, loading states, clean code

interface FormValues {
  email: string;
  amount: string;
  cryptoAddress: string;
  consent: boolean;
  paymentProvider: 'cryptomus' | 'nowpayments';
}

const withdrawalSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  amount: Yup.number()
    .positive('Amount must be positive')
    .min(10, 'Minimum withdrawal is $10')
    .max(100000, 'Maximum withdrawal is $100,000')
    .required('Amount is required'),
  cryptoAddress: Yup.string()
    .matches(/^(0x)?[0-9a-fA-F]{40}$/, 'Invalid Ethereum address')
    .required('Crypto address is required'),
  consent: Yup.boolean().oneOf([true], 'You must accept the terms').required('Consent is required'),
});

export default function EnhancedFormExample() {
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (values: FormValues, { setSubmitting, resetForm }: any) => {
    try {
      console.log('Form submitted:', values);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSubmitSuccess(true);
      resetForm();

      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* 🎨 DAISYUI CARD COMPONENT */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">
            💎 Crypto Withdrawal Form
            <div className="badge badge-primary">FORMIK + DAISYUI</div>
          </h2>

          {submitSuccess && (
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
              <span>Withdrawal request submitted successfully!</span>
            </div>
          )}

          <Formik
            initialValues={{
              email: '',
              amount: '',
              cryptoAddress: '',
              consent: false,
              paymentProvider: 'nowpayments' as const,
            }}
            validationSchema={withdrawalSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, touched }) => (
              <Form className="space-y-4">
                {/* Email Field with DaisyUI styling */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Email Address</span>
                  </label>
                  <Field
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    className={`input input-bordered w-full transition-all duration-300 ${
                      errors.email && touched.email
                        ? 'input-error border-error border-2 shadow-lg shadow-error/30 animate-shake'
                        : 'focus:border-primary focus:shadow-lg focus:shadow-primary/20'
                    }`}
                  />
                  <ErrorMessage name="email">
                    {(msg) => (
                      <div className="flex items-center gap-2 mt-1 px-2 py-1 bg-error/10 border-l-4 border-error rounded animate-pulse">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="stroke-current shrink-0 h-4 w-4 text-error"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-xs text-error font-medium">{msg}</span>
                      </div>
                    )}
                  </ErrorMessage>
                </div>

                {/* Amount Field */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Withdrawal Amount (USD)</span>
                  </label>
                  <Field
                    name="amount"
                    type="number"
                    placeholder="100.00"
                    className={`input input-bordered w-full transition-all duration-300 ${
                      errors.amount && touched.amount
                        ? 'input-error border-error border-2 shadow-lg shadow-error/30 animate-shake'
                        : 'focus:border-secondary focus:shadow-lg focus:shadow-secondary/20'
                    }`}
                  />
                  <ErrorMessage name="amount">
                    {(msg) => (
                      <div className="flex items-center gap-2 mt-1 px-2 py-1 bg-error/10 border-l-4 border-error rounded animate-pulse">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="stroke-current shrink-0 h-4 w-4 text-error"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-xs text-error font-medium">{msg}</span>
                      </div>
                    )}
                  </ErrorMessage>
                </div>

                {/* Payment Provider Selector */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">💳 Payment Provider</span>
                    <span className="label-text-alt text-info">
                      Choose your crypto payment gateway
                    </span>
                  </label>
                  <Field name="paymentProvider">
                    {({ field, form }: any) => (
                      <div className="grid grid-cols-2 gap-4">
                        {/* NOWPayments Option */}
                        <label
                          className={`cursor-pointer transition-all duration-300 ${
                            field.value === 'nowpayments' ? 'scale-105' : 'hover:scale-[1.02]'
                          }`}
                        >
                          <input
                            type="radio"
                            {...field}
                            value="nowpayments"
                            checked={field.value === 'nowpayments'}
                            className="sr-only"
                          />
                          <div
                            className={`card border-2 transition-all duration-300 ${
                              field.value === 'nowpayments'
                                ? 'border-success bg-success/10 shadow-lg shadow-success/20'
                                : 'border-base-300 hover:border-success/50'
                            }`}
                          >
                            <div className="card-body p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold">NOWPayments</h3>
                                {field.value === 'nowpayments' && (
                                  <div className="badge badge-success badge-sm">✓ Selected</div>
                                )}
                              </div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-base-content/70">Fees:</span>
                                  <span className="font-semibold text-success">0.5%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-base-content/70">Coins:</span>
                                  <span className="font-semibold">200+</span>
                                </div>
                                <div className="badge badge-success badge-xs mt-2">Recommended</div>
                              </div>
                            </div>
                          </div>
                        </label>

                        {/* Cryptomus Option */}
                        <label
                          className={`cursor-pointer transition-all duration-300 ${
                            field.value === 'cryptomus' ? 'scale-105' : 'hover:scale-[1.02]'
                          }`}
                        >
                          <input
                            type="radio"
                            {...field}
                            value="cryptomus"
                            checked={field.value === 'cryptomus'}
                            className="sr-only"
                          />
                          <div
                            className={`card border-2 transition-all duration-300 ${
                              field.value === 'cryptomus'
                                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                                : 'border-base-300 hover:border-primary/50'
                            }`}
                          >
                            <div className="card-body p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold">Cryptomus</h3>
                                {field.value === 'cryptomus' && (
                                  <div className="badge badge-primary badge-sm">✓ Selected</div>
                                )}
                              </div>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-base-content/70">Fees:</span>
                                  <span className="font-semibold">~1%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-base-content/70">Coins:</span>
                                  <span className="font-semibold">50+</span>
                                </div>
                                <div className="badge badge-ghost badge-xs mt-2">Alternative</div>
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>
                    )}
                  </Field>
                  <label className="label">
                    <span className="label-text-alt text-base-content/60">
                      💡 NOWPayments offers lower fees and more cryptocurrency options
                    </span>
                  </label>
                </div>

                {/* Crypto Address Field */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Ethereum Address</span>
                  </label>
                  <Field
                    name="cryptoAddress"
                    type="text"
                    placeholder="0x..."
                    className={`input input-bordered w-full font-mono text-sm transition-all duration-300 ${
                      errors.cryptoAddress && touched.cryptoAddress
                        ? 'input-error border-error border-2 shadow-lg shadow-error/30 animate-shake'
                        : 'focus:border-accent focus:shadow-lg focus:shadow-accent/20'
                    }`}
                  />
                  <ErrorMessage name="cryptoAddress">
                    {(msg) => (
                      <div className="flex items-center gap-2 mt-1 px-2 py-1 bg-error/10 border-l-4 border-error rounded animate-pulse">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="stroke-current shrink-0 h-4 w-4 text-error"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                        <span className="text-xs text-error font-medium">{msg}</span>
                      </div>
                    )}
                  </ErrorMessage>
                </div>

                {/* Advanced Terms & Conditions Agreement */}
                <div className="form-control">
                  <div
                    className={`card bg-gradient-to-br from-primary/5 to-secondary/5 border-2 transition-all duration-300 ${
                      errors.consent && touched.consent
                        ? 'border-error shadow-lg shadow-error/20'
                        : 'border-primary/20 hover:border-primary/40'
                    }`}
                  >
                    <div className="card-body p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 mt-1">
                          <Field name="consent">
                            {({ field }: any) => (
                              <input
                                {...field}
                                type="checkbox"
                                className={`checkbox checkbox-lg ${
                                  field.value ? 'checkbox-success' : 'checkbox-primary'
                                } ${errors.consent && touched.consent ? 'checkbox-error' : ''}`}
                              />
                            )}
                          </Field>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-base mb-2 flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-primary"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Terms & Conditions Agreement
                          </h3>
                          <div className="text-sm space-y-1 opacity-90">
                            <p className="flex items-center gap-2">
                              <span className="badge badge-sm badge-primary">📊</span>I understand
                              withdrawal fees and processing times
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="badge badge-sm badge-secondary">🔒</span>
                              Transactions are irreversible once confirmed
                            </p>
                            <p className="flex items-center gap-2">
                              <span className="badge badge-sm badge-accent">⏱️</span>
                              Processing may take 24-72 hours
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ErrorMessage name="consent">
                    {(msg) => (
                      <label className="label">
                        <span className="label-text-alt text-error font-semibold flex items-center gap-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {msg}
                        </span>
                      </label>
                    )}
                  </ErrorMessage>
                </div>

                {/* Submit Button with Loading State */}
                <div className="card-actions justify-end mt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`btn btn-primary w-full ${isSubmitting ? 'loading' : ''}`}
                  >
                    {isSubmitting ? 'Processing...' : 'Submit Withdrawal'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>

          {/* Info Alert */}
          <div className="alert alert-info mt-4">
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
            <span>This form uses Formik for validation and DaisyUI for styling</span>
          </div>
        </div>
      </div>
    </div>
  );
}
