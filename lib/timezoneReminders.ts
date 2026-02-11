// Timezone-Resilient Reminders - Handle reminders across timezones correctly
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export interface ReminderSchedule {
  id: string;
  title: string;
  dueDate: string; // ISO date string
  dueTime: string; // HH:MM format
  timezone: string;
  isRecurring: boolean;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[]; // 0-6, Sunday = 0
    dayOfMonth?: number;
  };
}

export class TimezoneReminderManager {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Get user's current timezone
  getCurrentTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  // Schedule notification with timezone awareness
  async scheduleReminder(reminder: ReminderSchedule): Promise<string | null> {
    try {
      // Parse the due date and time in the original timezone
      const [hours, minutes] = reminder.dueTime.split(':').map(Number);
      const dueDateTime = new Date(reminder.dueDate);
      dueDateTime.setHours(hours, minutes, 0, 0);

      // Convert to user's current timezone
      const currentTz = this.getCurrentTimezone();
      const localDateTime = this.convertTimezone(
        dueDateTime,
        reminder.timezone,
        currentTz
      );

      // Check if the time has passed
      if (localDateTime <= new Date()) {
        console.log('Reminder time has passed, skipping notification');
        return null;
      }

      // Schedule the notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Anchor Reminder',
          body: reminder.title,
          data: { reminderId: reminder.id },
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: reminder.isRecurring
          ? this.getRecurringTrigger(reminder, localDateTime)
          : { date: localDateTime },
      });

      // Store notification ID with reminder
      await supabase
        .from('reminders')
        .update({
          notification_id: notificationId,
          scheduled_timezone: currentTz,
        })
        .eq('id', reminder.id);

