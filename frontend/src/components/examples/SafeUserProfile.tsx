/**
 * Example: Safe User Profile Component
 *
 * Demonstrates:
 * - Safe HTML rendering
 * - URL sanitization
 * - Protected API calls
 * - Token refresh
 */

'use client';

import { useSafeHTML, useSafeLink, useSecureAPI } from '@/hooks/useSecurity';
import { InputSecurity } from '@/lib/security';
import { useEffect, useState } from 'react';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  bio: string;
  website: string;
  avatar: string;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
}

export default function SafeUserProfile() {
  const { secureFetch } = useSecureAPI();
  const { openSafeLink } = useSafeLink();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);

      // Secure API call with automatic token injection
      const response = await secureFetch('/api/users/profile');

      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const data = await response.json();
      setProfile(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Sanitize bio HTML (allows only safe tags)
  const safeBio = useSafeHTML(profile?.bio || '', [
    'p',
    'br',
    'strong',
    'em',
    'a',
    'ul',
    'li',
    'ol',
  ]);

  const handleExternalLink = (url: string) => {
    // Sanitize and open URL safely
    openSafeLink(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          No profile data available
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-32"></div>

        {/* Profile Content */}
        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="flex items-end -mt-16 mb-4">
            <img
              src={InputSecurity.sanitizeURL(profile.avatar) || '/default-avatar.png'}
              alt="Profile avatar"
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/default-avatar.png';
              }}
            />
            <div className="ml-4 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {InputSecurity.escapeHTML(profile.name)}
              </h1>
              <p className="text-gray-600">{InputSecurity.escapeHTML(profile.email)}</p>
            </div>
          </div>

          {/* Bio (Safe HTML rendering) */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">About</h2>
            <div
              className="text-gray-700 prose max-w-none"
              dangerouslySetInnerHTML={{ __html: safeBio }}
            />
          </div>

          {/* Website (Safe URL) */}
          {profile.website && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Website</h2>
              <button
                onClick={() => handleExternalLink(profile.website)}
                className="text-blue-600 hover:underline flex items-center"
              >
                🔗 {InputSecurity.escapeHTML(profile.website)}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </button>
            </div>
          )}

          {/* Social Links (Safe URLs) */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Social Links</h2>
            <div className="flex space-x-4">
              {profile.socialLinks.twitter && (
                <SafeSocialLink
                  platform="Twitter"
                  url={profile.socialLinks.twitter}
                  icon="🐦"
                  onClick={handleExternalLink}
                />
              )}
              {profile.socialLinks.linkedin && (
                <SafeSocialLink
                  platform="LinkedIn"
                  url={profile.socialLinks.linkedin}
                  icon="💼"
                  onClick={handleExternalLink}
                />
              )}
              {profile.socialLinks.github && (
                <SafeSocialLink
                  platform="GitHub"
                  url={profile.socialLinks.github}
                  icon="🐙"
                  onClick={handleExternalLink}
                />
              )}
            </div>
          </div>

          {/* Security Info */}
          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded">
            <p className="font-semibold text-green-800 mb-2">🔒 Security Features Active:</p>
            <ul className="space-y-1 text-green-700 text-sm">
              <li>✅ HTML sanitization (XSS prevention)</li>
              <li>✅ URL validation (prevents javascript: URIs)</li>
              <li>✅ Secure API calls with JWT</li>
              <li>✅ External links open with rel="noopener noreferrer"</li>
              <li>✅ Image error handling (prevents broken image attacks)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component: Safe Social Link
function SafeSocialLink({
  platform,
  url,
  icon,
  onClick,
}: {
  platform: string;
  url: string;
  icon: string;
  onClick: (url: string) => void;
}) {
  // Validate URL
  const safeUrl = InputSecurity.sanitizeURL(url);

  if (!safeUrl) {
    return null; // Don't render invalid URLs
  }

  return (
    <button
      onClick={() => onClick(safeUrl)}
      className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      title={`Visit ${platform}`}
    >
      <span className="text-2xl mr-2">{icon}</span>
      <span className="text-sm font-medium">{platform}</span>
    </button>
  );
}
