/**
 * Lead Tools Unit Tests
 *
 * Tests for all lead management MCP tools including adding,
 * pausing, resuming, and unsubscribing leads.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmartleadClient } from '../../smartlead-client.js';
import * as leadTools from '../../tools/leads.js';

// Mock SmartleadClient
vi.mock('../../smartlead-client.js', () => ({
  SmartleadClient: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  })),
}));

describe('Lead Tools', () => {
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

  describe('listCampaignLeads', () => {
    it('should list leads with default pagination', async () => {
      const mockResponse = {
        total_leads: 150,
        offset: 0,
        limit: 100,
        data: [
          { campaign_lead_map_id: 1, status: 'ACTIVE', lead: { email: 'test@example.com' } },
          { campaign_lead_map_id: 2, status: 'PAUSED', lead: { email: 'test2@example.com' } },
        ],
      };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await leadTools.listCampaignLeads(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
      });

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/leads', {
        offset: 0,
        limit: 100,
      });
      expect(result.content[0].text).toContain('Found 150 total leads');
      expect(result.content[0].text).toContain('Showing 2 leads');
    });

    it('should list leads with custom pagination', async () => {
      mockClient.get.mockResolvedValue({
        total_leads: 500,
        offset: 100,
        limit: 50,
        data: [],
      });

      const result = await leadTools.listCampaignLeads(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
        offset: 100,
        limit: 50,
      });

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/leads', {
        offset: 100,
        limit: 50,
      });
      expect(result.content[0].text).toContain('offset: 100');
      expect(result.content[0].text).toContain('limit: 50');
    });

    it('should throw error for invalid limit (too high)', async () => {
      await expect(
        leadTools.listCampaignLeads(mockClient as unknown as SmartleadClient, {
          campaign_id: 123,
          limit: 200, // Max is 100
        })
      ).rejects.toThrow();
    });

    it('should throw error for negative offset', async () => {
      await expect(
        leadTools.listCampaignLeads(mockClient as unknown as SmartleadClient, {
          campaign_id: 123,
          offset: -10,
        })
      ).rejects.toThrow();
    });
  });

  describe('addLeadsToCampaign', () => {
    it('should add leads to campaign', async () => {
      mockClient.post.mockResolvedValue({
        ok: true,
        upload_count: 2,
        total_leads: 102,
        already_added_to_campaign: 0,
        duplicate_count: 0,
        invalid_email_count: 0,
        unsubscribed_leads: 0,
      });

      const result = await leadTools.addLeadsToCampaign(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
        lead_list: [
          { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
          { first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' },
        ],
      });

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/123/leads', {
        lead_list: [
          { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
          { first_name: 'Jane', last_name: 'Doe', email: 'jane@example.com' },
        ],
      });
      expect(result.content[0].text).toContain('Successfully uploaded: 2');
      expect(result.content[0].text).toContain('Total leads in campaign: 102');
    });

    it('should add leads with settings', async () => {
      mockClient.post.mockResolvedValue({
        ok: true,
        upload_count: 1,
        total_leads: 101,
        already_added_to_campaign: 0,
        duplicate_count: 0,
        invalid_email_count: 0,
        unsubscribed_leads: 0,
      });

      const result = await leadTools.addLeadsToCampaign(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
        lead_list: [{ first_name: 'John', last_name: 'Doe', email: 'john@example.com' }],
        settings: {
          ignore_global_block_list: true,
          ignore_unsubscribe_list: false,
          ignore_duplicate_leads_in_other_campaign: true,
        },
      });

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/123/leads', {
        lead_list: [{ first_name: 'John', last_name: 'Doe', email: 'john@example.com' }],
        settings: {
          ignore_global_block_list: true,
          ignore_unsubscribe_list: false,
          ignore_duplicate_leads_in_other_campaign: true,
        },
      });
    });

    it('should add leads with all optional fields', async () => {
      mockClient.post.mockResolvedValue({
        ok: true,
        upload_count: 1,
        total_leads: 101,
        already_added_to_campaign: 0,
        duplicate_count: 0,
        invalid_email_count: 0,
        unsubscribed_leads: 0,
      });

      await leadTools.addLeadsToCampaign(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
        lead_list: [
          {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            phone_number: '+1234567890',
            company_name: 'Acme Inc',
            website: 'https://acme.com',
            location: 'New York',
            linkedin_profile: 'https://linkedin.com/in/johndoe',
            company_url: 'https://acme.com',
            custom_fields: { industry: 'Technology' },
          },
        ],
      });

      expect(mockClient.post).toHaveBeenCalled();
    });

    it('should report duplicates and invalid emails', async () => {
      mockClient.post.mockResolvedValue({
        ok: true,
        upload_count: 3,
        total_leads: 103,
        already_added_to_campaign: 2,
        duplicate_count: 1,
        invalid_email_count: 1,
        unsubscribed_leads: 1,
      });

      const result = await leadTools.addLeadsToCampaign(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
        lead_list: [
          { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        ],
      });

      expect(result.content[0].text).toContain('Already in campaign: 2');
      expect(result.content[0].text).toContain('Duplicates: 1');
      expect(result.content[0].text).toContain('Invalid emails: 1');
      expect(result.content[0].text).toContain('Unsubscribed: 1');
    });

    it('should throw error for invalid email format', async () => {
      await expect(
        leadTools.addLeadsToCampaign(mockClient as unknown as SmartleadClient, {
          campaign_id: 123,
          lead_list: [{ first_name: 'John', last_name: 'Doe', email: 'invalid-email' }],
        })
      ).rejects.toThrow();
    });

    it('should throw error for missing required lead fields', async () => {
      await expect(
        leadTools.addLeadsToCampaign(mockClient as unknown as SmartleadClient, {
          campaign_id: 123,
          lead_list: [{ email: 'john@example.com' }], // Missing first_name, last_name
        })
      ).rejects.toThrow();
    });

    it('should throw error for empty lead list', async () => {
      await expect(
        leadTools.addLeadsToCampaign(mockClient as unknown as SmartleadClient, {
          campaign_id: 123,
          lead_list: [],
        })
      ).rejects.toThrow();
    });
  });

  describe('pauseLead', () => {
    it('should pause a lead successfully', async () => {
      mockClient.post.mockResolvedValue({ ok: true, data: 'Lead paused' });

      const result = await leadTools.pauseLead(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
        lead_id: 456,
      });

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/123/leads/456/pause');
      expect(result.content[0].text).toContain('Lead 456 paused successfully');
    });

    it('should handle failed pause', async () => {
      mockClient.post.mockResolvedValue({ ok: false, data: 'Failed' });

      const result = await leadTools.pauseLead(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
        lead_id: 456,
      });

      expect(result.content[0].text).toContain('Failed to pause lead');
    });

    it('should throw error for missing lead_id', async () => {
      await expect(
        leadTools.pauseLead(mockClient as unknown as SmartleadClient, { campaign_id: 123 })
      ).rejects.toThrow();
    });
  });

  describe('resumeLead', () => {
    it('should resume a lead without delay', async () => {
      mockClient.post.mockResolvedValue({ ok: true, data: 'Lead resumed' });

      const result = await leadTools.resumeLead(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
        lead_id: 456,
      });

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/123/leads/456/resume', {});
      expect(result.content[0].text).toContain('Lead 456 resumed successfully');
    });

    it('should resume a lead with delay', async () => {
      mockClient.post.mockResolvedValue({ ok: true, data: 'Lead resumed' });

      const result = await leadTools.resumeLead(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
        lead_id: 456,
        resume_lead_with_delay_days: 5,
      });

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/123/leads/456/resume', {
        resume_lead_with_delay_days: 5,
      });
    });

    it('should handle failed resume', async () => {
      mockClient.post.mockResolvedValue({ ok: false, data: 'Failed' });

      const result = await leadTools.resumeLead(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
        lead_id: 456,
      });

      expect(result.content[0].text).toContain('Failed to resume lead');
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
      expect(result.content[0].text).toContain('Lead 456 deleted successfully');
    });

    it('should handle failed deletion', async () => {
      mockClient.delete.mockResolvedValue({ ok: false });

      const result = await leadTools.deleteLeadFromCampaign(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, lead_id: 456 }
      );

      expect(result.content[0].text).toContain('Failed to delete lead');
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
      expect(result.content[0].text).toContain('Lead 456 unsubscribed successfully');
    });

    it('should handle failed unsubscribe', async () => {
      mockClient.post.mockResolvedValue({ ok: false });

      const result = await leadTools.unsubscribeLeadFromCampaign(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, lead_id: 456 }
      );

      expect(result.content[0].text).toContain('Failed to unsubscribe lead');
    });
  });

  describe('getLeadByEmail', () => {
    it('should get lead by email', async () => {
      const mockLead = {
        id: 456,
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
      expect(result.content[0].text).toContain('john@example.com');
    });

    it('should throw error for invalid email format', async () => {
      await expect(
        leadTools.getLeadByEmail(mockClient as unknown as SmartleadClient, {
          email: 'not-an-email',
        })
      ).rejects.toThrow();
    });

    it('should throw error for missing email', async () => {
      await expect(
        leadTools.getLeadByEmail(mockClient as unknown as SmartleadClient, {})
      ).rejects.toThrow();
    });
  });

  describe('unsubscribeLeadGlobally', () => {
    it('should unsubscribe lead globally', async () => {
      mockClient.post.mockResolvedValue({ ok: true });

      const result = await leadTools.unsubscribeLeadGlobally(
        mockClient as unknown as SmartleadClient,
        { lead_id: 456 }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/leads/456/unsubscribe');
      expect(result.content[0].text).toContain('Lead 456 unsubscribed globally');
    });

    it('should handle failed global unsubscribe', async () => {
      mockClient.post.mockResolvedValue({ ok: false });

      const result = await leadTools.unsubscribeLeadGlobally(
        mockClient as unknown as SmartleadClient,
        { lead_id: 456 }
      );

      expect(result.content[0].text).toContain('Failed to unsubscribe lead globally');
    });

    it('should throw error for invalid lead_id', async () => {
      await expect(
        leadTools.unsubscribeLeadGlobally(mockClient as unknown as SmartleadClient, {
          lead_id: -1,
        })
      ).rejects.toThrow();
    });
  });

  describe('getLeadCampaigns', () => {
    it('should get all campaigns for a lead', async () => {
      const mockCampaigns = [
        { id: 1, status: 'ACTIVE', name: 'Campaign 1' },
        { id: 2, status: 'PAUSED', name: 'Campaign 2' },
      ];
      mockClient.get.mockResolvedValue(mockCampaigns);

      const result = await leadTools.getLeadCampaigns(mockClient as unknown as SmartleadClient, {
        lead_id: 456,
      });

      expect(mockClient.get).toHaveBeenCalledWith('/leads/456/campaigns');
      expect(result.content[0].text).toContain('Found 2 campaigns for lead 456');
      expect(result.content[0].text).toContain('Campaign 1');
      expect(result.content[0].text).toContain('Campaign 2');
    });

    it('should handle lead with no campaigns', async () => {
      mockClient.get.mockResolvedValue([]);

      const result = await leadTools.getLeadCampaigns(mockClient as unknown as SmartleadClient, {
        lead_id: 456,
      });

      expect(result.content[0].text).toContain('Found 0 campaigns');
    });
  });
});
