// Backlog Risk Service - Health meter and overload detection
import { newell } from '@/lib/groq';
import type { Reminder } from '@/types/reminder';
import type { BacklogRiskScore } from '@/types/phase8';

export class BacklogRiskService {
  /**
   * Calculate backlog risk score
   */
  static async calculateRiskScore(
    userId: string,
    reminders: Reminder[]
  ): Promise<BacklogRiskScore> {
    const pendingReminders = reminders.filter((r) => r.status === 'pending');
    const overdueReminders = reminders.filter((r) => r.status === 'overdue');

    // Calculate average age of pending tasks
    const averageAge = this.calculateAverageAge(pendingReminders);

    // Calculate completion rate
    const completionRate = this.calculateCompletionRate(reminders);

    // Calculate daily load
    const avgDailyLoad = this.calculateDailyLoad(reminders);

    // Calculate capacity utilization
    const capacityUtilization = this.calculateCapacity(
      reminders,
      avgDailyLoad
    );

    // Calculate risk score
    const score = this.calculateScore(
      pendingReminders.length,
      overdueReminders.length,
      averageAge,
      completionRate,
      capacityUtilization
    );

    // Determine risk level
    const level = this.getRiskLevel(score);

    // Generate AI-powered recommendations
    const recommendations = await this.generateRecommendations(
      reminders,
      score,
      level
    );

    return {
      score,
      level,
      totalPending: pendingReminders.length,
      overdueCount: overdueReminders.length,
      averageAge,
      recommendations,
      healthMetrics: {
        completionRate,
        avgDailyLoad,
        capacityUtilization,
      },
    };
  }

  /**
   * Calculate average age of pending tasks in days
   */
  private static calculateAverageAge(reminders: Reminder[]): number {
    if (reminders.length === 0) return 0;

    const now = Date.now();
    const totalAge = reminders.reduce((sum, r) => {
      const createdAt = new Date(r.createdAt).getTime();
      const ageInDays = (now - createdAt) / (1000 * 60 * 60 * 24);
      return sum + ageInDays;
    }, 0);

    return Math.round(totalAge / reminders.length);
  }

  /**
   * Calculate completion rate over last 30 days
   */
  private static calculateCompletionRate(reminders: Reminder[]): number {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentReminders = reminders.filter(
      (r) => new Date(r.createdAt).getTime() > thirtyDaysAgo
    );

    if (recentReminders.length === 0) return 100;

    const completed = recentReminders.filter(
      (r) => r.status === 'completed'
    ).length;
    return Math.round((completed / recentReminders.length) * 100);
  }

  /**
   * Calculate average daily task load
   */
  private static calculateDailyLoad(reminders: Reminder[]): number {
    const today = new Date().toISOString().split('T')[0];
    const todayTasks = reminders.filter((r) => r.dueDate === today);
    return todayTasks.length;
  }

  /**
   * Calculate capacity utilization (0-100)
   */
  private static calculateCapacity(
    reminders: Reminder[],
    avgDailyLoad: number
  ): number {
    // Assume healthy capacity is 10 tasks/day
    const healthyCapacity = 10;
    const utilization = (avgDailyLoad / healthyCapacity) * 100;
    return Math.min(100, Math.round(utilization));
  }

  /**
   * Calculate overall risk score (0-100)
   */
  private static calculateScore(
    pendingCount: number,
    overdueCount: number,
    averageAge: number,
    completionRate: number,
    capacityUtilization: number
  ): number {
    // Weights for different factors
    const pendingWeight = 0.2;
    const overdueWeight = 0.3;
    const ageWeight = 0.2;
    const completionWeight = 0.15;
    const capacityWeight = 0.15;

    // Normalize metrics
    const pendingScore = Math.min(100, (pendingCount / 50) * 100);
    const overdueScore = Math.min(100, (overdueCount / 20) * 100);
    const ageScore = Math.min(100, (averageAge / 30) * 100);
    const completionScore = 100 - completionRate;
    const capacityScore = Math.max(0, capacityUtilization - 80); // Risk starts at 80% capacity

    const totalScore =
      pendingScore * pendingWeight +
      overdueScore * overdueWeight +
      ageScore * ageWeight +
      completionScore * completionWeight +
      capacityScore * capacityWeight;

    return Math.min(100, Math.round(totalScore));
  }

