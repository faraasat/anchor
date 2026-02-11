// Offline-first storage utility for Anchor reminders
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reminder, ContextData } from '@/types/reminder';

const STORAGE_KEYS = {
  REMINDERS: '@anchor_reminders',
  CONTEXT: '@anchor_context',
  USER_PREFERENCES: '@anchor_preferences',
  SYNC_QUEUE: '@anchor_sync_queue',
  LAST_SYNC: '@anchor_last_sync',
} as const;

// Generate unique ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Reminders Storage
export const ReminderStorage = {
  async getAll(): Promise<Reminder[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading reminders:', error);
      return [];
    }
  },

  async save(reminders: Reminder[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(reminders));
    } catch (error) {
      console.error('Error saving reminders:', error);
      throw error;
    }
  },

  async add(reminder: Reminder): Promise<Reminder> {
    const reminders = await this.getAll();
    const newReminder = {
      ...reminder,
      id: reminder.id || generateId(),
      createdAt: reminder.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    reminders.push(newReminder);
    await this.save(reminders);
    await this.addToSyncQueue('create', newReminder);
    return newReminder;
  },

  async update(id: string, updates: Partial<Reminder>): Promise<Reminder | null> {
    const reminders = await this.getAll();
    const index = reminders.findIndex(r => r.id === id);
    if (index === -1) return null;

    const updatedReminder = {
      ...reminders[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    reminders[index] = updatedReminder;
    await this.save(reminders);
    await this.addToSyncQueue('update', updatedReminder);
    return updatedReminder;
  },

  async delete(id: string): Promise<boolean> {
    const reminders = await this.getAll();
    const index = reminders.findIndex(r => r.id === id);
    if (index === -1) return false;

    const deletedReminder = reminders[index];
    reminders.splice(index, 1);
    await this.save(reminders);
    await this.addToSyncQueue('delete', deletedReminder);
    return true;
  },

  async getById(id: string): Promise<Reminder | null> {
    const reminders = await this.getAll();
    return reminders.find(r => r.id === id) || null;
  },

  async getForDate(date: Date): Promise<Reminder[]> {
    const reminders = await this.getAll();
    const dateStr = date.toISOString().split('T')[0];

    return reminders.filter(r => {
      const reminderDate = new Date(r.dueDate).toISOString().split('T')[0];
      return reminderDate === dateStr && r.status !== 'completed';
    }).sort((a, b) => {
      const timeA = a.dueTime.split(':').map(Number);
      const timeB = b.dueTime.split(':').map(Number);
      return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
    });
  },

  async getTodaysReminders(): Promise<Reminder[]> {
    return this.getForDate(new Date());
  },

  async getUpcoming(days: number = 7): Promise<Reminder[]> {
    const reminders = await this.getAll();
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return reminders.filter(r => {
      const dueDate = new Date(r.dueDate);
      return dueDate >= now && dueDate <= endDate && r.status !== 'completed';
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  },

  async markComplete(id: string): Promise<Reminder | null> {
    return this.update(id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
  },

  async snooze(id: string, until: Date): Promise<Reminder | null> {
    return this.update(id, {
      status: 'snoozed',
      snoozedUntil: until.toISOString(),
      dueDate: until.toISOString(),
      dueTime: `${until.getHours().toString().padStart(2, '0')}:${until.getMinutes().toString().padStart(2, '0')}`,
    });
  },

  async checkOverdue(): Promise<void> {
    const reminders = await this.getAll();
    const now = new Date();
    let hasUpdates = false;

    const updatedReminders = reminders.map(r => {
      if (r.status === 'pending') {
        const dueDateTime = new Date(r.dueDate);
        const [hours, minutes] = r.dueTime.split(':').map(Number);
        dueDateTime.setHours(hours, minutes, 0, 0);

        if (dueDateTime < now) {
          hasUpdates = true;
          return { ...r, status: 'overdue' as const, updatedAt: new Date().toISOString() };
        }
      }
      return r;
    });

    if (hasUpdates) {
      await this.save(updatedReminders);
    }
  },

  async getByTag(tag: string): Promise<Reminder[]> {
    const reminders = await this.getAll();
    return reminders.filter(r => r.tag === tag);
  },

  async getGroupedByTag(): Promise<Record<string, Reminder[]>> {
    const reminders = await this.getAll();
    return reminders.reduce((acc, reminder) => {
      if (!acc[reminder.tag]) {
        acc[reminder.tag] = [];
      }
      acc[reminder.tag].push(reminder);
      return acc;
    }, {} as Record<string, Reminder[]>);
  },

  // Sync queue for backend sync
  async addToSyncQueue(action: 'create' | 'update' | 'delete', reminder: Reminder): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      queue.push({
        action,
        reminder,
        timestamp: new Date().toISOString(),
      });
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  },

  async getSyncQueue(): Promise<Array<{ action: string; reminder: Reminder; timestamp: string }>> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('Error getting sync queue:', error);
      return [];
    }
  },

  async clearSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (error) {
      console.error('Error clearing sync queue:', error);
    }
  },
};

// Context Storage (weather, traffic, etc.)
export const ContextStorage = {
  async get(): Promise<ContextData | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CONTEXT);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading context:', error);
      return null;
    }
  },

  async save(context: ContextData): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONTEXT, JSON.stringify(context));
    } catch (error) {
      console.error('Error saving context:', error);
    }
  },
};

// User Preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  defaultTag: string;
  notificationsEnabled: boolean;
  smartSnoozeEnabled: boolean;
  workStartTime: string;
  workEndTime: string;
  weekendDays: number[];
}

export const PreferencesStorage = {
  async get(): Promise<UserPreferences> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (!data) {
        return this.getDefaults();
      }
      return { ...this.getDefaults(), ...JSON.parse(data) };
    } catch (error) {
      console.error('Error loading preferences:', error);
      return this.getDefaults();
    }
  },

  async save(preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const current = await this.get();
      await AsyncStorage.setItem(
        STORAGE_KEYS.USER_PREFERENCES,
        JSON.stringify({ ...current, ...preferences })
      );
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  },

  getDefaults(): UserPreferences {
    return {
      theme: 'system',
      defaultTag: 'Personal',
      notificationsEnabled: true,
      smartSnoozeEnabled: true,
      workStartTime: '09:00',
      workEndTime: '17:00',
      weekendDays: [0, 6], // Sunday, Saturday
    };
  },
};

// Clear all data (for debugging/reset)
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};
