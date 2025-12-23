/**
 * Email Account Tools Unit Tests
 *
 * Tests for all email account management MCP tools including listing,
 * retrieving, warmup settings, and account creation/updates.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmartleadClient } from '../../smartlead-client.js';
import * as emailAccountTools from '../../tools/email-accounts.js';

// Mock SmartleadClient
vi.mock('../../smartlead-client.js', () => ({
  SmartleadClient: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  })),
}));

describe('Email Account Tools', () => {
  let mockClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    };
  });

  describe('listEmailAccounts', () => {
    it('should list email accounts with default pagination', async () => {
      const mockAccounts = [
        { id: 1, from_email: 'test1@example.com', from_name: 'Test 1' },
        { id: 2, from_email: 'test2@example.com', from_name: 'Test 2' },
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
      expect(result.content[0].text).toContain('test1@example.com');
    });

    it('should list email accounts with custom pagination', async () => {
      mockClient.get.mockResolvedValue([]);

      const result = await emailAccountTools.listEmailAccounts(
        mockClient as unknown as SmartleadClient,
        { offset: 50, limit: 25 }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/email-accounts', {
        offset: 50,
        limit: 25,
      });
    });

    it('should handle empty account list', async () => {
      mockClient.get.mockResolvedValue([]);

      const result = await emailAccountTools.listEmailAccounts(
        mockClient as unknown as SmartleadClient,
        {}
      );

      expect(result.content[0].text).toContain('Found 0 email accounts');
    });

    it('should throw error for invalid limit', async () => {
      await expect(
        emailAccountTools.listEmailAccounts(mockClient as unknown as SmartleadClient, {
          limit: 200, // Max is 100
        })
      ).rejects.toThrow();
    });
  });

  describe('getEmailAccount', () => {
    it('should get email account by ID', async () => {
      const mockAccount = {
        id: 123,
        from_name: 'Test Account',
        from_email: 'test@example.com',
        username: 'test@example.com',
        smtp_host: 'smtp.example.com',
        smtp_port: 587,
        imap_host: 'imap.example.com',
        imap_port: 993,
        message_per_day: 100,
        type: 'SMTP',
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

    it('should throw error for invalid account_id', async () => {
      await expect(
        emailAccountTools.getEmailAccount(mockClient as unknown as SmartleadClient, {
          account_id: -1,
        })
      ).rejects.toThrow();
    });
  });

  describe('updateWarmupSettings', () => {
    it('should enable warmup with all settings', async () => {
      mockClient.post.mockResolvedValue({ ok: true });

      const result = await emailAccountTools.updateWarmupSettings(
        mockClient as unknown as SmartleadClient,
        {
          email_account_id: 123,
          warmup_enabled: true,
          total_warmup_per_day: 50,
          daily_rampup: 5,
          reply_rate_percentage: 30,
          warmup_key_id: 'key123',
        }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/email-accounts/123/warmup', {
        warmup_enabled: true,
        total_warmup_per_day: 50,
        daily_rampup: 5,
        reply_rate_percentage: 30,
        warmup_key_id: 'key123',
      });
      expect(result.content[0].text).toContain('Warmup settings updated successfully');
      expect(result.content[0].text).toContain('Warmup enabled: true');
    });

    it('should disable warmup', async () => {
      mockClient.post.mockResolvedValue({ ok: true });

      const result = await emailAccountTools.updateWarmupSettings(
        mockClient as unknown as SmartleadClient,
        {
          email_account_id: 123,
          warmup_enabled: false,
        }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/email-accounts/123/warmup', {
        warmup_enabled: false,
      });
      expect(result.content[0].text).toContain('Warmup enabled: false');
    });

    it('should throw error for invalid reply_rate_percentage', async () => {
      await expect(
        emailAccountTools.updateWarmupSettings(mockClient as unknown as SmartleadClient, {
          email_account_id: 123,
          warmup_enabled: true,
          reply_rate_percentage: 150, // Invalid: > 100
        })
      ).rejects.toThrow();
    });

    it('should throw error for missing warmup_enabled', async () => {
      await expect(
        emailAccountTools.updateWarmupSettings(mockClient as unknown as SmartleadClient, {
          email_account_id: 123,
        })
      ).rejects.toThrow();
    });
  });

  describe('getWarmupStats', () => {
    it('should get warmup stats for account', async () => {
      const mockStats = {
        emails_sent: 100,
        emails_received: 50,
        reply_rate: 50,
        deliverability: 98,
      };
      mockClient.get.mockResolvedValue(mockStats);

      const result = await emailAccountTools.getWarmupStats(
        mockClient as unknown as SmartleadClient,
        { account_id: 123 }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/email-accounts/123/warmup-stats');
      expect(result.content[0].text).toContain('Warmup stats for email account 123');
      expect(result.content[0].text).toContain('last 7 days');
    });

    it('should throw error for missing account_id', async () => {
      await expect(
        emailAccountTools.getWarmupStats(mockClient as unknown as SmartleadClient, {})
      ).rejects.toThrow();
    });
  });

  describe('reconnectFailedAccounts', () => {
    it('should initiate reconnection for failed accounts', async () => {
      mockClient.post.mockResolvedValue({ reconnected: 5, failed: 2 });

      const result = await emailAccountTools.reconnectFailedAccounts(
        mockClient as unknown as SmartleadClient
      );

      expect(mockClient.post).toHaveBeenCalledWith(
        '/email-accounts/reconnect-failed-email-accounts',
        {}
      );
      expect(result.content[0].text).toContain('Reconnection process initiated');
      expect(result.content[0].text).toContain('reconnected');
    });

    it('should handle reconnection with empty result', async () => {
      mockClient.post.mockResolvedValue({});

      const result = await emailAccountTools.reconnectFailedAccounts(
        mockClient as unknown as SmartleadClient
      );

      expect(result.content[0].text).toContain('Reconnection process initiated');
    });
  });

  describe('createEmailAccount', () => {
    it('should create email account with all required fields', async () => {
      const mockCreatedAccount = {
        id: 789,
        from_name: 'New Account',
        from_email: 'new@example.com',
        type: 'SMTP',
      };
      mockClient.post.mockResolvedValue(mockCreatedAccount);

      const accountData = {
        from_name: 'New Account',
        from_email: 'new@example.com',
        username: 'new@example.com',
        password: 'secretpassword',
        smtp_host: 'smtp.example.com',
        smtp_port: 587,
        imap_host: 'imap.example.com',
        imap_port: 993,
        message_per_day: 100,
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
      expect(result.content[0].text).toContain('"id": 789');
    });

    it('should create GMAIL account', async () => {
      mockClient.post.mockResolvedValue({ id: 790, type: 'GMAIL' });

      const result = await emailAccountTools.createEmailAccount(
        mockClient as unknown as SmartleadClient,
        {
          from_name: 'Gmail Account',
          from_email: 'test@gmail.com',
          username: 'test@gmail.com',
          password: 'app-password',
          smtp_host: 'smtp.gmail.com',
          smtp_port: 587,
          imap_host: 'imap.gmail.com',
          imap_port: 993,
          message_per_day: 50,
          type: 'GMAIL',
        }
      );

      expect(result.content[0].text).toContain('Email account created successfully');
    });

    it('should create account with client_id', async () => {
      mockClient.post.mockResolvedValue({ id: 791 });

      await emailAccountTools.createEmailAccount(mockClient as unknown as SmartleadClient, {
        from_name: 'Client Account',
        from_email: 'client@example.com',
        username: 'client@example.com',
        password: 'password',
        smtp_host: 'smtp.example.com',
        smtp_port: 587,
        imap_host: 'imap.example.com',
        imap_port: 993,
        message_per_day: 100,
        type: 'SMTP',
        client_id: 456,
      });

      expect(mockClient.post).toHaveBeenCalledWith(
        '/email-accounts/save',
        expect.objectContaining({ client_id: 456 })
      );
    });

    it('should throw error for missing required fields', async () => {
      await expect(
        emailAccountTools.createEmailAccount(mockClient as unknown as SmartleadClient, {
          from_name: 'Test',
          // Missing all other required fields
        })
      ).rejects.toThrow();
    });

    it('should throw error for invalid email format', async () => {
      await expect(
        emailAccountTools.createEmailAccount(mockClient as unknown as SmartleadClient, {
          from_name: 'Test',
          from_email: 'invalid-email',
          username: 'test',
          password: 'pass',
          smtp_host: 'smtp.test.com',
          smtp_port: 587,
          imap_host: 'imap.test.com',
          imap_port: 993,
          message_per_day: 100,
          type: 'SMTP',
        })
      ).rejects.toThrow();
    });

    it('should throw error for invalid type', async () => {
      await expect(
        emailAccountTools.createEmailAccount(mockClient as unknown as SmartleadClient, {
          from_name: 'Test',
          from_email: 'test@example.com',
          username: 'test@example.com',
          password: 'pass',
          smtp_host: 'smtp.test.com',
          smtp_port: 587,
          imap_host: 'imap.test.com',
          imap_port: 993,
          message_per_day: 100,
          type: 'INVALID_TYPE',
        })
      ).rejects.toThrow();
    });
  });

  describe('updateEmailAccount', () => {
    it('should update email account with partial data', async () => {
      const mockUpdatedAccount = {
        id: 123,
        from_name: 'Updated Name',
        message_per_day: 150,
      };
      mockClient.post.mockResolvedValue(mockUpdatedAccount);

      const result = await emailAccountTools.updateEmailAccount(
        mockClient as unknown as SmartleadClient,
        {
          email_account_id: 123,
          from_name: 'Updated Name',
          message_per_day: 150,
        }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/email-accounts/123', {
        from_name: 'Updated Name',
        message_per_day: 150,
      });
      expect(result.content[0].text).toContain('Email account 123 updated successfully');
    });

    it('should update all fields', async () => {
      mockClient.post.mockResolvedValue({ id: 123 });

      const updateData = {
        email_account_id: 123,
        from_name: 'Full Update',
        from_email: 'updated@example.com',
        username: 'updated@example.com',
        password: 'newpassword',
        smtp_host: 'new.smtp.com',
        smtp_port: 465,
        imap_host: 'new.imap.com',
        imap_port: 143,
        message_per_day: 200,
        type: 'OUTLOOK' as const,
        client_id: 999,
      };

      await emailAccountTools.updateEmailAccount(
        mockClient as unknown as SmartleadClient,
        updateData
      );

      const { email_account_id, ...expectedData } = updateData;
      expect(mockClient.post).toHaveBeenCalledWith('/email-accounts/123', expectedData);
    });

    it('should update only message_per_day', async () => {
      mockClient.post.mockResolvedValue({ id: 123 });

      await emailAccountTools.updateEmailAccount(mockClient as unknown as SmartleadClient, {
        email_account_id: 123,
        message_per_day: 75,
      });

      expect(mockClient.post).toHaveBeenCalledWith('/email-accounts/123', {
        message_per_day: 75,
      });
    });

    it('should throw error for missing email_account_id', async () => {
      await expect(
        emailAccountTools.updateEmailAccount(mockClient as unknown as SmartleadClient, {
          from_name: 'Updated',
        })
      ).rejects.toThrow();
    });

    it('should throw error for invalid smtp_port', async () => {
      await expect(
        emailAccountTools.updateEmailAccount(mockClient as unknown as SmartleadClient, {
          email_account_id: 123,
          smtp_port: -1,
        })
      ).rejects.toThrow();
    });
  });
});
