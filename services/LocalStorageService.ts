// Local Storage Service - Local-first privacy mode
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Reminder } from '@/types/reminder';

const STORAGE_KEYS = {
  REMINDERS: '@anchor_reminders',
  PRIVACY_MODE: '@anchor_privacy_mode',
  LAST_SYNC: '@anchor_last_sync',
};

export class LocalStorageService {
  /**
   * Check if privacy mode is enabled
   */
  static async isPrivacyModeEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.PRIVACY_MODE);
      return value === 'true';
    } catch (error) {
      console.error('Error checking privacy mode:', error);
      return false;
    }
  }

  /**
   * Enable or disable privacy mode
   */
  static async setPrivacyMode(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PRIVACY_MODE, enabled ? 'true' : 'false');
    } catch (error) {
      console.error('Error setting privacy mode:', error);
      throw error;
    }
  }

  /**
   * Save reminders to local storage
   */
  static async saveReminders(reminders: Reminder[]): Promise<void> {
    try {
      const json = JSON.stringify(reminders);
      await AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, json);
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (error) {
      console.error('Error saving reminders to local storage:', error);
      throw error;
    }
  }

  /**
   * Load reminders from local storage
   */
  static async loadReminders(): Promise<Reminder[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.REMINDERS);
      if (!json) return [];

      return JSON.parse(json);
    } catch (error) {
      console.error('Error loading reminders from local storage:', error);
      return [];
    }
  }

  /**
   * Add a reminder to local storage
   */
  static async addReminder(reminder: Reminder): Promise<void> {
    try {
      const reminders = await this.loadReminders();
      reminders.push(reminder);
      await this.saveReminders(reminders);
    } catch (error) {
      console.error('Error adding reminder to local storage:', error);
      throw error;
    }
  }

  /**
   * Update a reminder in local storage
   */
  static async updateReminder(id: string, updates: Partial<Reminder>): Promise<void> {
    try {
      const reminders = await this.loadReminders();
      const index = reminders.findIndex((r) => r.id === id);

      if (index === -1) {
        throw new Error('Reminder not found');
      }

      reminders[index] = { ...reminders[index], ...updates, updatedAt: new Date().toISOString() };
      await this.saveReminders(reminders);
    } catch (error) {
      console.error('Error updating reminder in local storage:', error);
      throw error;
    }
  }

  /**
   * Delete a reminder from local storage
   */
  static async deleteReminder(id: string): Promise<void> {
    try {
      const reminders = await this.loadReminders();
      const filtered = reminders.filter((r) => r.id !== id);
      await this.saveReminders(filtered);
    } catch (error) {
      console.error('Error deleting reminder from local storage:', error);
      throw error;
    }
  }

  /**
   * Clear all local data
   */
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.REMINDERS,
        STORAGE_KEYS.LAST_SYNC,
      ]);
    } catch (error) {
      console.error('Error clearing local storage:', error);
      throw error;
    }
  }

  /**
   * Get last sync time
   */
  static async getLastSync(): Promise<Date | null> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return value ? new Date(value) : null;
    } catch (error) {
      console.error('Error getting last sync time:', error);
      return null;
    }
  }

  /**
   * Get a value from storage by key
   */
  static async get(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting value for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set a value in storage by key
   */
  static async set(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting value for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Remove a value from storage by key
   */
  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing value for key ${key}:`, error);
      throw error;
    }
  }
}
