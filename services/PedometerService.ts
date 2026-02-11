// Pedometer Service - Track daily steps and activity
import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export interface StepData {
  date: string;
  steps: number;
  goal: number;
  distance?: number; // meters
  calories?: number;
}

export interface StepTrend {
  daily: StepData[];
  weekly: number;
  monthly: number;
  averageDaily: number;
  bestDay: StepData | null;
}

export class PedometerService {
  private static readonly STORAGE_KEY = 'pedometer_data';
  private static readonly DEFAULT_GOAL = 10000;
  private static subscription: any = null;

  /**
   * Check if pedometer is available on device
   */
  static async isAvailable(): Promise<boolean> {
    try {
      return await Pedometer.isAvailableAsync();
    } catch (error) {
      console.error('Error checking pedometer availability:', error);
      return false;
    }
  }

  /**
   * Start tracking steps
   */
  static async startTracking(userId: string): Promise<void> {
    const available = await this.isAvailable();
    if (!available) {
      console.warn('Pedometer not available on this device');
      return;
    }

    // Stop existing subscription
    this.stopTracking();

    // Start new subscription
    this.subscription = Pedometer.watchStepCount((result) => {
      this.updateStepCount(userId, result.steps);
    });
  }

  /**
   * Stop tracking steps
   */
  static stopTracking(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }

  /**
   * Update step count for today
   */
  private static async updateStepCount(userId: string, steps: number): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const goal = await this.getStepGoal(userId);

      const stepData: StepData = {
        date: today,
        steps,
        goal,
        distance: steps * 0.762, // Average: 1 step = 0.762 meters
        calories: steps * 0.04, // Average: 1 step = 0.04 calories
      };

      // Save to Supabase
      await supabase.from('wellness_steps').upsert(
        {
          userId,
          date: today,
          steps,
          goal,
          distance: stepData.distance,
          calories: stepData.calories,
        },
        { onConflict: 'userId,date' }
      );

      // Also cache locally
      await this.saveStepDataLocally(stepData);
    } catch (error) {
      console.error('Error updating step count:', error);
    }
  }

  /**
   * Get today's step count
   */
  static async getTodaySteps(userId: string): Promise<StepData> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Try to get from Supabase first
      const { data } = await supabase
        .from('wellness_steps')
        .select('*')
        .eq('userId', userId)
        .eq('date', today)
        .single();

      if (data) {
        return {
          date: data.date,
          steps: data.steps,
          goal: data.goal,
          distance: data.distance,
          calories: data.calories,
        };
      }

      // If not in DB, try to get from device
      const available = await this.isAvailable();
      if (available) {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();

        const result = await Pedometer.getStepCountAsync(start, end);
        const goal = await this.getStepGoal(userId);

        return {
          date: today,
          steps: result.steps,
          goal,
          distance: result.steps * 0.762,
          calories: result.steps * 0.04,
        };
      }

      // Fallback to default
      const goal = await this.getStepGoal(userId);
      return { date: today, steps: 0, goal };
    } catch (error) {
      console.error('Error getting today steps:', error);
      const goal = await this.getStepGoal(userId);
      return { date: new Date().toISOString().split('T')[0], steps: 0, goal };
    }
  }

  /**
   * Get step history for date range
   */
  static async getStepHistory(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<StepData[]> {
    try {
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];

      const { data } = await supabase
        .from('wellness_steps')
        .select('*')
        .eq('userId', userId)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true });

      return (
        data?.map((d) => ({
          date: d.date,
          steps: d.steps,
          goal: d.goal,
          distance: d.distance,
          calories: d.calories,
        })) || []
      );
    } catch (error) {
      console.error('Error getting step history:', error);
      return [];
    }
  }

  /**
   * Get step trends (weekly, monthly averages)
   */
  static async getStepTrends(userId: string): Promise<StepTrend> {
    try {
      const today = new Date();
      const last30Days = new Date(today);
      last30Days.setDate(last30Days.getDate() - 30);

      const history = await this.getStepHistory(userId, last30Days, today);

      const last7Days = history.slice(-7);
      const weeklyTotal = last7Days.reduce((sum, d) => sum + d.steps, 0);
      const monthlyTotal = history.reduce((sum, d) => sum + d.steps, 0);
      const averageDaily = history.length > 0 ? monthlyTotal / history.length : 0;

      const bestDay =
        history.length > 0
          ? history.reduce((best, current) => (current.steps > best.steps ? current : best))
          : null;

      return {
        daily: last7Days,
        weekly: weeklyTotal,
        monthly: monthlyTotal,
        averageDaily: Math.round(averageDaily),
        bestDay,
      };
    } catch (error) {
      console.error('Error getting step trends:', error);
      return {
        daily: [],
        weekly: 0,
        monthly: 0,
        averageDaily: 0,
        bestDay: null,
      };
    }
  }

  /**
   * Set step goal
   */
  static async setStepGoal(userId: string, goal: number): Promise<void> {
    try {
      await AsyncStorage.setItem(`step_goal_${userId}`, goal.toString());

      // Also update in Supabase user preferences
      await supabase
        .from('user_preferences')
        .upsert({ userId, stepGoal: goal }, { onConflict: 'userId' });
    } catch (error) {
      console.error('Error setting step goal:', error);
    }
  }

  /**
   * Get step goal
   */
  static async getStepGoal(userId: string): Promise<number> {
    try {
      const stored = await AsyncStorage.getItem(`step_goal_${userId}`);
      if (stored) {
        return parseInt(stored, 10);
      }

      // Try from Supabase
      const { data } = await supabase
        .from('user_preferences')
        .select('stepGoal')
        .eq('userId', userId)
        .single();

      return data?.stepGoal || this.DEFAULT_GOAL;
    } catch (error) {
      console.error('Error getting step goal:', error);
      return this.DEFAULT_GOAL;
    }
  }

  /**
   * Calculate progress percentage
   */
  static calculateProgress(steps: number, goal: number): number {
    return Math.min((steps / goal) * 100, 100);
  }

  /**
   * Get motivational message based on progress
   */
  static getMotivationalMessage(steps: number, goal: number): string {
    const progress = this.calculateProgress(steps, goal);

    if (progress >= 100) {
      return '🎉 Goal crushed! Amazing work!';
    } else if (progress >= 80) {
      return '🔥 Almost there! Keep it up!';
    } else if (progress >= 50) {
      return '💪 Halfway there! You got this!';
    } else if (progress >= 25) {
      return '🚶 Good start! Keep moving!';
    } else {
      return '👟 Time to get moving!';
    }
  }

  /**
   * Save step data locally for offline access
   */
  private static async saveStepDataLocally(data: StepData): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      const history: StepData[] = stored ? JSON.parse(stored) : [];

      // Update or add today's data
      const index = history.findIndex((d) => d.date === data.date);
      if (index >= 0) {
        history[index] = data;
      } else {
        history.push(data);
      }

      // Keep last 30 days only
      const last30Days = history.slice(-30);
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(last30Days));
    } catch (error) {
      console.error('Error saving step data locally:', error);
    }
  }
}
