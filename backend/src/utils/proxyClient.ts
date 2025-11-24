import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import http from 'http';
import https from 'https';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';
import logger from '../logger';

export interface ProxyConfig {
  enabled: boolean;
  type: 'http' | 'https' | 'socks4' | 'socks5';
  host: string;
  port: number;
  auth?: {
    username: string;
    password: string;
  };
  bypass?: string[]; // Domains to bypass proxy
}

export class ProxyClient {
  private axiosInstance: AxiosInstance;
  private proxyConfig: ProxyConfig;

  constructor(proxyConfig: ProxyConfig) {
    this.proxyConfig = proxyConfig;

    if (!proxyConfig.enabled) {
      // No proxy - use standard axios
      this.axiosInstance = axios.create({
        timeout: 30000,
      });
      logger.info('ProxyClient initialized without proxy');
      return;
    }

    const proxyUrl = this.buildProxyUrl(proxyConfig);
    const agent = this.createProxyAgent(proxyConfig, proxyUrl);

    this.axiosInstance = axios.create({
      httpAgent: agent,
      httpsAgent: agent,
      timeout: 30000,
      validateStatus: (status) => status < 500, // Don't throw on 4xx
    });

    logger.info(
      `ProxyClient initialized with ${proxyConfig.type} proxy: ${proxyConfig.host}:${proxyConfig.port}`,
    );
  }

  private buildProxyUrl(config: ProxyConfig): string {
    const auth = config.auth
      ? `${encodeURIComponent(config.auth.username)}:${encodeURIComponent(
          config.auth.password,
        )}@`
      : '';
    return `${config.type}://${auth}${config.host}:${config.port}`;
  }

  private createProxyAgent(
    config: ProxyConfig,
    proxyUrl: string,
  ): http.Agent | https.Agent {
    if (config.type.startsWith('socks')) {
      logger.debug(`Creating SOCKS proxy agent: ${proxyUrl}`);
      return new SocksProxyAgent(proxyUrl);
    } else {
      logger.debug(`Creating HTTP(S) proxy agent: ${proxyUrl}`);
      return new HttpsProxyAgent(proxyUrl);
    }
  }

  private shouldBypassProxy(url: string): boolean {
    if (!this.proxyConfig.bypass || this.proxyConfig.bypass.length === 0) {
      return false;
    }

    try {
      const urlObj = new URL(url);
      return this.proxyConfig.bypass.some((pattern) => {
        if (pattern.includes('*')) {
          // Wildcard matching
          const regex = new RegExp(pattern.replace(/\*/g, '.*'));
          return regex.test(urlObj.hostname);
        }
        return (
          urlObj.hostname === pattern || urlObj.hostname.endsWith(`.${pattern}`)
        );
      });
    } catch (error) {
      logger.warn(`Invalid URL for proxy bypass check: ${url}`);
      return false;
    }
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      logger.debug(
        `GET ${url}${this.proxyConfig.enabled ? ' (via proxy)' : ''}`,
      );
      const response = await this.axiosInstance.get<T>(url, config);
      return response.data;
    } catch (error: any) {
      logger.error(`Proxy GET request failed: ${error.message}`, {
        url,
        error: error.response?.data,
      });
      throw error;
    }
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      logger.debug(
        `POST ${url}${this.proxyConfig.enabled ? ' (via proxy)' : ''}`,
      );
      const response = await this.axiosInstance.post<T>(url, data, config);
      return response.data;
    } catch (error: any) {
      logger.error(`Proxy POST request failed: ${error.message}`, {
        url,
        error: error.response?.data,
      });
      throw error;
    }
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      logger.debug(
        `PUT ${url}${this.proxyConfig.enabled ? ' (via proxy)' : ''}`,
      );
      const response = await this.axiosInstance.put<T>(url, data, config);
      return response.data;
    } catch (error: any) {
      logger.error(`Proxy PUT request failed: ${error.message}`, {
        url,
        error: error.response?.data,
      });
      throw error;
    }
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      logger.debug(
        `DELETE ${url}${this.proxyConfig.enabled ? ' (via proxy)' : ''}`,
      );
      const response = await this.axiosInstance.delete<T>(url, config);
      return response.data;
    } catch (error: any) {
      logger.error(`Proxy DELETE request failed: ${error.message}`, {
        url,
        error: error.response?.data,
      });
      throw error;
    }
  }

  // Get current IP address through proxy
  async getPublicIP(): Promise<string> {
    try {
      const response = await this.get<{ ip: string }>(
        'https://api.ipify.org?format=json',
      );
      return response.ip;
    } catch (error) {
      logger.error('Failed to get public IP through proxy');
      throw error;
    }
  }

  // Get geolocation info through proxy
  async getGeolocation(): Promise<any> {
    try {
      const response = await this.get('https://ipapi.co/json/');
      return response;
    } catch (error) {
      logger.error('Failed to get geolocation through proxy');
      throw error;
    }
  }

  // Test proxy connectivity
  async testConnection(): Promise<boolean> {
    try {
      const ip = await this.getPublicIP();
      logger.info(`Proxy connection test successful. Public IP: ${ip}`);
      return true;
    } catch (error) {
      logger.error('Proxy connection test failed', { error });
      return false;
    }
  }
}

// Factory function to create proxy client from environment variables
export function createProxyClient(): ProxyClient {
  const proxyConfig: ProxyConfig = {
    enabled: process.env.PROXY_ENABLED === 'true',
    type: (process.env.PROXY_TYPE as ProxyConfig['type']) || 'socks5',
    host: process.env.PROXY_HOST || '127.0.0.1',
    port: parseInt(process.env.PROXY_PORT || '1080', 10),
    auth: process.env.PROXY_USERNAME
      ? {
          username: process.env.PROXY_USERNAME,
          password: process.env.PROXY_PASSWORD || '',
        }
      : undefined,
    bypass: process.env.PROXY_BYPASS
      ? process.env.PROXY_BYPASS.split(',').map((s) => s.trim())
      : ['localhost', '127.0.0.1'],
  };

  return new ProxyClient(proxyConfig);
}

// Singleton instance
let proxyClientInstance: ProxyClient | null = null;

export function getProxyClient(): ProxyClient {
  if (!proxyClientInstance) {
    proxyClientInstance = createProxyClient();
  }
  return proxyClientInstance;
}

// Reset singleton (useful for testing)
export function resetProxyClient(): void {
  proxyClientInstance = null;
}

export default ProxyClient;
