/**
 * Mock SmartleadClient for testing
 * 
 * Provides a mock implementation of the SmartleadClient class
 * for unit testing tools without making actual API calls.
 */

import { jest } from '@jest/globals';

/**
 * Creates a mock SmartleadClient with configurable responses
 */
export function createMockClient() {
  return {
    get: jest.fn<(endpoint: string, params?: Record<string, unknown>) => Promise<unknown>>(),
    post: jest.fn<(endpoint: string, data?: unknown, params?: Record<string, unknown>) => Promise<unknown>>(),
    delete: jest.fn<(endpoint: string, data?: unknown, params?: Record<string, unknown>) => Promise<unknown>>(),
  };
}

export type MockSmartleadClient = ReturnType<typeof createMockClient>;

/**
 * Creates an API error for testing error handling
 */
export function createApiError(status: number, message: string): Error {
  let errorMessage = `Smartlead API error (${status}): ${message}`;
  
  if (status === 401 || status === 403) {
    errorMessage += ' - Check your API key is valid';
  } else if (status === 404) {
    errorMessage += ' - Resource not found';
  } else if (status === 429) {
    errorMessage += ' - Rate limit exceeded, please try again later';
  }
  
  return new Error(errorMessage);
}

/**
 * Mock data factories for common response types
 */
export const mockData = {
  campaign: (overrides?: Partial<Campaign>) => ({
    id: 1,
    user_id: 100,
    name: 'Test Campaign',
    status: 'DRAFTED' as const,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }),

  lead: (overrides?: Partial<Lead>) => ({
    id: 1,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone_number: '+1234567890',
    company_name: 'Acme Inc',
    ...overrides,
  }),

  emailAccount: (overrides?: Partial<EmailAccount>) => ({
    id: 1,
    from_name: 'Test Sender',
    from_email: 'sender@example.com',
    username: 'sender@example.com',
    smtp_host: 'smtp.example.com',
    smtp_port: 587,
    imap_host: 'imap.example.com',
    imap_port: 993,
    message_per_day: 100,
    type: 'SMTP' as const,
    ...overrides,
  }),

  campaignLeadData: (overrides?: Partial<CampaignLeadData>) => ({
    campaign_lead_map_id: 1,
    status: 'active',
    created_at: '2025-01-01T00:00:00Z',
    lead: mockData.lead(),
    ...overrides,
  }),

  leadsListResponse: (overrides?: Partial<LeadsListResponse>) => ({
    total_leads: 1,
    offset: 0,
    limit: 100,
    data: [mockData.campaignLeadData()],
    ...overrides,
  }),

  addLeadsResponse: (overrides?: Partial<AddLeadsResponse>) => ({
    ok: true,
    upload_count: 1,
    total_leads: 10,
    already_added_to_campaign: 0,
    duplicate_count: 0,
    invalid_email_count: 0,
    unsubscribed_leads: 0,
    ...overrides,
  }),

  okResponse: (ok = true) => ({ ok }),

  createCampaignResponse: (overrides?: Partial<CreateCampaignResponse>) => ({
    ok: true,
    id: 1,
    name: 'Test Campaign',
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }),
};

// Type definitions for mock data
interface Campaign {
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

interface Lead {
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

interface EmailAccount {
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

interface CampaignLeadData {
  campaign_lead_map_id: number;
  status: string;
  created_at: string;
  lead: Lead;
}

interface LeadsListResponse {
  total_leads: number;
  offset: number;
  limit: number;
  data: CampaignLeadData[];
}

interface AddLeadsResponse {
  ok: boolean;
  upload_count: number;
  total_leads: number;
  already_added_to_campaign: number;
  duplicate_count: number;
  invalid_email_count: number;
  unsubscribed_leads: number;
}

interface CreateCampaignResponse {
  ok: boolean;
  id: number;
  name: string;
  created_at: string;
}
