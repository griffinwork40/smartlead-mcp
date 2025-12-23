/**
 * Email Account Tool Schemas
 *
 * MCP tool definitions for email account management operations.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * All email account-related MCP tool definitions
 */
export const emailAccountTools: Tool[] = [
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
];
