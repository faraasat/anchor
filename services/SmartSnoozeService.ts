// Smart Snooze Service - AI-powered snooze suggestions using Newell AI
import { AIService } from '@/lib/groq';
import { CalendarEvent, Reminder } from '@/types/reminder';
import { CalendarIntegrationService } from './CalendarIntegrationService';

export interface SmartSnoozeOption {
  time: Date;
  label: string;
  reason: string;
  confidence: number;
}

export class SmartSnoozeService {
  /**
   * Get AI-powered smart snooze suggestion based on calendar and context
   */
  static async getSmartSnoozeOptions(
    reminder: Reminder,
    userId: string
  ): Promise<SmartSnoozeOption[]> {
    try {
      // Get calendar events for the rest of today and tomorrow
      const events = await this.getRelevantCalendarEvents();

      // Build context for AI
      const now = new Date();
      const context = this.buildContextForAI(reminder, events, now);

      // Call Newell AI for suggestions
      const aiResponse = await AIService.chat({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a productivity assistant helping suggest optimal snooze times.
Analyze the user's calendar and the reminder urgency to suggest 3 smart snooze times.
Return JSON array with: { time: "HH:mm", label: "string", reason: "string", confidence: 0-1 }
Consider:
- Calendar gaps (free time)
- Task urgency/priority
- Time of day (avoid late night)
- Context (work hours vs personal time)`,
          },
          {
            role: 'user',
            content: context,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      // Parse AI response
      const suggestions = this.parseAIResponse(aiResponse, now);
      return suggestions;
    } catch (error) {
      console.error('Error getting smart snooze options:', error);
      // Fallback to simple suggestions
      return this.getFallbackSuggestions();
    }
  }

  /**
   * Get relevant calendar events for smart snooze analysis
   */
  private static async getRelevantCalendarEvents(): Promise<CalendarEvent[]> {
    try {
      const isAvailable = await CalendarIntegrationService.isAvailable();
      if (!isAvailable) return [];

      const today = await CalendarIntegrationService.getTodayEvents();
      const tomorrow = await CalendarIntegrationService.getTomorrowEvents();

      return [...today, ...tomorrow];
    } catch (error) {
      console.error('Error getting calendar events:', error);
      return [];
    }
  }

  /**
   * Build context string for AI analysis
   */
  private static buildContextForAI(
    reminder: Reminder,
    events: CalendarEvent[],
    now: Date
  ): string {
    const currentTime = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    let context = `Current time: ${currentTime}\n`;
    context += `Task: "${reminder.title}"\n`;
    context += `Priority: ${reminder.priority}\n`;
    context += `Tag: ${reminder.tag}\n`;
    context += `Original due: ${reminder.dueTime}\n\n`;

    if (events.length > 0) {
      context += 'Calendar events:\n';
      events.forEach((event) => {
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);
        context += `- ${event.title}: ${start.getHours()}:${start
          .getMinutes()
          .toString()
          .padStart(2, '0')} - ${end.getHours()}:${end
          .getMinutes()
          .toString()
          .padStart(2, '0')}\n`;
      });
    } else {
      context += 'No calendar events scheduled.\n';
    }

    context += '\nSuggest 3 optimal snooze times with reasons.';

    return context;
  }

  /**
   * Parse AI response into snooze options
   */
  private static parseAIResponse(response: string, now: Date): SmartSnoozeOption[] {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return this.getFallbackSuggestions();
      }

      const suggestions = JSON.parse(jsonMatch[0]);

      return suggestions.map((s: any) => {
        const [hours, minutes] = s.time.split(':').map(Number);
        const time = new Date(now);
        time.setHours(hours, minutes, 0, 0);

        // If time is in the past today, move to tomorrow
        if (time <= now) {
          time.setDate(time.getDate() + 1);
        }

        return {
          time,
          label: s.label || this.formatTimeLabel(time),
          reason: s.reason || 'Good time to revisit this task',
          confidence: s.confidence || 0.8,
        };
      });
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this.getFallbackSuggestions();
    }
  }

  /**
   * Get fallback suggestions if AI fails
   */
  private static getFallbackSuggestions(): SmartSnoozeOption[] {
    const now = new Date();
    const suggestions: SmartSnoozeOption[] = [];

    // In 1 hour
    const in1Hour = new Date(now);
    in1Hour.setHours(in1Hour.getHours() + 1);
    suggestions.push({
      time: in1Hour,
      label: 'In 1 hour',
      reason: 'Quick snooze for short break',
      confidence: 0.7,
    });

    // This evening (6 PM)
    const evening = new Date(now);
    evening.setHours(18, 0, 0, 0);
    if (evening <= now) {
      evening.setDate(evening.getDate() + 1);
    }
    suggestions.push({
      time: evening,
      label: 'This evening',
      reason: 'Review at end of day',
      confidence: 0.8,
    });

    // Tomorrow morning (9 AM)
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    suggestions.push({
      time: tomorrow,
      label: 'Tomorrow morning',
      reason: 'Fresh start tomorrow',
      confidence: 0.9,
    });

    return suggestions;
  }

  /**
   * Format time into readable label
   */
  private static formatTimeLabel(time: Date): string {
    const now = new Date();
    const isToday = time.toDateString() === now.toDateString();
    const isTomorrow =
      time.toDateString() === new Date(now.getTime() + 86400000).toDateString();

    const hours = time.getHours();
    const minutes = time.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const timeStr = `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;

    if (isToday) {
      return `Today at ${timeStr}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${timeStr}`;
    } else {
      const dayName = time.toLocaleDateString('en-US', { weekday: 'short' });
      return `${dayName} at ${timeStr}`;
    }
  }

  /**
   * Apply smart snooze to a reminder
   */
  static async applySmartSnooze(
    reminderId: string,
    snoozeTime: Date
  ): Promise<void> {
    try {
      const dueDate = snoozeTime.toISOString().split('T')[0];
      const dueTime = `${snoozeTime.getHours().toString().padStart(2, '0')}:${snoozeTime
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

      // Update in Supabase
      const { supabase } = await import('@/lib/supabase');
      await supabase
        .from('reminders')
        .update({
          dueDate,
          dueTime,
          status: 'snoozed',
          snoozedUntil: snoozeTime.toISOString(),
        })
        .eq('id', reminderId);

      // Schedule notification
      const { default: Notifications } = await import('expo-notifications');
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Reminder',
          body: 'Your snoozed task is ready',
          sound: 'default',
          data: { reminderId },
        },
        trigger: {
          date: snoozeTime,
        },
      });
    } catch (error) {
      console.error('Error applying smart snooze:', error);
      throw error;
    }
  }

  /**
   * Get quick snooze presets
   */
  static getQuickSnoozePresets(): Array<{ label: string; minutes: number }> {
    return [
      { label: '5m', minutes: 5 },
      { label: '15m', minutes: 15 },
      { label: '1h', minutes: 60 },
      { label: '2h', minutes: 120 },
    ];
  }

  /**
   * Get contextual snooze presets based on time of day
   */
  static getContextualSnoozePresets(): Array<{ label: string; time: Date }> {
    const now = new Date();
    const presets: Array<{ label: string; time: Date }> = [];

    // Tonight (9 PM)
    const tonight = new Date(now);
    tonight.setHours(21, 0, 0, 0);
    if (tonight > now) {
      presets.push({ label: 'Tonight', time: tonight });
    }

    // Tomorrow AM (9 AM)
    const tomorrowAM = new Date(now);
    tomorrowAM.setDate(tomorrowAM.getDate() + 1);
    tomorrowAM.setHours(9, 0, 0, 0);
    presets.push({ label: 'Tomorrow AM', time: tomorrowAM });

    // Next Business Day (Monday 9 AM if weekend)
    const nextBusinessDay = new Date(now);
    nextBusinessDay.setDate(nextBusinessDay.getDate() + 1);
    while (nextBusinessDay.getDay() === 0 || nextBusinessDay.getDay() === 6) {
      nextBusinessDay.setDate(nextBusinessDay.getDate() + 1);
    }
    nextBusinessDay.setHours(9, 0, 0, 0);
    presets.push({ label: 'Next Business Day', time: nextBusinessDay });

    return presets;
  }
}
