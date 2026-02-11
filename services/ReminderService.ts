// Reminder Service - Real-time sync with Supabase
import { supabase, subscribeToReminders } from '@/lib/supabase';
import type { Database } from '@/types/database';
import type { Reminder } from '@/types/reminder';

type DBReminder = Database['public']['Tables']['reminders']['Row'];
type InsertReminder = Database['public']['Tables']['reminders']['Insert'];
type UpdateReminder = Database['public']['Tables']['reminders']['Update'];

export class ReminderService {
  // Convert database reminder to app reminder format
  private static toAppFormat(dbReminder: DBReminder): Reminder {
    return {
      id: dbReminder.id,
      title: dbReminder.title,
      description: dbReminder.description || undefined,
      dueDate: dbReminder.due_date,
      dueTime: dbReminder.due_time,
      tag: dbReminder.tag as any,
      status: dbReminder.status as any,
      priority: dbReminder.priority as any,
      isRecurring: dbReminder.is_recurring,
      recurrence: dbReminder.recurrence as any,
      assignedTo: dbReminder.assigned_to || undefined,
      locationTrigger: dbReminder.location_trigger as any,
      bluetoothTrigger: dbReminder.bluetooth_trigger as any,
      nfcTrigger: dbReminder.nfc_trigger || undefined,
      snoozedUntil: dbReminder.snoozed_until || undefined,
      completedAt: dbReminder.completed_at || undefined,
      createdAt: dbReminder.created_at,
      updatedAt: dbReminder.updated_at,
      isSensitive: dbReminder.is_sensitive || undefined,
      sensitiveDeleteAt: dbReminder.sensitive_delete_at || undefined,
      chainCount: dbReminder.chain_count || 0,
      longestChain: dbReminder.longest_chain || 0,
      lastCompletedDate: dbReminder.last_completed_date || undefined,
    };
  }

  // Get all reminders for user
  static async getAll(userId: string): Promise<Reminder[]> {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .or(`user_id.eq.${userId},assigned_to.eq.${userId}`)
      .order('due_date', { ascending: true })
      .order('due_time', { ascending: true });

    if (error) throw error;

    return (data || []).map(this.toAppFormat);
  }

  // Get reminders for household
  static async getHouseholdReminders(householdId: string): Promise<Reminder[]> {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('household_id', householdId)
      .order('due_date', { ascending: true })
      .order('due_time', { ascending: true });

    if (error) throw error;

    return (data || []).map(this.toAppFormat);
  }

  // Create reminder
  static async create(userId: string, reminder: Partial<Reminder>, householdId?: string): Promise<Reminder> {
    const insertData: InsertReminder = {
      user_id: userId,
      household_id: householdId || null,
      title: reminder.title!,
      description: reminder.description || null,
      due_date: reminder.dueDate!,
      due_time: reminder.dueTime!,
      tag: reminder.tag!,
      status: reminder.status || 'pending',
      priority: reminder.priority || 'medium',
      is_recurring: reminder.isRecurring || false,
      recurrence: (reminder.recurrence as any) || null,
      assigned_to: reminder.assignedTo || null,
      location_trigger: (reminder.locationTrigger as any) || null,
      bluetooth_trigger: (reminder.bluetoothTrigger as any) || null,
      nfc_trigger: reminder.nfcTrigger || null,
      is_sensitive: reminder.isSensitive || null,
      chain_count: reminder.chainCount || 0,
      longest_chain: reminder.longestChain || 0,
    };

    const { data, error } = await supabase
      .from('reminders')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return this.toAppFormat(data);
  }

  // Update reminder
  static async update(reminderId: string, updates: Partial<Reminder>): Promise<Reminder> {
    const updateData: UpdateReminder = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description || null;
    if (updates.dueDate !== undefined) updateData.due_date = updates.dueDate;
    if (updates.dueTime !== undefined) updateData.due_time = updates.dueTime;
    if (updates.tag !== undefined) updateData.tag = updates.tag;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.priority !== undefined) updateData.priority = updates.priority;
    if (updates.assignedTo !== undefined) updateData.assigned_to = updates.assignedTo || null;
    if (updates.locationTrigger !== undefined) updateData.location_trigger = updates.locationTrigger as any;
    if (updates.bluetoothTrigger !== undefined) updateData.bluetooth_trigger = updates.bluetoothTrigger as any;
    if (updates.nfcTrigger !== undefined) updateData.nfc_trigger = updates.nfcTrigger || null;
    if (updates.snoozedUntil !== undefined) updateData.snoozed_until = updates.snoozedUntil || null;
    if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt || null;
    if (updates.isSensitive !== undefined) updateData.is_sensitive = updates.isSensitive || null;
    if (updates.sensitiveDeleteAt !== undefined) updateData.sensitive_delete_at = updates.sensitiveDeleteAt || null;
    if (updates.chainCount !== undefined) updateData.chain_count = updates.chainCount || null;
    if (updates.longestChain !== undefined) updateData.longest_chain = updates.longestChain || null;
    if (updates.lastCompletedDate !== undefined) updateData.last_completed_date = updates.lastCompletedDate || null;

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('reminders')
      .update(updateData)
      .eq('id', reminderId)
      .select()
      .single();

