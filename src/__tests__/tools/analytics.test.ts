/**
 * Analytics Tools Unit Tests
 *
 * Tests for all analytics MCP tools including campaign statistics,
 * analytics summaries, and date-range reports.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmartleadClient } from '../../smartlead-client.js';
import * as analyticsTools from '../../tools/analytics.js';

// Mock SmartleadClient
vi.mock('../../smartlead-client.js', () => ({
  SmartleadClient: vi.fn().mockImplementation(() => ({
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  })),
}));

describe('Analytics Tools', () => {
  let mockClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    };
  });

  describe('getCampaignStatistics', () => {
    it('should get statistics with default pagination', async () => {
      const mockStats = {
        total_sent: 1000,
        opened: 250,
        clicked: 50,
        replied: 25,
        bounced: 10,
        unsubscribed: 5,
      };
      mockClient.get.mockResolvedValue(mockStats);

      const result = await analyticsTools.getCampaignStatistics(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123 }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/statistics', {
        offset: 0,
        limit: 100,
      });
      expect(result.content[0].text).toContain('Campaign 123 statistics');
      expect(result.content[0].text).toContain('"total_sent": 1000');
    });

    it('should get statistics with custom pagination', async () => {
      mockClient.get.mockResolvedValue({});

      const result = await analyticsTools.getCampaignStatistics(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, offset: 50, limit: 25 }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/statistics', {
        offset: 50,
        limit: 25,
      });
    });

    it('should filter by email_sequence_number', async () => {
      mockClient.get.mockResolvedValue({});

      const result = await analyticsTools.getCampaignStatistics(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, email_sequence_number: 2 }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/statistics', {
        offset: 0,
        limit: 100,
        email_sequence_number: 2,
      });
    });

    it('should filter by email_status opened', async () => {
      mockClient.get.mockResolvedValue({ opened_emails: [] });

      const result = await analyticsTools.getCampaignStatistics(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, email_status: 'opened' }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/statistics', {
        offset: 0,
        limit: 100,
        email_status: 'opened',
      });
    });

    it('should filter by email_status clicked', async () => {
      mockClient.get.mockResolvedValue({});

      await analyticsTools.getCampaignStatistics(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
        email_status: 'clicked',
      });

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/statistics', {
        offset: 0,
        limit: 100,
        email_status: 'clicked',
      });
    });

    it('should filter by email_status replied', async () => {
      mockClient.get.mockResolvedValue({});

      await analyticsTools.getCampaignStatistics(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
        email_status: 'replied',
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        '/campaigns/123/statistics',
        expect.objectContaining({ email_status: 'replied' })
      );
    });

    it('should filter by email_status bounced', async () => {
      mockClient.get.mockResolvedValue({});

      await analyticsTools.getCampaignStatistics(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
        email_status: 'bounced',
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        '/campaigns/123/statistics',
        expect.objectContaining({ email_status: 'bounced' })
      );
    });

    it('should filter by email_status unsubscribed', async () => {
      mockClient.get.mockResolvedValue({});

      await analyticsTools.getCampaignStatistics(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
        email_status: 'unsubscribed',
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        '/campaigns/123/statistics',
        expect.objectContaining({ email_status: 'unsubscribed' })
      );
    });

    it('should filter by both sequence and status', async () => {
      mockClient.get.mockResolvedValue({});

      await analyticsTools.getCampaignStatistics(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
        email_sequence_number: 1,
        email_status: 'replied',
      });

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/statistics', {
        offset: 0,
        limit: 100,
        email_sequence_number: 1,
        email_status: 'replied',
      });
    });

    it('should throw error for invalid email_status', async () => {
      await expect(
        analyticsTools.getCampaignStatistics(mockClient as unknown as SmartleadClient, {
          campaign_id: 123,
          email_status: 'invalid_status',
        })
      ).rejects.toThrow();
    });

    it('should throw error for missing campaign_id', async () => {
      await expect(
        analyticsTools.getCampaignStatistics(mockClient as unknown as SmartleadClient, {})
      ).rejects.toThrow();
    });

    it('should throw error for invalid limit', async () => {
      await expect(
        analyticsTools.getCampaignStatistics(mockClient as unknown as SmartleadClient, {
          campaign_id: 123,
          limit: 200,
        })
      ).rejects.toThrow();
    });
  });

  describe('getCampaignAnalytics', () => {
    it('should get top-level campaign analytics', async () => {
      const mockAnalytics = {
        total_leads: 500,
        emails_sent: 1000,
        unique_opens: 300,
        unique_clicks: 100,
        replies: 50,
        bounce_rate: 2.5,
        open_rate: 30,
        click_rate: 10,
        reply_rate: 5,
      };
      mockClient.get.mockResolvedValue(mockAnalytics);

      const result = await analyticsTools.getCampaignAnalytics(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123 }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/analytics');
      expect(result.content[0].text).toContain('Campaign 123 analytics');
      expect(result.content[0].text).toContain('"total_leads": 500');
      expect(result.content[0].text).toContain('"open_rate": 30');
    });

    it('should handle empty analytics', async () => {
      mockClient.get.mockResolvedValue({});

      const result = await analyticsTools.getCampaignAnalytics(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 456 }
      );

      expect(result.content[0].text).toContain('Campaign 456 analytics');
    });

    it('should throw error for invalid campaign_id', async () => {
      await expect(
        analyticsTools.getCampaignAnalytics(mockClient as unknown as SmartleadClient, {
          campaign_id: 0,
        })
      ).rejects.toThrow();
    });

    it('should throw error for non-numeric campaign_id', async () => {
      await expect(
        analyticsTools.getCampaignAnalytics(mockClient as unknown as SmartleadClient, {
          campaign_id: 'abc',
        })
      ).rejects.toThrow();
    });
  });

  describe('getCampaignAnalyticsByDate', () => {
    it('should get analytics for date range', async () => {
      const mockAnalytics = {
        data: [
          { date: '2025-01-01', sent: 100, opened: 30, clicked: 10 },
          { date: '2025-01-02', sent: 150, opened: 45, clicked: 15 },
          { date: '2025-01-03', sent: 120, opened: 36, clicked: 12 },
        ],
      };
      mockClient.get.mockResolvedValue(mockAnalytics);

      const result = await analyticsTools.getCampaignAnalyticsByDate(
        mockClient as unknown as SmartleadClient,
        {
          campaign_id: 123,
          start_date: '2025-01-01',
          end_date: '2025-01-03',
        }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/analytics-by-date', {
        start_date: '2025-01-01',
        end_date: '2025-01-03',
      });
      expect(result.content[0].text).toContain('Campaign 123 analytics from 2025-01-01 to 2025-01-03');
    });

    it('should handle single day range', async () => {
      mockClient.get.mockResolvedValue({ data: [] });

      const result = await analyticsTools.getCampaignAnalyticsByDate(
        mockClient as unknown as SmartleadClient,
        {
          campaign_id: 123,
          start_date: '2025-06-15',
          end_date: '2025-06-15',
        }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/analytics-by-date', {
        start_date: '2025-06-15',
        end_date: '2025-06-15',
      });
      expect(result.content[0].text).toContain('2025-06-15');
    });

    it('should throw error for invalid start_date format', async () => {
      await expect(
        analyticsTools.getCampaignAnalyticsByDate(mockClient as unknown as SmartleadClient, {
          campaign_id: 123,
          start_date: '01-01-2025', // Wrong format
          end_date: '2025-01-31',
        })
      ).rejects.toThrow();
    });

    it('should throw error for invalid end_date format', async () => {
      await expect(
        analyticsTools.getCampaignAnalyticsByDate(mockClient as unknown as SmartleadClient, {
          campaign_id: 123,
          start_date: '2025-01-01',
          end_date: 'January 31, 2025', // Wrong format
        })
      ).rejects.toThrow();
    });

    it('should throw error for missing start_date', async () => {
      await expect(
        analyticsTools.getCampaignAnalyticsByDate(mockClient as unknown as SmartleadClient, {
          campaign_id: 123,
          end_date: '2025-01-31',
        })
      ).rejects.toThrow();
    });

    it('should throw error for missing end_date', async () => {
      await expect(
        analyticsTools.getCampaignAnalyticsByDate(mockClient as unknown as SmartleadClient, {
          campaign_id: 123,
          start_date: '2025-01-01',
        })
      ).rejects.toThrow();
    });

    it('should throw error for missing campaign_id', async () => {
      await expect(
        analyticsTools.getCampaignAnalyticsByDate(mockClient as unknown as SmartleadClient, {
          start_date: '2025-01-01',
          end_date: '2025-01-31',
        })
      ).rejects.toThrow();
    });

    it('should handle date format with leading zeros', async () => {
      mockClient.get.mockResolvedValue({});

      await analyticsTools.getCampaignAnalyticsByDate(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
        start_date: '2025-01-05',
        end_date: '2025-02-09',
      });

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/analytics-by-date', {
        start_date: '2025-01-05',
        end_date: '2025-02-09',
      });
    });
  });
});
