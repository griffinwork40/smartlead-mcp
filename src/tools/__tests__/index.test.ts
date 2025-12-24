/**
 * Tool Registry Tests
 *
 * Unit tests for the central tool registry and execution.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmartleadClient } from '../../smartlead-client.js';
import { ALL_TOOLS, executeTool, hasToolHandler } from '../index.js';

// Mock the tool handlers
vi.mock('../campaigns.js', () => ({
  createCampaign: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'created' }] }),
  getCampaign: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'got campaign' }] }),
  listCampaigns: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'listed' }] }),
  updateCampaignSchedule: vi.fn(),
  updateCampaignSettings: vi.fn(),
  updateCampaignStatus: vi.fn(),
  deleteCampaign: vi.fn(),
  listCampaignEmailAccounts: vi.fn(),
  addCampaignEmailAccounts: vi.fn(),
  removeCampaignEmailAccounts: vi.fn(),
}));

vi.mock('../leads.js', () => ({
  listCampaignLeads: vi.fn(),
  addLeadsToCampaign: vi.fn(),
  pauseLead: vi.fn(),
  resumeLead: vi.fn(),
  deleteLeadFromCampaign: vi.fn(),
  unsubscribeLeadFromCampaign: vi.fn(),
  getLeadByEmail: vi.fn(),
  unsubscribeLeadGlobally: vi.fn(),
  getLeadCampaigns: vi.fn(),
}));

vi.mock('../email-accounts.js', () => ({
  listEmailAccounts: vi.fn(),
  getEmailAccount: vi.fn(),
  updateWarmupSettings: vi.fn(),
  getWarmupStats: vi.fn(),
  reconnectFailedAccounts: vi.fn(),
  createEmailAccount: vi.fn(),
  updateEmailAccount: vi.fn(),
}));

vi.mock('../analytics.js', () => ({
  getCampaignStatistics: vi.fn(),
  getCampaignAnalytics: vi.fn(),
  getCampaignAnalyticsByDate: vi.fn(),
}));

describe('Tool Registry', () => {
  const mockClient = {} as SmartleadClient;

  describe('ALL_TOOLS', () => {
    it('should export exactly 29 tools', () => {
      expect(ALL_TOOLS.length).toBe(29);
    });

    it('should have unique tool names', () => {
      const toolNames = ALL_TOOLS.map((tool) => tool.name);
      const uniqueNames = new Set(toolNames);
      expect(uniqueNames.size).toBe(toolNames.length);
    });

    it('should have all required fields for each tool', () => {
      ALL_TOOLS.forEach((tool) => {
        expect(tool.name).toBeDefined();
        expect(typeof tool.name).toBe('string');
        expect(tool.description).toBeDefined();
        expect(typeof tool.description).toBe('string');
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe('object');
        expect(tool.inputSchema.properties).toBeDefined();
      });
    });

    it('should include campaign tools', () => {
      const campaignToolNames = [
        'create_campaign',
        'get_campaign',
        'list_campaigns',
        'update_campaign_schedule',
        'update_campaign_settings',
        'update_campaign_status',
        'delete_campaign',
        'list_campaign_email_accounts',
        'add_campaign_email_accounts',
        'remove_campaign_email_accounts',
      ];
      campaignToolNames.forEach((name) => {
        expect(ALL_TOOLS.some((tool) => tool.name === name)).toBe(true);
      });
    });

    it('should include lead tools', () => {
      const leadToolNames = [
        'list_campaign_leads',
        'add_leads_to_campaign',
        'pause_lead',
        'resume_lead',
        'delete_lead_from_campaign',
        'unsubscribe_lead_from_campaign',
        'get_lead_by_email',
        'unsubscribe_lead_globally',
        'get_lead_campaigns',
      ];
      leadToolNames.forEach((name) => {
        expect(ALL_TOOLS.some((tool) => tool.name === name)).toBe(true);
      });
    });

    it('should include email account tools', () => {
      const emailToolNames = [
        'list_email_accounts',
        'get_email_account',
        'update_warmup_settings',
        'get_warmup_stats',
        'reconnect_failed_accounts',
        'create_email_account',
        'update_email_account',
      ];
      emailToolNames.forEach((name) => {
        expect(ALL_TOOLS.some((tool) => tool.name === name)).toBe(true);
      });
    });

    it('should include analytics tools', () => {
      const analyticsToolNames = [
        'get_campaign_statistics',
        'get_campaign_analytics',
        'get_campaign_analytics_by_date',
      ];
      analyticsToolNames.forEach((name) => {
        expect(ALL_TOOLS.some((tool) => tool.name === name)).toBe(true);
      });
    });
  });

  describe('hasToolHandler', () => {
    it('should return true for existing tools', () => {
      expect(hasToolHandler('create_campaign')).toBe(true);
      expect(hasToolHandler('list_campaigns')).toBe(true);
      expect(hasToolHandler('get_campaign_analytics')).toBe(true);
    });

    it('should return false for non-existent tools', () => {
      expect(hasToolHandler('non_existent_tool')).toBe(false);
      expect(hasToolHandler('')).toBe(false);
      expect(hasToolHandler('random_tool_name')).toBe(false);
    });
  });

  describe('executeTool', () => {
    it('should execute existing tool', async () => {
      const result = await executeTool('create_campaign', mockClient, { name: 'Test' });
      expect(result.content[0].text).toBe('created');
    });

    it('should throw error for unknown tool', async () => {
      await expect(executeTool('unknown_tool', mockClient, {})).rejects.toThrow('Unknown tool');
    });

    it('should pass arguments to handler', async () => {
      const { getCampaign } = await import('../campaigns.js');
      await executeTool('get_campaign', mockClient, { campaign_id: 123 });
      expect(getCampaign).toHaveBeenCalledWith(mockClient, { campaign_id: 123 });
    });
  });
});
