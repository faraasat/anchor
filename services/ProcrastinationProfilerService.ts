// Procrastination Profiler - AI-powered analysis of user delays
import { newell } from '@/lib/groq';
import type { Reminder } from '@/types/reminder';
import type { ProcrastinationProfile } from '@/types/phase8';

export class ProcrastinationProfilerService {
  /**
   * Analyze user's procrastination patterns
   */
  static async generateProfile(
    userId: string,
    reminders: Reminder[]
  ): Promise<ProcrastinationProfile> {
    // Get reminders with snooze history
    const snoozedReminders = reminders.filter(
      (r) => r.status === 'snoozed' || r.snoozedUntil
    );

    // Calculate category snooze counts
    const categoryStats = this.analyzeCategoryPatterns(snoozedReminders);

    // Calculate procrastination score (0-100)
    const procrastinationScore = this.calculateProcrastinationScore(reminders);

    // Find peak procrastination time
    const peakTime = this.findPeakProcrastinationTime(snoozedReminders);

    // Generate AI-powered suggestions
    const suggestedFixes = await this.generateSuggestions(
      categoryStats,
      peakTime,
      procrastinationScore
    );

    return {
      userId,
      topProcrastinatedCategories: categoryStats.slice(0, 5),
      procrastinationScore,
      peakProcrastinationTime: peakTime,
      suggestedFixes,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Analyze procrastination patterns by category
   */
  private static analyzeCategoryPatterns(reminders: Reminder[]): {
    category: string;
    snoozeCount: number;
    averageDelay: number;
  }[] {
    const categoryMap: Record<
      string,
      { count: number; totalDelay: number }
    > = {};

    for (const reminder of reminders) {
      const category = reminder.tag;
      if (!categoryMap[category]) {
        categoryMap[category] = { count: 0, totalDelay: 0 };
      }

      categoryMap[category].count++;

      // Calculate delay if snoozed
      if (reminder.snoozedUntil) {
        const originalDue = new Date(
          `${reminder.dueDate}T${reminder.dueTime}`
        ).getTime();
        const snoozeUntil = new Date(reminder.snoozedUntil).getTime();
        const delayMinutes = Math.max(0, (snoozeUntil - originalDue) / 1000 / 60);
        categoryMap[category].totalDelay += delayMinutes;
      }
    }

    return Object.entries(categoryMap)
      .map(([category, stats]) => ({
        category,
        snoozeCount: stats.count,
        averageDelay: stats.count > 0 ? stats.totalDelay / stats.count : 0,
      }))
      .sort((a, b) => b.snoozeCount - a.snoozeCount);
  }

  /**
   * Calculate overall procrastination score
   */
  private static calculateProcrastinationScore(reminders: Reminder[]): number {
    if (reminders.length === 0) return 0;

    const snoozedCount = reminders.filter(
      (r) => r.status === 'snoozed' || r.snoozedUntil
    ).length;
    const overdueCount = reminders.filter((r) => r.status === 'overdue').length;
    const completedCount = reminders.filter(
      (r) => r.status === 'completed'
    ).length;

    // Score based on snooze rate and overdue rate
    const snoozeRate = snoozedCount / reminders.length;
    const overdueRate = overdueCount / reminders.length;
    const completionRate = completedCount / reminders.length;

    // Higher score = more procrastination
    const score =
      snoozeRate * 40 + overdueRate * 50 + (1 - completionRate) * 10;

    return Math.min(100, Math.round(score * 100));
  }

  /**
   * Find the time of day when user procrastinates most
   */
  private static findPeakProcrastinationTime(
    reminders: Reminder[]
  ): string {
    const hourCounts: Record<number, number> = {};

    for (const reminder of reminders) {
      if (reminder.snoozedUntil) {
        const hour = new Date(reminder.snoozedUntil).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    }

    const peakHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 9;

    return `${String(peakHour).padStart(2, '0')}:00`;
  }

  /**
   * Generate AI-powered suggestions using Newell AI
   */
  private static async generateSuggestions(
    categoryStats: { category: string; snoozeCount: number; averageDelay: number }[],
    peakTime: string,
    score: number
  ): Promise<{ issue: string; suggestion: string; confidence: number }[]> {
    try {
      const prompt = `Analyze this procrastination pattern and suggest 3 actionable fixes:

Top procrastinated categories:
${categoryStats.map((c) => `- ${c.category}: snoozed ${c.snoozeCount} times, avg delay ${Math.round(c.averageDelay)} minutes`).join('\n')}

Peak procrastination time: ${peakTime}
Overall procrastination score: ${score}/100

Provide 3 specific, actionable suggestions to help reduce procrastination. Format as JSON:
[{
  "issue": "specific problem identified",
  "suggestion": "concrete action to take",
  "confidence": 0.85
}]`;

      const response = await newell.chat.ask({
        prompt,
        systemMessage:
          'You are a productivity coach specializing in behavioral psychology. Provide practical, empathetic suggestions. Return ONLY valid JSON, no markdown or explanations.',
      });

      const { extractJSON } = await import('@/lib/groq');
      const jsonStr = extractJSON(response);
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Error generating suggestions:', error);
      return this.getFallbackSuggestions(categoryStats, peakTime);
    }
  }

  /**
   * Fallback suggestions if AI fails
   */
  private static getFallbackSuggestions(
    categoryStats: { category: string; snoozeCount: number; averageDelay: number }[],
    peakTime: string
  ): { issue: string; suggestion: string; confidence: number }[] {
    const topCategory = categoryStats[0]?.category || 'Work';
    const peakHour = parseInt(peakTime.split(':')[0]);

    return [
      {
        issue: `High snooze rate for ${topCategory} tasks`,
        suggestion: `Break ${topCategory} tasks into smaller 15-minute chunks to reduce overwhelm`,
        confidence: 0.8,
      },
      {
        issue: `Peak procrastination at ${peakTime}`,
        suggestion: `Schedule your most important tasks ${peakHour > 12 ? 'in the morning' : 'in the afternoon'} when you're more focused`,
        confidence: 0.75,
      },
      {
        issue: 'Frequent task snoozing',
        suggestion: 'Set a "snooze budget" of max 2 snoozes per task to build completion momentum',
        confidence: 0.7,
      },
    ];
  }
}
