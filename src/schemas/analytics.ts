/**
 * Analytics Tool Schemas
 *
 * MCP tool definitions for campaign analytics and statistics operations.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * All analytics-related MCP tool definitions
 */
export const analyticsTools: Tool[] = [
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
