/**
 * Global Proxy Agent Configuration
 *
 * Sets global HTTP/HTTPS agents for Node.js fetch and other HTTP clients
 * to automatically route all outbound requests through configured proxy
 */

import http from 'http';
import https from 'https';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import { config } from '../config';
import logger from '../logger';

export function setupGlobalProxy(): void {
  if (!config.proxy.enabled) {
    logger.info('🌐 Proxy disabled - direct connections will be used');
    return;
  }

  try {
    const proxyConfig = config.proxy as {
      enabled: true;
      type: 'http' | 'https' | 'socks4' | 'socks5';
      host: string;
      port: number;
      auth?: { username: string; password: string };
      bypass?: string[];
    };
    const { type, host, port, auth, bypass } = proxyConfig;

    // Build proxy URL
    const authStr = auth
      ? `${encodeURIComponent(auth.username)}:${encodeURIComponent(
          auth.password,
        )}@`
      : '';
    const proxyUrl = `${type}://${authStr}${host}:${port}`;

    // Create appropriate agent based on proxy type
    let proxyAgent: http.Agent | https.Agent;

    if (type.startsWith('socks')) {
      proxyAgent = new SocksProxyAgent(proxyUrl);
      logger.info(`🧦 SOCKS proxy configured: ${type}://${host}:${port}`);
    } else {
      proxyAgent = new HttpsProxyAgent(proxyUrl);
      logger.info(`🌐 HTTP(S) proxy configured: ${type}://${host}:${port}`);
    }

    // Set global agents for http and https modules
    (http as any).globalAgent = proxyAgent;
    (https as any).globalAgent = proxyAgent;

    // Set agent for Node.js native fetch (Node 18+)
    if (typeof globalThis.fetch !== 'undefined') {
      const originalFetch = globalThis.fetch;
      (globalThis as any).fetch = (url: string | URL, init?: RequestInit) => {
        // Check if URL should bypass proxy
        const urlStr = typeof url === 'string' ? url : url.toString();
        const shouldBypass = bypass?.some((pattern: string) => {
          try {
            const urlObj = new URL(urlStr);
            return (
              urlObj.hostname.includes(pattern) ||
              pattern.includes(urlObj.hostname)
            );
          } catch {
            return false;
          }
        });

        if (shouldBypass) {
          logger.debug(`Bypassing proxy for: ${urlStr}`);
          return originalFetch(url, init);
        }

        // Use proxy agent
        const options = {
          ...init,
          agent: proxyAgent,
        };
        return originalFetch(url, options);
      };
      logger.info('✅ Global fetch configured to use proxy');
    }

    if (bypass && bypass.length > 0) {
      logger.info(`   Bypassing proxy for: ${bypass.join(', ')}`);
    }

    logger.info('✅ Global proxy agents configured successfully');
  } catch (error) {
    logger.error('❌ Failed to setup global proxy:', error);
    throw error;
  }
}

/**
 * Get configured proxy agent for use in specific HTTP clients
 * Returns undefined if proxy is disabled
 */
export function getProxyAgent(): http.Agent | https.Agent | undefined {
  if (!config.proxy.enabled) {
    return undefined;
  }

  const proxyConfig = config.proxy as {
    enabled: true;
    type: 'http' | 'https' | 'socks4' | 'socks5';
    host: string;
    port: number;
    auth?: { username: string; password: string };
  };
  const { type, host, port, auth } = proxyConfig;
  const authStr = auth
    ? `${encodeURIComponent(auth.username)}:${encodeURIComponent(
        auth.password,
      )}@`
    : '';
  const proxyUrl = `${type}://${authStr}${host}:${port}`;

  if (type.startsWith('socks')) {
    return new SocksProxyAgent(proxyUrl);
  } else {
    return new HttpsProxyAgent(proxyUrl);
  }
}

/**
 * Check if a URL should bypass the proxy
 */
export function shouldBypassProxy(url: string): boolean {
  if (!config.proxy.enabled) {
    return false;
  }

  const proxyConfig = config.proxy as {
    enabled: true;
    bypass?: string[];
  };

  if (!proxyConfig.bypass) {
    return false;
  }

  try {
    const urlObj = new URL(url);
    return proxyConfig.bypass.some((pattern: string) => {
      return (
        urlObj.hostname.includes(pattern) || pattern.includes(urlObj.hostname)
      );
    });
  } catch {
    return false;
  }
}