      return notificationId;
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      return null;
    }
  }

  // Convert time between timezones
  private convertTimezone(
    date: Date,
    fromTz: string,
    toTz: string
  ): Date {
    // Use Intl API for timezone conversion
    const fromDate = new Date(
      date.toLocaleString('en-US', { timeZone: fromTz })
    );
    const toDate = new Date(
      date.toLocaleString('en-US', { timeZone: toTz })
    );

    const diff = toDate.getTime() - fromDate.getTime();
    return new Date(date.getTime() - diff);
  }

  // Get recurring notification trigger
  private getRecurringTrigger(
    reminder: ReminderSchedule,
    baseDateTime: Date
  ): Notifications.NotificationTriggerInput {
    const hour = baseDateTime.getHours();
    const minute = baseDateTime.getMinutes();

    switch (reminder.recurrence?.frequency) {
      case 'daily':
        return {
          hour,
          minute,
          repeats: true,
        };

      case 'weekly':
        if (!reminder.recurrence.daysOfWeek) {
          throw new Error('Days of week required for weekly recurrence');
        }
        return {
          weekday: reminder.recurrence.daysOfWeek[0] + 1, // iOS uses 1-7, Sunday = 1
          hour,
          minute,
          repeats: true,
        };

      case 'monthly':
        if (!reminder.recurrence.dayOfMonth) {
          throw new Error('Day of month required for monthly recurrence');
        }
        return {
          day: reminder.recurrence.dayOfMonth,
          hour,
          minute,
          repeats: true,
        };

      default:
        return { date: baseDateTime };
    }
  }

  // Cancel scheduled notification
  async cancelReminder(reminderId: string): Promise<boolean> {
    try {
      const { data: reminder } = await supabase
        .from('reminders')
        .select('notification_id')
        .eq('id', reminderId)
        .single();

      if (reminder?.notification_id) {
        await Notifications.cancelScheduledNotificationAsync(
          reminder.notification_id
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error canceling reminder:', error);
      return false;
    }
  }

  // Reschedule all reminders when timezone changes
  async rescheduleAllReminders(): Promise<number> {
    try {
      const { data: reminders, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', this.userId)
        .eq('status', 'pending')
        .gte('due_date', new Date().toISOString().split('T')[0]);

      if (error) throw error;

      let rescheduledCount = 0;

      for (const reminder of reminders || []) {
        // Cancel existing notification
        if (reminder.notification_id) {
          await Notifications.cancelScheduledNotificationAsync(
            reminder.notification_id
          );
        }

        // Schedule with new timezone
        const reminderSchedule: ReminderSchedule = {
          id: reminder.id,
          title: reminder.title,
          dueDate: reminder.due_date,
          dueTime: reminder.due_time,
          timezone: reminder.scheduled_timezone || this.getCurrentTimezone(),
          isRecurring: reminder.is_recurring || false,
          recurrence: reminder.recurrence,
        };

        const notificationId = await this.scheduleReminder(reminderSchedule);

        if (notificationId) {
          rescheduledCount++;
        }
      }

      console.log(`Rescheduled ${rescheduledCount} reminders`);
      return rescheduledCount;
    } catch (error) {
      console.error('Error rescheduling reminders:', error);
      return 0;
    }
  }

  // Format time for display in user's timezone
  formatTimeForDisplay(
    dateStr: string,
    timeStr: string,
    timezone?: string
  ): string {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(dateStr);
    date.setHours(hours, minutes, 0, 0);

    const currentTz = this.getCurrentTimezone();

    if (timezone && timezone !== currentTz) {
      const localDate = this.convertTimezone(date, timezone, currentTz);
      return localDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Check if reminders need rescheduling due to timezone change
  async checkTimezoneChange(): Promise<boolean> {
    try {
      const currentTz = this.getCurrentTimezone();

      const { data: user } = await supabase
        .from('profiles')
        .select('last_timezone')
        .eq('id', this.userId)
        .single();

      if (user?.last_timezone && user.last_timezone !== currentTz) {
        // Timezone changed
        await supabase
          .from('profiles')
          .update({ last_timezone: currentTz })
          .eq('id', this.userId);

        return true;
      }

      // Store current timezone if not set
      if (!user?.last_timezone) {
        await supabase
          .from('profiles')
          .update({ last_timezone: currentTz })
          .eq('id', this.userId);
      }

      return false;
    } catch (error) {
      console.error('Error checking timezone change:', error);
      return false;
    }
  }

  // Calculate time until reminder
  getTimeUntilReminder(
    dueDate: string,
    dueTime: string,
    timezone?: string
  ): number {
    const [hours, minutes] = dueTime.split(':').map(Number);
    const date = new Date(dueDate);
    date.setHours(hours, minutes, 0, 0);

    const currentTz = this.getCurrentTimezone();
    const localDate = timezone
      ? this.convertTimezone(date, timezone, currentTz)
      : date;

    return localDate.getTime() - Date.now();
  }

  // Get user-friendly time remaining string
  getTimeRemainingString(
    dueDate: string,
    dueTime: string,
    timezone?: string
  ): string {
    const ms = this.getTimeUntilReminder(dueDate, dueTime, timezone);

    if (ms < 0) return 'Overdue';

    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `In ${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `In ${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `In ${minutes} min${minutes > 1 ? 's' : ''}`;

    return 'Soon';
  }
}

// Singleton instance
let timezoneManagerInstance: TimezoneReminderManager | null = null;

export const getTimezoneReminderManager = (userId: string): TimezoneReminderManager => {
  if (!timezoneManagerInstance || timezoneManagerInstance['userId'] !== userId) {
    timezoneManagerInstance = new TimezoneReminderManager(userId);
  }
  return timezoneManagerInstance;
};

// Initialize timezone checking on app start
export const initializeTimezoneMonitoring = async (userId: string) => {
  const manager = getTimezoneReminderManager(userId);
  const hasChanged = await manager.checkTimezoneChange();

  if (hasChanged) {
    console.log('Timezone change detected, rescheduling reminders...');
    await manager.rescheduleAllReminders();
  }
};
