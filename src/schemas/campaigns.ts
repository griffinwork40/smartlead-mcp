/**
 * Campaign Tool Schemas
 *
 * MCP tool definitions for campaign management operations.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * All campaign-related MCP tool definitions
 */
export const campaignTools: Tool[] = [
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
];
