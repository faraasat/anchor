// Phase 6: Widget Service for Home Screen Widgets
// Manages data for Daily Focus and Proximity widgets
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reminder } from '@/types/reminder';

const WIDGET_DATA_KEY = '@anchor_widget_data';

export interface WidgetData {
  dailyFocus: {
    currentTask: Reminder | null;
    completedToday: number;
    totalToday: number;
    lastUpdated: number;
  };
  proximity: {
    nearestAnchor: {
      name: string;
      type: 'wifi' | 'bluetooth' | 'nfc' | 'location';
      distance?: number; // in meters
      actionType: 'commute' | 'focus' | 'home' | 'office';
    } | null;
    relevantReminders: Reminder[];
    lastUpdated: number;
  };
}

class WidgetServiceClass {
  // Update Daily Focus widget data
  async updateDailyFocusWidget(data: WidgetData['dailyFocus']) {
    try {
      const widgetData = await this.getWidgetData();
      widgetData.dailyFocus = { ...data, lastUpdated: Date.now() };
      await this.saveWidgetData(widgetData);

      // Trigger native widget update (iOS/Android)
      if (typeof (global as any).updateWidget === 'function') {
        (global as any).updateWidget('dailyFocus', widgetData.dailyFocus);
      }
    } catch (err) {
      console.error('Failed to update Daily Focus widget:', err);
    }
  }

  // Update Proximity widget data
  async updateProximityWidget(data: WidgetData['proximity']) {
    try {
      const widgetData = await this.getWidgetData();
      widgetData.proximity = { ...data, lastUpdated: Date.now() };
      await this.saveWidgetData(widgetData);

      // Trigger native widget update (iOS/Android)
      if (typeof (global as any).updateWidget === 'function') {
        (global as any).updateWidget('proximity', widgetData.proximity);
      }
    } catch (err) {
      console.error('Failed to update Proximity widget:', err);
    }
  }

  // Get widget data
  async getWidgetData(): Promise<WidgetData> {
    try {
      const stored = await AsyncStorage.getItem(WIDGET_DATA_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.error('Failed to get widget data:', err);
    }

    // Return default data
    return {
      dailyFocus: {
        currentTask: null,
        completedToday: 0,
        totalToday: 0,
        lastUpdated: Date.now(),
      },
      proximity: {
        nearestAnchor: null,
        relevantReminders: [],
        lastUpdated: Date.now(),
      },
    };
  }

  // Save widget data
  private async saveWidgetData(data: WidgetData) {
    try {
      await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save widget data:', err);
    }
  }

  // Clear widget data
  async clearWidgetData() {
    try {
      await AsyncStorage.removeItem(WIDGET_DATA_KEY);
    } catch (err) {
      console.error('Failed to clear widget data:', err);
    }
  }
}

export const WidgetService = new WidgetServiceClass();
