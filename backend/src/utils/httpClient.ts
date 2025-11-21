import axios, { AxiosInstance, AxiosResponse } from "axios";
import { logger } from "../logger";

interface HttpClientConfig {
  baseURL: string;
  token?: string;
  timeout?: number;
  maxRetries?: number;
  maxBackoff?: number;
}

class SaaSHttpClient {
  private client: AxiosInstance;
  private maxRetries: number;
  private maxBackoff: number;

  constructor(config: HttpClientConfig) {
    const {
      baseURL,
      token,
      timeout = 10000,
      maxRetries = 3,
      maxBackoff = 16000,
    } = config;

    this.maxRetries = maxRetries;
    this.maxBackoff = maxBackoff;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    this.client = axios.create({
      baseURL,
      timeout,
      headers,
    });

    // Response interceptor for centralized error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        logger.error("HTTP Error:", {
          status: error.response?.status,
          message: error.message,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  private async request<T = any>(
    method: "GET" | "POST" | "PUT" | "DELETE",
    endpoint: string,
    data: any = {},
    params: any = {}
  ): Promise<T> {
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      try {
        const response = await this.client.request({
          method,
          url: endpoint,
          data,
          params,
        });
        return response.data;
      } catch (error: any) {
        attempt++;
        if (attempt > this.maxRetries) {
          logger.error(
            `Max retries reached for ${method} ${endpoint}: ${error.message}`
          );
          throw error;
        }

        const sleepTime = Math.min(
          Math.pow(2, attempt) * 1000,
          this.maxBackoff
        );
        logger.warn(
          `Request failed (${error.message}), retrying in ${
            sleepTime / 1000
          }s... [Attempt ${attempt}]`
        );
        await new Promise((resolve) => setTimeout(resolve, sleepTime));
      }
    }

    throw new Error("Unexpected error in request loop");
  }

  async get<T = any>(endpoint: string, params: any = {}): Promise<T> {
    return this.request<T>("GET", endpoint, {}, params);
  }

  async post<T = any>(endpoint: string, data: any = {}): Promise<T> {
    return this.request<T>("POST", endpoint, data);
  }

  async put<T = any>(endpoint: string, data: any = {}): Promise<T> {
    return this.request<T>("PUT", endpoint, data);
  }

  async delete<T = any>(endpoint: string, data: any = {}): Promise<T> {
    return this.request<T>("DELETE", endpoint, data);
  }
}

export default SaaSHttpClient;
