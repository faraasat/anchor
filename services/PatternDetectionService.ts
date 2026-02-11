// Pattern Detection Service - Habit-based reminder suggestions
import { newell } from '@fastshot/ai';
import type { Reminder, TagType } from '@/types/reminder';
import type { PatternDetection } from '@/types/phase8';

export class PatternDetectionService {
  /**
   * Detect patterns from user's completion history
   */
  static async detectPatterns(
    userId: string,
    completedReminders: Reminder[]
  ): Promise<PatternDetection[]> {
    const patterns: PatternDetection[] = [];

    // Detect time-based patterns
    patterns.push(...this.detectTimePatterns(completedReminders));

    // Detect sequence patterns
    patterns.push(...this.detectSequencePatterns(completedReminders));

    // Detect frequency patterns
    patterns.push(...this.detectFrequencyPatterns(completedReminders));

    // Sort by confidence
    patterns.sort((a, b) => b.confidence - a.confidence);

    // Enhance top patterns with AI suggestions
    const topPatterns = patterns.slice(0, 5);
    for (const pattern of topPatterns) {
      pattern.suggestedReminder = await this.enhanceSuggestionWithAI(pattern);
    }

    return topPatterns;
  }

  /**
   * Detect time-based patterns (e.g., "You usually visit the gym on Thursdays")
   */
  private static detectTimePatterns(
    reminders: Reminder[]
  ): PatternDetection[] {
    const patterns: PatternDetection[] = [];
    const dayOfWeekMap: Record<number, Record<string, number>> = {};

    // Group by day of week and category
    for (const reminder of reminders) {
      if (reminder.status !== 'completed') continue;

      const date = new Date(reminder.completedAt || reminder.dueDate);
      const dayOfWeek = date.getDay();
      const category = reminder.tag;

      if (!dayOfWeekMap[dayOfWeek]) {
        dayOfWeekMap[dayOfWeek] = {};
      }
      dayOfWeekMap[dayOfWeek][category] =
        (dayOfWeekMap[dayOfWeek][category] || 0) + 1;
    }

    // Find patterns with high confidence
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const [dayStr, categories] of Object.entries(dayOfWeekMap)) {
      const day = parseInt(dayStr);
      for (const [category, count] of Object.entries(categories)) {
        if (count >= 3) { // At least 3 occurrences
          const totalInCategory = reminders.filter(
            (r) => r.tag === category && r.status === 'completed'
          ).length;
          const confidence = count / Math.max(totalInCategory, count);

          // Find most common time
          const times = reminders
            .filter(
              (r) =>
                r.tag === category &&
                r.status === 'completed' &&
                new Date(r.completedAt || r.dueDate).getDay() === day
            )
            .map((r) => r.dueTime);

          const avgTime = this.calculateAverageTime(times);

          patterns.push({
            pattern: `You usually complete ${category} tasks on ${dayNames[day]}s`,
            type: 'time',
            confidence,
            suggestedReminder: {
              title: `${category} Task`,
              description: `Based on your habit of completing ${category} tasks on ${dayNames[day]}s`,
              dueTime: avgTime,
              tag: category as TagType,
            },
            historicalData: {
              occurrenceCount: count,
              lastOccurrence: new Date().toISOString(),
              avgFrequency: 'weekly',
            },
          });
        }
      }
    }

