// Smart Defer Service - AI-powered task deferral analysis
import { AI } from '@fastshot/ai';
import type { Reminder, DeferAnalysis, SmartDeferResult } from '@/types/reminder';
import { ReminderService } from './ReminderService';

const NEWELL_API_URL = process.env.EXPO_PUBLIC_NEWELL_API_URL!;
const PROJECT_ID = process.env.EXPO_PUBLIC_PROJECT_ID!;

export class SmartDeferService {
  /**
   * Analyze if the user is overwhelmed and should defer tasks
   */
  static async shouldOfferDefer(reminders: Reminder[]): Promise<boolean> {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Count high/medium priority tasks due within 2 hours
    const urgentTasks = reminders.filter((r) => {
      if (r.status !== 'pending' && r.status !== 'overdue') return false;
      if (r.priority === 'low') return false;

      const dueDateTime = new Date(`${r.dueDate}T${r.dueTime}`);
      return dueDateTime <= twoHoursFromNow;
    });

    // Offer defer if 3 or more urgent tasks
    return urgentTasks.length >= 3;
  }

  /**
   * Analyze which tasks can be safely deferred using AI
   */
  static async analyzeDeferCandidates(
    reminders: Reminder[],
    userId: string
  ): Promise<DeferAnalysis[]> {
    // Get low priority pending tasks
    const lowPriorityTasks = reminders.filter(
      (r) => r.priority === 'low' && (r.status === 'pending' || r.status === 'overdue')
    );

    if (lowPriorityTasks.length === 0) {
      return [];
    }

    // Get user's completion history for context
    const allUserReminders = await ReminderService.getAll(userId);
    const completedTasks = allUserReminders.filter((r) => r.status === 'completed');

    // Build AI prompt
    const prompt = `Analyze which of these low-priority tasks can be safely deferred by 30-60 minutes based on the user's completion patterns:

Current Low-Priority Tasks:
${lowPriorityTasks.map((r) => `- ${r.title} (${r.tag}, due at ${r.dueTime})`).join('\n')}

User's Recent Completion History:
${completedTasks.slice(-10).map((r) => `- ${r.title} (${r.tag}, completed ${r.completedAt ? new Date(r.completedAt).toLocaleString() : 'recently'})`).join('\n')}

For each task, provide:
1. canDefer: boolean (true if safe to defer)
2. reason: string (why it can/cannot be deferred)
3. suggestedDelay: number (minutes to defer, 30-60)
4. confidence: number (0-1 confidence score)

Respond in JSON format as an array.`;

    try {
      const ai = AI.create({
        baseURL: NEWELL_API_URL,
        projectId: PROJECT_ID
      });

      const result = await ai.generateText({
        prompt,
        model: 'anthropic/claude-3.5-sonnet',
      });

      // Parse AI response
      const analyses: DeferAnalysis[] = JSON.parse(result.text);
      return analyses.slice(0, lowPriorityTasks.length);
    } catch (error) {
      console.error('Error analyzing defer candidates:', error);
      // Fallback: defer all low priority tasks with moderate confidence
      return lowPriorityTasks.map(() => ({
        canDefer: true,
        reason: 'Low priority task with no immediate dependencies',
        suggestedDelay: 45,
        confidence: 0.6,
      }));
    }
  }

  /**
   * Execute smart defer - push back low priority tasks
   */
  static async executeDefer(
    reminders: Reminder[],
    userId: string
  ): Promise<SmartDeferResult> {
    const analyses = await this.analyzeDeferCandidates(reminders, userId);
    const lowPriorityTasks = reminders.filter(
      (r) => r.priority === 'low' && (r.status === 'pending' || r.status === 'overdue')
    );

    let deferredCount = 0;
    const deferredReminders: Reminder[] = [];

    for (let i = 0; i < lowPriorityTasks.length; i++) {
      const task = lowPriorityTasks[i];
      const analysis = analyses[i];

      if (analysis && analysis.canDefer && analysis.confidence > 0.5) {
        try {
          // Calculate new due time
          const currentDueTime = new Date(`${task.dueDate}T${task.dueTime}`);
          const newDueTime = new Date(
            currentDueTime.getTime() + analysis.suggestedDelay * 60 * 1000
          );

          const newTime = `${newDueTime.getHours().toString().padStart(2, '0')}:${newDueTime.getMinutes().toString().padStart(2, '0')}`;
          const newDate = newDueTime.toISOString().split('T')[0];

          // Update reminder
          const updated = await ReminderService.update(task.id, {
            dueTime: newTime,
            dueDate: newDate,
          });

          deferredReminders.push(updated);
          deferredCount++;
        } catch (error) {
          console.error('Error deferring task:', task.title, error);
        }
      }
    }

    return {
      deferredCount,
      reminders: deferredReminders,
      analysis: analyses,
    };
  }
}
