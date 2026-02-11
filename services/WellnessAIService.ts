// Wellness AI Service - Groq AI powered wellness insights
import { generateText } from '@/lib/groq';

export interface WellnessData {
  steps?: number;
  stepsGoal?: number;
  sleepHours?: number;
  sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  waterIntake?: number; // glasses
  waterGoal?: number;
  pomodoroSessions?: number;
  focusTime?: number; // minutes
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active';
  stressLevel?: 'low' | 'medium' | 'high';
  recentCompletionRate?: number; // percentage
}

export interface WellnessInsight {
  type: 'suggestion' | 'warning' | 'achievement' | 'tip';
  title: string;
  message: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
  icon: string;
}

export class WellnessAIService {
  /**
   * Generate personalized wellness insights based on user data
   */
  static async generateWellnessInsights(data: WellnessData): Promise<WellnessInsight[]> {
    try {
      const prompt = this.buildWellnessPrompt(data);

      const response = await generateText({
        prompt,
        systemPrompt: `You are a wellness coach AI assistant for Anchor, a premium task management app.
Your role is to analyze user wellness data and provide caring, actionable insights.

IMPORTANT RULES:
1. Return insights as a JSON array of objects
2. Each insight must have: type, title, message, priority, icon
3. Types: 'suggestion', 'warning', 'achievement', 'tip'
4. Priorities: 'high', 'medium', 'low'
5. Icons must be valid Ionicons names (e.g., 'moon-outline', 'water-outline', 'flash-outline')
6. Keep messages concise (1-2 sentences)
7. Be empathetic and encouraging, never judgmental
8. Suggest specific features in Anchor (Smart Defer, Pomodoro, etc.)
9. Return 2-4 insights maximum
10. Return ONLY valid JSON, no other text

Example format:
[
  {
    "type": "suggestion",
    "title": "Take it Easy Today",
    "message": "You had less sleep than usual. Consider using Smart Defer to reschedule non-urgent tasks.",
    "action": "Use Smart Defer",
    "priority": "high",
    "icon": "moon-outline"
  }
]`,
      });

      // Parse AI response
      const insights = this.parseInsightsResponse(response);
      return insights;
    } catch (error) {
      console.error('Error generating wellness insights:', error);
      // Return fallback insights
      return this.getFallbackInsights(data);
    }
  }

  /**
   * Build a detailed prompt for wellness analysis
   */
  private static buildWellnessPrompt(data: WellnessData): string {
    const parts: string[] = ['Analyze this wellness data and provide personalized insights:'];

    if (data.sleepHours !== undefined) {
      parts.push(`- Sleep: ${data.sleepHours} hours (quality: ${data.sleepQuality || 'unknown'})`);
    }

    if (data.steps !== undefined && data.stepsGoal !== undefined) {
      const stepsPercent = Math.round((data.steps / data.stepsGoal) * 100);
      parts.push(`- Steps: ${data.steps.toLocaleString()} / ${data.stepsGoal.toLocaleString()} (${stepsPercent}%)`);
    }

    if (data.waterIntake !== undefined && data.waterGoal !== undefined) {
      parts.push(`- Hydration: ${data.waterIntake} / ${data.waterGoal} glasses of water`);
    }

    if (data.pomodoroSessions !== undefined) {
      parts.push(`- Focus sessions today: ${data.pomodoroSessions} Pomodoros`);
    }

    if (data.focusTime !== undefined) {
      parts.push(`- Total focus time: ${data.focusTime} minutes`);
    }

    if (data.activityLevel) {
      parts.push(`- Activity level: ${data.activityLevel}`);
    }

    if (data.stressLevel) {
      parts.push(`- Stress level: ${data.stressLevel}`);
    }

    if (data.recentCompletionRate !== undefined) {
      parts.push(`- Task completion rate: ${data.recentCompletionRate}%`);
    }

    parts.push('\nProvide caring, actionable insights as JSON array.');

    return parts.join('\n');
  }

  /**
   * Parse AI response into structured insights
   */
  private static parseInsightsResponse(response: string): WellnessInsight[] {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate structure
      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      return parsed.filter((insight: any) => {
        return (
          insight.type &&
          insight.title &&
          insight.message &&
          insight.priority &&
          insight.icon
        );
      });
    } catch (error) {
      console.error('Error parsing wellness insights:', error);
      throw error;
    }
  }

  /**
   * Get fallback insights when AI fails
   */
  private static getFallbackInsights(data: WellnessData): WellnessInsight[] {
    const insights: WellnessInsight[] = [];

    // Sleep insights
    if (data.sleepHours !== undefined && data.sleepHours < 6) {
      insights.push({
        type: 'warning',
        title: 'Rest Priority',
        message: 'You had limited sleep. Consider lighter tasks today and prioritize rest tonight.',
        action: 'Use Smart Defer',
        priority: 'high',
        icon: 'moon-outline',
      });
    }

    // Hydration insights
    if (data.waterIntake !== undefined && data.waterGoal !== undefined) {
      const waterPercent = (data.waterIntake / data.waterGoal) * 100;
      if (waterPercent < 50) {
        insights.push({
          type: 'suggestion',
          title: 'Stay Hydrated',
          message: 'You\'re behind on your hydration goal. Keep a water bottle nearby!',
          priority: 'medium',
          icon: 'water-outline',
        });
      }
    }

    // Activity insights
    if (data.steps !== undefined && data.stepsGoal !== undefined) {
      const stepsPercent = (data.steps / data.stepsGoal) * 100;
      if (stepsPercent >= 100) {
        insights.push({
          type: 'achievement',
          title: 'Step Goal Achieved!',
          message: 'You\'ve hit your daily step goal. Great job staying active!',
          priority: 'low',
          icon: 'walk-outline',
        });
      }
    }

    // Focus insights
    if (data.pomodoroSessions !== undefined && data.pomodoroSessions >= 4) {
      insights.push({
        type: 'achievement',
        title: 'Focus Champion',
        message: `${data.pomodoroSessions} Pomodoro sessions today! Your concentration is outstanding.`,
        priority: 'medium',
        icon: 'flash-outline',
      });
    }

    return insights.slice(0, 3);
  }

  /**
   * Generate a daily wellness summary
   */
  static async generateDailySummary(data: WellnessData): Promise<string> {
    try {
      const prompt = `Based on this wellness data, write a brief, encouraging daily summary (2-3 sentences):

Sleep: ${data.sleepHours || 'N/A'} hours (${data.sleepQuality || 'unknown'} quality)
Steps: ${data.steps?.toLocaleString() || 'N/A'} / ${data.stepsGoal?.toLocaleString() || 'N/A'}
Water: ${data.waterIntake || 0} / ${data.waterGoal || 8} glasses
Focus: ${data.pomodoroSessions || 0} Pomodoro sessions
Completion rate: ${data.recentCompletionRate || 'N/A'}%

Make it personal, warm, and motivating. Focus on what went well and gentle suggestions for improvement.`;

      const summary = await generateText({
        prompt,
        systemPrompt: 'You are a caring wellness coach. Be brief, warm, and encouraging.',
      });

      return summary;
    } catch (error) {
      console.error('Error generating daily summary:', error);
      return 'Keep up the great work! Remember to balance productivity with self-care.';
    }
  }
}
