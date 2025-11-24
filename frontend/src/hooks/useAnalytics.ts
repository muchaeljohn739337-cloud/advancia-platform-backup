import { useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import analytics, { AnalyticsEvent } from '@/lib/analytics';

// Hook for tracking page views
export function usePageTracking() {
  useEffect(() => {
    // Track initial page view
    if (typeof window !== 'undefined') {
      analytics.trackPageView(window.location.pathname);

      // Track route changes using popstate and pushstate
      const handleRouteChange = () => {
        analytics.trackPageView(window.location.pathname);
      };

      window.addEventListener('popstate', handleRouteChange);

      // Override pushState and replaceState to track SPA navigation
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      history.pushState = function (...args) {
        originalPushState.apply(this, args);
        handleRouteChange();
      };

      history.replaceState = function (...args) {
        originalReplaceState.apply(this, args);
        handleRouteChange();
      };

      return () => {
        window.removeEventListener('popstate', handleRouteChange);
        history.pushState = originalPushState;
        history.replaceState = originalReplaceState;
      };
    }
  }, []);
}

// Hook for tracking user interactions
export function useAnalytics() {
  const { data: session } = useSession();

  // Set user ID when session changes
  useEffect(() => {
    if (session?.user && 'id' in session.user) {
      analytics.setUserId((session.user as any).id);
    }
  }, [session?.user]);

  const trackEvent = useCallback((event: AnalyticsEvent) => {
    analytics.track(event);
  }, []);

  const trackInteraction = useCallback(
    (action: string, element: string, properties?: Record<string, any>) => {
      analytics.trackInteraction(action, element, properties);
    },
    []
  );

  const trackFormSubmit = useCallback(
    (formName: string, success: boolean, properties?: Record<string, any>) => {
      analytics.trackFormSubmit(formName, success, properties);
    },
    []
  );

  const trackConversion = useCallback(
    (conversionType: string, value?: number, properties?: Record<string, any>) => {
      analytics.trackConversion(conversionType, value, properties);
    },
    []
  );

  return {
    trackEvent,
    trackInteraction,
    trackFormSubmit,
    trackConversion,
  };
}

// Hook for button click tracking
export function useTrackButtonClick(
  buttonName: string,
  additionalProperties?: Record<string, any>
) {
  const { trackInteraction } = useAnalytics();

  return useCallback(
    (event?: React.MouseEvent) => {
      trackInteraction('click', 'button', {
        buttonName,
        ...additionalProperties,
      });
    },
    [trackInteraction, buttonName, additionalProperties]
  );
}

// Hook for form tracking
export function useTrackForm(formName: string) {
  const { trackFormSubmit } = useAnalytics();

  const trackSubmit = useCallback(
    (success: boolean, additionalProperties?: Record<string, any>) => {
      trackFormSubmit(formName, success, additionalProperties);
    },
    [trackFormSubmit, formName]
  );

  return { trackSubmit };
}

// Hook for conversion tracking
export function useTrackConversion(conversionType: string) {
  const { trackConversion } = useAnalytics();

  return useCallback(
    (value?: number, properties?: Record<string, any>) => {
      trackConversion(conversionType, value, properties);
    },
    [trackConversion, conversionType]
  );
}

// Hook for admin analytics data
export function useAdminAnalytics() {
  const getUserJourney = useCallback(async (userId: string, days: number = 90) => {
    return analytics.getUserJourney(userId, days);
  }, []);

  const getFunnels = useCallback(
    async (params?: { startDate?: string; endDate?: string; segment?: string }) => {
      return analytics.getFunnels(params);
    },
    []
  );

  const getCohorts = useCallback(async (params?: { period?: string; months?: number }) => {
    return analytics.getCohorts(params);
  }, []);

  return {
    getUserJourney,
    getFunnels,
    getCohorts,
  };
}
