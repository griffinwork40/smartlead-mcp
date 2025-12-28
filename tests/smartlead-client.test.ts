/**
 * SmartleadClient Tests
 * 
 * Tests for the API client including:
 * - HTTP method handling (GET, POST, DELETE)
 * - API key validation
 * - Request/response handling
 * 
 * Note: Error handling for HTTP status codes (401, 404, 429) is tested through
 * tool integration tests which verify error propagation through the full flow.
 */

// @ts-nocheck - Jest ESM mocking has known TypeScript type issues
import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';

// Create manual mock functions with any types to avoid TS issues
const mockGet = jest.fn();
const mockPost = jest.fn();
const mockDelete = jest.fn();

const mockAxiosCreate = jest.fn().mockReturnValue({
  get: mockGet,
  post: mockPost,
  delete: mockDelete,
});

const mockIsAxiosError = jest.fn((error) => {
  return error?.isAxiosError === true;
});

// Mock the entire axios module before importing SmartleadClient
jest.unstable_mockModule('axios', () => ({
  default: {
    create: mockAxiosCreate,
    isAxiosError: mockIsAxiosError,
  },
  isAxiosError: mockIsAxiosError,
}));

// Dynamic import after mocking
const { SmartleadClient } = await import('../src/smartlead-client.js');

describe('SmartleadClient', () => {
  const validConfig = { apiKey: 'test-api-key-123' };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock implementation to return fresh instances
    mockAxiosCreate.mockReturnValue({
      get: mockGet,
      post: mockPost,
      delete: mockDelete,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Constructor', () => {
    it('should create client with valid API key', () => {
      const client = new SmartleadClient(validConfig);
      
      expect(mockAxiosCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://server.smartlead.ai/api/v1',
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
      expect(client).toBeDefined();
    });

    it('should throw error when API key is missing', () => {
      expect(() => new SmartleadClient({ apiKey: '' })).toThrow(
        'Smartlead API key is required'
      );
    });

    it('should throw error when API key is undefined', () => {
      expect(() => new SmartleadClient({ apiKey: undefined })).toThrow(
        'Smartlead API key is required'
      );
    });
  });

  describe('GET requests', () => {
    it('should make GET request with API key', async () => {
      const client = new SmartleadClient(validConfig);
      const mockResponse = { data: { id: 1, name: 'Test' } };
      mockGet.mockResolvedValueOnce(mockResponse);

      const result = await client.get('/campaigns');

      expect(mockGet).toHaveBeenCalledWith('/campaigns', {
        params: { api_key: 'test-api-key-123' },
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should include additional params in GET request', async () => {
      const client = new SmartleadClient(validConfig);
      mockGet.mockResolvedValueOnce({ data: [] });

      await client.get('/campaigns', { offset: 10, limit: 50 });

      expect(mockGet).toHaveBeenCalledWith('/campaigns', {
        params: { api_key: 'test-api-key-123', offset: 10, limit: 50 },
      });
    });
  });

  describe('POST requests', () => {
    it('should make POST request with API key and data', async () => {
      const client = new SmartleadClient(validConfig);
      const requestData = { name: 'New Campaign' };
      const mockResponse = { data: { id: 1, name: 'New Campaign' } };
      mockPost.mockResolvedValueOnce(mockResponse);

      const result = await client.post('/campaigns/create', requestData);

      expect(mockPost).toHaveBeenCalledWith(
        '/campaigns/create',
        requestData,
        { params: { api_key: 'test-api-key-123' } }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should make POST request without body', async () => {
      const client = new SmartleadClient(validConfig);
      mockPost.mockResolvedValueOnce({ data: { ok: true } });

      await client.post('/some-endpoint');

      expect(mockPost).toHaveBeenCalledWith(
        '/some-endpoint',
        undefined,
        { params: { api_key: 'test-api-key-123' } }
      );
    });

    it('should include additional params in POST request', async () => {
      const client = new SmartleadClient(validConfig);
      mockPost.mockResolvedValueOnce({ data: { ok: true } });

      await client.post('/endpoint', { data: 'test' }, { extra: 'param' });

      expect(mockPost).toHaveBeenCalledWith(
        '/endpoint',
        { data: 'test' },
        { params: { api_key: 'test-api-key-123', extra: 'param' } }
      );
    });
  });

  describe('DELETE requests', () => {
    it('should make DELETE request with API key', async () => {
      const client = new SmartleadClient(validConfig);
      mockDelete.mockResolvedValueOnce({ data: { ok: true } });

      const result = await client.delete('/campaigns/123');

      expect(mockDelete).toHaveBeenCalledWith('/campaigns/123', {
        data: undefined,
        params: { api_key: 'test-api-key-123' },
      });
      expect(result).toEqual({ ok: true });
    });

    it('should make DELETE request with body data', async () => {
      const client = new SmartleadClient(validConfig);
      const deleteData = { email_account_ids: [1, 2, 3] };
      mockDelete.mockResolvedValueOnce({ data: { ok: true } });

      await client.delete('/campaigns/123/email-accounts', deleteData);

      expect(mockDelete).toHaveBeenCalledWith(
        '/campaigns/123/email-accounts',
        {
          data: deleteData,
          params: { api_key: 'test-api-key-123' },
        }
      );
    });

    it('should include additional params in DELETE request', async () => {
      const client = new SmartleadClient(validConfig);
      mockDelete.mockResolvedValueOnce({ data: { ok: true } });

      await client.delete('/endpoint', { body: 'data' }, { extra: 'param' });

      expect(mockDelete).toHaveBeenCalledWith(
        '/endpoint',
        {
          data: { body: 'data' },
          params: { api_key: 'test-api-key-123', extra: 'param' },
        }
      );
    });
  });

  describe('Error Propagation', () => {
    it('should propagate errors from GET requests', async () => {
      const client = new SmartleadClient(validConfig);
      const error = new Error('Network error');
      mockGet.mockRejectedValueOnce(error);

      await expect(client.get('/campaigns')).rejects.toThrow('Network error');
    });

    it('should propagate errors from POST requests', async () => {
      const client = new SmartleadClient(validConfig);
      const error = new Error('Server error');
      mockPost.mockRejectedValueOnce(error);

      await expect(client.post('/campaigns/create', {})).rejects.toThrow('Server error');
    });

    it('should propagate errors from DELETE requests', async () => {
      const client = new SmartleadClient(validConfig);
      const error = new Error('Delete failed');
      mockDelete.mockRejectedValueOnce(error);

      await expect(client.delete('/campaigns/123')).rejects.toThrow('Delete failed');
    });

    it('should handle non-Error rejections', async () => {
      const client = new SmartleadClient(validConfig);
      mockGet.mockRejectedValueOnce('string error');

      await expect(client.get('/campaigns')).rejects.toThrow('Unknown error occurred');
    });
  });
});
