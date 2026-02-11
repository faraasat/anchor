// Contextual AI Service - Smart 'Near You' recommendations using Newell AI
import { generateText } from '@fastshot/ai';
import type { Reminder, CalendarEvent } from '@/types/reminder';

export interface ContextData {
  location?: {
    latitude: number;
    longitude: number;
  };
  weather?: {
    temperature: number;
    condition: string;
    icon: string;
  };
  time: {
    hour: number;
    dayOfWeek: number;
    isWeekend: boolean;
  };
  reminders: Reminder[];
  calendarEvents?: CalendarEvent[];
  userPatterns?: {
    productiveHours?: number[];
    preferredTaskTypes?: string[];
  };
}

export interface ContextualRecommendation {
  id: string;
  type: 'traffic' | 'weather' | 'proximity' | 'calendar' | 'productivity' | 'wellness';
  icon: string;
  title: string;
  message: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
  color: string;
  relatedReminderIds?: string[];
}

export class ContextualAIService {
  /**
   * Generate smart contextual recommendations based on current environment
   */
  static async generateRecommendations(context: ContextData): Promise<ContextualRecommendation[]> {
    try {
      const prompt = this.buildContextPrompt(context);

      const response = await generateText({
        prompt,
        systemPrompt: `You are Anchor's proactive AI assistant that analyzes user context and provides timely, helpful recommendations.

IMPORTANT RULES:
1. Return recommendations as a JSON array
2. Each recommendation must have: id, type, icon, title, message, priority, color
3. Types: 'traffic', 'weather', 'proximity', 'calendar', 'productivity', 'wellness'
4. Priorities: 'high' (urgent/time-sensitive), 'medium' (helpful), 'low' (nice-to-have)
5. Icons: valid Ionicons names (e.g., 'car-outline', 'rainy-outline', 'location-outline')
6. Colors: hex colors (e.g., '#F59E0B', '#3B82F6', '#10B981')
7. Messages must be actionable and specific (1-2 sentences)
8. Return 2-4 recommendations maximum
9. Focus on time-sensitive and location-relevant insights
10. Return ONLY valid JSON, no other text

Example format:
[
  {
    "id": "traffic-1",
    "type": "traffic",
    "icon": "car-outline",
    "title": "Leave Soon",
    "message": "Your meeting is in 45 minutes. Traffic is moderate - leave in 10 minutes to arrive on time.",
    "action": "View Route",
    "priority": "high",
    "color": "#F59E0B",
    "relatedReminderIds": []
  }
]`,
      });

      const recommendations = this.parseRecommendationsResponse(response);
      return recommendations;
    } catch (error) {
      console.error('Error generating contextual recommendations:', error);
      // Return smart fallback recommendations
      return this.getFallbackRecommendations(context);
    }
  }

  /**
   * Build detailed context prompt for AI
   */
  private static buildContextPrompt(context: ContextData): string {
    const parts: string[] = ['Analyze this context and provide smart, proactive recommendations:'];

    // Time context
    const { hour, dayOfWeek, isWeekend } = context.time;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    parts.push(`\nTime: ${hour}:00 on ${days[dayOfWeek]} ${isWeekend ? '(weekend)' : '(weekday)'}`);

    // Weather context
    if (context.weather) {
      parts.push(`Weather: ${context.weather.temperature}°F, ${context.weather.condition}`);
    }

    // Upcoming calendar events
    if (context.calendarEvents && context.calendarEvents.length > 0) {
      parts.push('\nUpcoming Calendar Events:');
      context.calendarEvents.slice(0, 3).forEach((event) => {
        const eventTime = new Date(event.startDate);
        const now = new Date();
        const minutesUntil = Math.floor((eventTime.getTime() - now.getTime()) / 60000);
        parts.push(`  - "${event.title}" in ${minutesUntil} minutes at ${event.location || 'unknown location'}`);
      });
    }

    // Active reminders
    const pendingReminders = context.reminders.filter((r) => r.status === 'pending');
    if (pendingReminders.length > 0) {
      parts.push('\nActive Reminders:');
      pendingReminders.slice(0, 5).forEach((reminder) => {
        const tags = reminder.tags?.join(', ') || 'no tags';
        parts.push(`  - "${reminder.title}" (${reminder.category}, due ${reminder.dueTime}, tags: ${tags})`);
      });
    }

    // Location-based reminders
    const locationReminders = pendingReminders.filter(
      (r) =>
        r.tags?.includes('errands') ||
        r.tags?.includes('shopping') ||
        r.tags?.includes('location') ||
        r.title.toLowerCase().includes('store') ||
        r.title.toLowerCase().includes('buy')
    );
    if (locationReminders.length > 0) {
      parts.push('\nLocation-Related Tasks:');
      locationReminders.forEach((r) => parts.push(`  - "${r.title}"`));
    }

    // Outdoor activity check
    const outdoorReminders = pendingReminders.filter(
      (r) =>
        r.tags?.includes('outdoor') ||
        r.title.toLowerCase().includes('walk') ||
        r.title.toLowerCase().includes('run') ||
        r.title.toLowerCase().includes('garden') ||
        r.title.toLowerCase().includes('outside')
    );
    if (outdoorReminders.length > 0) {
      parts.push('\nOutdoor Activities:');
      outdoorReminders.forEach((r) => parts.push(`  - "${r.title}"`));
    }

    parts.push('\nProvide 2-4 timely, actionable recommendations as JSON array.');
    parts.push('Focus on: time-sensitive alerts, weather impacts, location opportunities, productivity tips.');

    return parts.join('\n');
  }

