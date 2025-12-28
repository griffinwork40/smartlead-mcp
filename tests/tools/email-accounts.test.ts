/**
 * Email Account Tools Tests
 * 
 * Comprehensive tests for all email account management tools:
 * - listEmailAccounts
 * - getEmailAccount
 * - updateWarmupSettings
 * - getWarmupStats
 * - reconnectFailedAccounts
 * - createEmailAccount
 * - updateEmailAccount
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  createMockClient,
  mockData,
  MockSmartleadClient,
} from '../mocks/smartlead-client.mock.js';
import * as emailAccountTools from '../../src/tools/email-accounts.js';
import type { SmartleadClient } from '../../src/smartlead-client.js';

describe('Email Account Tools', () => {
  let mockClient: MockSmartleadClient;

  beforeEach(() => {
    mockClient = createMockClient();
    jest.clearAllMocks();
  });

  describe('listEmailAccounts', () => {
    it('should list email accounts with default pagination', async () => {
      const accounts = [
        mockData.emailAccount({ id: 1, from_email: 'account1@example.com' }),
        mockData.emailAccount({ id: 2, from_email: 'account2@example.com' }),
      ];
      mockClient.get.mockResolvedValue(accounts);

      const result = await emailAccountTools.listEmailAccounts(
        mockClient as unknown as SmartleadClient,
        {}
      );

      expect(mockClient.get).toHaveBeenCalledWith('/email-accounts', {
        offset: 0,
        limit: 100,
      });
      expect(result.content[0].text).toContain('Found 2 email accounts');
      expect(result.content[0].text).toContain('account1@example.com');
    });

    it('should list email accounts with custom pagination', async () => {
      mockClient.get.mockResolvedValue([mockData.emailAccount()]);

      await emailAccountTools.listEmailAccounts(
        mockClient as unknown as SmartleadClient,
        { offset: 10, limit: 50 }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/email-accounts', {
        offset: 10,
        limit: 50,
      });
    });

    it('should handle empty email accounts list', async () => {
      mockClient.get.mockResolvedValue([]);

      const result = await emailAccountTools.listEmailAccounts(
        mockClient as unknown as SmartleadClient,
        {}
      );

      expect(result.content[0].text).toContain('Found 0 email accounts');
    });

    it('should throw validation error for limit exceeding 100', async () => {
      await expect(
        emailAccountTools.listEmailAccounts(
          mockClient as unknown as SmartleadClient,
          { limit: 150 }
        )
      ).rejects.toThrow();
    });
  });

  describe('getEmailAccount', () => {
    it('should get email account by ID', async () => {
      const account = mockData.emailAccount({
        id: 123,
        from_email: 'test@example.com',
        from_name: 'Test Sender',
      });
      mockClient.get.mockResolvedValue(account);

      const result = await emailAccountTools.getEmailAccount(
        mockClient as unknown as SmartleadClient,
        { account_id: 123 }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/email-accounts/123/');
      expect(result.content[0].text).toContain('test@example.com');
      expect(result.content[0].text).toContain('Test Sender');
    });

    it('should throw validation error for invalid account_id', async () => {
      await expect(
        emailAccountTools.getEmailAccount(
          mockClient as unknown as SmartleadClient,
          { account_id: -1 }
        )
      ).rejects.toThrow();
    });

    it('should throw validation error for missing account_id', async () => {
      await expect(
        emailAccountTools.getEmailAccount(
          mockClient as unknown as SmartleadClient,
          {}
        )
      ).rejects.toThrow();
    });
  });

  describe('updateWarmupSettings', () => {
    it('should update warmup settings with all fields', async () => {
      mockClient.post.mockResolvedValue({ success: true });

      const warmupSettings = {
        email_account_id: 123,
        warmup_enabled: true,
        total_warmup_per_day: 50,
        daily_rampup: 5,
        reply_rate_percentage: 30,
        warmup_key_id: 'key-123',
      };

      const result = await emailAccountTools.updateWarmupSettings(
        mockClient as unknown as SmartleadClient,
        warmupSettings
      );

      expect(mockClient.post).toHaveBeenCalledWith('/email-accounts/123/warmup', {
        warmup_enabled: true,
        total_warmup_per_day: 50,
        daily_rampup: 5,
        reply_rate_percentage: 30,
        warmup_key_id: 'key-123',
      });
      expect(result.content[0].text).toContain('Warmup settings updated');
      expect(result.content[0].text).toContain('Warmup enabled: true');
    });

    it('should disable warmup', async () => {
      mockClient.post.mockResolvedValue({ success: true });

      const result = await emailAccountTools.updateWarmupSettings(
        mockClient as unknown as SmartleadClient,
        { email_account_id: 123, warmup_enabled: false }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/email-accounts/123/warmup', {
        warmup_enabled: false,
      });
      expect(result.content[0].text).toContain('Warmup enabled: false');
    });

    it('should throw validation error for invalid reply_rate_percentage', async () => {
      await expect(
        emailAccountTools.updateWarmupSettings(
          mockClient as unknown as SmartleadClient,
          { email_account_id: 123, warmup_enabled: true, reply_rate_percentage: 150 }
        )
      ).rejects.toThrow();
    });

    it('should throw validation error for missing required fields', async () => {
      await expect(
        emailAccountTools.updateWarmupSettings(
          mockClient as unknown as SmartleadClient,
          { email_account_id: 123 }
        )
      ).rejects.toThrow();
    });
  });

  describe('getWarmupStats', () => {
    it('should get warmup stats for an email account', async () => {
      const stats = {
        sent: 100,
        delivered: 95,
        opened: 60,
        replied: 20,
        bounced: 5,
      };
      mockClient.get.mockResolvedValue(stats);

      const result = await emailAccountTools.getWarmupStats(
        mockClient as unknown as SmartleadClient,
        { account_id: 123 }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/email-accounts/123/warmup-stats');
      expect(result.content[0].text).toContain('Warmup stats');
      expect(result.content[0].text).toContain('last 7 days');
    });

    it('should throw validation error for invalid account_id', async () => {
      await expect(
        emailAccountTools.getWarmupStats(
          mockClient as unknown as SmartleadClient,
          { account_id: 0 }
        )
      ).rejects.toThrow();
    });
  });

  describe('reconnectFailedAccounts', () => {
    it('should initiate reconnection for failed accounts', async () => {
      mockClient.post.mockResolvedValue({ reconnecting: 5, message: 'Reconnection initiated' });

      const result = await emailAccountTools.reconnectFailedAccounts(
        mockClient as unknown as SmartleadClient
      );

      expect(mockClient.post).toHaveBeenCalledWith('/email-accounts/reconnect-failed-email-accounts', {});
      expect(result.content[0].text).toContain('Reconnection process initiated');
    });

    it('should include response data in result', async () => {
      mockClient.post.mockResolvedValue({ accounts_processed: 3 });

      const result = await emailAccountTools.reconnectFailedAccounts(
        mockClient as unknown as SmartleadClient
      );

      expect(result.content[0].text).toContain('accounts_processed');
    });
  });

  describe('createEmailAccount', () => {
    it('should create email account with all required fields', async () => {
      const createdAccount = mockData.emailAccount({ id: 999 });
      mockClient.post.mockResolvedValue(createdAccount);

      const accountData = {
        from_name: 'New Sender',
        from_email: 'new@example.com',
        username: 'new@example.com',
        password: 'secure-password-123',
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
    });

    it('should create email account with optional client_id', async () => {
      const createdAccount = mockData.emailAccount({ id: 999, client_id: 42 });
      mockClient.post.mockResolvedValue(createdAccount);

      const accountData = {
        from_name: 'New Sender',
        from_email: 'new@example.com',
        username: 'new@example.com',
        password: 'secure-password-123',
        smtp_host: 'smtp.example.com',
        smtp_port: 587,
        imap_host: 'imap.example.com',
        imap_port: 993,
        message_per_day: 100,
        type: 'GMAIL' as const,
        client_id: 42,
      };

      await emailAccountTools.createEmailAccount(
        mockClient as unknown as SmartleadClient,
        accountData
      );

      expect(mockClient.post).toHaveBeenCalledWith('/email-accounts/save', {
        ...accountData,
        id: null,
      });
    });

    it.each(['SMTP', 'GMAIL', 'ZOHO', 'OUTLOOK'] as const)(
      'should accept account type %s',
      async (type) => {
        mockClient.post.mockResolvedValue(mockData.emailAccount({ type }));

        const accountData = {
          from_name: 'Sender',
          from_email: 'sender@example.com',
          username: 'sender@example.com',
          password: 'password',
          smtp_host: 'smtp.example.com',
          smtp_port: 587,
          imap_host: 'imap.example.com',
          imap_port: 993,
          message_per_day: 50,
          type,
        };

        await emailAccountTools.createEmailAccount(
          mockClient as unknown as SmartleadClient,
          accountData
        );

        expect(mockClient.post).toHaveBeenCalled();
      }
    );

    it('should throw validation error for invalid email format', async () => {
      await expect(
        emailAccountTools.createEmailAccount(
          mockClient as unknown as SmartleadClient,
          {
            from_name: 'Sender',
            from_email: 'not-an-email',
            username: 'sender@example.com',
            password: 'password',
            smtp_host: 'smtp.example.com',
            smtp_port: 587,
            imap_host: 'imap.example.com',
            imap_port: 993,
            message_per_day: 50,
            type: 'SMTP',
          }
        )
      ).rejects.toThrow();
    });

    it('should throw validation error for invalid type', async () => {
      await expect(
        emailAccountTools.createEmailAccount(
          mockClient as unknown as SmartleadClient,
          {
            from_name: 'Sender',
            from_email: 'sender@example.com',
            username: 'sender@example.com',
            password: 'password',
            smtp_host: 'smtp.example.com',
            smtp_port: 587,
            imap_host: 'imap.example.com',
            imap_port: 993,
            message_per_day: 50,
            type: 'INVALID',
          }
        )
      ).rejects.toThrow();
    });

    it('should throw validation error for missing required fields', async () => {
      await expect(
        emailAccountTools.createEmailAccount(
          mockClient as unknown as SmartleadClient,
          {
            from_name: 'Sender',
            from_email: 'sender@example.com',
          }
        )
      ).rejects.toThrow();
    });
  });

  describe('updateEmailAccount', () => {
    it('should update email account with partial fields', async () => {
      const updatedAccount = mockData.emailAccount({ id: 123, from_name: 'Updated Sender' });
      mockClient.post.mockResolvedValue(updatedAccount);

      const result = await emailAccountTools.updateEmailAccount(
        mockClient as unknown as SmartleadClient,
        { email_account_id: 123, from_name: 'Updated Sender' }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/email-accounts/123', {
        from_name: 'Updated Sender',
      });
      expect(result.content[0].text).toContain('Email account 123 updated successfully');
    });

    it('should update multiple fields at once', async () => {
      const updatedAccount = mockData.emailAccount();
      mockClient.post.mockResolvedValue(updatedAccount);

      await emailAccountTools.updateEmailAccount(
        mockClient as unknown as SmartleadClient,
        {
          email_account_id: 123,
          from_name: 'New Name',
          message_per_day: 200,
          smtp_port: 465,
        }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/email-accounts/123', {
        from_name: 'New Name',
        message_per_day: 200,
        smtp_port: 465,
      });
    });

    it('should update email account type', async () => {
      const updatedAccount = mockData.emailAccount({ type: 'OUTLOOK' });
      mockClient.post.mockResolvedValue(updatedAccount);

      await emailAccountTools.updateEmailAccount(
        mockClient as unknown as SmartleadClient,
        { email_account_id: 123, type: 'OUTLOOK' }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/email-accounts/123', {
        type: 'OUTLOOK',
      });
    });

    it('should throw validation error for invalid email_account_id', async () => {
      await expect(
        emailAccountTools.updateEmailAccount(
          mockClient as unknown as SmartleadClient,
          { email_account_id: -1, from_name: 'Test' }
        )
      ).rejects.toThrow();
    });

    it('should throw validation error for missing email_account_id', async () => {
      await expect(
        emailAccountTools.updateEmailAccount(
          mockClient as unknown as SmartleadClient,
          { from_name: 'Test' }
        )
      ).rejects.toThrow();
    });
  });
});
