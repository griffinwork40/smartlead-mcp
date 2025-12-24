/**
 * Lead Tools Tests
 *
 * Unit tests for lead management tool handlers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmartleadClient } from '../../smartlead-client.js';
import * as leadTools from '../leads.js';

// Mock SmartleadClient
vi.mock('../../smartlead-client.js', () => ({
  SmartleadClient: vi.fn(),
}));

describe('Lead Tools', () => {
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

  describe('listCampaignLeads', () => {
    it('should list leads with default pagination', async () => {
      const mockResponse = {
        total_leads: 150,
        offset: 0,
        limit: 100,
        data: [
          { campaign_lead_map_id: 1, lead: { email: 'test1@example.com' } },
          { campaign_lead_map_id: 2, lead: { email: 'test2@example.com' } },
        ],
      };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await leadTools.listCampaignLeads(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123 }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/leads', {
        offset: 0,
        limit: 100,
      });
      expect(result.content[0].text).toContain('Found 150 total leads');
    });

    it('should list leads with custom pagination', async () => {
      const mockResponse = {
        total_leads: 50,
        offset: 10,
        limit: 25,
        data: [],
      };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await leadTools.listCampaignLeads(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, offset: 10, limit: 25 }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/leads', {
        offset: 10,
        limit: 25,
      });
    });

    it('should throw error for missing campaign_id', async () => {
      await expect(
        leadTools.listCampaignLeads(mockClient as unknown as SmartleadClient, {})
      ).rejects.toThrow();
    });
  });

  describe('addLeadsToCampaign', () => {
    it('should add leads to campaign', async () => {
      const mockResponse = {
        ok: true,
        upload_count: 2,
        total_leads: 102,
        already_added_to_campaign: 0,
        duplicate_count: 0,
        invalid_email_count: 0,
        unsubscribed_leads: 0,
      };
      mockClient.post.mockResolvedValue(mockResponse);

      const leadList = [
        { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        { first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' },
      ];

      const result = await leadTools.addLeadsToCampaign(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, lead_list: leadList }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/123/leads', {
        lead_list: leadList,
      });
      expect(result.content[0].text).toContain('Successfully uploaded: 2');
    });

    it('should add leads with settings', async () => {
      const mockResponse = {
        ok: true,
        upload_count: 1,
        total_leads: 1,
        already_added_to_campaign: 0,
        duplicate_count: 0,
        invalid_email_count: 0,
        unsubscribed_leads: 0,
      };
      mockClient.post.mockResolvedValue(mockResponse);

      const leadList = [{ first_name: 'John', last_name: 'Doe', email: 'john@example.com' }];
      const settings = { ignore_global_block_list: true };

      await leadTools.addLeadsToCampaign(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
        lead_list: leadList,
        settings,
      });

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/123/leads', {
        lead_list: leadList,
        settings,
      });
    });

    it('should throw error for invalid email', async () => {
      await expect(
        leadTools.addLeadsToCampaign(mockClient as unknown as SmartleadClient, {
          campaign_id: 123,
          lead_list: [{ first_name: 'John', last_name: 'Doe', email: 'invalid-email' }],
        })
      ).rejects.toThrow();
    });

    it('should throw error for missing required fields', async () => {
      await expect(
        leadTools.addLeadsToCampaign(mockClient as unknown as SmartleadClient, {
          campaign_id: 123,
          lead_list: [{ email: 'john@example.com' }],
        })
      ).rejects.toThrow();
    });
  });

  describe('pauseLead', () => {
    it('should pause lead in campaign', async () => {
      mockClient.post.mockResolvedValue({ ok: true, data: 'Lead paused' });

      const result = await leadTools.pauseLead(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
        lead_id: 456,
      });

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/123/leads/456/pause');
      expect(result.content[0].text).toContain('paused successfully');
    });

    it('should handle failed pause', async () => {
      mockClient.post.mockResolvedValue({ ok: false, data: 'Error' });

      const result = await leadTools.pauseLead(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
        lead_id: 456,
      });

      expect(result.content[0].text).toContain('Failed to pause');
    });
  });

  describe('resumeLead', () => {
    it('should resume lead without delay', async () => {
      mockClient.post.mockResolvedValue({ ok: true, data: 'Lead resumed' });

      const result = await leadTools.resumeLead(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
        lead_id: 456,
      });

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/123/leads/456/resume', {});
      expect(result.content[0].text).toContain('resumed successfully');
    });

    it('should resume lead with delay', async () => {
      mockClient.post.mockResolvedValue({ ok: true, data: 'Lead resumed' });

      await leadTools.resumeLead(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
        lead_id: 456,
        resume_lead_with_delay_days: 5,
      });

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/123/leads/456/resume', {
        resume_lead_with_delay_days: 5,
      });
    });
  });

  describe('deleteLeadFromCampaign', () => {
    it('should delete lead from campaign', async () => {
      mockClient.delete.mockResolvedValue({ ok: true });

      const result = await leadTools.deleteLeadFromCampaign(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, lead_id: 456 }
      );

      expect(mockClient.delete).toHaveBeenCalledWith('/campaigns/123/leads/456');
      expect(result.content[0].text).toContain('deleted successfully');
    });
  });

  describe('unsubscribeLeadFromCampaign', () => {
    it('should unsubscribe lead from campaign', async () => {
      mockClient.post.mockResolvedValue({ ok: true });

      const result = await leadTools.unsubscribeLeadFromCampaign(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, lead_id: 456 }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/123/leads/456/unsubscribe');
      expect(result.content[0].text).toContain('unsubscribed successfully');
    });
  });

  describe('getLeadByEmail', () => {
    it('should get lead by email', async () => {
      const mockLead = {
        id: 123,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      };
      mockClient.get.mockResolvedValue(mockLead);

      const result = await leadTools.getLeadByEmail(mockClient as unknown as SmartleadClient, {
        email: 'john@example.com',
      });

      expect(mockClient.get).toHaveBeenCalledWith('/leads', { email: 'john@example.com' });
      expect(result.content[0].text).toContain('Lead found');
    });

    it('should throw error for invalid email format', async () => {
      await expect(
        leadTools.getLeadByEmail(mockClient as unknown as SmartleadClient, {
          email: 'not-an-email',
        })
      ).rejects.toThrow();
    });
  });

  describe('unsubscribeLeadGlobally', () => {
    it('should unsubscribe lead globally', async () => {
      mockClient.post.mockResolvedValue({ ok: true });

      const result = await leadTools.unsubscribeLeadGlobally(
        mockClient as unknown as SmartleadClient,
        { lead_id: 123 }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/leads/123/unsubscribe');
      expect(result.content[0].text).toContain('unsubscribed globally');
    });
  });

  describe('getLeadCampaigns', () => {
    it('should get campaigns for lead', async () => {
      const mockCampaigns = [
        { id: 1, name: 'Campaign 1', status: 'ACTIVE' },
        { id: 2, name: 'Campaign 2', status: 'PAUSED' },
      ];
      mockClient.get.mockResolvedValue(mockCampaigns);

      const result = await leadTools.getLeadCampaigns(mockClient as unknown as SmartleadClient, {
        lead_id: 123,
      });

      expect(mockClient.get).toHaveBeenCalledWith('/leads/123/campaigns');
      expect(result.content[0].text).toContain('Found 2 campaigns');
    });
  });
});
