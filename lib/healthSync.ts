// Health Data Sync Utility - Connect Apple Health and Google Fit for garden growth
import { Platform, Alert } from 'react-native';
import { supabase } from './supabase';

// Note: React Native doesn't have built-in health APIs
// For production, you would use:
// - react-native-health (iOS) or expo-health (when available)
// - react-native-google-fit (Android)
// This is a mock implementation showing the structure

export interface HealthData {
  date: Date;
  steps: number;
  sleepHours: number;
  activeMinutes: number;
  calories: number;
}

export class HealthSyncService {
  private userId: string;
  private isHealthKitAvailable: boolean = Platform.OS === 'ios';
  private isGoogleFitAvailable: boolean = Platform.OS === 'android';

  constructor(userId: string) {
    this.userId = userId;
  }

  // Request health permissions
  async requestPermissions(): Promise<boolean> {
    try {
      // In a real implementation, you would request permissions here
      // For iOS: HealthKit permissions
      // For Android: Google Fit permissions

      if (Platform.OS === 'ios') {
        // Mock: In production, use react-native-health
        // const permissions = {
        //   permissions: {
        //     read: ['Steps', 'SleepAnalysis', 'ActiveEnergyBurned'],
        //     write: []
        //   }
        // };
        // const authorized = await AppleHealthKit.initHealthKit(permissions);
        Alert.alert(
          'Health Integration',
          'Apple Health integration is available. In production, this would request HealthKit permissions.'
        );
        return true;
      } else if (Platform.OS === 'android') {
        // Mock: In production, use react-native-google-fit
        // const authorized = await GoogleFit.authorize();
        Alert.alert(
          'Health Integration',
          'Google Fit integration is available. In production, this would request Google Fit permissions.'
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error requesting health permissions:', error);
      return false;
    }
  }

  // Sync health data from device to Supabase
  async syncHealthData(): Promise<number> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return 0;

      // Get data for the last 7 days
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const healthRecords = await this.fetchHealthData(startDate, endDate);

      let syncedCount = 0;

      for (const record of healthRecords) {
        try {
          const dateStr = record.date.toISOString().split('T')[0];

          // Upsert health data
          const { error } = await supabase
            .from('health_data')
            .upsert({
              user_id: this.userId,
              date: dateStr,
              steps: record.steps,
              sleep_hours: record.sleepHours,
              active_minutes: record.activeMinutes,
              calories: record.calories,
              synced_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,date'
            });

          if (error) throw error;

          syncedCount++;
        } catch (error) {
          console.error('Error syncing health record:', error);
        }
      }

      // Update garden based on health data
      await this.updateGardenFromHealth();

      return syncedCount;
    } catch (error) {
      console.error('Error syncing health data:', error);
      Alert.alert('Sync Error', 'Failed to sync health data');
      return 0;
    }
  }

  // Fetch health data from device (mock implementation)
  private async fetchHealthData(startDate: Date, endDate: Date): Promise<HealthData[]> {
    // In production, this would fetch from HealthKit or Google Fit
    // For now, return mock data
    const records: HealthData[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      records.push({
        date: new Date(currentDate),
        steps: Math.floor(Math.random() * 5000) + 5000, // 5000-10000 steps
        sleepHours: Math.random() * 2 + 6, // 6-8 hours
        activeMinutes: Math.floor(Math.random() * 60) + 30, // 30-90 minutes
        calories: Math.floor(Math.random() * 1000) + 1500, // 1500-2500 calories
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return records;
  }

  // Get today's health summary
  async getTodayHealthSummary(): Promise<HealthData | null> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('health_data')
        .select('*')
        .eq('user_id', this.userId)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;

      if (!data) return null;

      return {
        date: new Date(data.date),
        steps: data.steps || 0,
        sleepHours: data.sleep_hours || 0,
        activeMinutes: data.active_minutes || 0,
        calories: data.calories || 0,
      };
    } catch (error) {
      console.error('Error getting today health summary:', error);
      return null;
    }
  }

  // Get health trend over period
  async getHealthTrend(days: number = 7): Promise<HealthData[]> {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const startDateStr = startDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('health_data')
        .select('*')
        .eq('user_id', this.userId)
        .gte('date', startDateStr)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) throw error;

      return (data || []).map(d => ({
        date: new Date(d.date),
        steps: d.steps || 0,
        sleepHours: d.sleep_hours || 0,
        activeMinutes: d.active_minutes || 0,
        calories: d.calories || 0,
      }));
    } catch (error) {
      console.error('Error getting health trend:', error);
      return [];
    }
  }

  // Update garden growth based on health data
  private async updateGardenFromHealth(): Promise<void> {
    try {
      const trend = await this.getHealthTrend(7);

      if (trend.length === 0) return;

      // Calculate health score (0-100)
      const avgSteps = trend.reduce((sum, d) => sum + d.steps, 0) / trend.length;
      const avgSleep = trend.reduce((sum, d) => sum + d.sleepHours, 0) / trend.length;
      const avgActive = trend.reduce((sum, d) => sum + d.activeMinutes, 0) / trend.length;

      // Normalize to 0-100 scale
      const stepsScore = Math.min((avgSteps / 10000) * 100, 100);
      const sleepScore = Math.min((avgSleep / 8) * 100, 100);
      const activeScore = Math.min((avgActive / 60) * 100, 100);

      const healthScore = (stepsScore + sleepScore + activeScore) / 3;

      // Update user's productivity stats with health bonus
      const today = new Date().toISOString().split('T')[0];

      const { data: existingStats } = await supabase
        .from('productivity_stats')
        .select('*')
        .eq('user_id', this.userId)
        .eq('date', today)
        .maybeSingle();

      if (existingStats) {
        // Apply health bonus to completion rate
        const healthBonus = healthScore * 0.1; // Up to 10% bonus
        const newRate = Math.min(
          (existingStats.completion_rate || 0) + healthBonus,
          100
        );

        await supabase
          .from('productivity_stats')
          .update({
            completion_rate: newRate,
          })
          .eq('id', existingStats.id);
      }
    } catch (error) {
      console.error('Error updating garden from health:', error);
    }
  }

  // Calculate health score for display
  calculateHealthScore(data: HealthData): number {
    const stepsScore = Math.min((data.steps / 10000) * 100, 100);
    const sleepScore = Math.min((data.sleepHours / 8) * 100, 100);
    const activeScore = Math.min((data.activeMinutes / 60) * 100, 100);

    return (stepsScore + sleepScore + activeScore) / 3;
  }

  // Get recommended activity based on current data
  async getActivityRecommendation(): Promise<string> {
    const today = await this.getTodayHealthSummary();

    if (!today) {
      return "Start your day with a short walk!";
    }

    if (today.steps < 3000) {
      return "Take a 10-minute walk to boost your energy";
    }

    if (today.activeMinutes < 20) {
      return "Add 15 minutes of light exercise";
    }

    if (today.steps > 8000 && today.activeMinutes > 45) {
      return "Great activity today! Consider some stretching";
    }

    return "You're on track! Keep up the momentum";
  }
}

// Export singleton-like function
export const getHealthSyncService = (userId: string) => {
  return new HealthSyncService(userId);
};

// Mock HealthKit/Google Fit data structures for reference
export interface HealthKitSteps {
  value: number;
  startDate: string;
  endDate: string;
}

export interface GoogleFitActivity {
  steps: number;
  calories: number;
  distance: number;
  start: number;
  end: number;
}
