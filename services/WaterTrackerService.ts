// Water Tracker Service - Track daily water intake
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import * as Notifications from 'expo-notifications';

export interface WaterEntry {
  timestamp: string;
  amount: number; // ml
}

export interface DailyWaterData {
  date: string;
  entries: WaterEntry[];
  total: number; // ml
  goal: number; // ml
  glassesConsumed: number;
  glassesGoal: number;
}

export interface WaterTrend {
  daily: DailyWaterData[];
  weeklyAverage: number;
  monthlyAverage: number;
  streak: number; // Days of meeting goal
}

export class WaterTrackerService {
  private static readonly STORAGE_KEY = 'water_tracker_data';
  private static readonly DEFAULT_GOAL = 2000; // 2L in ml
  private static readonly STANDARD_GLASS = 250; // 250ml per glass
  private static readonly REMINDER_INTERVAL = 2; // Hours

  /**
   * Add water intake
   */
  static async addWater(
    userId: string,
    amount: number,
    glasses: number = 1
  ): Promise<DailyWaterData> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const timestamp = new Date().toISOString();

      const entry: WaterEntry = {
        timestamp,
        amount: amount || glasses * this.STANDARD_GLASS,
      };

      // Get today's data
      let todayData = await this.getTodayWater(userId);

      // Add new entry
      todayData.entries.push(entry);
      todayData.total += entry.amount;
      todayData.glassesConsumed = Math.floor(todayData.total / this.STANDARD_GLASS);

      // Save to Supabase
      await supabase.from('wellness_water').upsert(
        {
          userId,
          date: today,
          entries: todayData.entries,
          total: todayData.total,
          goal: todayData.goal,
        },
        { onConflict: 'userId,date' }
      );

      // Save locally
      await this.saveWaterDataLocally(todayData);

      // Check if goal reached and send celebration notification
      if (
        todayData.total >= todayData.goal &&
        todayData.total - entry.amount < todayData.goal
      ) {
        await this.sendGoalReachedNotification();
      }

