// Demo Mode Management
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReminderStorage } from './storage';
import { DEMO_REMINDERS, DEMO_INSIGHTS, DEMO_WELLNESS } from './demoData';

const DEMO_MODE_KEY = '@anchor_demo_mode';

export const DemoMode = {
  async isEnabled(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(DEMO_MODE_KEY);
      return value === 'true';
    } catch (error) {
      console.error('Error checking demo mode:', error);
      return false;
    }
  },

  async enable(): Promise<void> {
    try {
      await AsyncStorage.setItem(DEMO_MODE_KEY, 'true');
      await this.loadDemoData();
    } catch (error) {
      console.error('Error enabling demo mode:', error);
    }
  },

  async disable(): Promise<void> {
    try {
      await AsyncStorage.setItem(DEMO_MODE_KEY, 'false');
      // Optionally clear demo data
    } catch (error) {
      console.error('Error disabling demo mode:', error);
    }
  },

  async toggle(): Promise<boolean> {
    const isEnabled = await this.isEnabled();
    if (isEnabled) {
      await this.disable();
    } else {
      await this.enable();
    }
    return !isEnabled;
  },

  async loadDemoData(): Promise<void> {
    try {
      // Load demo reminders
      await ReminderStorage.save(DEMO_REMINDERS);

      // Store demo insights and wellness data
      await AsyncStorage.setItem('@anchor_demo_insights', JSON.stringify(DEMO_INSIGHTS));
      await AsyncStorage.setItem('@anchor_demo_wellness', JSON.stringify(DEMO_WELLNESS));

      console.log('Demo data loaded successfully');
    } catch (error) {
      console.error('Error loading demo data:', error);
    }
  },

  async getDemoInsights() {
    try {
      const data = await AsyncStorage.getItem('@anchor_demo_insights');
      return data ? JSON.parse(data) : DEMO_INSIGHTS;
    } catch (error) {
      console.error('Error getting demo insights:', error);
      return DEMO_INSIGHTS;
    }
  },

  async getDemoWellness() {
    try {
      const data = await AsyncStorage.getItem('@anchor_demo_wellness');
      return data ? JSON.parse(data) : DEMO_WELLNESS;
    } catch (error) {
      console.error('Error getting demo wellness:', error);
      return DEMO_WELLNESS;
    }
  },

  async updateWellness(updates: Partial<typeof DEMO_WELLNESS>) {
    try {
      const current = await this.getDemoWellness();
      const updated = { ...current, ...updates };
      await AsyncStorage.setItem('@anchor_demo_wellness', JSON.stringify(updated));
      return updated;
    } catch (error) {
      console.error('Error updating wellness data:', error);
      return DEMO_WELLNESS;
    }
  },
};
