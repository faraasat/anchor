// Calendar Sync Utility - Bi-directional sync with Apple/Google Calendar
import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';
import { supabase } from './supabase';

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
}

export class CalendarSyncService {
  private userId: string;
  private defaultCalendarId: string | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Request calendar permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Calendar access is needed to sync your events with Anchor.'
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting calendar permissions:', error);
      return false;
    }
  }

  // Get default calendar
  async getDefaultCalendar(): Promise<string | null> {
    try {
      if (this.defaultCalendarId) {
        return this.defaultCalendarId;
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

      // Find default or first writable calendar
      const defaultCal = calendars.find(
        (cal) => cal.isPrimary || cal.allowsModifications
      );

      if (defaultCal) {
        this.defaultCalendarId = defaultCal.id;
        return defaultCal.id;
      }

      return null;
    } catch (error) {
      console.error('Error getting default calendar:', error);
      return null;
    }
  }

  // Sync events from device to Supabase
  async syncToSupabase(): Promise<number> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return 0;

      const calendarId = await this.getDefaultCalendar();
      if (!calendarId) {
        Alert.alert('Error', 'No calendar found');
        return 0;
      }

      // Get events from the next 30 days
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const events = await Calendar.getEventsAsync(
        [calendarId],
        startDate,
        endDate
      );

      let syncedCount = 0;

      for (const event of events) {
        try {
          // Check if event already exists
          const { data: existing } = await supabase
            .from('calendar_events')
            .select('id')
            .eq('user_id', this.userId)
            .eq('external_id', event.id)
            .eq('calendar_type', Platform.OS === 'ios' ? 'apple' : 'google')
            .maybeSingle();

          if (existing) {
            // Update existing event
            await supabase
              .from('calendar_events')
              .update({
                title: event.title,
                start_time: new Date(event.startDate).toISOString(),
                end_time: new Date(event.endDate).toISOString(),
                synced_at: new Date().toISOString(),
              })
              .eq('id', existing.id);
          } else {
            // Insert new event
            await supabase.from('calendar_events').insert({
              user_id: this.userId,
              external_id: event.id,
              title: event.title,
              start_time: new Date(event.startDate).toISOString(),
              end_time: new Date(event.endDate).toISOString(),
              calendar_type: Platform.OS === 'ios' ? 'apple' : 'google',
            });
          }

          syncedCount++;
        } catch (error) {
          console.error('Error syncing event:', event.title, error);
        }
      }

      return syncedCount;
    } catch (error) {
      console.error('Error syncing to Supabase:', error);
      Alert.alert('Sync Error', 'Failed to sync calendar events');
      return 0;
    }
  }

  // Create calendar event from Anchor reminder
  async createEventFromReminder(
    title: string,
    startTime: Date,
    duration: number = 60,
    notes?: string
  ): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const calendarId = await this.getDefaultCalendar();
      if (!calendarId) {
        Alert.alert('Error', 'No calendar found');
        return null;
      }

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration);

      const eventId = await Calendar.createEventAsync(calendarId, {
        title,
        startDate: startTime,
        endDate: endTime,
        notes,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      return eventId;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      Alert.alert('Error', 'Failed to create calendar event');
      return null;
    }
  }

  // Get upcoming events for context
  async getUpcomingEvents(hours: number = 24): Promise<CalendarEvent[]> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return [];

      const calendarId = await this.getDefaultCalendar();
      if (!calendarId) return [];

      const startDate = new Date();
      const endDate = new Date();
      endDate.setHours(endDate.getHours() + hours);

      const events = await Calendar.getEventsAsync(
        [calendarId],
        startDate,
        endDate
      );

      return events.map((event) => ({
        id: event.id,
        title: event.title,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        location: event.location,
        notes: event.notes,
      }));
    } catch (error) {
      console.error('Error getting upcoming events:', error);
      return [];
    }
  }

  // Find free time slots between events
  async findFreeTimeSlots(
    startTime: Date,
    endTime: Date,
    minDuration: number = 30
  ): Promise<Array<{ start: Date; end: Date }>> {
    try {
      const events = await this.getUpcomingEvents(
        (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
      );

      // Sort events by start time
      const sortedEvents = events
        .filter(e => e.startDate >= startTime && e.startDate <= endTime)
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

      const freeSlots: Array<{ start: Date; end: Date }> = [];
      let currentTime = startTime;

      for (const event of sortedEvents) {
        // Check if there's a gap before this event
        const gapDuration = (event.startDate.getTime() - currentTime.getTime()) / (1000 * 60);

        if (gapDuration >= minDuration) {
          freeSlots.push({
            start: new Date(currentTime),
            end: new Date(event.startDate),
          });
        }

        // Move current time to after this event
        currentTime = event.endDate > currentTime ? event.endDate : currentTime;
      }

      // Check if there's time after the last event
      if (currentTime < endTime) {
        const remainingDuration = (endTime.getTime() - currentTime.getTime()) / (1000 * 60);
        if (remainingDuration >= minDuration) {
          freeSlots.push({
            start: new Date(currentTime),
            end: new Date(endTime),
          });
        }
      }

      return freeSlots;
    } catch (error) {
      console.error('Error finding free time slots:', error);
      return [];
    }
  }

  // Delete calendar event
  async deleteEvent(externalId: string): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      await Calendar.deleteEventAsync(externalId);
      return true;
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      return false;
    }
  }
}

// Export singleton-like function
export const getCalendarSyncService = (userId: string) => {
  return new CalendarSyncService(userId);
};
