#!/usr/bin/env node

/**
 * Smartlead MCP Server
 *
 * Model Context Protocol server that exposes Smartlead API functionality
 * through well-designed tools for campaign management, lead handling,
 * email account management, and analytics.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { SmartleadClient } from './smartlead-client.js';
import {
  CreateCampaignSchema,
  GetCampaignSchema,
  UpdateCampaignScheduleSchema,
  UpdateCampaignSettingsSchema,
  UpdateCampaignStatusSchema,
  ManageCampaignEmailAccountsSchema,
  ListCampaignLeadsSchema,
  AddLeadsSchema,
  LeadActionSchema,
  ResumeLeadSchema,
  GetLeadByEmailSchema,
  GetLeadCampaignsSchema,
  ListEmailAccountsSchema,
  GetEmailAccountSchema,
  UpdateWarmupSettingsSchema,
  CreateEmailAccountSchema,
  UpdateEmailAccountSchema,
  GetCampaignStatisticsSchema,
  GetCampaignAnalyticsByDateSchema,
} from './types/smartlead.js';
import * as campaignTools from './tools/campaigns.js';
import * as leadTools from './tools/leads.js';
import * as emailAccountTools from './tools/email-accounts.js';
import * as analyticsTools from './tools/analytics.js';

// Initialize Smartlead client
const apiKey = process.env.SMARTLEAD_API_KEY;
if (!apiKey) {
  console.error('Error: SMARTLEAD_API_KEY environment variable is required');
  process.exit(1);
}

const smartleadClient = new SmartleadClient({ apiKey });

// Define all available tools
const TOOLS: Tool[] = [
  // Campaign Management Tools
  {
    name: 'create_campaign',
    description: 'Create a new email campaign in Smartlead',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Campaign name' },
        client_id: { type: 'number', description: 'Client ID (optional)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_campaign',
    description: 'Get details of a specific campaign by ID',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'number', description: 'Campaign ID' },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'list_campaigns',
    description: 'List all campaigns in your Smartlead account',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'update_campaign_schedule',
    description: 'Update campaign schedule settings (timezone, days, hours, lead limits)',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'number', description: 'Campaign ID' },
        timezone: { type: 'string', description: 'Timezone (e.g., America/New_York)' },
        days_of_the_week: { type: 'array', items: { type: 'number' }, description: 'Days of week (0-6)' },
        start_hour: { type: 'string', description: 'Start hour (HH:MM)' },
        end_hour: { type: 'string', description: 'End hour (HH:MM)' },
        min_time_btw_emails: { type: 'number', description: 'Min time between emails (minutes)' },
        max_new_leads_per_day: { type: 'number', description: 'Max new leads per day' },
        schedule_start_time: { type: 'string', description: 'Schedule start time (ISO 8601)' },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'update_campaign_settings',
    description: 'Update campaign general settings (tracking, unsubscribe text, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'number', description: 'Campaign ID' },
        track_settings: { type: 'array', items: { type: 'string' }, description: 'Tracking settings' },
        stop_lead_settings: { type: 'string', description: 'Stop lead settings' },
        unsubscribe_text: { type: 'string', description: 'Unsubscribe text' },
        send_as_plain_text: { type: 'boolean', description: 'Send as plain text' },
        follow_up_percentage: { type: 'number', description: 'Follow up percentage (0-100)' },
        client_id: { type: 'number', description: 'Client ID' },
        enable_ai_esp_matching: { type: 'boolean', description: 'Enable AI ESP matching' },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'update_campaign_status',
    description: 'Update campaign status (PAUSED, STOPPED, or START)',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'number', description: 'Campaign ID' },
        status: { type: 'string', enum: ['PAUSED', 'STOPPED', 'START'], description: 'New status' },
      },
      required: ['campaign_id', 'status'],
    },
  },
  {
    name: 'delete_campaign',
    description: 'Delete a campaign permanently',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'number', description: 'Campaign ID' },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'list_campaign_email_accounts',
    description: 'List all email accounts associated with a campaign',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'number', description: 'Campaign ID' },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'add_campaign_email_accounts',
    description: 'Add email accounts to a campaign',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'number', description: 'Campaign ID' },
        email_account_ids: { type: 'array', items: { type: 'number' }, description: 'Email account IDs' },
      },
      required: ['campaign_id', 'email_account_ids'],
    },
  },
  {
    name: 'remove_campaign_email_accounts',
    description: 'Remove email accounts from a campaign',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'number', description: 'Campaign ID' },
        email_account_ids: { type: 'array', items: { type: 'number' }, description: 'Email account IDs' },
      },
      required: ['campaign_id', 'email_account_ids'],
    },
  },

  // Lead Management Tools
  {
    name: 'list_campaign_leads',
    description: 'List all leads in a campaign with pagination',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'number', description: 'Campaign ID' },
        offset: { type: 'number', description: 'Offset for pagination', default: 0 },
        limit: { type: 'number', description: 'Limit for pagination', default: 100 },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'add_leads_to_campaign',
    description: 'Add leads to a campaign (max 100 leads per request)',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'number', description: 'Campaign ID' },
        lead_list: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              first_name: { type: 'string' },
              last_name: { type: 'string' },
              email: { type: 'string' },
              phone_number: { type: 'string' },
              company_name: { type: 'string' },
              website: { type: 'string' },
              location: { type: 'string' },
              linkedin_profile: { type: 'string' },
              company_url: { type: 'string' },
              custom_fields: { type: 'object' },
            },
            required: ['first_name', 'last_name', 'email'],
          },
          description: 'List of leads to add',
        },
        settings: {
          type: 'object',
          properties: {
            ignore_global_block_list: { type: 'boolean' },
            ignore_unsubscribe_list: { type: 'boolean' },
            ignore_duplicate_leads_in_other_campaign: { type: 'boolean' },
          },
          description: 'Upload settings',
        },
      },
      required: ['campaign_id', 'lead_list'],
    },
  },
  {
    name: 'pause_lead',
    description: 'Pause a lead in a campaign',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'number', description: 'Campaign ID' },
        lead_id: { type: 'number', description: 'Lead ID' },
      },
      required: ['campaign_id', 'lead_id'],
    },
  },
  {
    name: 'resume_lead',
    description: 'Resume a paused lead in a campaign',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'number', description: 'Campaign ID' },
        lead_id: { type: 'number', description: 'Lead ID' },
        resume_lead_with_delay_days: { type: 'number', description: 'Resume with delay (days)' },
      },
      required: ['campaign_id', 'lead_id'],
    },
  },
  {
    name: 'delete_lead_from_campaign',
    description: 'Delete a lead from a campaign',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'number', description: 'Campaign ID' },
        lead_id: { type: 'number', description: 'Lead ID' },
      },
      required: ['campaign_id', 'lead_id'],
    },
  },
  {
    name: 'unsubscribe_lead_from_campaign',
    description: 'Unsubscribe a lead from a specific campaign',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'number', description: 'Campaign ID' },
        lead_id: { type: 'number', description: 'Lead ID' },
      },
      required: ['campaign_id', 'lead_id'],
    },
  },
  {
    name: 'get_lead_by_email',
    description: 'Get lead details by email address',
    inputSchema: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Lead email address' },
      },
      required: ['email'],
    },
  },
  {
    name: 'unsubscribe_lead_globally',
    description: 'Unsubscribe a lead from all campaigns globally',
    inputSchema: {
      type: 'object',
      properties: {
        lead_id: { type: 'number', description: 'Lead ID' },
      },
      required: ['lead_id'],
    },
  },
  {
    name: 'get_lead_campaigns',
    description: 'Get all campaigns associated with a lead',
    inputSchema: {
      type: 'object',
      properties: {
        lead_id: { type: 'number', description: 'Lead ID' },
      },
      required: ['lead_id'],
    },
  },

  // Email Account Tools
  {
    name: 'list_email_accounts',
    description: 'List all email accounts with pagination',
    inputSchema: {
      type: 'object',
      properties: {
        offset: { type: 'number', description: 'Offset for pagination', default: 0 },
        limit: { type: 'number', description: 'Limit for pagination', default: 100 },
      },
    },
  },
  {
    name: 'get_email_account',
    description: 'Get details of a specific email account',
    inputSchema: {
      type: 'object',
      properties: {
        account_id: { type: 'number', description: 'Email account ID' },
      },
      required: ['account_id'],
    },
  },
  {
    name: 'update_warmup_settings',
    description: 'Update warmup settings for an email account',
    inputSchema: {
      type: 'object',
      properties: {
        email_account_id: { type: 'number', description: 'Email account ID' },
        warmup_enabled: { type: 'boolean', description: 'Enable warmup' },
        total_warmup_per_day: { type: 'number', description: 'Total warmup emails per day' },
        daily_rampup: { type: 'number', description: 'Daily rampup count' },
        reply_rate_percentage: { type: 'number', description: 'Reply rate percentage (0-100)' },
        warmup_key_id: { type: 'string', description: 'Warmup key ID' },
      },
      required: ['email_account_id', 'warmup_enabled'],
    },
  },
  {
    name: 'get_warmup_stats',
    description: 'Get warmup statistics for an email account (last 7 days)',
    inputSchema: {
      type: 'object',
      properties: {
        account_id: { type: 'number', description: 'Email account ID' },
      },
      required: ['account_id'],
    },
  },
  {
    name: 'reconnect_failed_accounts',
    description: 'Reconnect all failed email accounts (bulk operation)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'create_email_account',
    description: 'Create a new email account by connecting existing SMTP/IMAP credentials (Gmail, Outlook, custom SMTP, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        from_name: { type: 'string', description: 'Display name for the email account' },
        from_email: { type: 'string', description: 'Email address' },
        username: { type: 'string', description: 'Username for SMTP/IMAP authentication' },
        password: { type: 'string', description: 'Password for SMTP/IMAP authentication' },
        smtp_host: { type: 'string', description: 'SMTP server hostname' },
        smtp_port: { type: 'number', description: 'SMTP server port' },
        imap_host: { type: 'string', description: 'IMAP server hostname' },
        imap_port: { type: 'number', description: 'IMAP server port' },
        message_per_day: { type: 'number', description: 'Maximum messages per day' },
        type: { type: 'string', enum: ['SMTP', 'GMAIL', 'ZOHO', 'OUTLOOK'], description: 'Email account type' },
        client_id: { type: 'number', description: 'Client ID (optional)' },
      },
      required: ['from_name', 'from_email', 'username', 'password', 'smtp_host', 'smtp_port', 'imap_host', 'imap_port', 'message_per_day', 'type'],
    },
  },
  {
    name: 'update_email_account',
    description: 'Update email account settings (SMTP/IMAP credentials, message limits, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        email_account_id: { type: 'number', description: 'Email account ID' },
        from_name: { type: 'string', description: 'Display name for the email account' },
        from_email: { type: 'string', description: 'Email address' },
        username: { type: 'string', description: 'Username for SMTP/IMAP authentication' },
        password: { type: 'string', description: 'Password for SMTP/IMAP authentication' },
        smtp_host: { type: 'string', description: 'SMTP server hostname' },
        smtp_port: { type: 'number', description: 'SMTP server port' },
        imap_host: { type: 'string', description: 'IMAP server hostname' },
        imap_port: { type: 'number', description: 'IMAP server port' },
        message_per_day: { type: 'number', description: 'Maximum messages per day' },
        type: { type: 'string', enum: ['SMTP', 'GMAIL', 'ZOHO', 'OUTLOOK'], description: 'Email account type' },
        client_id: { type: 'number', description: 'Client ID' },
      },
      required: ['email_account_id'],
    },
  },

  // Analytics Tools
  {
    name: 'get_campaign_statistics',
    description: 'Get detailed campaign statistics with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'number', description: 'Campaign ID' },
        offset: { type: 'number', description: 'Offset for pagination', default: 0 },
        limit: { type: 'number', description: 'Limit for pagination', default: 100 },
        email_sequence_number: { type: 'number', description: 'Filter by email sequence number' },
        email_status: {
          type: 'string',
          enum: ['opened', 'clicked', 'replied', 'unsubscribed', 'bounced'],
          description: 'Filter by email status',
        },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'get_campaign_analytics',
    description: 'Get top-level campaign analytics summary',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'number', description: 'Campaign ID' },
      },
      required: ['campaign_id'],
    },
  },
  {
    name: 'get_campaign_analytics_by_date',
    description: 'Get campaign analytics for a specific date range',
    inputSchema: {
      type: 'object',
      properties: {
        campaign_id: { type: 'number', description: 'Campaign ID' },
        start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
        end_date: { type: 'string', description: 'End date (YYYY-MM-DD)' },
      },
      required: ['campaign_id', 'start_date', 'end_date'],
    },
  },
];

// Initialize MCP server
const server = new Server(
  {
    name: 'smartlead-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Register tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    // Campaign Management Tools
    if (name === 'create_campaign') {
      return await campaignTools.createCampaign(smartleadClient, args);
    }
    if (name === 'get_campaign') {
      return await campaignTools.getCampaign(smartleadClient, args);
    }
    if (name === 'list_campaigns') {
      return await campaignTools.listCampaigns(smartleadClient);
    }
    if (name === 'update_campaign_schedule') {
      return await campaignTools.updateCampaignSchedule(smartleadClient, args);
    }
    if (name === 'update_campaign_settings') {
      return await campaignTools.updateCampaignSettings(smartleadClient, args);
    }
    if (name === 'update_campaign_status') {
      return await campaignTools.updateCampaignStatus(smartleadClient, args);
    }
    if (name === 'delete_campaign') {
      return await campaignTools.deleteCampaign(smartleadClient, args);
    }
    if (name === 'list_campaign_email_accounts') {
      return await campaignTools.listCampaignEmailAccounts(smartleadClient, args);
    }
    if (name === 'add_campaign_email_accounts') {
      return await campaignTools.addCampaignEmailAccounts(smartleadClient, args);
    }
    if (name === 'remove_campaign_email_accounts') {
      return await campaignTools.removeCampaignEmailAccounts(smartleadClient, args);
    }

    // Lead Management Tools
    if (name === 'list_campaign_leads') {
      return await leadTools.listCampaignLeads(smartleadClient, args);
    }
    if (name === 'add_leads_to_campaign') {
      return await leadTools.addLeadsToCampaign(smartleadClient, args);
    }
    if (name === 'pause_lead') {
      return await leadTools.pauseLead(smartleadClient, args);
    }
    if (name === 'resume_lead') {
      return await leadTools.resumeLead(smartleadClient, args);
    }
    if (name === 'delete_lead_from_campaign') {
      return await leadTools.deleteLeadFromCampaign(smartleadClient, args);
    }
    if (name === 'unsubscribe_lead_from_campaign') {
      return await leadTools.unsubscribeLeadFromCampaign(smartleadClient, args);
    }
    if (name === 'get_lead_by_email') {
      return await leadTools.getLeadByEmail(smartleadClient, args);
    }
    if (name === 'unsubscribe_lead_globally') {
      return await leadTools.unsubscribeLeadGlobally(smartleadClient, args);
    }
    if (name === 'get_lead_campaigns') {
      return await leadTools.getLeadCampaigns(smartleadClient, args);
    }

    // Email Account Tools
    if (name === 'list_email_accounts') {
      return await emailAccountTools.listEmailAccounts(smartleadClient, args || {});
    }
    if (name === 'get_email_account') {
      return await emailAccountTools.getEmailAccount(smartleadClient, args);
    }
    if (name === 'update_warmup_settings') {
      return await emailAccountTools.updateWarmupSettings(smartleadClient, args);
    }
    if (name === 'get_warmup_stats') {
      return await emailAccountTools.getWarmupStats(smartleadClient, args);
    }
    if (name === 'reconnect_failed_accounts') {
      return await emailAccountTools.reconnectFailedAccounts(smartleadClient);
    }
    if (name === 'create_email_account') {
      return await emailAccountTools.createEmailAccount(smartleadClient, args);
    }
    if (name === 'update_email_account') {
      return await emailAccountTools.updateEmailAccount(smartleadClient, args);
    }

    // Analytics Tools
    if (name === 'get_campaign_statistics') {
      return await analyticsTools.getCampaignStatistics(smartleadClient, args);
    }
    if (name === 'get_campaign_analytics') {
      return await analyticsTools.getCampaignAnalytics(smartleadClient, args);
    }
    if (name === 'get_campaign_analytics_by_date') {
      return await analyticsTools.getCampaignAnalyticsByDate(smartleadClient, args);
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Smartlead MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
