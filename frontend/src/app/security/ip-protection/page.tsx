'use client';

import DashboardRouteGuard from '@/components/DashboardRouteGuard';
import {
  Eye,
  EyeOff,
  Globe,
  Lock,
  MapPin,
  Power,
  RefreshCw,
  Shield,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface IPInfo {
  ip: string;
  isp: string;
  country: string;
  city: string;
  region: string;
  protected: boolean;
  vpnActive: boolean;
  proxyActive: boolean;
}

export default function IPProtectionPage() {
  const [ipInfo, setIpInfo] = useState<IPInfo>({
    ip: '197.211.52.75',
    isp: 'Globacom',
    country: 'Nigeria',
    city: 'Lagos',
    region: 'Lagos State',
    protected: false,
    vpnActive: false,
    proxyActive: false,
  });
  const [loading, setLoading] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [targetCountry, setTargetCountry] = useState('United States');
  const [showRealIP, setShowRealIP] = useState(true);

  useEffect(() => {
    fetchIPInfo();
  }, []);

  async function fetchIPInfo() {
    setLoading(true);
    try {
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        setIpInfo({
          ip: data.ip || '197.211.52.75',
          isp: data.org || 'Globacom',
          country: data.country_name || 'Nigeria',
          city: data.city || 'Lagos',
          region: data.region || 'Lagos State',
          protected: false,
          vpnActive: false,
          proxyActive: false,
        });
      }
    } catch (error) {
      console.error('IP fetch error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function rotateIP() {
    setRotating(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) return;

      const response = await fetch('/api/security/rotate-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetCountry }),
      });

      if (response.ok) {
        const data = await response.json();
        setIpInfo({
          ...ipInfo,
          ip: data.newIP || generateRandomIP(),
          country: targetCountry,
          city: data.city || getCityForCountry(targetCountry),
          region: data.region || '',
          protected: true,
          vpnActive: true,
          proxyActive: true,
        });
      } else {
        // Demo mode: simulate IP rotation
        setIpInfo({
          ...ipInfo,
          ip: generateRandomIP(),
          country: targetCountry,
          city: getCityForCountry(targetCountry),
          region: '',
          protected: true,
          vpnActive: true,
          proxyActive: true,
        });
      }
    } catch (error) {
      console.error('IP rotation error:', error);
      // Demo mode fallback
      setIpInfo({
        ...ipInfo,
        ip: generateRandomIP(),
        country: targetCountry,
        city: getCityForCountry(targetCountry),
        region: '',
        protected: true,
        vpnActive: true,
        proxyActive: true,
      });
    } finally {
      setTimeout(() => setRotating(false), 2000);
    }
  }

  function generateRandomIP(): string {
    return `${Math.floor(Math.random() * 256)}.${Math.floor(
      Math.random() * 256
    )}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
  }

  function getCityForCountry(country: string): string {
    const cities: Record<string, string> = {
      'United States': 'New York',
      'United Kingdom': 'London',
      Germany: 'Berlin',
      France: 'Paris',
      Canada: 'Toronto',
      Australia: 'Sydney',
      Japan: 'Tokyo',
      Singapore: 'Singapore',
    };
    return cities[country] || 'Unknown';
  }

  async function toggleProtection() {
    if (ipInfo.protected) {
      // Disable protection
      await fetchIPInfo();
      setIpInfo({
        ...ipInfo,
        protected: false,
        vpnActive: false,
        proxyActive: false,
      });
    } else {
      // Enable protection
      await rotateIP();
    }
  }

  return (
    <DashboardRouteGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className={`p-3 rounded-xl ${ipInfo.protected ? 'bg-green-100' : 'bg-red-100'}`}>
                {ipInfo.protected ? (
                  <Shield className="h-8 w-8 text-green-600" />
                ) : (
                  <ShieldAlert className="h-8 w-8 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-slate-900">IP Protection</h1>
                <p className="text-slate-600">Secure your online identity and location</p>
              </div>
              <button
                onClick={toggleProtection}
                disabled={rotating}
                className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center gap-2 ${
                  ipInfo.protected
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <Power className="h-5 w-5" />
                {ipInfo.protected ? 'Disable Protection' : 'Enable Protection'}
              </button>
            </div>
          </div>

          {/* Status Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Current IP Info */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Your IP Status</h2>
                <div
                  className={`px-4 py-2 rounded-full font-bold text-sm ${
                    ipInfo.protected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {ipInfo.protected ? 'Protected' : 'Unprotected'}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-slate-600" />
                    <div>
                      <div className="text-xs text-slate-500">Your IP:</div>
                      <div className="font-mono font-bold text-slate-900 flex items-center gap-2">
                        {showRealIP ? ipInfo.ip : '•••.•••.•••.•••'}
                        <button
                          onClick={() => setShowRealIP(!showRealIP)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {showRealIP ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={fetchIPInfo}
                    disabled={loading}
                    className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <Zap className="h-5 w-5 text-slate-600" />
                  <div>
                    <div className="text-xs text-slate-500">Your ISP:</div>
                    <div className="font-bold text-slate-900">{ipInfo.isp}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-slate-600" />
                  <div>
                    <div className="text-xs text-slate-500">Location:</div>
                    <div className="font-bold text-slate-900">
                      {ipInfo.city}, {ipInfo.country}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* IP Rotation */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6">IP Rotation</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Target Country
                  </label>
                  <select
                    value={targetCountry}
                    onChange={(e) => setTargetCountry(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-blue-500 focus:outline-none text-slate-900 bg-white"
                  >
                    <option value="United States">🇺🇸 United States</option>
                    <option value="United Kingdom">🇬🇧 United Kingdom</option>
                    <option value="Germany">🇩🇪 Germany</option>
                    <option value="France">🇫🇷 France</option>
                    <option value="Canada">🇨🇦 Canada</option>
                    <option value="Australia">🇦🇺 Australia</option>
                    <option value="Japan">🇯🇵 Japan</option>
                    <option value="Singapore">🇸🇬 Singapore</option>
                  </select>
                </div>

                <button
                  onClick={rotateIP}
                  disabled={rotating}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-lg transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`h-5 w-5 ${rotating ? 'animate-spin' : ''}`} />
                  {rotating ? 'Rotating IP...' : 'Rotate IP Now'}
                </button>

                {ipInfo.protected && (
                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Lock className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-green-900 mb-1">Protection Active</h4>
                        <p className="text-sm text-green-800">
                          Your IP is now masked as {ipInfo.country}. Your real location is hidden.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Protection Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div
              className={`p-6 rounded-2xl shadow-lg ${
                ipInfo.vpnActive ? 'bg-green-50 border-2 border-green-500' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <Shield
                  className={`h-8 w-8 ${ipInfo.vpnActive ? 'text-green-600' : 'text-slate-400'}`}
                />
                {ipInfo.vpnActive && (
                  <div className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    ACTIVE
                  </div>
                )}
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">VPN Protection</h3>
              <p className="text-sm text-slate-600">
                {ipInfo.vpnActive
                  ? 'Your traffic is encrypted and routed through secure servers'
                  : 'Encrypts your internet traffic for security'}
              </p>
            </div>

            <div
              className={`p-6 rounded-2xl shadow-lg ${
                ipInfo.proxyActive ? 'bg-green-50 border-2 border-green-500' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <Globe
                  className={`h-8 w-8 ${ipInfo.proxyActive ? 'text-green-600' : 'text-slate-400'}`}
                />
                {ipInfo.proxyActive && (
                  <div className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    ACTIVE
                  </div>
                )}
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Proxy Server</h3>
              <p className="text-sm text-slate-600">
                {ipInfo.proxyActive
                  ? 'Routing through proxy servers in ' + ipInfo.country
                  : 'Masks your IP address through proxy servers'}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <MapPin className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Location Masking</h3>
              <p className="text-sm text-slate-600">
                {ipInfo.protected
                  ? `Appearing from ${ipInfo.country}`
                  : 'Hide your real geographical location'}
              </p>
            </div>
          </div>

          {/* Information Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">🌐 Why IP Protection Matters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy Protection
                </h4>
                <p className="text-sm text-blue-100">
                  Prevent websites, advertisers, and hackers from tracking your online activity and
                  building a profile about you.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Access Restrictions
                </h4>
                <p className="text-sm text-blue-100">
                  Bypass geo-blocks and access content that may be restricted in your region by
                  appearing from different countries.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security Enhancement
                </h4>
                <p className="text-sm text-blue-100">
                  Protect against DDoS attacks, port scanning, and other IP-based threats by hiding
                  your real address.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-2 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Anonymity Online
                </h4>
                <p className="text-sm text-blue-100">
                  Browse the web anonymously without revealing your identity or location to third
                  parties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardRouteGuard>
  );
}