    return patterns;
  }

  /**
   * Detect sequence patterns (e.g., "You always X after Y")
   */
  private static detectSequencePatterns(
    reminders: Reminder[]
  ): PatternDetection[] {
    const patterns: PatternDetection[] = [];
    const sequences: Record<string, { after: string; count: number }> = {};

    // Sort by completion time
    const sorted = reminders
      .filter((r) => r.status === 'completed' && r.completedAt)
      .sort(
        (a, b) =>
          new Date(a.completedAt!).getTime() -
          new Date(b.completedAt!).getTime()
      );

    // Look for sequences (within 1 hour)
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];

      const timeDiff =
        new Date(curr.completedAt!).getTime() -
        new Date(prev.completedAt!).getTime();

      if (timeDiff < 60 * 60 * 1000) {
        // Within 1 hour
        const key = `${curr.title}`;
        if (!sequences[key]) {
          sequences[key] = { after: prev.title, count: 0 };
        }
        sequences[key].count++;
      }
    }

    // Create patterns from sequences
    for (const [task, { after, count }] of Object.entries(sequences)) {
      if (count >= 2) {
        // At least 2 occurrences
        patterns.push({
          pattern: `You often complete "${task}" after "${after}"`,
          type: 'sequence',
          confidence: Math.min(0.9, count / 5),
          suggestedReminder: {
            title: task,
            description: `Suggested because you typically do this after "${after}"`,
            dueTime: '14:00',
            tag: 'Personal',
          },
          historicalData: {
            occurrenceCount: count,
            lastOccurrence: new Date().toISOString(),
            avgFrequency: 'as-needed',
          },
        });
      }
    }

    return patterns;
  }

  /**
   * Detect frequency patterns (e.g., "You X every 3 days")
   */
  private static detectFrequencyPatterns(
    reminders: Reminder[]
  ): PatternDetection[] {
    const patterns: PatternDetection[] = [];
    const titleFrequency: Record<string, Date[]> = {};

    // Group completions by title
    for (const reminder of reminders) {
      if (reminder.status !== 'completed' || !reminder.completedAt) continue;

      const normalizedTitle = reminder.title.toLowerCase().trim();
      if (!titleFrequency[normalizedTitle]) {
        titleFrequency[normalizedTitle] = [];
      }
      titleFrequency[normalizedTitle].push(new Date(reminder.completedAt));
    }

    // Analyze frequencies
    for (const [title, dates] of Object.entries(titleFrequency)) {
      if (dates.length < 3) continue; // Need at least 3 occurrences

      // Sort dates
      dates.sort((a, b) => a.getTime() - b.getTime());

      // Calculate average interval
      const intervals: number[] = [];
      for (let i = 1; i < dates.length; i++) {
        const daysDiff =
          (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
        intervals.push(daysDiff);
      }

      const avgInterval =
        intervals.reduce((sum, i) => sum + i, 0) / intervals.length;

      // Check if intervals are consistent
      const variance =
        intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) /
        intervals.length;
      const stdDev = Math.sqrt(variance);

      if (stdDev < avgInterval * 0.3) {
        // Consistent pattern
        let frequency = 'regularly';
        if (avgInterval < 2) frequency = 'daily';
        else if (avgInterval < 8) frequency = 'weekly';
        else if (avgInterval < 35) frequency = 'monthly';

        patterns.push({
          pattern: `You complete "${title}" approximately every ${Math.round(avgInterval)} days`,
          type: 'frequency',
          confidence: Math.min(0.9, 1 - stdDev / avgInterval),
          suggestedReminder: {
            title,
            description: `Suggested based on your ${frequency} pattern`,
            dueTime: '10:00',
            tag: 'Personal',
          },
          historicalData: {
            occurrenceCount: dates.length,
            lastOccurrence: dates[dates.length - 1].toISOString(),
            avgFrequency: frequency,
          },
        });
      }
    }

    return patterns;
  }

  /**
   * Calculate average time from time strings
   */
  private static calculateAverageTime(times: string[]): string {
    if (times.length === 0) return '10:00';

    const totalMinutes = times.reduce((sum, time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return sum + hours * 60 + minutes;
    }, 0);

    const avgMinutes = Math.round(totalMinutes / times.length);
    const hours = Math.floor(avgMinutes / 60);
    const minutes = avgMinutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  /**
   * Enhance suggestion with AI context
   */
  private static async enhanceSuggestionWithAI(
    pattern: PatternDetection
  ): Promise<PatternDetection['suggestedReminder']> {
    try {
      const prompt = `Based on this pattern: "${pattern.pattern}" (${Math.round(pattern.confidence * 100)}% confidence, occurred ${pattern.historicalData.occurrenceCount} times), suggest a better reminder title and description that captures the habit.

Return JSON:
{
  "title": "concise title",
  "description": "helpful description with context"
}`;

      const response = await newell.chat.ask({
        prompt,
        systemMessage:
          'You are a habit formation expert. Create engaging, motivational reminder text.',
      });

      const parsed = JSON.parse(response);
      return {
        ...pattern.suggestedReminder,
        title: parsed.title || pattern.suggestedReminder.title,
        description: parsed.description || pattern.suggestedReminder.description,
      };
    } catch (error) {
      console.error('Error enhancing suggestion:', error);
      return pattern.suggestedReminder;
    }
  }

  /**
   * Check if pattern suggestion should be shown to user
   */
  static shouldShowSuggestion(pattern: PatternDetection): boolean {
    // Show if:
    // 1. High confidence (>= 70%)
    // 2. At least 3 historical occurrences
    // 3. Last occurrence was recent (within 30 days)

    if (pattern.confidence < 0.7) return false;
    if (pattern.historicalData.occurrenceCount < 3) return false;

    const lastOccurrence = new Date(pattern.historicalData.lastOccurrence);
    const daysSince =
      (Date.now() - lastOccurrence.getTime()) / (1000 * 60 * 60 * 24);

    return daysSince <= 30;
  }
}
