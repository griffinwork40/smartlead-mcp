/**
 * Campaign Tools Tests
 *
 * Unit tests for campaign management tool handlers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmartleadClient } from '../../smartlead-client.js';
import * as campaignTools from '../campaigns.js';

// Mock SmartleadClient
vi.mock('../../smartlead-client.js', () => ({
  SmartleadClient: vi.fn(),
}));

describe('Campaign Tools', () => {
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

  describe('createCampaign', () => {
    it('should create a campaign with valid name', async () => {
      const mockResponse = {
        id: 123,
        name: 'Test Campaign',
        created_at: '2025-01-01T00:00:00Z',
      };
      mockClient.post.mockResolvedValue(mockResponse);

      const result = await campaignTools.createCampaign(
        mockClient as unknown as SmartleadClient,
        { name: 'Test Campaign' }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/create', { name: 'Test Campaign' });
      expect(result.content[0].text).toContain('Campaign created successfully');
      expect(result.content[0].text).toContain('ID: 123');
    });

    it('should create a campaign with client_id', async () => {
      const mockResponse = {
        id: 456,
        name: 'Client Campaign',
        created_at: '2025-01-01T00:00:00Z',
      };
      mockClient.post.mockResolvedValue(mockResponse);

      const result = await campaignTools.createCampaign(
        mockClient as unknown as SmartleadClient,
        { name: 'Client Campaign', client_id: 789 }
      );

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
        name: 'Test Campaign',
        status: 'ACTIVE',
        created_at: '2025-01-01T00:00:00Z',
      };
      mockClient.get.mockResolvedValue(mockCampaign);

      const result = await campaignTools.getCampaign(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123 }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123');
      expect(result.content[0].text).toContain('"id": 123');
    });

    it('should throw error for invalid campaign_id', async () => {
      await expect(
        campaignTools.getCampaign(mockClient as unknown as SmartleadClient, { campaign_id: -1 })
      ).rejects.toThrow();
    });

    it('should throw error for missing campaign_id', async () => {
      await expect(
        campaignTools.getCampaign(mockClient as unknown as SmartleadClient, {})
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
    });

    it('should handle empty campaign list', async () => {
      mockClient.get.mockResolvedValue([]);

      const result = await campaignTools.listCampaigns(mockClient as unknown as SmartleadClient);

      expect(result.content[0].text).toContain('Found 0 campaigns');
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
      expect(result.content[0].text).toContain('PAUSED successfully');
    });

    it('should update campaign status to START', async () => {
      mockClient.post.mockResolvedValue({ ok: true });

      const result = await campaignTools.updateCampaignStatus(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 456, status: 'START' }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/456/status', { status: 'START' });
      expect(result.content[0].text).toContain('START successfully');
    });

    it('should throw error for invalid status', async () => {
      await expect(
        campaignTools.updateCampaignStatus(mockClient as unknown as SmartleadClient, {
          campaign_id: 123,
          status: 'INVALID',
        })
      ).rejects.toThrow();
    });
  });

  describe('deleteCampaign', () => {
    it('should delete campaign', async () => {
      mockClient.delete.mockResolvedValue({ ok: true });

      const result = await campaignTools.deleteCampaign(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123 }
      );

      expect(mockClient.delete).toHaveBeenCalledWith('/campaigns/123');
      expect(result.content[0].text).toContain('deleted successfully');
    });

    it('should handle failed deletion', async () => {
      mockClient.delete.mockResolvedValue({ ok: false });

      const result = await campaignTools.deleteCampaign(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123 }
      );

      expect(result.content[0].text).toContain('Failed to delete');
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
  });
});