  /**
   * Get risk level based on score
   */
  private static getRiskLevel(
    score: number
  ): 'healthy' | 'moderate' | 'concerning' | 'critical' {
    if (score < 25) return 'healthy';
    if (score < 50) return 'moderate';
    if (score < 75) return 'concerning';
    return 'critical';
  }

  /**
   * Generate AI-powered recommendations
   */
  private static async generateRecommendations(
    reminders: Reminder[],
    score: number,
    level: string
  ): Promise<BacklogRiskScore['recommendations']> {
    try {
      const overdueReminders = reminders
        .filter((r) => r.status === 'overdue')
        .slice(0, 5);
      const oldReminders = reminders
        .filter((r) => r.status === 'pending')
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        .slice(0, 5);

      const prompt = `Analyze this task backlog and provide 3 actionable recommendations:

Backlog Risk Score: ${score}/100 (${level})
Total Pending: ${reminders.filter((r) => r.status === 'pending').length}
Overdue: ${overdueReminders.length}

Sample overdue tasks:
${overdueReminders.map((r) => `- ${r.title} (${r.tag}, due ${r.dueDate})`).join('\n')}

Sample old tasks:
${oldReminders.map((r) => `- ${r.title} (${r.tag}, created ${new Date(r.createdAt).toLocaleDateString()})`).join('\n')}

Provide 3 specific recommendations. Format as JSON:
[{
  "action": "defer|delete|reschedule|delegate",
  "reminderIds": ["id1", "id2"],
  "reason": "why this action helps"
}]`;

      const response = await newell.chat.ask({
        prompt,
        systemMessage:
          'You are a task management expert. Provide practical recommendations to reduce backlog risk. Return ONLY valid JSON, no markdown or explanations.',
      });

      const { extractJSON } = await import('@/lib/groq');
      const jsonStr = extractJSON(response);
      const parsed = JSON.parse(jsonStr);
      return Array.isArray(parsed) ? parsed : this.getFallbackRecommendations(reminders, score);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return this.getFallbackRecommendations(reminders, score);
    }
  }

  /**
   * Fallback recommendations if AI fails
   */
  private static getFallbackRecommendations(
    reminders: Reminder[],
    score: number
  ): BacklogRiskScore['recommendations'] {
    const overdueIds = reminders
      .filter((r) => r.status === 'overdue')
      .slice(0, 10)
      .map((r) => r.id);

    const oldPendingIds = reminders
      .filter((r) => r.status === 'pending')
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .slice(0, 10)
      .map((r) => r.id);

    const recommendations: BacklogRiskScore['recommendations'] = [];

    if (score >= 75) {
      recommendations.push({
        action: 'delete',
        reminderIds: oldPendingIds.slice(0, 5),
        reason:
          'These tasks are very old and may no longer be relevant. Consider deleting them.',
      });
      recommendations.push({
        action: 'reschedule',
        reminderIds: overdueIds.slice(0, 5),
        reason:
          'Critical backlog. Reschedule these overdue tasks to manageable dates.',
      });
    } else if (score >= 50) {
      recommendations.push({
        action: 'defer',
        reminderIds: oldPendingIds.slice(0, 5),
        reason: 'Defer less urgent tasks to reduce immediate load.',
      });
      recommendations.push({
        action: 'reschedule',
        reminderIds: overdueIds,
        reason: 'Reschedule overdue tasks to get back on track.',
      });
    } else {
      recommendations.push({
        action: 'defer',
        reminderIds: oldPendingIds.slice(0, 3),
        reason: 'Your backlog is healthy. Consider deferring these old tasks.',
      });
    }

    return recommendations;
  }

  /**
   * Get health meter color based on score
   */
  static getHealthMeterColor(score: number): string {
    if (score < 25) return '#10B981'; // Green - healthy
    if (score < 50) return '#F59E0B'; // Yellow - moderate
    if (score < 75) return '#EF4444'; // Orange - concerning
    return '#DC2626'; // Red - critical
  }

  /**
   * Get health meter message
   */
  static getHealthMeterMessage(level: BacklogRiskScore['level']): string {
    switch (level) {
      case 'healthy':
        return 'Your task backlog is healthy and manageable!';
      case 'moderate':
        return 'Your backlog is growing. Consider reviewing older tasks.';
      case 'concerning':
        return 'Your backlog needs attention. Time for a cleanup session.';
      case 'critical':
        return 'Critical backlog overload! Schedule a purge session immediately.';
    }
  }
}
