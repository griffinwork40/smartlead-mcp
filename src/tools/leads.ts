/**
 * Lead Management Tools
 *
 * MCP tools for managing leads in Smartlead campaigns including adding,
 * pausing, resuming, and unsubscribing leads.
 */

import { SmartleadClient } from '../smartlead-client.js';
import {
  Lead,
  LeadsListResponse,
  AddLeadsResponse,
  OkResponse,
  ListCampaignLeadsSchema,
  AddLeadsSchema,
  LeadActionSchema,
  ResumeLeadSchema,
  GetLeadByEmailSchema,
  GetLeadCampaignsSchema,
} from '../types/smartlead.js';

/**
 * List leads in a campaign
 */
export async function listCampaignLeads(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = ListCampaignLeadsSchema.parse(args);

  const result = await client.get<LeadsListResponse>(`/campaigns/${params.campaign_id}/leads`, {
    offset: params.offset,
    limit: params.limit,
  });

  return {
    content: [
      {
        type: 'text',
        text: `Found ${result.total_leads} total leads in campaign ${params.campaign_id}.\n\nShowing ${result.data.length} leads (offset: ${result.offset}, limit: ${result.limit}):\n\n${JSON.stringify(result.data, null, 2)}`,
      },
    ],
  };
}

/**
 * Add leads to a campaign
 */
export async function addLeadsToCampaign(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = AddLeadsSchema.parse(args);

  const result = await client.post<AddLeadsResponse>(`/campaigns/${params.campaign_id}/leads`, {
    lead_list: params.lead_list,
    ...(params.settings && { settings: params.settings }),
  });

  return {
    content: [
      {
        type: 'text',
        text: `Leads uploaded to campaign ${params.campaign_id}:\n\n` +
          `✓ Successfully uploaded: ${result.upload_count}\n` +
          `✓ Total leads in campaign: ${result.total_leads}\n` +
          `- Already in campaign: ${result.already_added_to_campaign}\n` +
          `- Duplicates: ${result.duplicate_count}\n` +
          `- Invalid emails: ${result.invalid_email_count}\n` +
          `- Unsubscribed: ${result.unsubscribed_leads}`,
      },
    ],
  };
}

/**
 * Pause a lead in a campaign
 */
export async function pauseLead(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = LeadActionSchema.parse(args);

  const result = await client.post<{ ok: boolean; data: string }>(
    `/campaigns/${params.campaign_id}/leads/${params.lead_id}/pause`
  );

  return {
    content: [
      {
        type: 'text',
        text: result.ok
          ? `Lead ${params.lead_id} paused successfully in campaign ${params.campaign_id}.`
          : 'Failed to pause lead.',
      },
    ],
  };
}

/**
 * Resume a lead in a campaign
 */
export async function resumeLead(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = ResumeLeadSchema.parse(args);

  const requestBody: { resume_lead_with_delay_days?: number } = {};
  if (params.resume_lead_with_delay_days !== undefined) {
    requestBody.resume_lead_with_delay_days = params.resume_lead_with_delay_days;
  }

  const result = await client.post<{ ok: boolean; data: string }>(
    `/campaigns/${params.campaign_id}/leads/${params.lead_id}/resume`,
    requestBody
  );

  return {
    content: [
      {
        type: 'text',
        text: result.ok
          ? `Lead ${params.lead_id} resumed successfully in campaign ${params.campaign_id}.`
          : 'Failed to resume lead.',
      },
    ],
  };
}

/**
 * Delete a lead from a campaign
 */
export async function deleteLeadFromCampaign(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = LeadActionSchema.parse(args);

  const result = await client.delete<OkResponse>(`/campaigns/${params.campaign_id}/leads/${params.lead_id}`);

  return {
    content: [
      {
        type: 'text',
        text: result.ok
          ? `Lead ${params.lead_id} deleted successfully from campaign ${params.campaign_id}.`
          : 'Failed to delete lead.',
      },
    ],
  };
}

/**
 * Unsubscribe a lead from a campaign
 */
export async function unsubscribeLeadFromCampaign(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = LeadActionSchema.parse(args);

  const result = await client.post<OkResponse>(
    `/campaigns/${params.campaign_id}/leads/${params.lead_id}/unsubscribe`
  );

  return {
    content: [
      {
        type: 'text',
        text: result.ok
          ? `Lead ${params.lead_id} unsubscribed successfully from campaign ${params.campaign_id}.`
          : 'Failed to unsubscribe lead.',
      },
    ],
  };
}

/**
 * Get lead by email address
 */
export async function getLeadByEmail(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = GetLeadByEmailSchema.parse(args);

  const lead = await client.get<Lead>('/leads', { email: params.email });

  return {
    content: [
      {
        type: 'text',
        text: `Lead found:\n\n${JSON.stringify(lead, null, 2)}`,
      },
    ],
  };
}

/**
 * Unsubscribe lead globally from all campaigns
 */
export async function unsubscribeLeadGlobally(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = GetLeadCampaignsSchema.parse(args);

  const result = await client.post<OkResponse>(`/leads/${params.lead_id}/unsubscribe`);

  return {
    content: [
      {
        type: 'text',
        text: result.ok
          ? `Lead ${params.lead_id} unsubscribed globally from all campaigns.`
          : 'Failed to unsubscribe lead globally.',
      },
    ],
  };
}

/**
 * Get all campaigns for a lead
 */
export async function getLeadCampaigns(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = GetLeadCampaignsSchema.parse(args);

  const campaigns = await client.get<Array<{ id: number; status: string; name: string }>>(
    `/leads/${params.lead_id}/campaigns`
  );

  return {
    content: [
      {
        type: 'text',
        text: `Found ${campaigns.length} campaigns for lead ${params.lead_id}:\n\n${JSON.stringify(campaigns, null, 2)}`,
      },
    ],
  };
}
