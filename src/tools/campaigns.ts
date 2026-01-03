/**
 * Campaign Management Tools
 *
 * MCP tools for managing Smartlead campaigns including creation, updates,
 * status changes, and email account associations.
 */

import { SmartleadClient } from '../smartlead-client.js';
import {
  Campaign,
  CreateCampaignResponse,
  EmailAccount,
  OkResponse,
  CreateCampaignSchema,
  GetCampaignSchema,
  UpdateCampaignScheduleSchema,
  UpdateCampaignSettingsSchema,
  UpdateCampaignStatusSchema,
  ManageCampaignEmailAccountsSchema,
  SaveCampaignSequencesSchema,
  SaveSequencesResponse,
} from '../types/smartlead.js';

/**
 * Create a new campaign
 */
export async function createCampaign(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = CreateCampaignSchema.parse(args);

  const result = await client.post<CreateCampaignResponse>('/campaigns/create', {
    name: params.name,
    ...(params.client_id && { client_id: params.client_id }),
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

/**
 * Get campaign by ID
 */
export async function getCampaign(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = GetCampaignSchema.parse(args);

  const campaign = await client.get<Campaign>(`/campaigns/${params.campaign_id}`);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(campaign, null, 2),
      },
    ],
  };
}

/**
 * List all campaigns
 */
export async function listCampaigns(
  client: SmartleadClient
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const campaigns = await client.get<Campaign[]>('/campaigns');

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(campaigns, null, 2),
      },
    ],
  };
}

/**
 * Update campaign schedule
 */
export async function updateCampaignSchedule(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = UpdateCampaignScheduleSchema.parse(args);

  const { campaign_id, ...scheduleData } = params;

  const result = await client.post<OkResponse>(`/campaigns/${campaign_id}/schedule`, scheduleData);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

/**
 * Update campaign settings
 */
export async function updateCampaignSettings(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = UpdateCampaignSettingsSchema.parse(args);

  const { campaign_id, ...settingsData } = params;

  const result = await client.post<OkResponse>(`/campaigns/${campaign_id}/settings`, settingsData);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

/**
 * Update campaign status
 */
export async function updateCampaignStatus(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = UpdateCampaignStatusSchema.parse(args);

  const result = await client.post<OkResponse>(`/campaigns/${params.campaign_id}/status`, {
    status: params.status,
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

/**
 * Delete campaign
 */
export async function deleteCampaign(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = GetCampaignSchema.parse(args);

  const result = await client.delete<OkResponse>(`/campaigns/${params.campaign_id}`);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

/**
 * List email accounts for campaign
 */
export async function listCampaignEmailAccounts(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = GetCampaignSchema.parse(args);

  const accounts = await client.get<EmailAccount[]>(`/campaigns/${params.campaign_id}/email-accounts`);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(accounts, null, 2),
      },
    ],
  };
}

/**
 * Add email accounts to campaign
 */
export async function addCampaignEmailAccounts(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = ManageCampaignEmailAccountsSchema.parse(args);

  const result = await client.post(`/campaigns/${params.campaign_id}/email-accounts`, {
    email_account_ids: params.email_account_ids,
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

/**
 * Remove email accounts from campaign
 */
export async function removeCampaignEmailAccounts(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = ManageCampaignEmailAccountsSchema.parse(args);

  const result = await client.delete(`/campaigns/${params.campaign_id}/email-accounts`, {
    email_account_ids: params.email_account_ids,
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

/**
 * Save email sequences for a campaign
 * Creates new sequences if id is null, updates existing if id is provided
 */
export async function saveCampaignSequences(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = SaveCampaignSequencesSchema.parse(args);

  const { campaign_id, ...sequenceData } = params;

  const result = await client.post<SaveSequencesResponse>(
    `/campaigns/${campaign_id}/sequences`,
    sequenceData
  );

  const seqCount = params.sequences.length;
  const hasUpdates = params.sequences.some((s: { id?: number | null }) => s.id);
  const action = hasUpdates ? 'updated' : 'created';

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
