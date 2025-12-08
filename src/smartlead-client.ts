/**
 * SmartleadClient - API client wrapper for Smartlead API
 *
 * Handles HTTP requests to the Smartlead API with authentication,
 * error handling, and response validation.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

const BASE_URL = 'https://server.smartlead.ai/api/v1';

export interface SmartleadConfig {
  apiKey: string;
}

export interface SmartleadApiError {
  error: string;
  status?: number;
}

/**
 * SmartleadClient handles all HTTP communication with the Smartlead API.
 * Authentication is handled via API key passed as query parameter.
 */
export class SmartleadClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(config: SmartleadConfig) {
    if (!config.apiKey) {
      throw new Error('Smartlead API key is required. Set SMARTLEAD_API_KEY environment variable.');
    }

    this.apiKey = config.apiKey;
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Make a GET request to the Smartlead API
   */
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<T> {
    try {
      const response = await this.client.get<T>(endpoint, {
        params: {
          api_key: this.apiKey,
          ...params,
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Make a POST request to the Smartlead API
   */
  async post<T>(endpoint: string, data?: unknown, params?: Record<string, unknown>): Promise<T> {
    try {
      const response = await this.client.post<T>(endpoint, data, {
        params: {
          api_key: this.apiKey,
          ...params,
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Make a DELETE request to the Smartlead API
   */
  async delete<T>(endpoint: string, data?: unknown, params?: Record<string, unknown>): Promise<T> {
    try {
      const response = await this.client.delete<T>(endpoint, {
        data,
        params: {
          api_key: this.apiKey,
          ...params,
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors and transform them into user-friendly messages
   */
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<SmartleadApiError>;

      if (axiosError.response) {
        const status = axiosError.response.status;
        const errorData = axiosError.response.data;

        let message = `Smartlead API error (${status})`;

        if (errorData && typeof errorData === 'object' && 'error' in errorData) {
          message += `: ${errorData.error}`;
        } else if (axiosError.message) {
          message += `: ${axiosError.message}`;
        }

        if (status === 401 || status === 403) {
          message += ' - Check your API key is valid';
        } else if (status === 404) {
          message += ' - Resource not found';
        } else if (status === 429) {
          message += ' - Rate limit exceeded, please try again later';
        }

        return new Error(message);
      } else if (axiosError.request) {
        return new Error('No response received from Smartlead API. Check your network connection.');
      }
    }

    return error instanceof Error ? error : new Error('Unknown error occurred');
  }
}
