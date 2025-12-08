/**
 * Email Account Management Tools
 *
 * MCP tools for managing email accounts including listing, retrieving,
 * and managing warmup settings.
 */

import { SmartleadClient } from '../smartlead-client.js';
import {
  EmailAccount,
  ListEmailAccountsSchema,
  GetEmailAccountSchema,
  UpdateWarmupSettingsSchema,
  CreateEmailAccountSchema,
  UpdateEmailAccountSchema,
} from '../types/smartlead.js';

/**
 * List all email accounts
 */
export async function listEmailAccounts(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = ListEmailAccountsSchema.parse(args);

  const accounts = await client.get<EmailAccount[]>('/email-accounts', {
    offset: params.offset,
    limit: params.limit,
  });

  return {
    content: [
      {
        type: 'text',
        text: `Found ${accounts.length} email accounts:\n\n${JSON.stringify(accounts, null, 2)}`,
      },
    ],
  };
}

/**
 * Get email account by ID
 */
export async function getEmailAccount(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = GetEmailAccountSchema.parse(args);

  const account = await client.get<EmailAccount>(`/email-accounts/${params.account_id}/`);

  return {
    content: [
      {
        type: 'text',
        text: `Email account details:\n\n${JSON.stringify(account, null, 2)}`,
      },
    ],
  };
}

/**
 * Update warmup settings for an email account
 */
export async function updateWarmupSettings(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = UpdateWarmupSettingsSchema.parse(args);

  const { email_account_id, ...warmupData } = params;

  const result = await client.post(`/email-accounts/${email_account_id}/warmup`, warmupData);

  return {
    content: [
      {
        type: 'text',
        text: `Warmup settings updated successfully for email account ${email_account_id}.\n\nWarmup enabled: ${warmupData.warmup_enabled}`,
      },
    ],
  };
}

/**
 * Get warmup stats for an email account
 */
export async function getWarmupStats(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = GetEmailAccountSchema.parse(args);

  const stats = await client.get<Record<string, unknown>>(`/email-accounts/${params.account_id}/warmup-stats`);

  return {
    content: [
      {
        type: 'text',
        text: `Warmup stats for email account ${params.account_id} (last 7 days):\n\n${JSON.stringify(stats, null, 2)}`,
      },
    ],
  };
}

/**
 * Reconnect failed email accounts (bulk operation)
 */
export async function reconnectFailedAccounts(
  client: SmartleadClient
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const result = await client.post<Record<string, unknown>>('/email-accounts/reconnect-failed-email-accounts', {});

  return {
    content: [
      {
        type: 'text',
        text: 'Reconnection process initiated for failed email accounts.\n\n' + JSON.stringify(result, null, 2),
      },
    ],
  };
}

/**
 * Create a new email account by connecting existing SMTP/IMAP credentials
 * Note: This connects an existing email account, it does not create accounts using Smartlead's infrastructure
 */
export async function createEmailAccount(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = CreateEmailAccountSchema.parse(args);

  // Set id to null to indicate creation (per OpenAPI spec)
  const accountData = {
    id: null,
    ...params,
  };

  const result = await client.post<EmailAccount>('/email-accounts/save', accountData);

  return {
    content: [
      {
        type: 'text',
        text: `Email account created successfully:\n\n${JSON.stringify(result, null, 2)}`,
      },
    ],
  };
}

/**
 * Update email account settings
 */
export async function updateEmailAccount(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = UpdateEmailAccountSchema.parse(args);

  const { email_account_id, ...updateData } = params;

  const result = await client.post<EmailAccount>(`/email-accounts/${email_account_id}`, updateData);

  return {
    content: [
      {
        type: 'text',
        text: `Email account ${email_account_id} updated successfully:\n\n${JSON.stringify(result, null, 2)}`,
      },
    ],
  };
}
