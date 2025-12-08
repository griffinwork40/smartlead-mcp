/**
 * Type definitions for Smartlead API
 * Based on OpenAPI spec
 */

import { z } from 'zod';

// ============================================================================
// API Response Types
// ============================================================================

export interface Campaign {
  id: number;
  user_id: number;
  name: string;
  status: 'DRAFTED' | 'ACTIVE' | 'COMPLETED' | 'STOPPED' | 'PAUSED';
  created_at: string;
  updated_at: string;
  track_settings?: string;
  scheduler_cron_value?: string;
  min_time_btwn_emails?: number;
  max_leads_per_day?: number;
  stop_lead_settings?: string;
  unsubscribe_text?: string;
  client_id?: number | null;
}

export interface Lead {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string | null;
  company_name?: string | null;
  website?: string | null;
  location?: string | null;
  linkedin_profile?: string | null;
  company_url?: string | null;
  custom_fields?: Record<string, unknown>;
  is_unsubscribed?: boolean;
}

export interface EmailAccount {
  id: number;
  from_name: string;
  from_email: string;
  username: string;
  smtp_host: string;
  smtp_port: number;
  imap_host: string;
  imap_port: number;
  message_per_day: number;
  type: 'SMTP' | 'GMAIL' | 'ZOHO' | 'OUTLOOK';
  client_id?: number | null;
  warmup_details?: Record<string, unknown>;
}

export interface CampaignLeadData {
  campaign_lead_map_id: number;
  status: string;
  created_at: string;
  lead: Lead;
}

export interface LeadsListResponse {
  total_leads: number;
  offset: number;
  limit: number;
  data: CampaignLeadData[];
}

export interface AddLeadsResponse {
  ok: boolean;
  upload_count: number;
  total_leads: number;
  already_added_to_campaign: number;
  duplicate_count: number;
  invalid_email_count: number;
  unsubscribed_leads: number;
}

export interface OkResponse {
  ok: boolean;
}

export interface CreateCampaignResponse {
  ok: boolean;
  id: number;
  name: string;
  created_at: string;
}

// ============================================================================
// Zod Validation Schemas for Tool Inputs
// ============================================================================

export const CreateCampaignSchema = z.object({
  name: z.string().min(1).describe('Campaign name'),
  client_id: z.number().int().optional().describe('Client ID (optional)'),
});

export const GetCampaignSchema = z.object({
  campaign_id: z.number().int().positive().describe('Campaign ID'),
});

export const UpdateCampaignScheduleSchema = z.object({
  campaign_id: z.number().int().positive().describe('Campaign ID'),
  timezone: z.string().optional().describe('Timezone (e.g., America/New_York)'),
  days_of_the_week: z.array(z.number().int().min(0).max(6)).optional().describe('Days of week (0-6)'),
  start_hour: z.string().optional().describe('Start hour (HH:MM format)'),
  end_hour: z.string().optional().describe('End hour (HH:MM format)'),
  min_time_btw_emails: z.number().int().optional().describe('Minimum time between emails (minutes)'),
  max_new_leads_per_day: z.number().int().optional().describe('Maximum new leads per day'),
  schedule_start_time: z.string().optional().describe('Schedule start time (ISO 8601 format)'),
});

export const UpdateCampaignSettingsSchema = z.object({
  campaign_id: z.number().int().positive().describe('Campaign ID'),
  track_settings: z.array(z.string()).optional().describe('Tracking settings'),
  stop_lead_settings: z.string().optional().describe('Stop lead settings'),
  unsubscribe_text: z.string().optional().describe('Unsubscribe text'),
  send_as_plain_text: z.boolean().optional().describe('Send as plain text'),
  follow_up_percentage: z.number().int().min(0).max(100).optional().describe('Follow up percentage'),
  client_id: z.number().int().optional().describe('Client ID'),
  enable_ai_esp_matching: z.boolean().optional().describe('Enable AI ESP matching'),
});

