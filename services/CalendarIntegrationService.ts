// Calendar Integration Service - Bi-directional device calendar sync
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import type { CalendarEvent } from '@/types/reminder';

export class CalendarIntegrationService {
  /**
   * Request calendar permissions
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting calendar permissions:', error);
      return false;
    }
  }

  /**
   * Get all available calendars
   */
  static async getCalendars(): Promise<Calendar.Calendar[]> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Calendar permission denied');
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      return calendars;
    } catch (error) {
      console.error('Error fetching calendars:', error);
      return [];
    }
  }

  /**
   * Get today's calendar events
   */
  static async getTodayEvents(): Promise<CalendarEvent[]> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return [];
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      if (calendars.length === 0) {
        return [];
      }

      // Get today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch events from all calendars
      const allEvents: CalendarEvent[] = [];
      for (const calendar of calendars) {
        const events = await Calendar.getEventsAsync(
          [calendar.id],
          today,
          tomorrow
        );

        const mappedEvents = events.map((event) => ({
          id: event.id,
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          notes: event.notes,
          calendarId: event.calendarId,
          allDay: event.allDay,
        }));

        allEvents.push(...mappedEvents);
      }

      // Sort by start time
      allEvents.sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );

      return allEvents;
    } catch (error) {
      console.error('Error fetching today\'s events:', error);
      return [];
    }
  }

  /**
   * Get events for a specific date
   */
  static async getEventsForDate(date: Date): Promise<CalendarEvent[]> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return [];
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      if (calendars.length === 0) {
        return [];
      }

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const allEvents: CalendarEvent[] = [];
      for (const calendar of calendars) {
        const events = await Calendar.getEventsAsync(
          [calendar.id],
          startOfDay,
          endOfDay
        );

        const mappedEvents = events.map((event) => ({
          id: event.id,
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          notes: event.notes,
          calendarId: event.calendarId,
          allDay: event.allDay,
        }));

        allEvents.push(...mappedEvents);
      }

      allEvents.sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );

      return allEvents;
    } catch (error) {
      console.error('Error fetching events for date:', error);
      return [];
    }
  }

  /**
   * Check if calendar access is available
   */
  static async isAvailable(): Promise<boolean> {
    // Calendar API is not available on web
    if (Platform.OS === 'web') {
      return false;
    }

    try {
      const hasPermission = await this.requestPermissions();
      return hasPermission;
    } catch (error) {
      return false;
    }
  }
}
