// AI Insights Service - Smart suggestions and productivity analysis
import { generateText } from '@fastshot/ai';
import { ReminderService } from './ReminderService';
import { WeatherService } from './WeatherService';
import { HardwareTriggersService } from './HardwareTriggersService';
import type { Reminder } from '@/types/reminder';

export interface TaskSuggestion {
  type: 'reassign' | 'reschedule' | 'location' | 'delegation';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  action: () => Promise<void>;
}

export interface ProductivityInsight {
  title: string;
  description: string;
  message?: string;
  metric?: number;
  trend: 'up' | 'down' | 'stable';
  category: 'completion' | 'efficiency' | 'balance' | 'collaboration';
  type?: string;
  confidence?: number;
}

export interface HouseholdPattern {
  userId: string;
  userName: string;
  commonLocations: string[];
  activeHours: string[];
  preferredTaskTypes: string[];
  completionRate: number;
}

export class AIInsightsService {
  // Analyze household patterns to suggest task redistribution
  static async analyzeHouseholdPatterns(
    householdId: string,
    members: Array<{ id: string; name: string; location?: { latitude: number; longitude: number } }>
  ): Promise<TaskSuggestion[]> {
    try {
      const reminders = await ReminderService.getHouseholdReminders(householdId);
      const suggestions: TaskSuggestion[] = [];

      // Get member patterns
      const patterns = await this.extractMemberPatterns(reminders, members);

      // Check for location-based reassignments
      for (const reminder of reminders) {
        if (!reminder.locationTrigger || reminder.assignedTo) continue;

        // Find member closest to reminder location
        const closestMember = await this.findClosestMember(
          reminder.locationTrigger,
          members
        );

        if (closestMember) {
          suggestions.push({
            type: 'reassign',
            priority: 'high',
            title: `Assign "${reminder.title}" to ${closestMember.name}`,
            description: `${closestMember.name} is near ${reminder.locationTrigger.name || 'the location'}. This task could be completed more efficiently by them.`,
            action: async () => {
              await ReminderService.update(reminder.id, {
                assignedTo: closestMember.id,
              });
            },
          });
        }
      }

      // Analyze task distribution balance
      const assignedCounts = reminders.reduce((acc, r) => {
        if (r.assignedTo) {
          acc[r.assignedTo] = (acc[r.assignedTo] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const maxTasks = Math.max(...Object.values(assignedCounts));
      const minTasks = Math.min(...Object.values(assignedCounts));

      if (maxTasks - minTasks > 5) {
        const overloadedUser = members.find(
          (m) => assignedCounts[m.id] === maxTasks
        );
        const underloadedUser = members.find(
          (m) => assignedCounts[m.id] === minTasks
        );

        if (overloadedUser && underloadedUser) {
          suggestions.push({
            type: 'delegation',
            priority: 'medium',
            title: 'Rebalance household tasks',
            description: `${overloadedUser.name} has ${maxTasks} tasks while ${underloadedUser.name} has ${minTasks}. Consider redistributing some tasks.`,
            action: async () => {
              // This would open a task redistribution UI
            },
          });
        }
      }

      return suggestions;
    } catch (error) {
      console.error('Error analyzing household patterns:', error);
      return [];
    }
  }

  // Extract behavioral patterns from reminder history
  private static async extractMemberPatterns(
    reminders: Reminder[],
    members: Array<{ id: string; name: string }>
  ): Promise<Record<string, HouseholdPattern>> {
    const patterns: Record<string, HouseholdPattern> = {};

    for (const member of members) {
      const memberReminders = reminders.filter(
        (r) => r.assignedTo === member.id || r.user_id === member.id
      );

      const completed = memberReminders.filter((r) => r.status === 'completed');
      const completionRate = memberReminders.length > 0
        ? (completed.length / memberReminders.length) * 100
        : 0;

      // Extract common task types
      const taskTypes = memberReminders.reduce((acc, r) => {
        acc[r.tag] = (acc[r.tag] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const preferredTaskTypes = Object.entries(taskTypes)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([type]) => type);

      // Extract active hours
      const hours = memberReminders
        .filter((r) => r.completedAt)
        .map((r) => new Date(r.completedAt!).getHours());

      const hourCounts = hours.reduce((acc, h) => {
        acc[h] = (acc[h] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      const activeHours = Object.entries(hourCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => `${hour}:00`);

      patterns[member.id] = {
        userId: member.id,
        userName: member.name,
        commonLocations: [],
        activeHours,
        preferredTaskTypes,
        completionRate,
      };
    }

    return patterns;
  }

  // Find the household member closest to a location
  private static async findClosestMember(
    locationTrigger: { latitude: number; longitude: number; name: string },
    members: Array<{ id: string; name: string; location?: { latitude: number; longitude: number } }>
  ): Promise<{ id: string; name: string } | null> {
    let closest: { id: string; name: string; distance: number } | null = null;

    for (const member of members) {
      if (!member.location) continue;

      const distance = this.calculateDistance(
        member.location.latitude,
        member.location.longitude,
        locationTrigger.latitude,
        locationTrigger.longitude
      );

      if (!closest || distance < closest.distance) {
        closest = {
          id: member.id,
          name: member.name,
          distance,
        };
      }
    }

    // Only suggest if within 2km
    return closest && closest.distance < 2000 ? closest : null;
  }

  // Generate AI-powered productivity insights
  static async generateProductivityInsights(
    userId: string,
    reminders: Reminder[],
    stats: Array<{ date: string; completion_rate: number; completed_count: number }>
  ): Promise<ProductivityInsight[]> {
    try {
      const insights: ProductivityInsight[] = [];

      // Calculate completion trend
      const recentStats = stats.slice(-7);
      const avgCompletion = recentStats.reduce((sum, s) => sum + s.completion_rate, 0) / recentStats.length;
      const prevAvgCompletion = stats.slice(-14, -7).reduce((sum, s) => sum + s.completion_rate, 0) / 7;
      const trend = avgCompletion > prevAvgCompletion ? 'up' : avgCompletion < prevAvgCompletion ? 'down' : 'stable';

      insights.push({
        title: 'Completion Rate Trend',
        description: `Your completion rate is ${avgCompletion.toFixed(0)}% this week, ${trend === 'up' ? 'up' : 'down'} from ${prevAvgCompletion.toFixed(0)}% last week.`,
        metric: avgCompletion,
        trend,
        category: 'completion',
      });

      // Analyze task distribution by tag
      const tagDistribution = reminders.reduce((acc, r) => {
        acc[r.tag] = (acc[r.tag] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const dominantTag = Object.entries(tagDistribution)
        .sort(([, a], [, b]) => b - a)[0];

      if (dominantTag && dominantTag[1] > reminders.length * 0.4) {
        insights.push({
          title: 'Task Balance',
          description: `${dominantTag[1]} of your tasks are tagged as "${dominantTag[0]}". Consider diversifying to maintain work-life balance.`,
          metric: (dominantTag[1] / reminders.length) * 100,
          trend: 'stable',
          category: 'balance',
        });
      }

      // Use AI to generate personalized insight
      const aiPrompt = `Based on this user's productivity data, provide ONE brief, actionable insight (max 2 sentences):
- Completion rate: ${avgCompletion.toFixed(0)}%
- Total tasks this week: ${recentStats.reduce((sum, s) => sum + s.completed_count, 0)}
- Task categories: ${Object.entries(tagDistribution).map(([k, v]) => `${k}(${v})`).join(', ')}

Focus on encouragement and practical tips. Be specific and motivating.`;

      const aiInsight = await generateText({ prompt: aiPrompt });

      if (aiInsight) {
        insights.push({
          title: 'AI Recommendation',
          description: aiInsight,
          trend: 'stable',
          category: 'efficiency',
        });
      }

      return insights;
    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }

  // Smart reminder creation suggestions
  static async suggestSmartReminder(
    userInput: string,
    context: {
      currentLocation?: { latitude: number; longitude: number };
      weather?: any;
      recentReminders: Reminder[];
    }
  ): Promise<{
    title: string;
    suggestedTag: string;
    suggestedTime: string;
    suggestedDate: string;
    reasoning: string;
  }> {
    try {
      // Build context for AI
      const contextStr = [
        `User wants to create: "${userInput}"`,
        context.currentLocation ? 'User location: available' : '',
        context.weather ? `Weather: ${context.weather.condition}, ${context.weather.temperature}°F` : '',
        `Recent tasks: ${context.recentReminders.slice(0, 5).map(r => r.title).join(', ')}`,
      ].filter(Boolean).join('\n');

      const prompt = `${contextStr}

Analyze this reminder request and suggest:
1. Best tag/category (Work, Personal, Health, Errands, or other)
2. Optimal time of day (24h format like "09:00")
3. Best date (today, tomorrow, or specific day)
4. Brief reason for your suggestions

Format response as:
TAG: [category]
TIME: [HH:MM]
DATE: [today/tomorrow/YYYY-MM-DD]
REASON: [brief explanation]`;

      const aiResponse = await generateText({ prompt });

      // Parse AI response
      const tag = aiResponse.match(/TAG:\s*(.+)/)?.[1]?.trim() || 'Personal';
      const time = aiResponse.match(/TIME:\s*(.+)/)?.[1]?.trim() || '09:00';
      const dateStr = aiResponse.match(/DATE:\s*(.+)/)?.[1]?.trim() || 'today';
      const reasoning = aiResponse.match(/REASON:\s*(.+)/)?.[1]?.trim() || 'Based on common patterns';

      // Convert date string to actual date
      const now = new Date();
      let suggestedDate = now.toISOString().split('T')[0];

      if (dateStr.toLowerCase() === 'tomorrow') {
        now.setDate(now.getDate() + 1);
        suggestedDate = now.toISOString().split('T')[0];
      } else if (dateStr.match(/\d{4}-\d{2}-\d{2}/)) {
        suggestedDate = dateStr;
      }

      return {
        title: userInput,
        suggestedTag: tag,
        suggestedTime: time,
        suggestedDate,
        reasoning,
      };
    } catch (error) {
      console.error('Error suggesting smart reminder:', error);

      // Fallback to basic suggestions
      const now = new Date();
      return {
        title: userInput,
        suggestedTag: 'Personal',
        suggestedTime: '09:00',
        suggestedDate: now.toISOString().split('T')[0],
        reasoning: 'Default suggestion',
      };
    }
  }

  // Generate nudge message suggestion
  static async suggestNudgeMessage(
    reminder: Reminder,
    recipient: { name: string },
    sender: { name: string }
  ): Promise<string> {
    try {
      const prompt = `Generate a friendly, gentle nudge message (max 20 words) from ${sender.name} to ${recipient.name} about this task:
Task: "${reminder.title}"
Due: ${reminder.dueTime}
Priority: ${reminder.priority}

Be encouraging, not pushy. Use emojis sparingly.`;

      const message = await generateText({ prompt });
      return message || `Hey ${recipient.name}, gentle reminder about "${reminder.title}" 🔔`;
    } catch (error) {
      console.error('Error generating nudge message:', error);
      return `Hey ${recipient.name}, gentle reminder about "${reminder.title}" 🔔`;
    }
  }

  // Calculate distance between two coordinates
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Analyze reminder for optimal scheduling
  static async analyzeOptimalTiming(reminder: Partial<Reminder>): Promise<{
    suggestedTime: string;
    reason: string;
  }> {
    try {
      // Check weather if outdoor activity
      if (reminder.tag && ['Personal', 'Health', 'Errands'].includes(reminder.tag)) {
        const weather = await WeatherService.getCurrentWeather();
        const weatherCheck = await WeatherService.isGoodWeatherForActivity('outdoor');

        if (weather && !weatherCheck.suitable) {
          return {
            suggestedTime: '14:00',
            reason: weatherCheck.reason || 'Weather conditions may affect this task',
          };
        }
      }

      // Default suggestions based on tag
      const timeSuggestions: Record<string, { time: string; reason: string }> = {
        'Work': { time: '09:00', reason: 'Start of workday for maximum focus' },
        'Personal': { time: '10:00', reason: 'Mid-morning for personal tasks' },
        'Health': { time: '07:00', reason: 'Morning routine for consistency' },
        'Errands': { time: '15:00', reason: 'Afternoon when most places are open' },
      };

      const suggestion = reminder.tag ? timeSuggestions[reminder.tag] : null;

      return suggestion || {
        suggestedTime: '09:00',
        reason: 'Morning is generally best for productivity',
      };
    } catch (error) {
      console.error('Error analyzing timing:', error);
      return {
        suggestedTime: '09:00',
        reason: 'Default morning time',
      };
    }
  }
}
