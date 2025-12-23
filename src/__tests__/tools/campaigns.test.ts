/**
 * Campaign Tools Unit Tests
 *
 * Tests for all campaign management MCP tools including creation,
 * updates, status changes, and email account associations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmartleadClient } from '../../smartlead-client.js';
import * as campaignTools from '../../tools/campaigns.js';

// Mock SmartleadClient
vi.mock('../../smartlead-client.js', () => ({
  SmartleadClient: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  })),
}));

describe('Campaign Tools', () => {
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

  describe('createCampaign', () => {
    it('should create a campaign with name only', async () => {
      mockClient.post.mockResolvedValue({
        ok: true,
        id: 123,
        name: 'Test Campaign',
        created_at: '2025-01-01T00:00:00Z',
      });

      const result = await campaignTools.createCampaign(mockClient as unknown as SmartleadClient, {
        name: 'Test Campaign',
      });

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/create', {
        name: 'Test Campaign',
      });
      expect(result.content[0].text).toContain('Campaign created successfully!');
      expect(result.content[0].text).toContain('ID: 123');
      expect(result.content[0].text).toContain('Name: Test Campaign');
    });

    it('should create a campaign with client_id', async () => {
      mockClient.post.mockResolvedValue({
        ok: true,
        id: 456,
        name: 'Client Campaign',
        created_at: '2025-01-01T00:00:00Z',
      });

      const result = await campaignTools.createCampaign(mockClient as unknown as SmartleadClient, {
        name: 'Client Campaign',
        client_id: 789,
      });

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/create', {
        name: 'Client Campaign',
        client_id: 789,
      });
      expect(result.content[0].text).toContain('ID: 456');
    });

    it('should throw error for missing name', async () => {
      await expect(
        campaignTools.createCampaign(mockClient as unknown as SmartleadClient, {})
      ).rejects.toThrow();
    });

    it('should throw error for empty name', async () => {
      await expect(
        campaignTools.createCampaign(mockClient as unknown as SmartleadClient, { name: '' })
      ).rejects.toThrow();
    });
  });

  describe('getCampaign', () => {
    it('should get campaign by ID', async () => {
      const mockCampaign = {
        id: 123,
        user_id: 1,
        name: 'Test Campaign',
        status: 'ACTIVE',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
      };
      mockClient.get.mockResolvedValue(mockCampaign);

      const result = await campaignTools.getCampaign(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
      });

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123');
      expect(result.content[0].text).toContain('"id": 123');
      expect(result.content[0].text).toContain('"name": "Test Campaign"');
    });

    it('should throw error for missing campaign_id', async () => {
      await expect(
        campaignTools.getCampaign(mockClient as unknown as SmartleadClient, {})
      ).rejects.toThrow();
    });

    it('should throw error for invalid campaign_id', async () => {
      await expect(
        campaignTools.getCampaign(mockClient as unknown as SmartleadClient, { campaign_id: -1 })
      ).rejects.toThrow();
    });

    it('should throw error for non-integer campaign_id', async () => {
      await expect(
        campaignTools.getCampaign(mockClient as unknown as SmartleadClient, { campaign_id: 'abc' })
      ).rejects.toThrow();
    });
  });

  describe('listCampaigns', () => {
    it('should list all campaigns', async () => {
      const mockCampaigns = [
        { id: 1, name: 'Campaign 1', status: 'ACTIVE' },
        { id: 2, name: 'Campaign 2', status: 'PAUSED' },
      ];
      mockClient.get.mockResolvedValue(mockCampaigns);

      const result = await campaignTools.listCampaigns(mockClient as unknown as SmartleadClient);

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns');
      expect(result.content[0].text).toContain('Found 2 campaigns');
      expect(result.content[0].text).toContain('Campaign 1');
      expect(result.content[0].text).toContain('Campaign 2');
    });

    it('should handle empty campaign list', async () => {
      mockClient.get.mockResolvedValue([]);

      const result = await campaignTools.listCampaigns(mockClient as unknown as SmartleadClient);

      expect(result.content[0].text).toContain('Found 0 campaigns');
    });
  });

  describe('updateCampaignSchedule', () => {
    it('should update campaign schedule with all options', async () => {
      mockClient.post.mockResolvedValue({ ok: true });

      const scheduleData = {
        campaign_id: 123,
        timezone: 'America/New_York',
        days_of_the_week: [1, 2, 3, 4, 5],
        start_hour: '09:00',
        end_hour: '17:00',
        min_time_btw_emails: 5,
        max_new_leads_per_day: 100,
        schedule_start_time: '2025-01-01T09:00:00Z',
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
        min_time_btw_emails: 5,
        max_new_leads_per_day: 100,
        schedule_start_time: '2025-01-01T09:00:00Z',
      });
      expect(result.content[0].text).toContain('Campaign schedule updated successfully!');
    });

    it('should update campaign schedule with minimal options', async () => {
      mockClient.post.mockResolvedValue({ ok: true });

      const result = await campaignTools.updateCampaignSchedule(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 456 }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/456/schedule', {});
      expect(result.content[0].text).toContain('updated successfully');
    });

    it('should handle failed schedule update', async () => {
      mockClient.post.mockResolvedValue({ ok: false });

      const result = await campaignTools.updateCampaignSchedule(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 789 }
      );

      expect(result.content[0].text).toContain('Failed to update campaign schedule');
    });

    it('should throw error for invalid days_of_the_week', async () => {
      await expect(
        campaignTools.updateCampaignSchedule(mockClient as unknown as SmartleadClient, {
          campaign_id: 123,
          days_of_the_week: [0, 7, 8], // 7 and 8 are invalid (0-6 only)
        })
      ).rejects.toThrow();
    });
  });

  describe('updateCampaignSettings', () => {
    it('should update campaign settings', async () => {
      mockClient.post.mockResolvedValue({ ok: true });

      const settingsData = {
        campaign_id: 123,
        track_settings: ['OPENS', 'CLICKS'],
        stop_lead_settings: 'REPLY',
        unsubscribe_text: 'Click here to unsubscribe',
        send_as_plain_text: false,
        follow_up_percentage: 50,
        enable_ai_esp_matching: true,
      };

      const result = await campaignTools.updateCampaignSettings(
        mockClient as unknown as SmartleadClient,
        settingsData
      );

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/123/settings', {
        track_settings: ['OPENS', 'CLICKS'],
        stop_lead_settings: 'REPLY',
        unsubscribe_text: 'Click here to unsubscribe',
        send_as_plain_text: false,
        follow_up_percentage: 50,
        enable_ai_esp_matching: true,
      });
      expect(result.content[0].text).toContain('Campaign settings updated successfully!');
    });

    it('should handle failed settings update', async () => {
      mockClient.post.mockResolvedValue({ ok: false });

      const result = await campaignTools.updateCampaignSettings(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123 }
      );

      expect(result.content[0].text).toContain('Failed to update campaign settings');
    });

    it('should validate follow_up_percentage range', async () => {
      await expect(
        campaignTools.updateCampaignSettings(mockClient as unknown as SmartleadClient, {
          campaign_id: 123,
          follow_up_percentage: 150, // Invalid: > 100
        })
      ).rejects.toThrow();
    });
  });

  describe('updateCampaignStatus', () => {
    it('should update campaign status to PAUSED', async () => {
      mockClient.post.mockResolvedValue({ ok: true });

      const result = await campaignTools.updateCampaignStatus(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, status: 'PAUSED' }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/123/status', { status: 'PAUSED' });
      expect(result.content[0].text).toContain('Campaign status updated to PAUSED successfully!');
    });

    it('should update campaign status to START', async () => {
      mockClient.post.mockResolvedValue({ ok: true });

      const result = await campaignTools.updateCampaignStatus(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, status: 'START' }
      );

      expect(result.content[0].text).toContain('START');
    });

    it('should update campaign status to STOPPED', async () => {
      mockClient.post.mockResolvedValue({ ok: true });

      const result = await campaignTools.updateCampaignStatus(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, status: 'STOPPED' }
      );

      expect(result.content[0].text).toContain('STOPPED');
    });

    it('should handle failed status update', async () => {
      mockClient.post.mockResolvedValue({ ok: false });

      const result = await campaignTools.updateCampaignStatus(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, status: 'PAUSED' }
      );

      expect(result.content[0].text).toContain('Failed to update campaign status');
    });

    it('should throw error for invalid status', async () => {
      await expect(
        campaignTools.updateCampaignStatus(mockClient as unknown as SmartleadClient, {
          campaign_id: 123,
          status: 'INVALID_STATUS',
        })
      ).rejects.toThrow();
    });
  });

  describe('deleteCampaign', () => {
    it('should delete campaign', async () => {
      mockClient.delete.mockResolvedValue({ ok: true });

      const result = await campaignTools.deleteCampaign(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
      });

      expect(mockClient.delete).toHaveBeenCalledWith('/campaigns/123');
      expect(result.content[0].text).toContain('Campaign 123 deleted successfully!');
    });

    it('should handle failed deletion', async () => {
      mockClient.delete.mockResolvedValue({ ok: false });

      const result = await campaignTools.deleteCampaign(mockClient as unknown as SmartleadClient, {
        campaign_id: 456,
      });

      expect(result.content[0].text).toContain('Failed to delete campaign');
    });
  });

  describe('listCampaignEmailAccounts', () => {
    it('should list email accounts for campaign', async () => {
      const mockAccounts = [
        { id: 1, from_email: 'test1@example.com' },
        { id: 2, from_email: 'test2@example.com' },
      ];
      mockClient.get.mockResolvedValue(mockAccounts);

      const result = await campaignTools.listCampaignEmailAccounts(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123 }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/email-accounts');
      expect(result.content[0].text).toContain('Found 2 email accounts');
      expect(result.content[0].text).toContain('test1@example.com');
    });

    it('should handle empty email accounts list', async () => {
      mockClient.get.mockResolvedValue([]);

      const result = await campaignTools.listCampaignEmailAccounts(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123 }
      );

      expect(result.content[0].text).toContain('Found 0 email accounts');
    });
  });

  describe('addCampaignEmailAccounts', () => {
    it('should add email accounts to campaign', async () => {
      mockClient.post.mockResolvedValue({ ok: true });

      const result = await campaignTools.addCampaignEmailAccounts(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, email_account_ids: [1, 2, 3] }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/123/email-accounts', {
        email_account_ids: [1, 2, 3],
      });
      expect(result.content[0].text).toContain('Successfully added 3 email accounts');
    });

    it('should add single email account', async () => {
      mockClient.post.mockResolvedValue({ ok: true });

      const result = await campaignTools.addCampaignEmailAccounts(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, email_account_ids: [1] }
      );

      expect(result.content[0].text).toContain('Successfully added 1 email accounts');
    });

    it('should throw error for empty email_account_ids', async () => {
      await expect(
        campaignTools.addCampaignEmailAccounts(mockClient as unknown as SmartleadClient, {
          campaign_id: 123,
          email_account_ids: [],
        })
      ).rejects.toThrow();
    });
  });

  describe('removeCampaignEmailAccounts', () => {
    it('should remove email accounts from campaign', async () => {
      mockClient.delete.mockResolvedValue({ ok: true });

      const result = await campaignTools.removeCampaignEmailAccounts(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, email_account_ids: [1, 2] }
      );

      expect(mockClient.delete).toHaveBeenCalledWith('/campaigns/123/email-accounts', {
        email_account_ids: [1, 2],
      });
      expect(result.content[0].text).toContain('Successfully removed 2 email accounts');
    });

    it('should throw error for missing email_account_ids', async () => {
      await expect(
        campaignTools.removeCampaignEmailAccounts(mockClient as unknown as SmartleadClient, {
          campaign_id: 123,
        })
      ).rejects.toThrow();
    });
  });
});
