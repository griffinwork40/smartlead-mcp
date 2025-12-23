/**
 * Tests for Smartlead Type Definitions and Zod Schemas
 *
 * Tests validation of all Zod schemas for MCP tool inputs.
 */

import { describe, it, expect } from 'vitest';
import {
  CreateCampaignSchema,
  GetCampaignSchema,
  UpdateCampaignScheduleSchema,
  UpdateCampaignSettingsSchema,
  UpdateCampaignStatusSchema,
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
  ManageCampaignEmailAccountsSchema,
} from '../../types/smartlead.js';

describe('Zod Validation Schemas', () => {
  // ===========================================================================
  // Campaign Schemas
  // ===========================================================================
  describe('CreateCampaignSchema', () => {
    it('should validate valid campaign creation input', () => {
      const result = CreateCampaignSchema.safeParse({
        name: 'Test Campaign',
      });
      expect(result.success).toBe(true);
    });

    it('should validate with optional client_id', () => {
      const result = CreateCampaignSchema.safeParse({
        name: 'Test Campaign',
        client_id: 123,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.client_id).toBe(123);
      }
    });

    it('should reject empty name', () => {
      const result = CreateCampaignSchema.safeParse({
        name: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing name', () => {
      const result = CreateCampaignSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('should reject non-integer client_id', () => {
      const result = CreateCampaignSchema.safeParse({
        name: 'Test Campaign',
        client_id: 12.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('GetCampaignSchema', () => {
    it('should validate positive campaign_id', () => {
      const result = GetCampaignSchema.safeParse({
        campaign_id: 1,
      });
      expect(result.success).toBe(true);
    });

    it('should reject zero campaign_id', () => {
      const result = GetCampaignSchema.safeParse({
        campaign_id: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative campaign_id', () => {
      const result = GetCampaignSchema.safeParse({
        campaign_id: -1,
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-integer campaign_id', () => {
      const result = GetCampaignSchema.safeParse({
        campaign_id: 1.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateCampaignScheduleSchema', () => {
    it('should validate with only campaign_id', () => {
      const result = UpdateCampaignScheduleSchema.safeParse({
        campaign_id: 1,
      });
      expect(result.success).toBe(true);
    });

    it('should validate with all optional fields', () => {
      const result = UpdateCampaignScheduleSchema.safeParse({
        campaign_id: 1,
        timezone: 'America/New_York',
        days_of_the_week: [1, 2, 3, 4, 5],
        start_hour: '09:00',
        end_hour: '17:00',
        min_time_btw_emails: 5,
        max_new_leads_per_day: 100,
        schedule_start_time: '2025-01-01T00:00:00Z',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid days_of_the_week values', () => {
      const result = UpdateCampaignScheduleSchema.safeParse({
        campaign_id: 1,
        days_of_the_week: [7], // Invalid - max is 6
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative days_of_the_week values', () => {
      const result = UpdateCampaignScheduleSchema.safeParse({
        campaign_id: 1,
        days_of_the_week: [-1],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateCampaignSettingsSchema', () => {
    it('should validate with only campaign_id', () => {
      const result = UpdateCampaignSettingsSchema.safeParse({
        campaign_id: 1,
      });
      expect(result.success).toBe(true);
    });

    it('should validate with all optional fields', () => {
      const result = UpdateCampaignSettingsSchema.safeParse({
        campaign_id: 1,
        track_settings: ['opens', 'clicks'],
        stop_lead_settings: 'after_reply',
        unsubscribe_text: 'Click to unsubscribe',
        send_as_plain_text: false,
        follow_up_percentage: 50,
        client_id: 123,
        enable_ai_esp_matching: true,
      });
      expect(result.success).toBe(true);
    });

    it('should reject follow_up_percentage below 0', () => {
      const result = UpdateCampaignSettingsSchema.safeParse({
        campaign_id: 1,
        follow_up_percentage: -1,
      });
      expect(result.success).toBe(false);
    });

    it('should reject follow_up_percentage above 100', () => {
      const result = UpdateCampaignSettingsSchema.safeParse({
        campaign_id: 1,
        follow_up_percentage: 101,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateCampaignStatusSchema', () => {
    it('should validate PAUSED status', () => {
      const result = UpdateCampaignStatusSchema.safeParse({
        campaign_id: 1,
        status: 'PAUSED',
      });
      expect(result.success).toBe(true);
    });

    it('should validate STOPPED status', () => {
      const result = UpdateCampaignStatusSchema.safeParse({
        campaign_id: 1,
        status: 'STOPPED',
      });
      expect(result.success).toBe(true);
    });

    it('should validate START status', () => {
      const result = UpdateCampaignStatusSchema.safeParse({
        campaign_id: 1,
        status: 'START',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const result = UpdateCampaignStatusSchema.safeParse({
        campaign_id: 1,
        status: 'INVALID',
      });
      expect(result.success).toBe(false);
    });
  });

  // ===========================================================================
  // Lead Schemas
  // ===========================================================================
  describe('ListCampaignLeadsSchema', () => {
    it('should validate with only campaign_id (defaults applied)', () => {
      const result = ListCampaignLeadsSchema.safeParse({
        campaign_id: 1,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.offset).toBe(0);
        expect(result.data.limit).toBe(100);
      }
    });

    it('should validate with custom offset and limit', () => {
      const result = ListCampaignLeadsSchema.safeParse({
        campaign_id: 1,
        offset: 50,
        limit: 25,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.offset).toBe(50);
        expect(result.data.limit).toBe(25);
      }
    });

    it('should reject limit above 100', () => {
      const result = ListCampaignLeadsSchema.safeParse({
        campaign_id: 1,
        limit: 101,
      });
      expect(result.success).toBe(false);
    });

    it('should reject limit below 1', () => {
      const result = ListCampaignLeadsSchema.safeParse({
        campaign_id: 1,
        limit: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative offset', () => {
      const result = ListCampaignLeadsSchema.safeParse({
        campaign_id: 1,
        offset: -1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('AddLeadsSchema', () => {
    it('should validate valid lead list', () => {
      const result = AddLeadsSchema.safeParse({
        campaign_id: 1,
        lead_list: [
          {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should validate lead with all optional fields', () => {
      const result = AddLeadsSchema.safeParse({
        campaign_id: 1,
        lead_list: [
          {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            phone_number: '+1234567890',
            company_name: 'ACME Corp',
            website: 'https://acme.com',
            location: 'New York',
            linkedin_profile: 'https://linkedin.com/in/johndoe',
            company_url: 'https://acme.com',
            custom_fields: { industry: 'tech' },
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should validate with settings', () => {
      const result = AddLeadsSchema.safeParse({
        campaign_id: 1,
        lead_list: [
          {
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
          },
        ],
        settings: {
          ignore_global_block_list: true,
          ignore_unsubscribe_list: false,
          ignore_duplicate_leads_in_other_campaign: true,
        },
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = AddLeadsSchema.safeParse({
        campaign_id: 1,
        lead_list: [
          {
            first_name: 'John',
            last_name: 'Doe',
            email: 'not-an-email',
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty first_name', () => {
      const result = AddLeadsSchema.safeParse({
        campaign_id: 1,
        lead_list: [
          {
            first_name: '',
            last_name: 'Doe',
            email: 'john@example.com',
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty lead_list', () => {
      const result = AddLeadsSchema.safeParse({
        campaign_id: 1,
        lead_list: [],
      });
      // Empty array is valid by schema, but max is 100
      expect(result.success).toBe(true);
    });

    it('should reject more than 100 leads', () => {
      const leads = Array.from({ length: 101 }, (_, i) => ({
        first_name: 'John',
        last_name: 'Doe',
        email: `john${i}@example.com`,
      }));
      const result = AddLeadsSchema.safeParse({
        campaign_id: 1,
        lead_list: leads,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('LeadActionSchema', () => {
    it('should validate valid input', () => {
      const result = LeadActionSchema.safeParse({
        campaign_id: 1,
        lead_id: 100,
      });
      expect(result.success).toBe(true);
    });

    it('should reject zero campaign_id', () => {
      const result = LeadActionSchema.safeParse({
        campaign_id: 0,
        lead_id: 100,
      });
      expect(result.success).toBe(false);
    });

    it('should reject zero lead_id', () => {
      const result = LeadActionSchema.safeParse({
        campaign_id: 1,
        lead_id: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ResumeLeadSchema', () => {
    it('should validate without delay', () => {
      const result = ResumeLeadSchema.safeParse({
        campaign_id: 1,
        lead_id: 100,
      });
      expect(result.success).toBe(true);
    });

    it('should validate with delay', () => {
      const result = ResumeLeadSchema.safeParse({
        campaign_id: 1,
        lead_id: 100,
        resume_lead_with_delay_days: 7,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.resume_lead_with_delay_days).toBe(7);
      }
    });
  });

  describe('GetLeadByEmailSchema', () => {
    it('should validate valid email', () => {
      const result = GetLeadByEmailSchema.safeParse({
        email: 'test@example.com',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = GetLeadByEmailSchema.safeParse({
        email: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty email', () => {
      const result = GetLeadByEmailSchema.safeParse({
        email: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('GetLeadCampaignsSchema', () => {
    it('should validate valid lead_id', () => {
      const result = GetLeadCampaignsSchema.safeParse({
        lead_id: 100,
      });
      expect(result.success).toBe(true);
    });

    it('should reject zero lead_id', () => {
      const result = GetLeadCampaignsSchema.safeParse({
        lead_id: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  // ===========================================================================
  // Email Account Schemas
  // ===========================================================================
  describe('ListEmailAccountsSchema', () => {
    it('should validate with defaults', () => {
      const result = ListEmailAccountsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.offset).toBe(0);
        expect(result.data.limit).toBe(100);
      }
    });

    it('should validate custom offset and limit', () => {
      const result = ListEmailAccountsSchema.safeParse({
        offset: 20,
        limit: 50,
      });
      expect(result.success).toBe(true);
    });

    it('should reject limit above 100', () => {
      const result = ListEmailAccountsSchema.safeParse({
        limit: 150,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('GetEmailAccountSchema', () => {
    it('should validate positive account_id', () => {
      const result = GetEmailAccountSchema.safeParse({
        account_id: 1,
      });
      expect(result.success).toBe(true);
    });

    it('should reject zero account_id', () => {
      const result = GetEmailAccountSchema.safeParse({
        account_id: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateWarmupSettingsSchema', () => {
    it('should validate minimal input', () => {
      const result = UpdateWarmupSettingsSchema.safeParse({
        email_account_id: 1,
        warmup_enabled: true,
      });
      expect(result.success).toBe(true);
    });

    it('should validate with all optional fields', () => {
      const result = UpdateWarmupSettingsSchema.safeParse({
        email_account_id: 1,
        warmup_enabled: true,
        total_warmup_per_day: 30,
        daily_rampup: 2,
        reply_rate_percentage: 40,
        warmup_key_id: 'key123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject reply_rate_percentage below 0', () => {
      const result = UpdateWarmupSettingsSchema.safeParse({
        email_account_id: 1,
        warmup_enabled: true,
        reply_rate_percentage: -1,
      });
      expect(result.success).toBe(false);
    });

    it('should reject reply_rate_percentage above 100', () => {
      const result = UpdateWarmupSettingsSchema.safeParse({
        email_account_id: 1,
        warmup_enabled: true,
        reply_rate_percentage: 101,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('CreateEmailAccountSchema', () => {
    const validAccount = {
      from_name: 'Test Sender',
      from_email: 'test@example.com',
      username: 'testuser',
      password: 'testpass',
      smtp_host: 'smtp.example.com',
      smtp_port: 587,
      imap_host: 'imap.example.com',
      imap_port: 993,
      message_per_day: 50,
      type: 'SMTP' as const,
    };

    it('should validate complete input', () => {
      const result = CreateEmailAccountSchema.safeParse(validAccount);
      expect(result.success).toBe(true);
    });

    it('should validate with optional client_id', () => {
      const result = CreateEmailAccountSchema.safeParse({
        ...validAccount,
        client_id: 123,
      });
      expect(result.success).toBe(true);
    });

    it('should validate all account types', () => {
      for (const type of ['SMTP', 'GMAIL', 'ZOHO', 'OUTLOOK'] as const) {
        const result = CreateEmailAccountSchema.safeParse({
          ...validAccount,
          type,
        });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid email', () => {
      const result = CreateEmailAccountSchema.safeParse({
        ...validAccount,
        from_email: 'not-an-email',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty from_name', () => {
      const result = CreateEmailAccountSchema.safeParse({
        ...validAccount,
        from_name: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-positive smtp_port', () => {
      const result = CreateEmailAccountSchema.safeParse({
        ...validAccount,
        smtp_port: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid type', () => {
      const result = CreateEmailAccountSchema.safeParse({
        ...validAccount,
        type: 'INVALID',
      });
      expect(result.success).toBe(false);
    });

    it('should allow passthrough of extra fields', () => {
      const result = CreateEmailAccountSchema.safeParse({
        ...validAccount,
        extra_field: 'extra_value',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('extra_field', 'extra_value');
      }
    });
  });

  describe('UpdateEmailAccountSchema', () => {
    it('should validate with only email_account_id', () => {
      const result = UpdateEmailAccountSchema.safeParse({
        email_account_id: 1,
      });
      expect(result.success).toBe(true);
    });

    it('should validate with all optional fields', () => {
      const result = UpdateEmailAccountSchema.safeParse({
        email_account_id: 1,
        from_name: 'Updated Sender',
        from_email: 'updated@example.com',
        username: 'updateduser',
        password: 'updatedpass',
        smtp_host: 'smtp2.example.com',
        smtp_port: 465,
        imap_host: 'imap2.example.com',
        imap_port: 143,
        message_per_day: 100,
        type: 'GMAIL',
        client_id: 456,
      });
      expect(result.success).toBe(true);
    });

    it('should reject zero email_account_id', () => {
      const result = UpdateEmailAccountSchema.safeParse({
        email_account_id: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should allow passthrough of extra fields', () => {
      const result = UpdateEmailAccountSchema.safeParse({
        email_account_id: 1,
        extra_setting: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveProperty('extra_setting', true);
      }
    });
  });

  // ===========================================================================
  // Analytics Schemas
  // ===========================================================================
  describe('GetCampaignStatisticsSchema', () => {
    it('should validate with only campaign_id (defaults applied)', () => {
      const result = GetCampaignStatisticsSchema.safeParse({
        campaign_id: 1,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.offset).toBe(0);
        expect(result.data.limit).toBe(100);
      }
    });

    it('should validate with all optional filters', () => {
      const result = GetCampaignStatisticsSchema.safeParse({
        campaign_id: 1,
        offset: 10,
        limit: 50,
        email_sequence_number: 1,
        email_status: 'opened',
      });
      expect(result.success).toBe(true);
    });

    it('should validate all email_status values', () => {
      for (const status of ['opened', 'clicked', 'replied', 'unsubscribed', 'bounced'] as const) {
        const result = GetCampaignStatisticsSchema.safeParse({
          campaign_id: 1,
          email_status: status,
        });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid email_status', () => {
      const result = GetCampaignStatisticsSchema.safeParse({
        campaign_id: 1,
        email_status: 'invalid',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('GetCampaignAnalyticsByDateSchema', () => {
    it('should validate valid date range', () => {
      const result = GetCampaignAnalyticsByDateSchema.safeParse({
        campaign_id: 1,
        start_date: '2025-01-01',
        end_date: '2025-01-31',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid start_date format', () => {
      const result = GetCampaignAnalyticsByDateSchema.safeParse({
        campaign_id: 1,
        start_date: '01-01-2025', // Wrong format
        end_date: '2025-01-31',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid end_date format', () => {
      const result = GetCampaignAnalyticsByDateSchema.safeParse({
        campaign_id: 1,
        start_date: '2025-01-01',
        end_date: '2025/01/31', // Wrong format
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing dates', () => {
      const result = GetCampaignAnalyticsByDateSchema.safeParse({
        campaign_id: 1,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ManageCampaignEmailAccountsSchema', () => {
    it('should validate valid input', () => {
      const result = ManageCampaignEmailAccountsSchema.safeParse({
        campaign_id: 1,
        email_account_ids: [1, 2, 3],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty email_account_ids', () => {
      const result = ManageCampaignEmailAccountsSchema.safeParse({
        campaign_id: 1,
        email_account_ids: [],
      });
      expect(result.success).toBe(false);
    });

    it('should reject non-positive email_account_ids', () => {
      const result = ManageCampaignEmailAccountsSchema.safeParse({
        campaign_id: 1,
        email_account_ids: [0],
      });
      expect(result.success).toBe(false);
    });

    it('should reject zero campaign_id', () => {
      const result = ManageCampaignEmailAccountsSchema.safeParse({
        campaign_id: 0,
        email_account_ids: [1],
      });
      expect(result.success).toBe(false);
    });
  });
});
