// Daily Briefing Service - AI-powered narrative summaries
// Phase 2: Conversational intelligence using Newell AI
import { generateText } from '@fastshot/ai';
import type { Reminder } from '@/types/reminder';

export interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  description?: string;
}

export interface WellnessData {
  focusTime?: number;      // Pomodoro minutes
  waterIntake?: number;    // Glasses of water
  steps?: number;
  sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  energyLevel?: 'low' | 'medium' | 'high';
}

export interface DailyBriefing {
  greeting: string;
  summary: string;
  keyTasks: string[];
  weatherContext?: string;
  wellnessAdvice?: string;
  motivationalNote: string;
  timestamp: string;
  type: 'morning' | 'evening';
}

export interface EveningReflection {
  summary: string;
  achievements: string[];
  completionRate: number;
  tomorrowPriorities: string[];
  encouragement: string;
  timestamp: string;
}

export class DailyBriefingService {
  /**
   * Generate morning briefing with conversational AI narrative
   */
  static async generateMorningBriefing(
    reminders: Reminder[],
    weather?: WeatherData,
    wellness?: WellnessData
  ): Promise<DailyBriefing> {
    const now = new Date();
    const hour = now.getHours();

    // Get today's pending tasks
    const today = now.toISOString().split('T')[0];
    const todayTasks = reminders.filter(
      r => r.dueDate === today && r.status === 'pending'
    );

    // Build context for AI
    const taskCount = todayTasks.length;
    const highPriorityCount = todayTasks.filter(r => r.priority === 'high').length;
    const tasksByTag = this.groupTasksByTag(todayTasks);

    // Get time-based greeting
    const timeGreeting = hour < 12 ? 'Good morning' :
                        hour < 17 ? 'Good afternoon' :
                        'Good evening';

    // Build AI prompt for natural narrative
    const prompt = this.buildMorningPrompt({
      timeGreeting,
      taskCount,
      highPriorityCount,
      tasksByTag,
      weather,
      wellness,
      todayTasks,
    });

    try {
      // Generate conversational narrative using Newell AI
      const narrative = await generateText({
        prompt,
        maxTokens: 300,
      });

      // Parse AI response and structure briefing
      return this.parseMorningNarrative(narrative, todayTasks, weather, wellness);
    } catch (error) {
      console.error('Error generating morning briefing:', error);
      // Fallback to structured briefing
      return this.generateFallbackMorningBriefing(todayTasks, weather, wellness);
    }
  }

  /**
   * Generate evening productivity reflection
   */
  static async generateEveningReflection(
    completedToday: Reminder[],
    pendingTasks: Reminder[],
    tomorrowTasks: Reminder[]
  ): Promise<EveningReflection> {
    const totalToday = completedToday.length + pendingTasks.length;
    const completionRate = totalToday > 0
      ? Math.round((completedToday.length / totalToday) * 100)
      : 0;

    // Build context for evening reflection
    const achievementsByTag = this.groupTasksByTag(completedToday);
    const tomorrowByPriority = tomorrowTasks
      .sort((a, b) => {
        const priority = { high: 3, medium: 2, low: 1 };
        return priority[b.priority] - priority[a.priority];
      })
      .slice(0, 3); // Top 3 priorities

    // Build AI prompt for reflection
    const prompt = this.buildEveningPrompt({
      completedCount: completedToday.length,
      completionRate,
      achievementsByTag,
      pendingCount: pendingTasks.length,
      tomorrowTasks: tomorrowByPriority,
    });

    try {
      // Generate conversational reflection using Newell AI
      const narrative = await generateText({
        prompt,
        maxTokens: 350,
      });

      return this.parseEveningNarrative(
        narrative,
        completedToday,
        completionRate,
        tomorrowByPriority
      );
    } catch (error) {
      console.error('Error generating evening reflection:', error);
      // Fallback to structured reflection
      return this.generateFallbackEveningReflection(
        completedToday,
        completionRate,
        tomorrowByPriority
      );
    }
  }

