'use client';

import DashboardRouteGuard from '@/components/DashboardRouteGuard';
import SupportChatWidget from '@/components/SupportChatWidget';
import {
  CreditCard,
  FileText,
  Github,
  HelpCircle,
  Linkedin,
  Mail,
  Send,
  Shield,
  Twitter,
  Upload,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function SupportPage() {
  const [formData, setFormData] = useState({
    email: '',
    subject: '',
    category: 'GENERAL',
    priority: 'MEDIUM',
    message: '',
    systemLogs: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setMessage({
          type: 'error',
          text: 'Authentication token not found. Please log in again.',
        });
        return;
      }

      const response = await fetch('/api/support/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit support ticket');
      }

      setMessage({
        type: 'success',
        text: '✅ Support ticket submitted successfully! Our team will respond shortly.',
      });
      setFormData({
        email: '',
        subject: '',
        category: 'GENERAL',
        priority: 'MEDIUM',
        message: '',
        systemLogs: '',
      });
      setFiles([]);
    } catch (error) {
      console.error('Support ticket error:', error);
      setMessage({
        type: 'error',
        text:
          error instanceof Error
            ? error.message
            : 'Failed to submit support ticket. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <DashboardRouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl">
                <Mail className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-4">Submit a Request</h1>
            <p className="text-xl text-blue-100">
              Submit a request and our support team will get in touch with you.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Help Notice */}
          <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg mb-8">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Need help faster?</h3>
                <p className="text-blue-800 text-sm">
                  Try our live chat widget (bottom right) for instant assistance, or check our{' '}
                  <Link href="/faq" className="underline font-semibold hover:text-blue-600">
                    FAQ section
                  </Link>{' '}
                  for common questions.
                </p>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            {message && (
              <div
                className={`mb-6 p-4 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-900 mb-2">
                  Your email address *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:outline-none text-slate-900 placeholder-slate-400 transition-colors"
                />
              </div>

              {/* Subject */}
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-semibold text-slate-900 mb-2"
                >
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Briefly describe your issue or question"
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:outline-none text-slate-900 placeholder-slate-400 transition-colors"
                />
              </div>

              {/* Request Topic (Category) */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-semibold text-slate-900 mb-2"
                >
                  Request Topic *
                </label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:outline-none text-slate-900 bg-white transition-colors"
                >
                  <option value="">Select the category that best matches your request...</option>
                  <option value="GENERAL">General Inquiry</option>
                  <option value="BILLING">Billing & Payments</option>
                  <option value="TECHNICAL">Technical Issue</option>
                  <option value="SECURITY">Security Concern</option>
                  <option value="ACCOUNT">Account Management</option>
                  <option value="FEATURE_REQUEST">Feature Request</option>
                  <option value="OTHER">Other</option>
                </select>
                <p className="text-xs text-slate-500 mt-2">
                  Select the category that best matches your request so we can assist you more
                  efficiently.
                </p>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-semibold text-slate-900 mb-2"
                >
                  Description *
                </label>
                <textarea
                  id="message"
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Please provide any additional details about your request to help us assist you better."
                  rows={8}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:outline-none text-slate-900 placeholder-slate-400 resize-none transition-colors"
                />
              </div>

              {/* System Logs (Optional) */}
              <div>
                <label
                  htmlFor="systemLogs"
                  className="block text-sm font-semibold text-slate-900 mb-2"
                >
                  System Logs (optional)
                </label>
                <textarea
                  id="systemLogs"
                  value={formData.systemLogs}
                  onChange={(e) => setFormData({ ...formData, systemLogs: e.target.value })}
                  placeholder="Paste any error messages or system logs here..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:outline-none text-slate-900 placeholder-slate-400 resize-none transition-colors font-mono text-xs"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Automatically linked from the app - please keep for troubleshooting.
                </p>
              </div>

              {/* File Attachments */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">
                  Attachments (optional)
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                  <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-700 font-semibold">
                      Add file
                    </span>
                    <span className="text-slate-600"> or drop files here</span>
                    <input
                      id="file-upload"
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt,.log"
                    />
                  </label>
                  <p className="text-xs text-slate-500 mt-2">PNG, JPG, PDF, DOC up to 10MB</p>
                </div>

                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-slate-50 p-3 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span className="text-sm text-slate-700">{file.name}</span>
                          <span className="text-xs text-slate-500">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                          aria-label="Remove file"
                        >
                          <Send className="h-4 w-4 rotate-180" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:bg-slate-400 text-white font-bold py-4 px-6 rounded-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Send className="h-5 w-5" />
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </form>

            {/* Help Info */}
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">📋 What to expect:</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Our support team reviews all tickets within 24 hours</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>You&apos;ll receive updates via email as your ticket progresses</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Critical security and billing issues receive priority handling</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-blue-600 font-bold">✓</span>
                  <span>Average response time: 4-6 hours for urgent issues</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Section - VeePN Style */}
        <footer className="bg-slate-900 text-white mt-20">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
              {/* Products */}
              <div>
                <h4 className="font-bold text-lg mb-4">Products</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>
                    <Link href="/dashboard" className="hover:text-white transition-colors">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link href="/payments/checkout" className="hover:text-white transition-colors">
                      Deposit Funds
                    </Link>
                  </li>
                  <li>
                    <Link href="/wallet" className="hover:text-white transition-colors">
                      Wallet
                    </Link>
                  </li>
                  <li>
                    <Link href="/rewards" className="hover:text-white transition-colors">
                      Rewards Program
                    </Link>
                  </li>
                  <li>
                    <Link href="/transactions" className="hover:text-white transition-colors">
                      Transactions
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Features */}
              <div>
                <h4 className="font-bold text-lg mb-4">Features</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>Bank-Level Security</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span>Instant Transfers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Multi-Currency Support</span>
                  </li>
                  <li>
                    <Link href="/pricing" className="hover:text-white transition-colors">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="/api" className="hover:text-white transition-colors">
                      API Access
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Help */}
              <div>
                <h4 className="font-bold text-lg mb-4">Help</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>
                    <Link href="/faq" className="hover:text-white transition-colors">
                      FAQ
                    </Link>
                  </li>
                  <li>
                    <Link href="/support" className="hover:text-white transition-colors">
                      Support Center
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacy-policy" className="hover:text-white transition-colors">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms-of-service" className="hover:text-white transition-colors">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-white transition-colors">
                      Contact Us
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Company */}
              <div>
                <h4 className="font-bold text-lg mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>
                    <Link href="/about" className="hover:text-white transition-colors">
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/careers" className="hover:text-white transition-colors">
                      Careers
                    </Link>
                  </li>
                  <li>
                    <Link href="/blog" className="hover:text-white transition-colors">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <Link href="/security" className="hover:text-white transition-colors">
                      Security
                    </Link>
                  </li>
                  <li>
                    <Link href="/compliance" className="hover:text-white transition-colors">
                      Compliance
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex justify-center gap-6 mb-8 pb-8 border-b border-slate-700">
              <a
                href="https://twitter.com/advanciapayledger"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-6 w-6" />
              </a>
              <a
                href="https://github.com/advanciapayledger"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-6 w-6" />
              </a>
              <a
                href="https://linkedin.com/company/advanciapayledger"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-6 w-6" />
              </a>
            </div>

            {/* Company Disclosure - VeePN Style */}
            <div className="text-center space-y-3 text-sm text-slate-400">
              <p>
                © {new Date().getFullYear()}{' '}
                <Link href="/" className="text-white hover:text-blue-400 font-semibold">
                  Advancia Pay Ledger
                </Link>
                . All Rights Reserved.
              </p>
              <p>
                Services provided by{' '}
                <span className="font-semibold text-slate-300">Advancia Technologies LLC</span>,
                registered in Delaware, USA.
              </p>
              <p>
                <span className="font-semibold">Payment Processing Partners:</span> Stripe Inc.
                (USA) and Cryptomus (International).
              </p>
              <div className="flex items-center justify-center gap-4 text-xs pt-4">
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3 text-green-400" />
                  PCI DSS Compliant
                </span>
                <span>•</span>
                <span>FinCEN MSB Registration: Pending</span>
                <span>•</span>
                <span>State Money Transmitter Licenses: Applied</span>
              </div>
            </div>
          </div>
        </footer>

        {/* Chat Widget */}
        <SupportChatWidget />
      </div>
    </DashboardRouteGuard>
  );
}