      return todayData;
    } catch (error) {
      console.error('Error adding water:', error);
      throw error;
    }
  }

  /**
   * Get today's water intake
   */
  static async getTodayWater(userId: string): Promise<DailyWaterData> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Try Supabase first
      const { data } = await supabase
        .from('wellness_water')
        .select('*')
        .eq('userId', userId)
        .eq('date', today)
        .single();

      if (data) {
        return {
          date: data.date,
          entries: data.entries || [],
          total: data.total || 0,
          goal: data.goal || this.DEFAULT_GOAL,
          glassesConsumed: Math.floor((data.total || 0) / this.STANDARD_GLASS),
          glassesGoal: Math.ceil((data.goal || this.DEFAULT_GOAL) / this.STANDARD_GLASS),
        };
      }

      // Return empty for today
      const goal = await this.getWaterGoal(userId);
      return {
        date: today,
        entries: [],
        total: 0,
        goal,
        glassesConsumed: 0,
        glassesGoal: Math.ceil(goal / this.STANDARD_GLASS),
      };
    } catch (error) {
      console.error('Error getting today water:', error);
      const goal = await this.getWaterGoal(userId);
      return {
        date: new Date().toISOString().split('T')[0],
        entries: [],
        total: 0,
        goal,
        glassesConsumed: 0,
        glassesGoal: Math.ceil(goal / this.STANDARD_GLASS),
      };
    }
  }

  /**
   * Get water history for date range
   */
  static async getWaterHistory(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailyWaterData[]> {
    try {
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];

      const { data } = await supabase
        .from('wellness_water')
        .select('*')
        .eq('userId', userId)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true });

      return (
        data?.map((d) => ({
          date: d.date,
          entries: d.entries || [],
          total: d.total || 0,
          goal: d.goal || this.DEFAULT_GOAL,
          glassesConsumed: Math.floor((d.total || 0) / this.STANDARD_GLASS),
          glassesGoal: Math.ceil((d.goal || this.DEFAULT_GOAL) / this.STANDARD_GLASS),
        })) || []
      );
    } catch (error) {
      console.error('Error getting water history:', error);
      return [];
    }
  }

  /**
   * Get water trends
   */
  static async getWaterTrends(userId: string): Promise<WaterTrend> {
    try {
      const today = new Date();
      const last30Days = new Date(today);
      last30Days.setDate(last30Days.getDate() - 30);

      const history = await this.getWaterHistory(userId, last30Days, today);

      const last7Days = history.slice(-7);
      const weeklyAverage =
        last7Days.length > 0
          ? last7Days.reduce((sum, d) => sum + d.total, 0) / last7Days.length
          : 0;

      const monthlyAverage =
        history.length > 0 ? history.reduce((sum, d) => sum + d.total, 0) / history.length : 0;

      // Calculate streak (consecutive days of meeting goal)
      let streak = 0;
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].total >= history[i].goal) {
          streak++;
        } else {
          break;
        }
      }

      return {
        daily: last7Days,
        weeklyAverage: Math.round(weeklyAverage),
        monthlyAverage: Math.round(monthlyAverage),
        streak,
      };
    } catch (error) {
      console.error('Error getting water trends:', error);
      return {
        daily: [],
        weeklyAverage: 0,
        monthlyAverage: 0,
        streak: 0,
      };
    }
  }

  /**
   * Set water goal
   */
  static async setWaterGoal(userId: string, goalMl: number): Promise<void> {
    try {
      await AsyncStorage.setItem(`water_goal_${userId}`, goalMl.toString());

      await supabase
        .from('user_preferences')
        .upsert({ userId, waterGoal: goalMl }, { onConflict: 'userId' });
    } catch (error) {
      console.error('Error setting water goal:', error);
    }
  }

  /**
   * Get water goal
   */
  static async getWaterGoal(userId: string): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem(`water_goal_${userId}`);
      if (stored) {
        return parseInt(stored, 10);
      }

      const { data } = await supabase
        .from('user_preferences')
        .select('waterGoal')
        .eq('userId', userId)
        .single();

      return data?.waterGoal || this.DEFAULT_GOAL;
    } catch (error) {
      console.error('Error getting water goal:', error);
      return this.DEFAULT_GOAL;
    }
  }

  /**
   * Calculate progress percentage
   */
  static calculateProgress(total: number, goal: number): number {
    return Math.min((total / goal) * 100, 100);
  }

  /**
   * Get motivational message
   */
  static getMotivationalMessage(glassesConsumed: number, glassesGoal: number): string {
    const progress = (glassesConsumed / glassesGoal) * 100;

    if (progress >= 100) {
      return '🎉 Goal reached! Stay hydrated!';
    } else if (progress >= 75) {
      return '💧 Almost there! One more glass!';
    } else if (progress >= 50) {
      return '💪 Halfway! Keep it up!';
    } else if (progress >= 25) {
      return '🌊 Good start! Drink more water!';
    } else {
      return '💦 Time to hydrate!';
    }
  }

  /**
   * Schedule hydration reminders
   */
  static async scheduleHydrationReminders(userId: string, enabled: boolean): Promise<void> {
    try {
      if (!enabled) {
        await Notifications.cancelAllScheduledNotificationsAsync();
        return;
      }

      // Schedule reminders every 2 hours during waking hours (8 AM - 10 PM)
      const times = ['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

      for (const time of times) {
        const [hours, minutes] = time.split(':').map(Number);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: '💧 Hydration Reminder',
            body: 'Time to drink some water!',
            sound: 'default',
            data: { type: 'hydration' },
          },
          trigger: {
            hour: hours,
            minute: minutes,
            repeats: true,
          },
        });
      }

      await AsyncStorage.setItem(`water_reminders_${userId}`, 'enabled');
    } catch (error) {
      console.error('Error scheduling hydration reminders:', error);
    }
  }

  /**
   * Check if hydration reminders are enabled
   */
  static async areRemindersEnabled(userId: string): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(`water_reminders_${userId}`);
      return stored === 'enabled';
    } catch (error) {
      return false;
    }
  }

  /**
   * Send goal reached notification
   */
  private static async sendGoalReachedNotification(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Hydration Goal Reached!',
          body: 'Great job staying hydrated today!',
          sound: 'default',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending goal reached notification:', error);
    }
  }

  /**
   * Save water data locally
   */
  private static async saveWaterDataLocally(data: DailyWaterData): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      const history: DailyWaterData[] = stored ? JSON.parse(stored) : [];

      const index = history.findIndex((d) => d.date === data.date);
      if (index >= 0) {
        history[index] = data;
      } else {
        history.push(data);
      }

      // Keep last 30 days
      const last30Days = history.slice(-30);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(last30Days));
    } catch (error) {
      console.error('Error saving water data locally:', error);
    }
  }

  /**
   * Get quick add amounts
   */
  static getQuickAddAmounts(): Array<{ label: string; amount: number; glasses: number }> {
    return [
      { label: 'Glass', amount: 250, glasses: 1 },
      { label: 'Bottle', amount: 500, glasses: 2 },
      { label: 'Large', amount: 750, glasses: 3 },
    ];
  }
}
