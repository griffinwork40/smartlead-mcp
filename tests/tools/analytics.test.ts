/**
 * Analytics Tools Tests
 * 
 * Comprehensive tests for all analytics tools:
 * - getCampaignStatistics
 * - getCampaignAnalytics
 * - getCampaignAnalyticsByDate
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  createMockClient,
  MockSmartleadClient,
} from '../mocks/smartlead-client.mock.js';
import * as analyticsTools from '../../src/tools/analytics.js';
import type { SmartleadClient } from '../../src/smartlead-client.js';

describe('Analytics Tools', () => {
  let mockClient: MockSmartleadClient;

  beforeEach(() => {
    mockClient = createMockClient();
    jest.clearAllMocks();
  });

  describe('getCampaignStatistics', () => {
    it('should get campaign statistics with default pagination', async () => {
      const stats = {
        total_sent: 1000,
        total_opened: 450,
        total_clicked: 120,
        total_replied: 50,
        total_bounced: 25,
      };
      mockClient.get.mockResolvedValue(stats);

      const result = await analyticsTools.getCampaignStatistics(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123 }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/statistics', {
        offset: 0,
        limit: 100,
      });
      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
      expect(parsed.total_sent).toBeDefined();
    });

    it('should get campaign statistics with custom pagination', async () => {
      const stats = { data: [] };
      mockClient.get.mockResolvedValue(stats);

      await analyticsTools.getCampaignStatistics(
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

      await analyticsTools.getCampaignStatistics(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 123, email_sequence_number: 2 }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/statistics', {
        offset: 0,
        limit: 100,
        email_sequence_number: 2,
      });
    });

    it.each(['opened', 'clicked', 'replied', 'unsubscribed', 'bounced'] as const)(
      'should filter by email_status %s',
      async (status) => {
        mockClient.get.mockResolvedValue({});

        await analyticsTools.getCampaignStatistics(
          mockClient as unknown as SmartleadClient,
          { campaign_id: 123, email_status: status }
        );

        expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/statistics', {
          offset: 0,
          limit: 100,
          email_status: status,
        });
      }
    );

    it('should combine multiple filters', async () => {
      mockClient.get.mockResolvedValue({});

      await analyticsTools.getCampaignStatistics(
        mockClient as unknown as SmartleadClient,
        {
          campaign_id: 123,
          offset: 10,
          limit: 50,
          email_sequence_number: 1,
          email_status: 'opened',
        }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/123/statistics', {
        offset: 10,
        limit: 50,
        email_sequence_number: 1,
        email_status: 'opened',
      });
    });

    it('should throw validation error for invalid email_status', async () => {
      await expect(
        analyticsTools.getCampaignStatistics(
          mockClient as unknown as SmartleadClient,
          { campaign_id: 123, email_status: 'invalid' as any }
        )
      ).rejects.toThrow();
    });

    it('should throw validation error for missing campaign_id', async () => {
      await expect(
        analyticsTools.getCampaignStatistics(
          mockClient as unknown as SmartleadClient,
          {}
        )
      ).rejects.toThrow();
    });

    it('should throw validation error for limit exceeding 100', async () => {
      await expect(
        analyticsTools.getCampaignStatistics(
          mockClient as unknown as SmartleadClient,
          { campaign_id: 123, limit: 200 }
        )
      ).rejects.toThrow();
    });
  });

  describe('getCampaignAnalytics', () => {
    it('should get top-level campaign analytics', async () => {
      const analytics = {
        sent_count: 1000,
        unique_sent_count: 950,
        open_count: 450,
        unique_open_count: 400,
        click_count: 150,
        unique_click_count: 120,
        reply_count: 60,
        bounce_count: 30,
        unsubscribe_count: 10,
        open_rate: 42.1,
        click_rate: 12.6,
        reply_rate: 6.0,
      };
      mockClient.get.mockResolvedValue(analytics);

      const result = await analyticsTools.getCampaignAnalytics(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 456 }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/456/analytics');
      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
      expect(parsed.sent_count).toBeDefined();
      expect(parsed.open_rate).toBeDefined();
    });

    it('should handle campaign with no analytics data', async () => {
      mockClient.get.mockResolvedValue({});

      const result = await analyticsTools.getCampaignAnalytics(
        mockClient as unknown as SmartleadClient,
        { campaign_id: 456 }
      );

      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toEqual({});
    });

    it('should throw validation error for invalid campaign_id', async () => {
      await expect(
        analyticsTools.getCampaignAnalytics(
          mockClient as unknown as SmartleadClient,
          { campaign_id: -1 }
        )
      ).rejects.toThrow();
    });

    it('should throw validation error for non-integer campaign_id', async () => {
      await expect(
        analyticsTools.getCampaignAnalytics(
          mockClient as unknown as SmartleadClient,
          { campaign_id: 'abc' as any }
        )
      ).rejects.toThrow();
    });
  });

  describe('getCampaignAnalyticsByDate', () => {
    it('should get campaign analytics for date range', async () => {
      const analytics = {
        '2025-01-01': { sent: 100, opened: 45, clicked: 15 },
        '2025-01-02': { sent: 120, opened: 55, clicked: 20 },
        '2025-01-03': { sent: 90, opened: 40, clicked: 12 },
      };
      mockClient.get.mockResolvedValue(analytics);

      const result = await analyticsTools.getCampaignAnalyticsByDate(
        mockClient as unknown as SmartleadClient,
        {
          campaign_id: 789,
          start_date: '2025-01-01',
          end_date: '2025-01-31',
        }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/789/analytics-by-date', {
        start_date: '2025-01-01',
        end_date: '2025-01-31',
      });
      // Verify JSON response
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeDefined();
      expect(parsed['2025-01-01']).toBeDefined();
      expect(parsed['2025-01-02']).toBeDefined();
      expect(parsed['2025-01-03']).toBeDefined();
    });

    it('should handle single day date range', async () => {
      mockClient.get.mockResolvedValue({});

      await analyticsTools.getCampaignAnalyticsByDate(
        mockClient as unknown as SmartleadClient,
        {
          campaign_id: 789,
          start_date: '2025-06-15',
          end_date: '2025-06-15',
        }
      );

      expect(mockClient.get).toHaveBeenCalledWith('/campaigns/789/analytics-by-date', {
        start_date: '2025-06-15',
        end_date: '2025-06-15',
      });
    });

    it('should throw validation error for invalid start_date format', async () => {
      await expect(
        analyticsTools.getCampaignAnalyticsByDate(
          mockClient as unknown as SmartleadClient,
          {
            campaign_id: 789,
            start_date: '01-01-2025', // Wrong format
            end_date: '2025-01-31',
          }
        )
      ).rejects.toThrow();
    });

    it('should throw validation error for invalid end_date format', async () => {
      await expect(
        analyticsTools.getCampaignAnalyticsByDate(
          mockClient as unknown as SmartleadClient,
          {
            campaign_id: 789,
            start_date: '2025-01-01',
            end_date: 'January 31, 2025', // Wrong format
          }
        )
      ).rejects.toThrow();
    });

    it('should throw validation error for missing dates', async () => {
      await expect(
        analyticsTools.getCampaignAnalyticsByDate(
          mockClient as unknown as SmartleadClient,
          { campaign_id: 789 }
        )
      ).rejects.toThrow();
    });

    it('should throw validation error for missing campaign_id', async () => {
      await expect(
        analyticsTools.getCampaignAnalyticsByDate(
          mockClient as unknown as SmartleadClient,
          { start_date: '2025-01-01', end_date: '2025-01-31' }
        )
      ).rejects.toThrow();
    });

    it('should accept dates with leading zeros', async () => {
      mockClient.get.mockResolvedValue({});

      await analyticsTools.getCampaignAnalyticsByDate(
        mockClient as unknown as SmartleadClient,
        {
          campaign_id: 789,
          start_date: '2025-01-05',
          end_date: '2025-09-08',
        }
      );

      expect(mockClient.get).toHaveBeenCalled();
    });
  });
});
