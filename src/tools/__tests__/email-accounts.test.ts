/**
 * Email Account Tools Tests
 *
 * Unit tests for email account management tool handlers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmartleadClient } from '../../smartlead-client.js';
import * as emailAccountTools from '../email-accounts.js';

// Mock SmartleadClient
vi.mock('../../smartlead-client.js', () => ({
  SmartleadClient: vi.fn(),
}));

describe('Email Account Tools', () => {
  let mockClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('listEmailAccounts', () => {
    it('should list email accounts with default pagination', async () => {
      const mockAccounts = [
        { id: 1, from_email: 'test1@example.com', from_name: 'Test User 1' },
        { id: 2, from_email: 'test2@example.com', from_name: 'Test User 2' },
      ];
      mockClient.get.mockResolvedValue(mockAccounts);

      const result = await emailAccountTools.listEmailAccounts(
        mockClient as unknown as SmartleadClient,
        {}
      );

      expect(mockClient.get).toHaveBeenCalledWith('/email-accounts', {
        offset: 0,
        limit: 100,
      });
      expect(result.content[0].text).toContain('Found 2 email accounts');
    });

    it('should list email accounts with custom pagination', async () => {
      mockClient.get.mockResolvedValue([]);

      await emailAccountTools.listEmailAccounts(mockClient as unknown as SmartleadClient, {
        offset: 10,
        limit: 50,
      });

      expect(mockClient.get).toHaveBeenCalledWith('/email-accounts', {
        offset: 10,
        limit: 50,
      });
    });
  });

  describe('getEmailAccount', () => {
    it('should get email account by ID', async () => {
      const mockAccount = {
        id: 123,
        from_email: 'test@example.com',
        from_name: 'Test User',
        smtp_host: 'smtp.example.com',
      };
      mockClient.get.mockResolvedValue(mockAccount);

      const result = await emailAccountTools.getEmailAccount(
        mockClient as unknown as SmartleadClient,
        { account_id: 123 }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/email-accounts/123/');
      expect(result.content[0].text).toContain('Email account details');
      expect(result.content[0].text).toContain('test@example.com');
    });

    it('should throw error for missing account_id', async () => {
      await expect(
        emailAccountTools.getEmailAccount(mockClient as unknown as SmartleadClient, {})
      ).rejects.toThrow();
    });
  });

  describe('updateWarmupSettings', () => {
    it('should update warmup settings', async () => {
      mockClient.post.mockResolvedValue({ ok: true });

      const result = await emailAccountTools.updateWarmupSettings(
        mockClient as unknown as SmartleadClient,
        { email_account_id: 123, warmup_enabled: true, total_warmup_per_day: 20 }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/email-accounts/123/warmup', {
        warmup_enabled: true,
        total_warmup_per_day: 20,
      });
      expect(result.content[0].text).toContain('Warmup settings updated successfully');
    });

    it('should disable warmup', async () => {
      mockClient.post.mockResolvedValue({ ok: true });

      const result = await emailAccountTools.updateWarmupSettings(
        mockClient as unknown as SmartleadClient,
        { email_account_id: 123, warmup_enabled: false }
      );

      expect(result.content[0].text).toContain('Warmup enabled: false');
    });

    it('should throw error for missing required fields', async () => {
      await expect(
        emailAccountTools.updateWarmupSettings(mockClient as unknown as SmartleadClient, {
          email_account_id: 123,
        })
      ).rejects.toThrow();
    });
  });

  describe('getWarmupStats', () => {
    it('should get warmup stats', async () => {
      const mockStats = {
        sent: 100,
        received: 80,
        landed_inbox: 75,
      };
      mockClient.get.mockResolvedValue(mockStats);

      const result = await emailAccountTools.getWarmupStats(
        mockClient as unknown as SmartleadClient,
        { account_id: 123 }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/email-accounts/123/warmup-stats');
      expect(result.content[0].text).toContain('Warmup stats');
      expect(result.content[0].text).toContain('last 7 days');
    });
  });

  describe('reconnectFailedAccounts', () => {
    it('should initiate reconnection', async () => {
      mockClient.post.mockResolvedValue({ success: true, reconnected: 5 });

      const result = await emailAccountTools.reconnectFailedAccounts(
        mockClient as unknown as SmartleadClient
      );

      expect(mockClient.post).toHaveBeenCalledWith(
        '/email-accounts/reconnect-failed-email-accounts',
        {}
      );
      expect(result.content[0].text).toContain('Reconnection process initiated');
    });
  });

  describe('createEmailAccount', () => {
    it('should create email account with required fields', async () => {
      const mockCreatedAccount = {
        id: 999,
        from_email: 'new@example.com',
        from_name: 'New Account',
      };
      mockClient.post.mockResolvedValue(mockCreatedAccount);

      const accountData = {
        from_name: 'New Account',
        from_email: 'new@example.com',
        username: 'new@example.com',
        password: 'secret123',
        smtp_host: 'smtp.example.com',
        smtp_port: 587,
        imap_host: 'imap.example.com',
        imap_port: 993,
        message_per_day: 50,
        type: 'SMTP' as const,
      };

      const result = await emailAccountTools.createEmailAccount(
        mockClient as unknown as SmartleadClient,
        accountData
      );

      expect(mockClient.post).toHaveBeenCalledWith('/email-accounts/save', {
        ...accountData,
        id: null,
      });
      expect(result.content[0].text).toContain('Email account created successfully');
    });

    it('should throw error for missing required fields', async () => {
      await expect(
        emailAccountTools.createEmailAccount(mockClient as unknown as SmartleadClient, {
          from_name: 'Test',
        })
      ).rejects.toThrow();
    });

    it('should throw error for invalid email', async () => {
      await expect(
        emailAccountTools.createEmailAccount(mockClient as unknown as SmartleadClient, {
          from_name: 'Test',
          from_email: 'not-an-email',
          username: 'test',
          password: 'pass',
          smtp_host: 'smtp.test.com',
          smtp_port: 587,
          imap_host: 'imap.test.com',
          imap_port: 993,
          message_per_day: 50,
          type: 'SMTP',
        })
      ).rejects.toThrow();
    });
  });

  describe('updateEmailAccount', () => {
    it('should update email account', async () => {
      const mockUpdatedAccount = {
        id: 123,
        from_email: 'updated@example.com',
        from_name: 'Updated Name',
      };
      mockClient.post.mockResolvedValue(mockUpdatedAccount);

      const result = await emailAccountTools.updateEmailAccount(
        mockClient as unknown as SmartleadClient,
        { email_account_id: 123, from_name: 'Updated Name' }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/email-accounts/123', {
        from_name: 'Updated Name',
      });
      expect(result.content[0].text).toContain('updated successfully');
    });

    it('should throw error for missing email_account_id', async () => {
      await expect(
        emailAccountTools.updateEmailAccount(mockClient as unknown as SmartleadClient, {
          from_name: 'Test',
        })
      ).rejects.toThrow();
    });
  });
});