    if (error) throw error;

    return this.toAppFormat(data);
  }

  // Mark complete
  static async markComplete(reminderId: string): Promise<Reminder> {
    // Get current reminder to check chain and sensitive status
    const { data: current, error: fetchError } = await supabase
      .from('reminders')
      .select('*')
      .eq('id', reminderId)
      .single();

    if (fetchError) throw fetchError;

    const reminder = this.toAppFormat(current);
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Calculate chain count for recurring reminders
    let chainCount = reminder.chainCount || 0;
    let longestChain = reminder.longestChain || 0;

    if (reminder.isRecurring && reminder.lastCompletedDate) {
      const lastDate = new Date(reminder.lastCompletedDate);
      const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      // Chain continues if completed within 1 day
      if (daysDiff <= 1) {
        chainCount++;
      } else {
        // Chain broken, reset
        chainCount = 1;
      }
    } else if (reminder.isRecurring) {
      // First completion
      chainCount = 1;
    }

    // Update longest chain if current is higher
    if (chainCount > longestChain) {
      longestChain = chainCount;
    }

    // Calculate sensitive delete time (60 minutes from now)
    const sensitiveDeleteAt = reminder.isSensitive
      ? new Date(now.getTime() + 60 * 60 * 1000).toISOString()
      : null;

    return this.update(reminderId, {
      status: 'completed',
      completedAt: now.toISOString(),
      chainCount,
      longestChain,
      lastCompletedDate: today,
      sensitiveDeleteAt: sensitiveDeleteAt || undefined,
    });
  }

  // Snooze reminder
  static async snooze(reminderId: string, snoozeUntil: Date): Promise<Reminder> {
    return this.update(reminderId, {
      status: 'snoozed',
      snoozedUntil: snoozeUntil.toISOString(),
    });
  }

  // Delete reminder
  static async delete(reminderId: string): Promise<void> {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', reminderId);

    if (error) throw error;
  }

  // Get reminders by location
  static async getByLocation(userId: string, latitude: number, longitude: number, radiusMeters: number = 500): Promise<Reminder[]> {
    const allReminders = await this.getAll(userId);

    return allReminders.filter((reminder) => {
      if (!reminder.locationTrigger) return false;

      const { latitude: lat, longitude: lng, radius } = reminder.locationTrigger;
      const distance = this.calculateDistance(latitude, longitude, lat, lng);

      return distance <= (radius || radiusMeters);
    });
  }

  // Calculate distance between two coordinates (Haversine formula)
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

  // Subscribe to real-time changes
  static subscribe(userId: string, callback: (reminders: Reminder[]) => void) {
    return subscribeToReminders(userId, async () => {
      const reminders = await this.getAll(userId);
      callback(reminders);
    });
  }

  // Check for overdue reminders
  static async checkOverdue(userId: string): Promise<void> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const { error } = await supabase
      .from('reminders')
      .update({ status: 'overdue', updated_at: new Date().toISOString() })
      .or(`user_id.eq.${userId},assigned_to.eq.${userId}`)
      .eq('status', 'pending')
      .or(`due_date.lt.${today},and(due_date.eq.${today},due_time.lt.${currentTime})`);

    if (error) console.error('Error checking overdue:', error);
  }

  // Clean up sensitive data that has passed the deletion time
  static async cleanupSensitiveData(): Promise<void> {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('reminders')
      .update({
        title: '[Deleted]',
        description: null,
        updated_at: new Date().toISOString(),
        is_sensitive: null,
        sensitive_delete_at: null,
      })
      .lte('sensitive_delete_at', now)
      .not('sensitive_delete_at', 'is', null);

    if (error) console.error('Error cleaning up sensitive data:', error);
  }

  // Get top chains for gamification
  static async getTopChains(userId: string): Promise<{ reminder: Reminder; chain: number }[]> {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .eq('is_recurring', true)
      .gt('longest_chain', 0)
      .order('longest_chain', { ascending: false })
      .limit(5);

    if (error) throw error;

    return (data || []).map((r) => ({
      reminder: this.toAppFormat(r),
      chain: r.longest_chain || 0,
    }));
  }
}