export const UpdateCampaignStatusSchema = z.object({
  campaign_id: z.number().int().positive().describe('Campaign ID'),
  status: z.enum(['PAUSED', 'STOPPED', 'START']).describe('New campaign status'),
});

export const ListCampaignLeadsSchema = z.object({
  campaign_id: z.number().int().positive().describe('Campaign ID'),
  offset: z.number().int().min(0).default(0).describe('Offset for pagination'),
  limit: z.number().int().min(1).max(100).default(100).describe('Limit for pagination'),
});

export const AddLeadsSchema = z.object({
  campaign_id: z.number().int().positive().describe('Campaign ID'),
  lead_list: z.array(z.object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().email(),
    phone_number: z.string().optional(),
    company_name: z.string().optional(),
    website: z.string().optional(),
    location: z.string().optional(),
    linkedin_profile: z.string().optional(),
    company_url: z.string().optional(),
    custom_fields: z.record(z.unknown()).optional(),
  })).max(100).describe('List of leads (max 100)'),
  settings: z.object({
    ignore_global_block_list: z.boolean().optional(),
    ignore_unsubscribe_list: z.boolean().optional(),
    ignore_duplicate_leads_in_other_campaign: z.boolean().optional(),
  }).optional().describe('Upload settings'),
});

export const LeadActionSchema = z.object({
  campaign_id: z.number().int().positive().describe('Campaign ID'),
  lead_id: z.number().int().positive().describe('Lead ID'),
});

export const ResumeLeadSchema = z.object({
  campaign_id: z.number().int().positive().describe('Campaign ID'),
  lead_id: z.number().int().positive().describe('Lead ID'),
  resume_lead_with_delay_days: z.number().int().optional().describe('Resume with delay (days)'),
});

export const GetLeadByEmailSchema = z.object({
  email: z.string().email().describe('Lead email address'),
});

export const GetLeadCampaignsSchema = z.object({
  lead_id: z.number().int().positive().describe('Lead ID'),
});

export const ListEmailAccountsSchema = z.object({
  offset: z.number().int().min(0).default(0).describe('Offset for pagination'),
  limit: z.number().int().min(1).max(100).default(100).describe('Limit for pagination'),
});

export const GetEmailAccountSchema = z.object({
  account_id: z.number().int().positive().describe('Email account ID'),
});

export const UpdateWarmupSettingsSchema = z.object({
  email_account_id: z.number().int().positive().describe('Email account ID'),
  warmup_enabled: z.boolean().describe('Enable warmup'),
  total_warmup_per_day: z.number().int().optional().describe('Total warmup emails per day'),
  daily_rampup: z.number().int().optional().describe('Daily rampup count'),
  reply_rate_percentage: z.number().int().min(0).max(100).optional().describe('Reply rate percentage'),
  warmup_key_id: z.string().optional().describe('Warmup key ID'),
});

export const GetCampaignStatisticsSchema = z.object({
  campaign_id: z.number().int().positive().describe('Campaign ID'),
  offset: z.number().int().min(0).default(0).describe('Offset for pagination'),
  limit: z.number().int().min(1).max(100).default(100).describe('Limit for pagination'),
  email_sequence_number: z.number().int().optional().describe('Email sequence number filter'),
  email_status: z.enum(['opened', 'clicked', 'replied', 'unsubscribed', 'bounced']).optional().describe('Email status filter'),
});

export const GetCampaignAnalyticsByDateSchema = z.object({
  campaign_id: z.number().int().positive().describe('Campaign ID'),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Start date (YYYY-MM-DD)'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('End date (YYYY-MM-DD)'),
});

export const ManageCampaignEmailAccountsSchema = z.object({
  campaign_id: z.number().int().positive().describe('Campaign ID'),
  email_account_ids: z.array(z.number().int().positive()).min(1).describe('Email account IDs'),
});
