/**
 * Analytics Tools
 *
 * MCP tools for retrieving campaign analytics, statistics, and performance metrics.
 */

import { SmartleadClient } from '../smartlead-client.js';
import {
  GetCampaignSchema,
  GetCampaignStatisticsSchema,
  GetCampaignAnalyticsByDateSchema,
} from '../types/smartlead.js';

/**
 * Get campaign statistics
 */
export async function getCampaignStatistics(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = GetCampaignStatisticsSchema.parse(args);

  const queryParams: Record<string, unknown> = {
    offset: params.offset,
    limit: params.limit,
  };

  if (params.email_sequence_number !== undefined) {
    queryParams.email_sequence_number = params.email_sequence_number;
  }

  if (params.email_status !== undefined) {
    queryParams.email_status = params.email_status;
  }

  const stats = await client.get<Record<string, unknown>>(
    `/campaigns/${params.campaign_id}/statistics`,
    queryParams
  );

  return {
    content: [
      {
        type: 'text',
        text: `Campaign ${params.campaign_id} statistics:\n\n${JSON.stringify(stats, null, 2)}`,
      },
    ],
  };
}

/**
 * Get campaign top-level analytics
 */
export async function getCampaignAnalytics(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = GetCampaignSchema.parse(args);

  const analytics = await client.get<Record<string, unknown>>(`/campaigns/${params.campaign_id}/analytics`);

  return {
    content: [
      {
        type: 'text',
        text: `Campaign ${params.campaign_id} analytics:\n\n${JSON.stringify(analytics, null, 2)}`,
      },
    ],
  };
}

/**
 * Get campaign analytics by date range
 */
export async function getCampaignAnalyticsByDate(
  client: SmartleadClient,
  args: unknown
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const params = GetCampaignAnalyticsByDateSchema.parse(args);

  const analytics = await client.get<Record<string, unknown>>(`/campaigns/${params.campaign_id}/analytics-by-date`, {
    start_date: params.start_date,
    end_date: params.end_date,
  });

  return {
    content: [
      {
        type: 'text',
        text: `Campaign ${params.campaign_id} analytics from ${params.start_date} to ${params.end_date}:\n\n${JSON.stringify(analytics, null, 2)}`,
      },
    ],
  };
}
