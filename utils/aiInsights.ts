// AI Insights - Newell AI integration for productivity insights
import { Reminder } from '@/types/reminder';

const NEWELL_API_URL = process.env.EXPO_PUBLIC_NEWELL_API_URL || 'https://newell.fastshot.ai';

export interface ProductivityInsight {
  type: 'pattern' | 'suggestion' | 'warning' | 'achievement';
  title: string;
  message: string;
  confidence: number;
  actionable?: {
    action: string;
    data: any;
  };
}

export interface ProductivityMetrics {
  completionRate: number;
  streak: number;
  peakHours: string[];
  bestDays: string[];
  averageTasksPerDay: number;
  categoryBreakdown: Record<string, number>;
}

/**
 * AI Insights Service - Fallback implementation with mock data
 * In production, this would integrate with Newell AI API
 */
export class AIInsightsService {
  /**
   * Generate personalized productivity insights using AI
   */
  static async generateInsights(reminders: Reminder[]): Promise<ProductivityInsight[]> {
    // For now, return fallback insights
    // In production, this would call Newell AI
    return this.getFallbackInsights(reminders);
  }

  /**
   * Detect patterns and suggest predictive reminders
   */
  static async detectPatterns(reminders: Reminder[]): Promise<Reminder[]> {
    // Mock pattern detection
    const completedReminders = reminders.filter(r => r.status === 'completed');
    if (completedReminders.length < 2) {
      return [];
    }

    // Return empty for now - could add pattern detection logic
    return [];
  }

  /**
   * Parse complex voice input into structured reminder
   */
  static async parseVoiceInput(voiceText: string): Promise<Partial<Reminder>> {
    // Simple parsing fallback
    const now = new Date();

    return {
      title: voiceText,
      dueTime: '09:00',
      dueDate: now.toISOString().split('T')[0],
      tag: 'Personal',
      priority: 'medium',
      recurrence: { type: 'none' },
      isRecurring: false,
    };
  }

  /**
   * Generate personalized productivity guidelines
   */
  static async generateGuidelines(reminders: Reminder[]): Promise<string[]> {
    return [
      'Schedule your most important tasks during peak hours',
      'Keep your streak alive with at least one task daily',
      'Break large tasks into smaller, manageable subtasks',
      'Review and plan your week every Sunday evening',
      'Celebrate small wins to maintain motivation',
    ];
  }

  // Helper methods
  private static calculateMetrics(reminders: Reminder[]): ProductivityMetrics {
    const completed = reminders.filter(r => r.status === 'completed').length;
    const total = reminders.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Calculate streak (simplified)
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const hasCompleted = reminders.some(
        r => r.status === 'completed' && r.completedAt?.startsWith(dateStr)
      );
      if (hasCompleted) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    // Peak hours (based on due times)
    const hourCounts: Record<number, number> = {};
    reminders.forEach(r => {
      const hour = parseInt(r.dueTime.split(':')[0]);
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    const peakHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([hour]) => `${hour}:00`);

    return {
      completionRate,
      streak,
      peakHours,
      bestDays: ['Tuesday', 'Thursday'],
      averageTasksPerDay: total / 7,
      categoryBreakdown: {},
    };
  }

  private static summarizeActivity(reminders: Reminder[]): string {
    const recent = reminders.slice(0, 10);
    return recent.map(r => `- ${r.title} (${r.tag}, ${r.status})`).join('\n');
  }

  private static getFallbackInsights(reminders: Reminder[]): ProductivityInsight[] {
    const metrics = this.calculateMetrics(reminders);

    return [
      {
        type: 'pattern',
        title: 'Your peak productivity hours',
        message: `You complete most tasks between ${metrics.peakHours[0] || '9:00'} and ${metrics.peakHours[1] || '11:00'}`,
        confidence: 0.8,
      },
      {
        type: 'achievement',
        title: 'Consistent progress',
        message: `You're on a ${metrics.streak}-day streak! Keep up the momentum`,
        confidence: 0.9,
      },
      {
        type: 'suggestion',
        title: 'Optimize your schedule',
        message: 'Schedule important tasks during your peak hours for better results',
        confidence: 0.75,
      },
    ];
  }
}