  /**
   * Parse AI response into structured recommendations
   */
  private static parseRecommendationsResponse(response: string): ContextualRecommendation[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      // Validate and assign unique IDs
      return parsed
        .filter((rec: any) => {
          return rec.type && rec.icon && rec.title && rec.message && rec.priority && rec.color;
        })
        .map((rec: any, index: number) => ({
          ...rec,
          id: rec.id || `rec-${Date.now()}-${index}`,
        }));
    } catch (error) {
      console.error('Error parsing contextual recommendations:', error);
      throw error;
    }
  }

  /**
   * Generate smart fallback recommendations
   */
  private static getFallbackRecommendations(context: ContextData): ContextualRecommendation[] {
    const recommendations: ContextualRecommendation[] = [];

    // Check for upcoming calendar events (traffic alert)
    if (context.calendarEvents && context.calendarEvents.length > 0) {
      const nextEvent = context.calendarEvents[0];
      const eventTime = new Date(nextEvent.startDate);
      const now = new Date();
      const minutesUntil = Math.floor((eventTime.getTime() - now.getTime()) / 60000);

      if (minutesUntil > 0 && minutesUntil <= 60) {
        recommendations.push({
          id: 'traffic-fb-1',
          type: 'traffic',
          icon: 'car-outline',
          title: 'Upcoming Event',
          message: `"${nextEvent.title}" starts in ${minutesUntil} minutes. ${nextEvent.location ? `Navigate to ${nextEvent.location}.` : 'Get ready to join.'}`,
          action: nextEvent.location ? 'View Route' : 'Join Meeting',
          priority: minutesUntil <= 15 ? 'high' : 'medium',
          color: '#F59E0B',
        });
      }
    }

    // Check weather impact on outdoor tasks
    const outdoorTasks = context.reminders.filter(
      (r) =>
        r.status === 'pending' &&
        (r.tags?.includes('outdoor') ||
          r.title.toLowerCase().includes('walk') ||
          r.title.toLowerCase().includes('run'))
    );

    if (outdoorTasks.length > 0 && context.weather) {
      const badWeather = ['rain', 'snow', 'storm', 'thunderstorm'].some((cond) =>
        context.weather!.condition.toLowerCase().includes(cond)
      );

      if (badWeather) {
        recommendations.push({
          id: 'weather-fb-1',
          type: 'weather',
          icon: 'rainy-outline',
          title: 'Weather Alert',
          message: `${context.weather.condition} today. Consider rescheduling "${outdoorTasks[0].title}" or moving it indoors.`,
          action: 'Reschedule',
          priority: 'medium',
          color: '#3B82F6',
          relatedReminderIds: [outdoorTasks[0].id],
        });
      } else if (context.weather.temperature > 85) {
        recommendations.push({
          id: 'weather-fb-2',
          type: 'weather',
          icon: 'sunny-outline',
          title: 'Hot Day',
          message: `It's ${context.weather.temperature}°F outside. Stay hydrated during outdoor activities!`,
          priority: 'low',
          color: '#F59E0B',
        });
      }
    }

    // Check for tasks due this hour
    const urgentTasks = context.reminders.filter((r) => {
      if (r.status !== 'pending') return false;
      const [taskHour] = r.dueTime.split(':').map(Number);
      return taskHour === context.time.hour;
    });

    if (urgentTasks.length > 0) {
      recommendations.push({
        id: 'calendar-fb-1',
        type: 'calendar',
        icon: 'time-outline',
        title: 'Due Now',
        message: `"${urgentTasks[0].title}" is scheduled for this hour. Time to focus!`,
        priority: 'high',
        color: '#EF4444',
        relatedReminderIds: [urgentTasks[0].id],
      });
    }

    // Productivity tip based on time of day
    if (context.time.hour >= 9 && context.time.hour <= 11 && !context.time.isWeekend) {
      recommendations.push({
        id: 'productivity-fb-1',
        type: 'productivity',
        icon: 'flash-outline',
        title: 'Peak Hours',
        message: 'This is typically a productive time. Consider tackling your most important task now.',
        priority: 'low',
        color: '#10B981',
      });
    }

    // Sort by priority
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations.slice(0, 3);
  }

  /**
   * Generate a contextual greeting/summary
   */
  static async generateContextualGreeting(context: ContextData): Promise<string> {
    try {
      const prompt = `Generate a brief, friendly greeting based on this context:

Time: ${context.time.hour}:00 (${context.time.isWeekend ? 'weekend' : 'weekday'})
Weather: ${context.weather?.temperature || 'unknown'}°F, ${context.weather?.condition || 'unknown'}
Pending tasks: ${context.reminders.filter((r) => r.status === 'pending').length}
Upcoming events: ${context.calendarEvents?.length || 0}

Write a 1-2 sentence greeting that's warm, contextual, and encouraging. Reference the time of day and weather if relevant.`;

      const greeting = await generateText({
        prompt,
        systemPrompt: 'You are a friendly AI assistant. Keep greetings brief and natural.',
      });

      return greeting;
    } catch (error) {
      console.error('Error generating contextual greeting:', error);
      // Fallback greeting based on time
      const hour = context.time.hour;
      if (hour < 12) return 'Good morning! Ready to make today productive?';
      if (hour < 17) return 'Good afternoon! You\'re doing great so far.';
      return 'Good evening! Let\'s finish strong today.';
    }
  }
}