  /**
   * Generate quick contextual insight (for pull-to-refresh, etc.)
   */
  static async generateQuickInsight(
    reminders: Reminder[],
    context?: { weather?: WeatherData; timeOfDay?: string }
  ): Promise<string> {
    const pending = reminders.filter(r => r.status === 'pending');
    const overdue = reminders.filter(r => r.status === 'overdue');

    const prompt = `You are Anchor, a personal assistant. Give a brief, encouraging insight about the user's tasks in 1-2 sentences. Be conversational and supportive.

Context:
- ${pending.length} pending tasks
- ${overdue.length} overdue tasks
${context?.weather ? `- Weather: ${context.weather.condition}, ${context.weather.temperature}°F` : ''}
${context?.timeOfDay ? `- Time: ${context.timeOfDay}` : ''}

Generate a brief, friendly insight:`;

    try {
      const insight = await generateText({ prompt, maxTokens: 100 });
      return insight.trim();
    } catch (error) {
      console.error('Error generating quick insight:', error);
      return pending.length > 0
        ? `You have ${pending.length} task${pending.length === 1 ? '' : 's'} ahead today. Let's make progress together.`
        : 'All caught up! Enjoy your day.';
    }
  }

  // === PRIVATE HELPER METHODS ===

  private static buildMorningPrompt(context: {
    timeGreeting: string;
    taskCount: number;
    highPriorityCount: number;
    tasksByTag: Record<string, number>;
    weather?: WeatherData;
    wellness?: WellnessData;
    todayTasks: Reminder[];
  }): string {
    const { timeGreeting, taskCount, highPriorityCount, tasksByTag, weather, wellness, todayTasks } = context;

    // Sample task titles (first 3)
    const sampleTasks = todayTasks.slice(0, 3).map(t => `"${t.title}"`).join(', ');

    return `You are Anchor, a sophisticated personal assistant. Generate a natural, conversational morning briefing that feels like a trusted colleague greeting the user. Be warm, insightful, and concise.

Context:
- Greeting: ${timeGreeting}
- Total tasks today: ${taskCount}
- High priority tasks: ${highPriorityCount}
- Tasks by category: ${Object.entries(tasksByTag).map(([tag, count]) => `${tag}: ${count}`).join(', ')}
${sampleTasks ? `- Sample tasks: ${sampleTasks}` : ''}
${weather ? `- Weather: ${weather.condition}, ${weather.temperature}°F` : ''}
${wellness?.energyLevel ? `- Energy level: ${wellness.energyLevel}` : ''}

Generate a briefing with these sections (use natural language, not labels):
1. Opening greeting (personalized, warm)
2. Day overview (what kind of day: focused, busy, light, etc.)
3. Key highlights (mention 1-2 important tasks naturally)
4. Weather context if relevant (brief)
5. Encouraging close

Keep it conversational, under 150 words, like a personal assistant who knows the user well.`;
  }

  private static buildEveningPrompt(context: {
    completedCount: number;
    completionRate: number;
    achievementsByTag: Record<string, number>;
    pendingCount: number;
    tomorrowTasks: Reminder[];
  }): string {
    const { completedCount, completionRate, achievementsByTag, pendingCount, tomorrowTasks } = context;

    const tomorrowSample = tomorrowTasks.slice(0, 3).map(t => `"${t.title}"`).join(', ');

    return `You are Anchor, a sophisticated personal assistant. Generate a warm, reflective evening summary that celebrates progress and sets up tomorrow. Be encouraging and insightful.

Today's Progress:
- Completed: ${completedCount} tasks (${completionRate}% completion rate)
- Achievements by category: ${Object.entries(achievementsByTag).map(([tag, count]) => `${tag}: ${count}`).join(', ')}
- Still pending: ${pendingCount}

Tomorrow:
${tomorrowSample ? `- Key priorities: ${tomorrowSample}` : '- Light schedule ahead'}

Generate a reflection with these elements (naturally woven together):
1. Acknowledge today's accomplishments (be specific about what they achieved)
2. Celebrate the completion rate (encouraging, not judgmental)
3. Highlight 1-2 notable achievements
4. Preview tomorrow (what to expect, how to prepare)
5. Motivational close (supportive, looking forward)

Keep it conversational, under 180 words, like a trusted coach reviewing the day.`;
  }

