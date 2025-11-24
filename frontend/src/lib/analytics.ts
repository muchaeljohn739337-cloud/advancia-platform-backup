import apiClient from './apiClient';

export interface AnalyticsEvent {
  eventName: string;
  eventProperties?: Record<string, any>;
  userProperties?: Record<string, any>;
  sessionId?: string;
  deviceInfo?: Record<string, any>;
  referrer?: string;
  url?: string;
  platform?: string;
  appVersion?: string;
}

export interface UserJourney {
  userId: string;
  events: Array<{
    id: string;
    eventName: string;
    eventProperties: any;
    timestamp: string;
    sessionId?: string;
  }>;
  milestones: {
    registered: boolean;
    emailVerified: boolean;
    profileCompleted: boolean;
    firstLogin: boolean;
    firstTransaction: boolean;
    firstCryptoPurchase: boolean;
    firstWithdrawal: boolean;
    powerUser: boolean;
  };
  timeRange: {
    start: string;
    end: string;
  };
  recentEvents: Array<{
    id: string;
    eventName: string;
    eventProperties: any;
    timestamp: string;
  }>;
}

export interface FunnelData {
  step: string;
  users: number;
  conversionRate: number;
  dropOff: number;
}

export interface CohortData {
  cohort_month: string;
  cohort_size: number;
  active_users: number;
  retained_30d: number;
  retained_90d: number;
  avg_transactions_per_user: number;
}

class AnalyticsService {
  private sessionId: string;
  private userId: string | null = null;

  constructor() {
    // Generate or retrieve session ID
    this.sessionId = this.getOrCreateSessionId();

    // Try to get user ID from localStorage or session
    this.userId = localStorage.getItem('userId');
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  setUserId(userId: string) {
    this.userId = userId;
    localStorage.setItem('userId', userId);
  }

  // Track user events
  async track(event: AnalyticsEvent): Promise<void> {
    try {
      const eventData = {
        ...event,
        sessionId: event.sessionId || this.sessionId,
        userId: this.userId,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          ...event.deviceInfo,
        },
        referrer: event.referrer || document.referrer,
        url: event.url || window.location.href,
        platform: event.platform || 'web',
        appVersion: event.appVersion || '1.0.0',
      };

      await apiClient.post('/api/analytics/amplitude/track', eventData);

      // Store in local storage for offline tracking (optional)
      this.storeEventLocally(eventData);
    } catch (error) {
      console.error('Analytics tracking failed:', error);
      // Store failed events for retry
      this.storeFailedEvent(event);
    }
  }

  // Track page views
  async trackPageView(page: string, properties?: Record<string, any>): Promise<void> {
    await this.track({
      eventName: 'page_view',
      eventProperties: {
        page,
        ...properties,
      },
    });
  }

  // Track user interactions
  async trackInteraction(
    action: string,
    element: string,
    properties?: Record<string, any>
  ): Promise<void> {
    await this.track({
      eventName: 'user_interaction',
      eventProperties: {
        action,
        element,
        ...properties,
      },
    });
  }

  // Track form submissions
  async trackFormSubmit(
    formName: string,
    success: boolean,
    properties?: Record<string, any>
  ): Promise<void> {
    await this.track({
      eventName: 'form_submit',
      eventProperties: {
        formName,
        success,
        ...properties,
      },
    });
  }

  // Track conversions
  async trackConversion(
    conversionType: string,
    value?: number,
    properties?: Record<string, any>
  ): Promise<void> {
    await this.track({
      eventName: 'conversion',
      eventProperties: {
        conversionType,
        value,
        ...properties,
      },
    });
  }

  // Get user journey
  async getUserJourney(userId: string, days: number = 90): Promise<UserJourney> {
    const response = await apiClient.get(`/api/analytics/amplitude/user-journey/${userId}`, {
      params: { days },
    });
    return response.data;
  }

  // Get funnel analysis
  async getFunnels(params?: { startDate?: string; endDate?: string; segment?: string }): Promise<{
    funnels: FunnelData[];
    insights: {
      bestPerformingStep: string;
      worstDropOff: string;
      overallConversionRate: number;
    };
  }> {
    const response = await apiClient.get('/api/analytics/amplitude/funnels', {
      params,
    });
    return response.data;
  }

  // Get cohort analysis
  async getCohorts(params?: { period?: string; months?: number }): Promise<{
    cohorts: CohortData[];
    insights: {
      bestCohort: string;
      retentionTrend: string;
      recommendations: string[];
    };
  }> {
    const response = await apiClient.get('/api/analytics/amplitude/cohorts', {
      params,
    });
    return response.data;
  }

  // Private methods for offline handling
  private storeEventLocally(event: AnalyticsEvent): void {
    try {
      const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      events.push({ ...event, timestamp: new Date().toISOString() });

      // Keep only last 100 events
      if (events.length > 100) {
        events.splice(0, events.length - 100);
      }

      localStorage.setItem('analytics_events', JSON.stringify(events));
    } catch (error) {
      console.error('Failed to store event locally:', error);
    }
  }

  private storeFailedEvent(event: AnalyticsEvent): void {
    try {
      const failedEvents = JSON.parse(localStorage.getItem('analytics_failed_events') || '[]');
      failedEvents.push({
        ...event,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      });

      // Keep only last 50 failed events
      if (failedEvents.length > 50) {
        failedEvents.splice(0, failedEvents.length - 50);
      }

      localStorage.setItem('analytics_failed_events', JSON.stringify(failedEvents));
    } catch (error) {
      console.error('Failed to store failed event:', error);
    }
  }

  // Retry failed events (call this periodically)
  async retryFailedEvents(): Promise<void> {
    try {
      const failedEvents = JSON.parse(localStorage.getItem('analytics_failed_events') || '[]');
      const successfulRetries: number[] = [];

      for (let i = 0; i < failedEvents.length; i++) {
        const event = failedEvents[i];
        if (event.retryCount < 3) {
          try {
            await apiClient.post('/api/analytics/amplitude/track', event);
            successfulRetries.push(i);
          } catch (error) {
            event.retryCount++;
          }
        }
      }

      // Remove successfully retried events
      successfulRetries.reverse().forEach((index) => {
        failedEvents.splice(index, 1);
      });

      localStorage.setItem('analytics_failed_events', JSON.stringify(failedEvents));
    } catch (error) {
      console.error('Failed to retry events:', error);
    }
  }
}

// Create singleton instance
export const analytics = new AnalyticsService();
export default analytics;
