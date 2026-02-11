// Advanced Integrations Hook - Initialize all advanced features
import { useEffect, useState, useCallback } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { useAuth } from '@/lib/auth';
import { getCalendarSyncService } from '@/lib/calendarSync';
import { getHealthSyncService } from '@/lib/healthSync';
import { getOfflineSyncManager } from '@/lib/offlineSync';
import { getTimezoneReminderManager, initializeTimezoneMonitoring } from '@/lib/timezoneReminders';

interface IntegrationStatus {
  calendar: {
    enabled: boolean;
    lastSync: Date | null;
    upcomingEvents: number;
  };
  health: {
    enabled: boolean;
    lastSync: Date | null;
    todayScore: number;
  };
  offline: {
    queueCount: number;
    isOnline: boolean;
    isSyncing: boolean;
  };
  timezone: {
    current: string;
    hasChanged: boolean;
  };
}

export const useAdvancedIntegrations = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [status, setStatus] = useState<IntegrationStatus>({
    calendar: { enabled: false, lastSync: null, upcomingEvents: 0 },
    health: { enabled: false, lastSync: null, todayScore: 0 },
    offline: { queueCount: 0, isOnline: true, isSyncing: false },
    timezone: { current: 'UTC', hasChanged: false },
  });

  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize all services
  useEffect(() => {
    if (!userId) return;

    const initialize = async () => {
      try {
        // Initialize timezone monitoring
        await initializeTimezoneMonitoring(userId);

        // Get services
        const calendarService = getCalendarSyncService(userId);
        const healthService = getHealthSyncService(userId);
        const offlineService = getOfflineSyncManager(userId);
        const timezoneService = getTimezoneReminderManager(userId);

        // Update initial status
        const offlineStatus = offlineService.getQueueStatus();
        const currentTz = timezoneService.getCurrentTimezone();

        setStatus({
          calendar: { enabled: false, lastSync: null, upcomingEvents: 0 },
          health: { enabled: false, lastSync: null, todayScore: 0 },
          offline: {
            queueCount: offlineStatus.count,
            isOnline: offlineStatus.isOnline,
            isSyncing: offlineStatus.isSyncing,
          },
          timezone: { current: currentTz, hasChanged: false },
        });

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing integrations:', error);
      }
    };

    initialize();

    // Monitor app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [userId]);

  // Handle app state changes
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active' && userId) {
      // App came to foreground, check for changes
      checkForUpdates();
    }
  };

  // Check for updates
  const checkForUpdates = useCallback(async () => {
    if (!userId) return;

    try {
      const offlineService = getOfflineSyncManager(userId);
      const timezoneService = getTimezoneReminderManager(userId);

      // Check timezone changes
      const hasTimezoneChanged = await timezoneService.checkTimezoneChange();

      // Update status
      const offlineStatus = offlineService.getQueueStatus();
      setStatus((prev) => ({
        ...prev,
        offline: {
          queueCount: offlineStatus.count,
          isOnline: offlineStatus.isOnline,
          isSyncing: offlineStatus.isSyncing,
        },
        timezone: {
          current: timezoneService.getCurrentTimezone(),
          hasChanged: hasTimezoneChanged,
        },
      }));

      // Trigger sync if online
      if (offlineStatus.isOnline && offlineStatus.count > 0) {
        await offlineService.forceSyncNow();
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }, [userId]);

  // Sync calendar
  const syncCalendar = useCallback(async () => {
    if (!userId) return;

    try {
      const calendarService = getCalendarSyncService(userId);
      const count = await calendarService.syncToSupabase();

      const events = await calendarService.getUpcomingEvents(24);

      setStatus((prev) => ({
        ...prev,
        calendar: {
          enabled: true,
          lastSync: new Date(),
          upcomingEvents: events.length,
        },
      }));

      Alert.alert('Calendar Synced', `${count} events synced successfully`);
    } catch (error) {
      console.error('Error syncing calendar:', error);
      Alert.alert('Sync Failed', 'Failed to sync calendar events');
    }
  }, [userId]);

  // Sync health data
  const syncHealth = useCallback(async () => {
    if (!userId) return;

    try {
      const healthService = getHealthSyncService(userId);
      const count = await healthService.syncHealthData();

      const todaySummary = await healthService.getTodayHealthSummary();
      const score = todaySummary
        ? healthService.calculateHealthScore(todaySummary)
        : 0;

      setStatus((prev) => ({
        ...prev,
        health: {
          enabled: true,
          lastSync: new Date(),
          todayScore: score,
        },
      }));

      Alert.alert('Health Data Synced', `${count} days of health data synced`);
    } catch (error) {
      console.error('Error syncing health:', error);
      Alert.alert('Sync Failed', 'Failed to sync health data');
    }
  }, [userId]);

  // Force offline sync
  const forceOfflineSync = useCallback(async () => {
    if (!userId) return;

    try {
      const offlineService = getOfflineSyncManager(userId);
      const count = await offlineService.forceSyncNow();

      const offlineStatus = offlineService.getQueueStatus();
      setStatus((prev) => ({
        ...prev,
        offline: {
          queueCount: offlineStatus.count,
          isOnline: offlineStatus.isOnline,
          isSyncing: offlineStatus.isSyncing,
        },
      }));

      if (count > 0) {
        Alert.alert('Sync Complete', `${count} operations synced successfully`);
      }
    } catch (error) {
      console.error('Error forcing sync:', error);
    }
  }, [userId]);

  // Get calendar events for context
  const getCalendarContext = useCallback(async () => {
    if (!userId) return [];

    try {
      const calendarService = getCalendarSyncService(userId);
      return await calendarService.getUpcomingEvents(24);
    } catch (error) {
      console.error('Error getting calendar context:', error);
      return [];
    }
  }, [userId]);

  // Get health recommendation
  const getHealthRecommendation = useCallback(async () => {
    if (!userId) return null;

    try {
      const healthService = getHealthSyncService(userId);
      return await healthService.getActivityRecommendation();
    } catch (error) {
      console.error('Error getting health recommendation:', error);
      return null;
    }
  }, [userId]);

  return {
    isInitialized,
    status,
    syncCalendar,
    syncHealth,
    forceOfflineSync,
    getCalendarContext,
    getHealthRecommendation,
    checkForUpdates,
  };
};
