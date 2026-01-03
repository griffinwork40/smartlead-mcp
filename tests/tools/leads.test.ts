/**
 * Lead Tools Tests
 * 
 * Comprehensive tests for all lead management tools:
 * - listCampaignLeads
 * - addLeadsToCampaign
 * - pauseLead
 * - resumeLead
 * - deleteLeadFromCampaign
 * - unsubscribeLeadFromCampaign
 * - getLeadByEmail
 * - unsubscribeLeadGlobally
 * - getLeadCampaigns
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  createMockClient,
  mockData,
  MockSmartleadClient,
} from '../mocks/smartlead-client.mock.js';
import * as leadTools from '../../src/tools/leads.js';
import type { SmartleadClient } from '../../src/smartlead-client.js';

describe('Lead Tools', () => {
  let mockClient: MockSmartleadClient;

  beforeEach(() => {
    mockClient = createMockClient();
    jest.clearAllMocks();
  });

  describe('listCampaignLeads', () => {
    it('should list leads with default pagination', async () => {
      const response = mockData.leadsListResponse({
        total_leads: 150,
        data: [
          mockData.campaignLeadData(),
          mockData.campaignLeadData({ campaign_lead_map_id: 2 }),
        ],
      });
      mockClient.get.mockResolvedValue(response);

      const result = await leadTools.listCampaignLeads(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123 }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/leads', {
        offset: 0,
        limit: 100,
      });
      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
      expect(parsed.total_leads).toBe(150);
      expect(parsed.data).toHaveLength(2);
    });

    it('should list leads with custom pagination', async () => {
      const response = mockData.leadsListResponse({
        offset: 50,
        limit: 25,
      });
      mockClient.get.mockResolvedValue(response);

      const result = await leadTools.listCampaignLeads(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, offset: 50, limit: 25 }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/leads', {
        offset: 50,
        limit: 25,
      });
    });

    it('should throw validation error for limit exceeding 100', async () => {
      await expect(
        leadTools.listCampaignLeads(
          mockClient as unknown as SmartleadClient,
          { campaign_id: 123, limit: 200 }
        )
      ).rejects.toThrow();
    });

    it('should throw validation error for negative offset', async () => {
      await expect(
        leadTools.listCampaignLeads(
          mockClient as unknown as SmartleadClient,
          { campaign_id: 123, offset: -5 }
        )
      ).rejects.toThrow();
    });
  });

  describe('addLeadsToCampaign', () => {
    it('should add leads to campaign', async () => {
      const response = mockData.addLeadsResponse({
        upload_count: 3,
        total_leads: 50,
      });
      mockClient.post.mockResolvedValue(response);

      const leadList = [
        { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
        { first_name: 'Jane', last_name: 'Smith', email: 'jane@example.com' },
        { first_name: 'Bob', last_name: 'Wilson', email: 'bob@example.com' },
      ];

      const result = await leadTools.addLeadsToCampaign(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, lead_list: leadList }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/123/leads', {
        lead_list: leadList,
      });
      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
      expect(parsed.upload_count).toBe(3);
      expect(parsed.total_leads).toBe(50);
    });

    it('should add leads with all optional fields', async () => {
      const response = mockData.addLeadsResponse();
      mockClient.post.mockResolvedValue(response);

      const leadList = [
        {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone_number: '+1234567890',
          company_name: 'Acme Inc',
          website: 'https://example.com',
          location: 'New York, NY',
          linkedin_profile: 'https://linkedin.com/in/johndoe',
          company_url: 'https://acme.com',
          custom_fields: { industry: 'Technology' },
        },
      ];

      await leadTools.addLeadsToCampaign(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, lead_list: leadList }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/123/leads', {
        lead_list: leadList,
      });
    });

    it('should add leads with settings', async () => {
      const response = mockData.addLeadsResponse();
      mockClient.post.mockResolvedValue(response);

      const settings = {
        ignore_global_block_list: true,
        ignore_unsubscribe_list: false,
        ignore_duplicate_leads_in_other_campaign: true,
      };

      await leadTools.addLeadsToCampaign(
        mockClient as unknown as SmartleadClient,
        {
          campaign_id: 123,
          lead_list: [{ first_name: 'John', last_name: 'Doe', email: 'john@example.com' }],
          settings,
        }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/123/leads', {
        lead_list: [{ first_name: 'John', last_name: 'Doe', email: 'john@example.com' }],
        settings,
      });
    });

    it('should report upload statistics including duplicates and invalid emails', async () => {
      const response = mockData.addLeadsResponse({
        upload_count: 5,
        already_added_to_campaign: 2,
        duplicate_count: 1,
        invalid_email_count: 3,
        unsubscribed_leads: 1,
      });
      mockClient.post.mockResolvedValue(response);

      const result = await leadTools.addLeadsToCampaign(
        mockClient as unknown as SmartleadClient,
        {
          campaign_id: 123,
          lead_list: [{ first_name: 'John', last_name: 'Doe', email: 'john@example.com' }],
        }
      );

      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.already_added_to_campaign).toBe(2);
      expect(parsed.duplicate_count).toBe(1);
      expect(parsed.invalid_email_count).toBe(3);
      expect(parsed.unsubscribed_leads).toBe(1);
    });

    it('should throw validation error for invalid email', async () => {
      await expect(
        leadTools.addLeadsToCampaign(
          mockClient as unknown as SmartleadClient,
          {
            campaign_id: 123,
            lead_list: [{ first_name: 'John', last_name: 'Doe', email: 'invalid-email' }],
          }
        )
      ).rejects.toThrow();
    });

    it('should throw validation error for empty lead_list', async () => {
      await expect(
        leadTools.addLeadsToCampaign(
          mockClient as unknown as SmartleadClient,
          { campaign_id: 123, lead_list: [] }
        )
      ).rejects.toThrow();
    });
  });

  describe('pauseLead', () => {
    it('should pause a lead in a campaign', async () => {
      mockClient.post.mockResolvedValue({ ok: true, data: 'Lead paused' });

      const result = await leadTools.pauseLead(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, lead_id: 456 }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/123/leads/456/pause');
      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.ok).toBe(true);
    });

    it('should report failure when pause fails', async () => {
      mockClient.post.mockResolvedValue({ ok: false, data: '' });

      const result = await leadTools.pauseLead(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, lead_id: 456 }
      );

      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.ok).toBe(false);
    });
  });

  describe('resumeLead', () => {
    it('should resume a lead without delay', async () => {
      mockClient.post.mockResolvedValue({ ok: true, data: 'Lead resumed' });

      const result = await leadTools.resumeLead(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, lead_id: 456 }
      );

      expect(mockClient.post).toHaveBeenCalledWith(
        '/campaigns/123/leads/456/resume',
        {}
      );
      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.ok).toBe(true);
    });

    it('should resume a lead with delay', async () => {
      mockClient.post.mockResolvedValue({ ok: true, data: 'Lead resumed' });

      await leadTools.resumeLead(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, lead_id: 456, resume_lead_with_delay_days: 5 }
      );

      expect(mockClient.post).toHaveBeenCalledWith(
        '/campaigns/123/leads/456/resume',
        { resume_lead_with_delay_days: 5 }
      );
    });

    it('should report failure when resume fails', async () => {
      mockClient.post.mockResolvedValue({ ok: false, data: '' });

      const result = await leadTools.resumeLead(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, lead_id: 456 }
      );

      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.ok).toBe(false);
    });
  });

  describe('deleteLeadFromCampaign', () => {
    it('should delete a lead from a campaign', async () => {
      mockClient.delete.mockResolvedValue({ ok: true });

      const result = await leadTools.deleteLeadFromCampaign(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, lead_id: 456 }
      );

      expect(mockClient.delete).toHaveBeenCalledWith('/campaigns/123/leads/456');
      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.ok).toBe(true);
    });

    it('should report failure when delete fails', async () => {
      mockClient.delete.mockResolvedValue({ ok: false });

      const result = await leadTools.deleteLeadFromCampaign(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, lead_id: 456 }
      );

      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.ok).toBe(false);
    });
  });

  describe('unsubscribeLeadFromCampaign', () => {
    it('should unsubscribe a lead from a campaign', async () => {
      mockClient.post.mockResolvedValue({ ok: true });

      const result = await leadTools.unsubscribeLeadFromCampaign(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, lead_id: 456 }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/campaigns/123/leads/456/unsubscribe');
      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.ok).toBe(true);
    });

    it('should report failure when unsubscribe fails', async () => {
      mockClient.post.mockResolvedValue({ ok: false });

      const result = await leadTools.unsubscribeLeadFromCampaign(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, lead_id: 456 }
      );

      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.ok).toBe(false);
    });
  });

  describe('getLeadByEmail', () => {
    it('should get lead by email address', async () => {
      const lead = mockData.lead({ email: 'john@example.com' });
      mockClient.get.mockResolvedValue(lead);

      const result = await leadTools.getLeadByEmail(
        mockClient as unknown as SmartleadClient,
        { email: 'john@example.com' }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/leads', { email: 'john@example.com' });
      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
      expect(parsed.email).toBe('john@example.com');
    });

    it('should throw validation error for invalid email format', async () => {
      await expect(
        leadTools.getLeadByEmail(
          mockClient as unknown as SmartleadClient,
          { email: 'not-an-email' }
        )
      ).rejects.toThrow();
    });
  });

  describe('unsubscribeLeadGlobally', () => {
    it('should unsubscribe lead from all campaigns', async () => {
      mockClient.post.mockResolvedValue({ ok: true });

      const result = await leadTools.unsubscribeLeadGlobally(
        mockClient as unknown as SmartleadClient,
        { lead_id: 789 }
      );

      expect(mockClient.post).toHaveBeenCalledWith('/leads/789/unsubscribe');
      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.ok).toBe(true);
    });

    it('should report failure when global unsubscribe fails', async () => {
      mockClient.post.mockResolvedValue({ ok: false });

      const result = await leadTools.unsubscribeLeadGlobally(
        mockClient as unknown as SmartleadClient,
        { lead_id: 789 }
      );

      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.ok).toBe(false);
    });
  });

  describe('getLeadCampaigns', () => {
    it('should get all campaigns for a lead', async () => {
      const campaigns = [
        { id: 1, status: 'ACTIVE', name: 'Campaign 1' },
        { id: 2, status: 'PAUSED', name: 'Campaign 2' },
      ];
      mockClient.get.mockResolvedValue(campaigns);

      const result = await leadTools.getLeadCampaigns(
        mockClient as unknown as SmartleadClient,
        { lead_id: 789 }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/leads/789/campaigns');
      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].name).toBe('Campaign 1');
      expect(parsed[1].name).toBe('Campaign 2');
    });

    it('should handle lead with no campaigns', async () => {
      mockClient.get.mockResolvedValue([]);

      const result = await leadTools.getLeadCampaigns(
        mockClient as unknown as SmartleadClient,
        { lead_id: 789 }
      );

      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(0);
    });

    it('should throw validation error for invalid lead_id', async () => {
      await expect(
        leadTools.getLeadCampaigns(
          mockClient as unknown as SmartleadClient,
          { lead_id: 0 }
        )
      ).rejects.toThrow();
    });
  });
});
