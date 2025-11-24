'use client';

import { useEffect, useState } from 'react';
import TrustpilotWidgetEmbedded from './TrustpilotWidgetEmbedded';

interface TrustReport {
  scamAdviserScore: number;
  trustpilotRating: number;
  sslValid: boolean;
  verifiedBusiness: boolean;
  status: 'verified' | 'pending' | 'needs_attention';
  lastChecked: string;
}

export default function TrustBadges() {
  const [trustReport, setTrustReport] = useState<TrustReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrustReport();
  }, []);

  const fetchTrustReport = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/trust/report`);

      if (!response.ok) {
        throw new Error('Failed to fetch trust report');
      }

      const data = await response.json();
      setTrustReport(data.report);
    } catch (err) {
      console.error('Error fetching trust report:', err);
      setError('Unable to load trust information');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-orange-600 bg-orange-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'In Progress';
      default:
        return 'Improving';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">🛡️ Trust & Security</h3>
        {trustReport && (
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              trustReport.status
            )}`}
          >
            {getStatusText(trustReport.status)}
          </span>
        )}
      </div>

      {/* Trust Score Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Scam Adviser Badge */}
        <div className="flex flex-col items-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg hover:shadow-md transition-shadow">
          <div className="text-3xl font-bold text-green-600">
            {trustReport?.scamAdviserScore || 'N/A'}
          </div>
          <div className="text-sm text-gray-700 mt-1 font-medium">Scam Adviser</div>
          <div className="text-xs text-gray-500 mt-1">Trust Score</div>
        </div>

        {/* Trustpilot Badge */}
        <div className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg hover:shadow-md transition-shadow">
          <div className="flex items-center gap-1">
            <span className="text-3xl font-bold text-blue-600">
              {trustReport?.trustpilotRating?.toFixed(1) || 'N/A'}
            </span>
            <span className="text-yellow-500 text-2xl">★</span>
          </div>
          <div className="text-sm text-gray-700 mt-1 font-medium">Trustpilot</div>
          <div className="text-xs text-gray-500 mt-1">Rating</div>
        </div>

        {/* SSL Certificate */}
        <div className="flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg hover:shadow-md transition-shadow">
          <div className="text-3xl">{trustReport?.sslValid ? '🔒' : '⚠️'}</div>
          <div className="text-sm text-gray-700 mt-2 font-medium">SSL Secure</div>
          <div className="text-xs text-gray-500 mt-1">
            {trustReport?.sslValid ? 'Verified' : 'Pending'}
          </div>
        </div>

        {/* Verified Business */}
        <div className="flex flex-col items-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg hover:shadow-md transition-shadow">
          <div className="text-3xl">{trustReport?.verifiedBusiness ? '✓' : '⏳'}</div>
          <div className="text-sm text-gray-700 mt-2 font-medium">Verified</div>
          <div className="text-xs text-gray-500 mt-1">
            {trustReport?.verifiedBusiness ? 'Business' : 'In Process'}
          </div>
        </div>
      </div>

      {/* Trustpilot Widget */}
      <div className="border-t border-gray-200 pt-4">
        <TrustpilotWidgetEmbedded template="mini" height={24} width="100%" stars="5" />
      </div>

      {/* Trust Certifications */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="flex flex-col items-center">
          <div className="text-2xl mb-1">🔐</div>
          <div className="text-xs text-gray-600 text-center font-medium">256-bit Encryption</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-2xl mb-1">💳</div>
          <div className="text-xs text-gray-600 text-center font-medium">PCI Compliant</div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-2xl mb-1">🏦</div>
          <div className="text-xs text-gray-600 text-center font-medium">Regulated Platform</div>
        </div>
      </div>

      {/* External Links */}
      <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
        <a
          href="https://www.scamadviser.com/check-website/advanciapayledger.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2 hover:underline"
        >
          <span>View Scam Adviser report</span>
          <span>→</span>
        </a>
        <a
          href="https://www.trustpilot.com/review/advanciapayledger.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2 hover:underline"
        >
          <span>View Trustpilot reviews</span>
          <span>→</span>
        </a>
      </div>

      {/* Last Updated */}
      {trustReport?.lastChecked && (
        <div className="text-xs text-gray-500 text-center pt-2">
          Last updated: {new Date(trustReport.lastChecked).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}
