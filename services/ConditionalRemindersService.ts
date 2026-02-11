// Conditional Reminders Service - Handles task dependencies
import { ConditionalRule, Reminder } from '@/types/reminder';
import { supabase } from '@/lib/supabase';
import * as Notifications from 'expo-notifications';

export class ConditionalRemindersService {
  /**
   * Create a conditional rule linking two reminders
   */
  static async createConditionalRule(rule: ConditionalRule): Promise<void> {
    try {
      const { data: triggerReminder } = await supabase
        .from('reminders')
        .select('*')
        .eq('id', rule.triggerReminderId)
        .single();

      const { data: targetReminder } = await supabase
        .from('reminders')
        .select('*')
        .eq('id', rule.targetReminderId)
        .single();

      if (!triggerReminder || !targetReminder) {
        throw new Error('One or both reminders not found');
      }

      // Add the conditional rule to the target reminder
      const existingRules = targetReminder.conditionalRules || [];
      existingRules.push(rule);

      await supabase
        .from('reminders')
        .update({ conditionalRules: existingRules })
        .eq('id', rule.targetReminderId);
    } catch (error) {
      console.error('Error creating conditional rule:', error);
      throw error;
    }
  }

  /**
   * Remove a conditional rule
   */
  static async removeConditionalRule(
    targetReminderId: string,
    triggerReminderId: string
  ): Promise<void> {
    try {
      const { data: targetReminder } = await supabase
        .from('reminders')
        .select('*')
        .eq('id', targetReminderId)
        .single();

      if (!targetReminder) return;

      const updatedRules = (targetReminder.conditionalRules || []).filter(
        (rule: ConditionalRule) => rule.triggerReminderId !== triggerReminderId
      );

      await supabase
        .from('reminders')
        .update({ conditionalRules: updatedRules })
        .eq('id', targetReminderId);
    } catch (error) {
      console.error('Error removing conditional rule:', error);
      throw error;
    }
  }

  /**
   * Check and trigger conditional reminders when a reminder is completed
   */
  static async checkAndTriggerConditionals(
    completedReminderId: string,
    userId: string
  ): Promise<void> {
    try {
      // Find all reminders that depend on this completed reminder
      const { data: dependentReminders } = await supabase
        .from('reminders')
        .select('*')
        .eq('userId', userId);

      if (!dependentReminders) return;

      for (const reminder of dependentReminders) {
        const conditionalRules = reminder.conditionalRules || [];

        for (const rule of conditionalRules) {
          if (
            rule.triggerReminderId === completedReminderId &&
            rule.type === 'on_complete'
          ) {
            await this.activateConditionalReminder(reminder, rule);
          }
        }
      }
    } catch (error) {
      console.error('Error checking conditional triggers:', error);
    }
  }

  /**
   * Activate a conditional reminder
   */
  private static async activateConditionalReminder(
    reminder: Reminder,
    rule: ConditionalRule
  ): Promise<void> {
    const delay = rule.delay || 0; // Minutes to wait

    // Calculate new due time
    const now = new Date();
    now.setMinutes(now.getMinutes() + delay);

    const newDueDate = now.toISOString().split('T')[0];
    const newDueTime = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    // Update the reminder
    await supabase
      .from('reminders')
      .update({
        dueDate: newDueDate,
        dueTime: newDueTime,
        status: 'pending',
      })
      .eq('id', reminder.id);

    // Schedule notification
    if (delay === 0) {
      // Trigger immediately
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Task Ready!',
          body: `"${reminder.title}" is now available`,
          sound: 'default',
          data: { reminderId: reminder.id },
        },
        trigger: null,
      });
    } else {
      // Schedule for later
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Task Ready!',
          body: `"${reminder.title}" is now available`,
          sound: 'default',
          data: { reminderId: reminder.id },
        },
        trigger: {
          seconds: delay * 60,
        },
      });
    }
  }

  /**
   * Get all dependencies for a reminder
   */
  static async getDependencies(reminderId: string): Promise<Reminder[]> {
    try {
      const { data: reminder } = await supabase
        .from('reminders')
        .select('*')
        .eq('id', reminderId)
        .single();

      if (!reminder || !reminder.conditionalRules) return [];

      const triggerIds = reminder.conditionalRules.map(
        (rule: ConditionalRule) => rule.triggerReminderId
      );

      const { data: dependencies } = await supabase
        .from('reminders')
        .select('*')
        .in('id', triggerIds);

      return dependencies || [];
    } catch (error) {
      console.error('Error getting dependencies:', error);
      return [];
    }
  }

  /**
   * Get all dependent reminders (reminders that depend on this one)
   */
  static async getDependents(reminderId: string, userId: string): Promise<Reminder[]> {
    try {
      const { data: allReminders } = await supabase
        .from('reminders')
        .select('*')
        .eq('userId', userId);

      if (!allReminders) return [];

      return allReminders.filter((reminder: Reminder) => {
        if (!reminder.conditionalRules) return false;
        return reminder.conditionalRules.some(
          (rule: ConditionalRule) => rule.triggerReminderId === reminderId
        );
      });
    } catch (error) {
      console.error('Error getting dependents:', error);
      return [];
    }
  }

  /**
   * Check if a reminder can be completed (no pending dependencies)
   */
  static async canComplete(reminder: Reminder): Promise<{ can: boolean; reason?: string }> {
    if (!reminder.conditionalRules || reminder.conditionalRules.length === 0) {
      return { can: true };
    }

    try {
      const triggerIds = reminder.conditionalRules
        .filter((rule) => rule.type === 'on_complete')
        .map((rule) => rule.triggerReminderId);

      if (triggerIds.length === 0) {
        return { can: true };
      }

      const { data: triggerReminders } = await supabase
        .from('reminders')
        .select('*')
        .in('id', triggerIds);

      if (!triggerReminders) return { can: true };

      const incompleteTriggers = triggerReminders.filter(
        (r: Reminder) => r.status !== 'completed'
      );

      if (incompleteTriggers.length > 0) {
        const titles = incompleteTriggers.map((r: Reminder) => r.title).join(', ');
        return {
          can: false,
          reason: `Complete these tasks first: ${titles}`,
        };
      }

      return { can: true };
    } catch (error) {
      console.error('Error checking if can complete:', error);
      return { can: true };
    }
  }

  /**
   * Visualize dependency chain for a reminder
   */
  static async getDependencyChain(
    reminderId: string,
    userId: string
  ): Promise<{ reminder: Reminder; dependencies: Reminder[]; dependents: Reminder[] }> {
    const { data: reminder } = await supabase
      .from('reminders')
      .select('*')
      .eq('id', reminderId)
      .single();

    if (!reminder) {
      throw new Error('Reminder not found');
    }

    const dependencies = await this.getDependencies(reminderId);
    const dependents = await this.getDependents(reminderId, userId);

    return { reminder, dependencies, dependents };
  }
}
