// Enhanced Notification Service - Interactive notifications with custom snooze and haptic feedback
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { Reminder } from '@/types/reminder';
import { SmartSnoozeService } from './SmartSnoozeService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Haptic Signatures for different actions
export enum HapticSignature {
  TASK_COMPLETED = 'task_completed',
  TASK_SNOOZED = 'task_snoozed',
  TASK_CREATED = 'task_created',
  GOAL_REACHED = 'goal_reached',
  WARNING = 'warning',
  DEPENDENCY_READY = 'dependency_ready',
}

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class EnhancedNotificationService {
  private static readonly SYNC_KEY = 'notification_sync_state';

  /**
   * Initialize notification service
   */
  static async initialize(): Promise<void> {
    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
        return;
      }

      // Register notification categories with actions
      await this.registerNotificationCategories();

      // Set up notification response handler
      this.setupNotificationResponseHandler();
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  /**
   * Register interactive notification categories
   */
  private static async registerNotificationCategories(): Promise<void> {
    if (Platform.OS === 'ios') {
      await Notifications.setNotificationCategoryAsync('reminder', [
        {
          identifier: 'complete',
          buttonTitle: '✓ Complete',
          options: {
            opensAppToForeground: false,
          },
        },
        {
          identifier: 'snooze_5m',
          buttonTitle: '5m',
          options: {
            opensAppToForeground: false,
          },
        },
        {
          identifier: 'snooze_15m',
          buttonTitle: '15m',
          options: {
            opensAppToForeground: false,
          },
        },
        {
          identifier: 'snooze_1h',
          buttonTitle: '1h',
          options: {
            opensAppToForeground: false,
          },
        },
        {
          identifier: 'snooze_smart',
          buttonTitle: '✨ Smart',
          options: {
            opensAppToForeground: true,
          },
        },
      ]);
    }
  }

  /**
   * Setup notification response handler
   */
  private static setupNotificationResponseHandler(): void {
    Notifications.addNotificationResponseReceivedListener(async (response) => {
      const action = response.actionIdentifier;
      const reminderId = response.notification.request.content.data.reminderId as string;

      if (!reminderId) return;

      switch (action) {
        case 'complete':
          await this.handleCompleteAction(reminderId);
          break;
        case 'snooze_5m':
          await this.handleSnoozeAction(reminderId, 5);
          break;
        case 'snooze_15m':
          await this.handleSnoozeAction(reminderId, 15);
          break;
        case 'snooze_1h':
          await this.handleSnoozeAction(reminderId, 60);
          break;
        case 'snooze_smart':
          // Open app for smart snooze selection
          break;
      }
    });
  }

  /**
   * Handle complete action from notification
   */
  private static async handleCompleteAction(reminderId: string): Promise<void> {
    try {
      const { supabase } = await import('@/lib/supabase');
      await supabase
        .from('reminders')
        .update({ status: 'completed', completedAt: new Date().toISOString() })
        .eq('id', reminderId);

      // Play haptic signature
      await this.playHapticSignature(HapticSignature.TASK_COMPLETED);

      // Sync across devices
      await this.syncNotificationState(reminderId, 'completed');
    } catch (error) {
      console.error('Error completing reminder from notification:', error);
    }
  }

  /**
   * Handle snooze action from notification
   */
  private static async handleSnoozeAction(reminderId: string, minutes: number): Promise<void> {
    try {
      const snoozeUntil = new Date();
      snoozeUntil.setMinutes(snoozeUntil.getMinutes() + minutes);

      await SmartSnoozeService.applySmartSnooze(reminderId, snoozeUntil);

      // Play haptic signature
      await this.playHapticSignature(HapticSignature.TASK_SNOOZED);

      // Sync across devices
      await this.syncNotificationState(reminderId, 'snoozed', snoozeUntil.toISOString());
    } catch (error) {
      console.error('Error snoozing reminder from notification:', error);
    }
  }

  /**
   * Schedule interactive notification for reminder
   */
  static async scheduleReminderNotification(reminder: Reminder): Promise<string> {
    try {
      const dueDateTime = new Date(`${reminder.dueDate}T${reminder.dueTime}`);

      // Get weather context if weather-dependent
      let bodyText = reminder.description || reminder.title;
      if (reminder.weatherDependent) {
        // Add weather context
        const weatherContext = await this.getWeatherContext();
        if (weatherContext) {
          bodyText += `\n${weatherContext}`;
        }
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: bodyText,
          sound: 'default',
          categoryIdentifier: 'reminder',
          data: {
            reminderId: reminder.id,
            priority: reminder.priority,
          },
          badge: 1,
        },
        trigger: {
          date: dueDateTime,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  /**
   * Play haptic signature for specific action
   */
  static async playHapticSignature(signature: HapticSignature): Promise<void> {
    if (Platform.OS === 'web') return;

    try {
      switch (signature) {
        case HapticSignature.TASK_COMPLETED:
          // Success pattern: short, pause, short, pause, long
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          await this.delay(50);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          await this.delay(50);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;

        case HapticSignature.TASK_SNOOZED:
          // Snooze pattern: medium, pause, medium
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await this.delay(100);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;

        case HapticSignature.TASK_CREATED:
          // Creation pattern: light single tap
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;

        case HapticSignature.GOAL_REACHED:
          // Celebration pattern: series of increasing taps
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          await this.delay(50);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await this.delay(50);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await this.delay(50);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;

        case HapticSignature.WARNING:
          // Warning pattern: two heavy taps
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await this.delay(100);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;

        case HapticSignature.DEPENDENCY_READY:
          // Dependency ready: ascending pattern
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          await this.delay(75);
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await this.delay(75);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
      }
    } catch (error) {
      console.error('Error playing haptic signature:', error);
    }
  }

  /**
   * Sync notification state across devices (True Sync)
   */
  private static async syncNotificationState(
    reminderId: string,
    state: 'completed' | 'snoozed' | 'dismissed',
    snoozedUntil?: string
  ): Promise<void> {
    try {
      const syncData = {
        reminderId,
        state,
        timestamp: new Date().toISOString(),
        snoozedUntil,
      };

      // Save to Supabase for cross-device sync
      const { supabase } = await import('@/lib/supabase');
      await supabase.from('notification_sync').insert(syncData);

      // Save locally
      await AsyncStorage.setItem(
        `${this.SYNC_KEY}_${reminderId}`,
        JSON.stringify(syncData)
      );
    } catch (error) {
      console.error('Error syncing notification state:', error);
    }
  }

  /**
   * Listen for notification sync from other devices
   */
  static setupCrossDeviceSync(userId: string, onSync: (data: any) => void): void {
    const { supabase } = require('@/lib/supabase');

    // Subscribe to notification sync changes
    const subscription = supabase
      .channel('notification_sync')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_sync',
        },
        (payload: any) => {
          onSync(payload.new);
        }
      )
      .subscribe();

    // Return cleanup function
    return () => {
      subscription.unsubscribe();
    };
  }

  /**
   * Get weather context for notification
   */
  private static async getWeatherContext(): Promise<string | null> {
    try {
      const { WeatherService } = await import('./WeatherService');
      const weather = await WeatherService.getCurrentWeather();

      if (weather.condition.toLowerCase().includes('rain')) {
        return '☔ It\'s raining - don\'t forget an umbrella!';
      } else if (weather.temperature > 30) {
        return '🌡️ It\'s hot outside - stay hydrated!';
      } else if (weather.temperature < 5) {
        return '🧥 It\'s cold - dress warmly!';
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Helper: delay for haptic patterns
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Cancel notification
   */
  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }
}
