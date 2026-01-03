/**
 * Campaign Tools Tests
 * 
 * Comprehensive tests for all campaign management tools:
 * - createCampaign
 * - getCampaign
 * - listCampaigns
 * - updateCampaignSchedule
 * - updateCampaignSettings
 * - updateCampaignStatus
 * - deleteCampaign
 * - listCampaignEmailAccounts
 * - addCampaignEmailAccounts
 * - removeCampaignEmailAccounts
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  createMockClient,
  mockData,
  MockSmartleadClient,
} from '../mocks/smartlead-client.mock.js';
import * as campaignTools from '../../src/tools/campaigns.js';
import type { SmartleadClient } from '../../src/smartlead-client.js';

describe('Campaign Tools', () => {
  let mockClient: MockSmartleadClient;

  beforeEach(() => {
    mockClient = createMockClient();
    jest.clearAllMocks();
  });

  describe('createCampaign', () => {
    it('should create a campaign with required name', async () => {
      const response = mockData.createCampaignResponse({ name: 'New Campaign' });
      mockClient.post.mockResolvedValue(response);

      const result = await campaignTools.createCampaign(
        mockClient as unknown as SmartleadClient,
        { name: 'New Campaign' }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/create', { name: 'New Campaign' });
      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
      expect(parsed.name).toBe('New Campaign');
    });

    it('should create a campaign with optional client_id', async () => {
      const response = mockData.createCampaignResponse();
      mockClient.post.mockResolvedValue(response);

      await campaignTools.createCampaign(
        mockClient as unknown as SmartleadClient,
        { name: 'New Campaign', client_id: 42 }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/create', {
        name: 'New Campaign',
        client_id: 42,
      });
    });

    it('should throw validation error for missing name', async () => {
      await expect(
        campaignTools.createCampaign(mockClient as unknown as SmartleadClient, {})
      ).rejects.toThrow();
    });

    it('should throw validation error for empty name', async () => {
      await expect(
        campaignTools.createCampaign(mockClient as unknown as SmartleadClient, { name: '' })
      ).rejects.toThrow();
    });
  });

  describe('getCampaign', () => {
    it('should get campaign by ID', async () => {
      const campaign = mockData.campaign({ id: 123, name: 'My Campaign' });
      mockClient.get.mockResolvedValue(campaign);

      const result = await campaignTools.getCampaign(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123 }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123');
      expect(result.content[0].text).toContain('My Campaign');
    });

    it('should throw validation error for missing campaign_id', async () => {
      await expect(
        campaignTools.getCampaign(mockClient as unknown as SmartleadClient, {})
      ).rejects.toThrow();
    });

    it('should throw validation error for negative campaign_id', async () => {
      await expect(
        campaignTools.getCampaign(mockClient as unknown as SmartleadClient, { campaign_id: -1 })
      ).rejects.toThrow();
    });
  });

  describe('listCampaigns', () => {
    it('should list all campaigns', async () => {
      const campaigns = [
        mockData.campaign({ id: 1, name: 'Campaign 1' }),
        mockData.campaign({ id: 2, name: 'Campaign 2' }),
      ];
      mockClient.get.mockResolvedValue(campaigns);

      const result = await campaignTools.listCampaigns(mockClient as unknown as SmartleadClient);

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns');
      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('Campaign 1');
      expect(parsed[1].name).toBe('Campaign 2');
    });

    it('should handle empty campaign list', async () => {
      mockClient.get.mockResolvedValue([]);

      const result = await campaignTools.listCampaigns(mockClient as unknown as SmartleadClient);

      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(0);
    });
  });

  describe('updateCampaignSchedule', () => {
    it('should update campaign schedule with all fields', async () => {
      mockClient.post.mockResolvedValue({ ok: true });

      const scheduleData = {
        campaign_id: 123,
        timezone: 'America/New_York',
        days_of_the_week: [1, 2, 3, 4, 5],
        start_hour: '09:00',
        end_hour: '17:00',
        min_time_btw_emails: 30,
        max_new_leads_per_day: 100,
      };

      const result = await campaignTools.updateCampaignSchedule(
        mockClient as unknown as SmartleadClient,
        scheduleData
      );

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/123/schedule', {
        timezone: 'America/New_York',
        days_of_the_week: [1, 2, 3, 4, 5],
        start_hour: '09:00',
        end_hour: '17:00',
        min_time_btw_emails: 30,
        max_new_leads_per_day: 100,
      });
      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.ok).toBe(true);
    });

    it('should update campaign schedule with partial fields', async () => {
      mockClient.post.mockResolvedValue({ ok: true });

      await campaignTools.updateCampaignSchedule(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, timezone: 'UTC' }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/123/schedule', {
        timezone: 'UTC',
      });
    });

    it('should report failure when ok is false', async () => {
      mockClient.post.mockResolvedValue({ ok: false });

      const result = await campaignTools.updateCampaignSchedule(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, timezone: 'UTC' }
      );

      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.ok).toBe(false);
    });
  });

  describe('updateCampaignSettings', () => {
    it('should update campaign settings', async () => {
      mockClient.post.mockResolvedValue({ ok: true });

      const settingsData = {
        campaign_id: 123,
        track_settings: ['opens', 'clicks'],
        unsubscribe_text: 'Unsubscribe here',
        send_as_plain_text: false,
        follow_up_percentage: 50,
      };

      const result = await campaignTools.updateCampaignSettings(
        mockClient as unknown as SmartleadClient,
        settingsData
      );

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/123/settings', {
        track_settings: ['opens', 'clicks'],
        unsubscribe_text: 'Unsubscribe here',
        send_as_plain_text: false,
        follow_up_percentage: 50,
      });
      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.ok).toBe(true);
    });

    it('should throw validation error for invalid follow_up_percentage', async () => {
      await expect(
        campaignTools.updateCampaignSettings(
          mockClient as unknown as SmartleadClient,
          { campaign_id: 123, follow_up_percentage: 150 }
        )
      ).rejects.toThrow();
    });
  });

  describe('updateCampaignStatus', () => {
    it.each(['PAUSED', 'STOPPED', 'START'] as const)(
      'should update campaign status to %s',
      async (status) => {
        mockClient.post.mockResolvedValue({ ok: true });

        const result = await campaignTools.updateCampaignStatus(
          mockClient as unknown as SmartleadClient,
          { campaign_id: 123, status }
        );

        expect(mockClient.post).toHaveBeenCalledWith('/campaigns/123/status', { status });
        // Verify JSON response
        const parsed = JSON.parse(result.content[0].text);
        expect(parsed.ok).toBe(true);
      }
    );

    it('should throw validation error for invalid status', async () => {
      await expect(
        campaignTools.updateCampaignStatus(
          mockClient as unknown as SmartleadClient,
          { campaign_id: 123, status: 'INVALID' }
        )
      ).rejects.toThrow();
    });
  });

  describe('deleteCampaign', () => {
    it('should delete campaign by ID', async () => {
      mockClient.delete.mockResolvedValue({ ok: true });

      const result = await campaignTools.deleteCampaign(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 456 }
      );

      expect(mockClient.delete).toHaveBeenCalledWith('/campaigns/456');
      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.ok).toBe(true);
    });

    it('should report failure when delete fails', async () => {
      mockClient.delete.mockResolvedValue({ ok: false });

      const result = await campaignTools.deleteCampaign(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 456 }
      );

      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.ok).toBe(false);
    });
  });

  describe('listCampaignEmailAccounts', () => {
    it('should list email accounts for a campaign', async () => {
      const accounts = [
        mockData.emailAccount({ id: 1, from_email: 'account1@example.com' }),
        mockData.emailAccount({ id: 2, from_email: 'account2@example.com' }),
      ];
      mockClient.get.mockResolvedValue(accounts);

      const result = await campaignTools.listCampaignEmailAccounts(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123 }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/email-accounts');
      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].from_email).toBe('account1@example.com');
    });

    it('should handle campaign with no email accounts', async () => {
      mockClient.get.mockResolvedValue([]);

      const result = await campaignTools.listCampaignEmailAccounts(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123 }
      );

      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(0);
    });
  });

  describe('addCampaignEmailAccounts', () => {
    it('should add email accounts to a campaign', async () => {
      mockClient.post.mockResolvedValue({ ok: true });

      const result = await campaignTools.addCampaignEmailAccounts(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, email_account_ids: [1, 2, 3] }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/123/email-accounts', {
        email_account_ids: [1, 2, 3],
      });
      // Verify JSON response (the result object is returned as-is)
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    it('should throw validation error for empty email_account_ids', async () => {
      await expect(
        campaignTools.addCampaignEmailAccounts(
          mockClient as unknown as SmartleadClient,
          { campaign_id: 123, email_account_ids: [] }
        )
      ).rejects.toThrow();
    });
  });

  describe('removeCampaignEmailAccounts', () => {
    it('should remove email accounts from a campaign', async () => {
      mockClient.delete.mockResolvedValue({ ok: true });

      const result = await campaignTools.removeCampaignEmailAccounts(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, email_account_ids: [1, 2] }
      );

      expect(mockClient.delete).toHaveBeenCalledWith('/campaigns/123/email-accounts', {
        email_account_ids: [1, 2],
      });
      // Verify JSON response (the result object is returned as-is)
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
    });

    it('should throw validation error for invalid email_account_ids', async () => {
      await expect(
        campaignTools.removeCampaignEmailAccounts(
          mockClient as unknown as SmartleadClient,
          { campaign_id: 123, email_account_ids: [-1] }
        )
      ).rejects.toThrow();
    });
  });
});
