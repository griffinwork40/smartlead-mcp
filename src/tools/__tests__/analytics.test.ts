/**
 * Analytics Tools Tests
 *
 * Unit tests for analytics tool handlers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SmartleadClient } from '../../smartlead-client.js';
import * as analyticsTools from '../analytics.js';

// Mock SmartleadClient
vi.mock('../../smartlead-client.js', () => ({
  SmartleadClient: vi.fn(),
}));

describe('Analytics Tools', () => {
  let mockClient: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('getCampaignStatistics', () => {
    it('should get statistics with default pagination', async () => {
      const mockStats = {
        total: 1000,
        opened: 500,
        clicked: 200,
        replied: 50,
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
    });

    it('should get statistics with custom pagination', async () => {
      mockClient.get.mockResolvedValue({});

      await analyticsTools.getCampaignStatistics(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
        offset: 50,
        limit: 25,
      });

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/statistics', {
        offset: 50,
        limit: 25,
      });
    });

    it('should filter by email_sequence_number', async () => {
      mockClient.get.mockResolvedValue({});

      await analyticsTools.getCampaignStatistics(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
        email_sequence_number: 2,
      });

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/statistics', {
        offset: 0,
        limit: 100,
        email_sequence_number: 2,
      });
    });

    it('should filter by email_status', async () => {
      mockClient.get.mockResolvedValue({});

      await analyticsTools.getCampaignStatistics(mockClient as unknown as SmartleadClient, {
        campaign_id: 123,
        email_status: 'opened',
      });

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/statistics', {
        offset: 0,
        limit: 100,
        email_status: 'opened',
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
  });

  describe('getCampaignAnalytics', () => {
    it('should get campaign analytics', async () => {
      const mockAnalytics = {
        total_sent: 5000,
        total_opened: 2500,
        open_rate: 50,
        total_clicked: 1000,
        click_rate: 20,
        total_replied: 250,
        reply_rate: 5,
      };
      mockClient.get.mockResolvedValue(mockAnalytics);

      const result = await analyticsTools.getCampaignAnalytics(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123 }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/analytics');
      expect(result.content[0].text).toContain('Campaign 123 analytics');
      expect(result.content[0].text).toContain('total_sent');
    });

    it('should throw error for missing campaign_id', async () => {
      await expect(
        analyticsTools.getCampaignAnalytics(mockClient as unknown as SmartleadClient, {})
      ).rejects.toThrow();
    });

    it('should throw error for invalid campaign_id', async () => {
      await expect(
        analyticsTools.getCampaignAnalytics(mockClient as unknown as SmartleadClient, {
          campaign_id: -1,
        })
      ).rejects.toThrow();
    });
  });

  describe('getCampaignAnalyticsByDate', () => {
    it('should get analytics by date range', async () => {
      const mockAnalytics = {
        '2025-01-01': { sent: 100, opened: 50 },
        '2025-01-02': { sent: 150, opened: 75 },
        '2025-01-03': { sent: 120, opened: 60 },
      };
      mockClient.get.mockResolvedValue(mockAnalytics);

      const result = await analyticsTools.getCampaignAnalyticsByDate(
        mockClient as unknown as SmartleadClient,
        {
          campaign_id: 123,
          start_date: '2025-01-01',
          end_date: '2025-01-31',
        }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/analytics-by-date', {
        start_date: '2025-01-01',
        end_date: '2025-01-31',
      });
      expect(result.content[0].text).toContain('Campaign 123 analytics');
      expect(result.content[0].text).toContain('2025-01-01');
      expect(result.content[0].text).toContain('2025-01-31');
    });

    it('should throw error for invalid date format', async () => {
      await expect(
        analyticsTools.getCampaignAnalyticsByDate(mockClient as unknown as SmartleadClient, {
          campaign_id: 123,
          start_date: '01-01-2025',
          end_date: '2025-01-31',
        })
      ).rejects.toThrow();
    });

    it('should throw error for missing dates', async () => {
      await expect(
        analyticsTools.getCampaignAnalyticsByDate(mockClient as unknown as SmartleadClient, {
          campaign_id: 123,
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
  });
});
