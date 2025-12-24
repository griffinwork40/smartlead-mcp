/**
 * Tools Index
 *
 * Central registry for all MCP tools. Aggregates tool definitions and handlers
 * from domain-specific modules and provides a unified interface for the server.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { SmartleadClient } from '../smartlead-client.js';

// Import tool schemas
import { campaignTools } from '../schemas/campaigns.js';
import { leadTools } from '../schemas/leads.js';
import { emailAccountTools } from '../schemas/email-accounts.js';
import { analyticsTools } from '../schemas/analytics.js';

// Import tool handlers
import * as campaignHandlers from './campaigns.js';
import * as leadHandlers from './leads.js';
import * as emailAccountHandlers from './email-accounts.js';
import * as analyticsHandlers from './analytics.js';

/**
 * Standard MCP tool response type
 */
export type ToolResponse = { content: Array<{ type: string; text: string }>; isError?: boolean };

/**
 * Tool handler function signature
 */
type ToolHandler = (client: SmartleadClient, args?: unknown) => Promise<ToolResponse>;

/**
 * All available MCP tools aggregated from domain modules
 */
export const ALL_TOOLS: Tool[] = [
  ...campaignTools,
  ...leadTools,
  ...emailAccountTools,
  ...analyticsTools,
];

/**
 * Tool handler registry mapping tool names to their handler functions
 */
const toolHandlers: Record<string, ToolHandler> = {
  // Campaign tools
  create_campaign: campaignHandlers.createCampaign,
  get_campaign: campaignHandlers.getCampaign,
  list_campaigns: campaignHandlers.listCampaigns,
  update_campaign_schedule: campaignHandlers.updateCampaignSchedule,
  update_campaign_settings: campaignHandlers.updateCampaignSettings,
  update_campaign_status: campaignHandlers.updateCampaignStatus,
  delete_campaign: campaignHandlers.deleteCampaign,
  list_campaign_email_accounts: campaignHandlers.listCampaignEmailAccounts,
  add_campaign_email_accounts: campaignHandlers.addCampaignEmailAccounts,
  remove_campaign_email_accounts: campaignHandlers.removeCampaignEmailAccounts,

  // Lead tools
  list_campaign_leads: leadHandlers.listCampaignLeads,
  add_leads_to_campaign: leadHandlers.addLeadsToCampaign,
  pause_lead: leadHandlers.pauseLead,
  resume_lead: leadHandlers.resumeLead,
  delete_lead_from_campaign: leadHandlers.deleteLeadFromCampaign,
  unsubscribe_lead_from_campaign: leadHandlers.unsubscribeLeadFromCampaign,
  get_lead_by_email: leadHandlers.getLeadByEmail,
  unsubscribe_lead_globally: leadHandlers.unsubscribeLeadGlobally,
  get_lead_campaigns: leadHandlers.getLeadCampaigns,

  // Email account tools
  list_email_accounts: emailAccountHandlers.listEmailAccounts,
  get_email_account: emailAccountHandlers.getEmailAccount,
  update_warmup_settings: emailAccountHandlers.updateWarmupSettings,
  get_warmup_stats: emailAccountHandlers.getWarmupStats,
  reconnect_failed_accounts: emailAccountHandlers.reconnectFailedAccounts,
  create_email_account: emailAccountHandlers.createEmailAccount,
  update_email_account: emailAccountHandlers.updateEmailAccount,

  // Analytics tools
  get_campaign_statistics: analyticsHandlers.getCampaignStatistics,
  get_campaign_analytics: analyticsHandlers.getCampaignAnalytics,
  get_campaign_analytics_by_date: analyticsHandlers.getCampaignAnalyticsByDate,
};

/**
 * Execute a tool by name with the given arguments
 *
 * @param toolName - Name of the tool to execute
 * @param client - SmartleadClient instance
 * @param args - Tool arguments
 * @returns Tool execution result
 * @throws Error if tool is not found
 */
export async function executeTool(
  toolName: string,
  client: SmartleadClient,
  args?: unknown
): Promise<ToolResponse> {
  const handler = toolHandlers[toolName];

  if (!handler) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  // Validate tool exists in schema registry for consistency
  const toolInRegistry = ALL_TOOLS.some((tool) => tool.name === toolName);
  if (!toolInRegistry) {
    console.warn(`[Warning] Handler exists for '${toolName}' but tool not found in ALL_TOOLS schema registry`);
  }

  return handler(client, args);
}

/**
 * Check if a tool exists in the registry
 */
export function hasToolHandler(toolName: string): boolean {
  return toolName in toolHandlers;
}
