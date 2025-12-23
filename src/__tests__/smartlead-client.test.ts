/**
 * SmartleadClient Unit Tests
 *
 * Tests for the SmartLead API client including HTTP methods,
 * error handling, and authentication.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios, { AxiosError, AxiosHeaders } from 'axios';
import { SmartleadClient, SmartleadConfig } from '../smartlead-client.js';

// Mock axios
vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios');
  return {
    ...actual,
    default: {
      create: vi.fn(() => ({
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
      })),
      isAxiosError: vi.fn((error: unknown) => {
        // Check if error has isAxiosError property set to true
        return error !== null && typeof error === 'object' && 'isAxiosError' in error && (error as { isAxiosError: boolean }).isAxiosError === true;
      }),
    },
  };
});

describe('SmartleadClient', () => {
  let mockAxiosInstance: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAxiosInstance = {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    };
    (axios.create as ReturnType<typeof vi.fn>).mockReturnValue(mockAxiosInstance);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('constructor', () => {
    it('should create client with valid API key', () => {
      const client = new SmartleadClient({ apiKey: 'test-api-key' });
      expect(client).toBeInstanceOf(SmartleadClient);
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'https://server.smartlead.ai/api/v1',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should throw error when API key is missing', () => {
      expect(() => new SmartleadClient({ apiKey: '' })).toThrow(
        'Smartlead API key is required. Set SMARTLEAD_API_KEY environment variable.'
      );
    });

    it('should throw error when API key is undefined', () => {
      expect(() => new SmartleadClient({ apiKey: undefined as unknown as string })).toThrow(
        'Smartlead API key is required. Set SMARTLEAD_API_KEY environment variable.'
      );
    });
  });

  describe('get', () => {
    it('should make GET request with API key', async () => {
      const client = new SmartleadClient({ apiKey: 'test-key' });
      mockAxiosInstance.get.mockResolvedValue({ data: { id: 1, name: 'Test Campaign' } });

      const result = await client.get('/campaigns/1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/campaigns/1', {
        params: { api_key: 'test-key' },
      });
      expect(result).toEqual({ id: 1, name: 'Test Campaign' });
    });

    it('should include additional query params', async () => {
      const client = new SmartleadClient({ apiKey: 'test-key' });
      mockAxiosInstance.get.mockResolvedValue({ data: [] });

      await client.get('/campaigns', { offset: 0, limit: 10 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/campaigns', {
        params: { api_key: 'test-key', offset: 0, limit: 10 },
      });
    });

    it('should handle successful response', async () => {
      const client = new SmartleadClient({ apiKey: 'test-key' });
      const mockData = [{ id: 1 }, { id: 2 }];
      mockAxiosInstance.get.mockResolvedValue({ data: mockData });

      const result = await client.get('/campaigns');

      expect(result).toEqual(mockData);
    });
  });

  describe('post', () => {
    it('should make POST request with data', async () => {
      const client = new SmartleadClient({ apiKey: 'test-key' });
      const postData = { name: 'New Campaign' };
      mockAxiosInstance.post.mockResolvedValue({ data: { id: 123, ok: true } });

      const result = await client.post('/campaigns/create', postData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/campaigns/create', postData, {
        params: { api_key: 'test-key' },
      });
      expect(result).toEqual({ id: 123, ok: true });
    });

    it('should make POST request with additional params', async () => {
      const client = new SmartleadClient({ apiKey: 'test-key' });
      mockAxiosInstance.post.mockResolvedValue({ data: { ok: true } });

      await client.post('/endpoint', { foo: 'bar' }, { extra: 'param' });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/endpoint', { foo: 'bar' }, {
        params: { api_key: 'test-key', extra: 'param' },
      });
    });

    it('should handle POST without data', async () => {
      const client = new SmartleadClient({ apiKey: 'test-key' });
      mockAxiosInstance.post.mockResolvedValue({ data: { ok: true } });

      await client.post('/endpoint');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/endpoint', undefined, {
        params: { api_key: 'test-key' },
      });
    });
  });

  describe('delete', () => {
    it('should make DELETE request', async () => {
      const client = new SmartleadClient({ apiKey: 'test-key' });
      mockAxiosInstance.delete.mockResolvedValue({ data: { ok: true } });

      const result = await client.delete('/campaigns/123');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/campaigns/123', {
        data: undefined,
        params: { api_key: 'test-key' },
      });
      expect(result).toEqual({ ok: true });
    });

    it('should make DELETE request with data', async () => {
      const client = new SmartleadClient({ apiKey: 'test-key' });
      const deleteData = { email_account_ids: [1, 2, 3] };
      mockAxiosInstance.delete.mockResolvedValue({ data: { ok: true } });

      await client.delete('/campaigns/1/email-accounts', deleteData);

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/campaigns/1/email-accounts', {
        data: deleteData,
        params: { api_key: 'test-key' },
      });
    });

    it('should make DELETE request with additional params', async () => {
      const client = new SmartleadClient({ apiKey: 'test-key' });
      mockAxiosInstance.delete.mockResolvedValue({ data: { ok: true } });

      await client.delete('/endpoint', { data: 'test' }, { extra: 'param' });

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/endpoint', {
        data: { data: 'test' },
        params: { api_key: 'test-key', extra: 'param' },
      });
    });
  });

  describe('error handling', () => {
    it('should handle 401 unauthorized error', async () => {
      const client = new SmartleadClient({ apiKey: 'test-key' });
      const axiosError = new Error('Unauthorized') as AxiosError;
      axiosError.isAxiosError = true;
      axiosError.response = {
        status: 401,
        data: { error: 'Invalid API key' },
        statusText: 'Unauthorized',
        headers: {},
        config: { headers: new AxiosHeaders() },
      };

      // Use a method that will call handleError
      mockAxiosInstance.get.mockRejectedValue(axiosError);

      await expect(client.get('/campaigns')).rejects.toThrow(
        'Smartlead API error (401): Invalid API key - Check your API key is valid'
      );
    });

    it('should handle 403 forbidden error', async () => {
      const client = new SmartleadClient({ apiKey: 'test-key' });
      const axiosError = new Error('Forbidden') as AxiosError;
      axiosError.isAxiosError = true;
      axiosError.response = {
        status: 403,
        data: { error: 'Access denied' },
        statusText: 'Forbidden',
        headers: {},
        config: { headers: new AxiosHeaders() },
      };
      axiosError.message = 'Forbidden';

      mockAxiosInstance.get.mockRejectedValue(axiosError);

      await expect(client.get('/campaigns')).rejects.toThrow(
        'Smartlead API error (403): Access denied - Check your API key is valid'
      );
    });

    it('should handle 404 not found error', async () => {
      const client = new SmartleadClient({ apiKey: 'test-key' });
      const axiosError = new Error('Not Found') as AxiosError;
      axiosError.isAxiosError = true;
      axiosError.response = {
        status: 404,
        data: { error: 'Campaign not found' },
        statusText: 'Not Found',
        headers: {},
        config: { headers: new AxiosHeaders() },
      };

      mockAxiosInstance.get.mockRejectedValue(axiosError);

      await expect(client.get('/campaigns/999')).rejects.toThrow(
        'Smartlead API error (404): Campaign not found - Resource not found'
      );
    });

    it('should handle 429 rate limit error', async () => {
      const client = new SmartleadClient({ apiKey: 'test-key' });
      const axiosError = new Error('Too Many Requests') as AxiosError;
      axiosError.isAxiosError = true;
      axiosError.response = {
        status: 429,
        data: { error: 'Rate limit exceeded' },
        statusText: 'Too Many Requests',
        headers: {},
        config: { headers: new AxiosHeaders() },
      };

      mockAxiosInstance.get.mockRejectedValue(axiosError);

      await expect(client.get('/campaigns')).rejects.toThrow(
        'Smartlead API error (429): Rate limit exceeded - Rate limit exceeded, please try again later'
      );
    });

    it('should handle generic API error with message', async () => {
      const client = new SmartleadClient({ apiKey: 'test-key' });
      const axiosError = new Error('Server Error') as AxiosError;
      axiosError.isAxiosError = true;
      axiosError.response = {
        status: 500,
        data: { error: 'Internal server error' },
        statusText: 'Internal Server Error',
        headers: {},
        config: { headers: new AxiosHeaders() },
      };

      mockAxiosInstance.post.mockRejectedValue(axiosError);

      await expect(client.post('/campaigns/create', {})).rejects.toThrow(
        'Smartlead API error (500): Internal server error'
      );
    });

    it('should handle API error without error field in response', async () => {
      const client = new SmartleadClient({ apiKey: 'test-key' });
      const axiosError = new Error('Bad Gateway') as AxiosError;
      axiosError.isAxiosError = true;
      axiosError.response = {
        status: 502,
        data: 'Some non-standard error response',
        statusText: 'Bad Gateway',
        headers: {},
        config: { headers: new AxiosHeaders() },
      };
      axiosError.message = 'Network Error';

      mockAxiosInstance.get.mockRejectedValue(axiosError);

      await expect(client.get('/campaigns')).rejects.toThrow(
        'Smartlead API error (502): Network Error'
      );
    });

    it('should handle network error (no response)', async () => {
      const client = new SmartleadClient({ apiKey: 'test-key' });
      const axiosError = new Error('Network Error') as AxiosError;
      axiosError.isAxiosError = true;
      axiosError.request = {};
      axiosError.response = undefined;

      mockAxiosInstance.get.mockRejectedValue(axiosError);

      await expect(client.get('/campaigns')).rejects.toThrow(
        'No response received from Smartlead API. Check your network connection.'
      );
    });

    it('should handle non-Axios errors', async () => {
      const client = new SmartleadClient({ apiKey: 'test-key' });
      const regularError = new Error('Some random error');

      mockAxiosInstance.get.mockRejectedValue(regularError);

      await expect(client.get('/campaigns')).rejects.toThrow('Some random error');
    });

    it('should handle unknown error types', async () => {
      const client = new SmartleadClient({ apiKey: 'test-key' });

      mockAxiosInstance.get.mockRejectedValue('string error');

      await expect(client.get('/campaigns')).rejects.toThrow('Unknown error occurred');
    });

    it('should handle delete errors', async () => {
      const client = new SmartleadClient({ apiKey: 'test-key' });
      const axiosError = new Error('Not Found') as AxiosError;
      axiosError.isAxiosError = true;
      axiosError.response = {
        status: 404,
        data: { error: 'Resource not found' },
        statusText: 'Not Found',
        headers: {},
        config: { headers: new AxiosHeaders() },
      };

      mockAxiosInstance.delete.mockRejectedValue(axiosError);

      await expect(client.delete('/campaigns/999')).rejects.toThrow(
        'Smartlead API error (404): Resource not found - Resource not found'
      );
    });
  });
});
