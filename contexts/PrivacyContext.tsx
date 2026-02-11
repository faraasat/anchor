// Privacy Context - Manage local-first mode and sensitive data
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LocalStorageService } from '@/services/LocalStorageService';
import { ReminderService } from '@/services/ReminderService';
import type { Reminder } from '@/types/reminder';

interface PrivacyContextType {
  isPrivacyMode: boolean;
  isPrivacyVeilEnabled: boolean;
  setPrivacyMode: (enabled: boolean) => Promise<void>;
  setPrivacyVeil: (enabled: boolean) => Promise<void>;
  getReminders: (userId: string) => Promise<Reminder[]>;
  createReminder: (userId: string, reminder: Partial<Reminder>, householdId?: string) => Promise<Reminder>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<Reminder>;
  deleteReminder: (id: string) => Promise<void>;
  markComplete: (id: string) => Promise<Reminder>;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const [isPrivacyMode, setIsPrivacyModeState] = useState(false);
  const [isPrivacyVeilEnabled, setIsPrivacyVeilState] = useState(false);

  // Load privacy mode setting on mount
  useEffect(() => {
    loadPrivacyMode();
    loadPrivacyVeil();
    startSensitiveDataCleanup();
  }, []);

  const loadPrivacyMode = async () => {
    const enabled = await LocalStorageService.isPrivacyModeEnabled();
    setIsPrivacyModeState(enabled);
  };

  const loadPrivacyVeil = async () => {
    try {
      const enabled = await LocalStorageService.get('privacy_veil_enabled');
      setIsPrivacyVeilState(enabled === 'true');
    } catch (error) {
      console.error('Error loading privacy veil setting:', error);
    }
  };

  const setPrivacyMode = async (enabled: boolean) => {
    await LocalStorageService.setPrivacyMode(enabled);
    setIsPrivacyModeState(enabled);
  };

  const setPrivacyVeil = async (enabled: boolean) => {
    try {
      await LocalStorageService.set('privacy_veil_enabled', enabled.toString());
      setIsPrivacyVeilState(enabled);
    } catch (error) {
      console.error('Error setting privacy veil:', error);
    }
  };

  // Start periodic cleanup of sensitive data
  const startSensitiveDataCleanup = () => {
    // Clean up every 5 minutes
    const interval = setInterval(async () => {
      try {
        await ReminderService.cleanupSensitiveData();
      } catch (error) {
        console.error('Error in sensitive data cleanup:', error);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  };

  const getReminders = useCallback(
    async (userId: string): Promise<Reminder[]> => {
      if (isPrivacyMode) {
        return await LocalStorageService.loadReminders();
      } else {
        return await ReminderService.getAll(userId);
      }
    },
    [isPrivacyMode]
  );

  const createReminder = useCallback(
    async (userId: string, reminder: Partial<Reminder>, householdId?: string): Promise<Reminder> => {
      if (isPrivacyMode) {
        const newReminder: Reminder = {
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: reminder.title || '',
          description: reminder.description,
          dueDate: reminder.dueDate || new Date().toISOString().split('T')[0],
          dueTime: reminder.dueTime || '09:00',
          tag: reminder.tag || 'Personal',
          status: reminder.status || 'pending',
          priority: reminder.priority || 'medium',
          isRecurring: reminder.isRecurring || false,
          recurrence: reminder.recurrence || { type: 'none' },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isSensitive: reminder.isSensitive,
          chainCount: reminder.chainCount || 0,
          longestChain: reminder.longestChain || 0,
        };

        await LocalStorageService.addReminder(newReminder);
        return newReminder;
      } else {
        return await ReminderService.create(userId, reminder, householdId);
      }
    },
    [isPrivacyMode]
  );

  const updateReminder = useCallback(
    async (id: string, updates: Partial<Reminder>): Promise<Reminder> => {
      if (isPrivacyMode) {
        await LocalStorageService.updateReminder(id, updates);
        const reminders = await LocalStorageService.loadReminders();
        const updated = reminders.find((r) => r.id === id);
        if (!updated) throw new Error('Reminder not found');
        return updated;
      } else {
        return await ReminderService.update(id, updates);
      }
    },
    [isPrivacyMode]
  );

  const deleteReminder = useCallback(
    async (id: string): Promise<void> => {
      if (isPrivacyMode) {
        await LocalStorageService.deleteReminder(id);
      } else {
        await ReminderService.delete(id);
      }
    },
    [isPrivacyMode]
  );

  const markComplete = useCallback(
    async (id: string): Promise<Reminder> => {
      if (isPrivacyMode) {
        const reminders = await LocalStorageService.loadReminders();
        const reminder = reminders.find((r) => r.id === id);
        if (!reminder) throw new Error('Reminder not found');

        const now = new Date();
        const today = now.toISOString().split('T')[0];

        // Calculate chain count
        let chainCount = reminder.chainCount || 0;
        let longestChain = reminder.longestChain || 0;

        if (reminder.isRecurring && reminder.lastCompletedDate) {
          const lastDate = new Date(reminder.lastCompletedDate);
          const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

          if (daysDiff <= 1) {
            chainCount++;
          } else {
            chainCount = 1;
          }
        } else if (reminder.isRecurring) {
          chainCount = 1;
        }

        if (chainCount > longestChain) {
          longestChain = chainCount;
        }

        const updates: Partial<Reminder> = {
          status: 'completed',
          completedAt: now.toISOString(),
          chainCount,
          longestChain,
          lastCompletedDate: today,
        };

        // Handle sensitive data
        if (reminder.isSensitive) {
          updates.sensitiveDeleteAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
        }

        await LocalStorageService.updateReminder(id, updates);
        const updatedReminders = await LocalStorageService.loadReminders();
        const updated = updatedReminders.find((r) => r.id === id);
        if (!updated) throw new Error('Reminder not found');
        return updated;
      } else {
        return await ReminderService.markComplete(id);
      }
    },
    [isPrivacyMode]
  );

  const value: PrivacyContextType = {
    isPrivacyMode,
    isPrivacyVeilEnabled,
    setPrivacyMode,
    setPrivacyVeil,
    getReminders,
    createReminder,
    updateReminder,
    deleteReminder,
    markComplete,
  };

  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (context === undefined) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
}
