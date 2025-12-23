/**
 * Lead Tool Schemas
 *
 * MCP tool definitions for lead management operations.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * All lead-related MCP tool definitions
 */
export const leadTools: Tool[] = [
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
];