  private static parseMorningNarrative(
    narrative: string,
    todayTasks: Reminder[],
    weather?: WeatherData,
    wellness?: WellnessData
  ): DailyBriefing {
    // Extract key sections from AI narrative
    const lines = narrative.split('\n').filter(l => l.trim());

    // First line is typically greeting
    const greeting = lines[0] || 'Good morning.';

    // Rest is summary
    const summary = lines.slice(1).join('\n').trim();

    // Extract key tasks (high priority)
    const keyTasks = todayTasks
      .filter(r => r.priority === 'high')
      .slice(0, 3)
      .map(r => r.title);

    return {
      greeting,
      summary,
      keyTasks,
      weatherContext: weather ? `${weather.condition}, ${weather.temperature}°F` : undefined,
      wellnessAdvice: wellness?.energyLevel === 'low'
        ? 'Consider scheduling breaks today to maintain your energy.'
        : undefined,
      motivationalNote: 'You have got this.',
      timestamp: new Date().toISOString(),
      type: 'morning',
    };
  }

  private static parseEveningNarrative(
    narrative: string,
    completedToday: Reminder[],
    completionRate: number,
    tomorrowTasks: Reminder[]
  ): EveningReflection {
    // Extract sections from AI narrative
    const lines = narrative.split('\n').filter(l => l.trim());

    const summary = narrative;

    // Extract achievements (completed task titles)
    const achievements = completedToday
      .slice(0, 5)
      .map(r => r.title);

    // Tomorrow priorities
    const tomorrowPriorities = tomorrowTasks.map(r => r.title);

    // Last line or fallback encouragement
    const encouragement = lines[lines.length - 1] || 'Rest well and recharge for tomorrow.';

    return {
      summary,
      achievements,
      completionRate,
      tomorrowPriorities,
      encouragement,
      timestamp: new Date().toISOString(),
    };
  }

  private static groupTasksByTag(tasks: Reminder[]): Record<string, number> {
    return tasks.reduce((acc, task) => {
      acc[task.tag] = (acc[task.tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private static generateFallbackMorningBriefing(
    todayTasks: Reminder[],
    weather?: WeatherData,
    wellness?: WellnessData
  ): DailyBriefing {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    const taskCount = todayTasks.length;
    const highPriority = todayTasks.filter(r => r.priority === 'high');

    const dayType = taskCount === 0 ? 'clear' :
                   taskCount <= 3 ? 'focused' :
                   taskCount <= 6 ? 'productive' : 'busy';

    const greeting = `${timeGreeting}.`;
    const summary = taskCount === 0
      ? `You have a ${dayType} day ahead with no scheduled tasks. A great opportunity to plan or take some time for yourself.`
      : `You have a ${dayType} day ahead with ${taskCount} task${taskCount === 1 ? '' : 's'}.${highPriority.length > 0 ? ` ${highPriority.length} high priority item${highPriority.length === 1 ? '' : 's'} need${highPriority.length === 1 ? 's' : ''} your attention.` : ''}`;

    return {
      greeting,
      summary,
      keyTasks: highPriority.slice(0, 3).map(r => r.title),
      weatherContext: weather ? `${weather.condition}, ${weather.temperature}°F` : undefined,
      wellnessAdvice: wellness?.energyLevel === 'low'
        ? 'Consider taking breaks to maintain your energy throughout the day.'
        : undefined,
      motivationalNote: 'Let us make today count.',
      timestamp: new Date().toISOString(),
      type: 'morning',
    };
  }

  private static generateFallbackEveningReflection(
    completedToday: Reminder[],
    completionRate: number,
    tomorrowTasks: Reminder[]
  ): EveningReflection {
    const completedCount = completedToday.length;

    const summary = completedCount === 0
      ? 'Today was a quieter day. Every day does not need to be packed with completions—sometimes rest and reflection are just as valuable.'
      : `You completed ${completedCount} task${completedCount === 1 ? '' : 's'} today with a ${completionRate}% completion rate. ${
          completionRate >= 80 ? 'Outstanding progress!' :
          completionRate >= 60 ? 'Solid work today.' :
          'Every step forward counts.'
        }`;

    const encouragement = tomorrowTasks.length > 0
      ? `Tomorrow brings ${tomorrowTasks.length} priorit${tomorrowTasks.length === 1 ? 'y' : 'ies'}. Rest well and start fresh.`
      : 'Tomorrow is looking light. Enjoy the breathing room.';

    return {
      summary,
      achievements: completedToday.slice(0, 5).map(r => r.title),
      completionRate,
      tomorrowPriorities: tomorrowTasks.map(r => r.title),
      encouragement,
      timestamp: new Date().toISOString(),
    };
  }
}
