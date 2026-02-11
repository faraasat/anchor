// Anchor Points Service - NFC & Bluetooth trigger management
// Phase 1: Physical-world awareness for premium UX
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import type { Reminder } from '@/types/reminder';

// NFC Tag structure
export interface NFCTag {
  id: string;
  name: string;
  uid: string; // NFC unique identifier
  action: 'trigger' | 'open_stack' | 'complete';
  reminderId?: string;
  stackName?: string;
  createdAt: string;
  lastTriggered?: string;
}

// Bluetooth Anchor structure
export interface BluetoothAnchor {
  id: string;
  name: string;
  deviceId: string; // Bluetooth device MAC address
  deviceName: string;
  action: 'connect' | 'disconnect';
  triggerType: 'open_stack' | 'trigger_reminder';
  stackName?: string;
  reminderId?: string;
  createdAt: string;
  lastTriggered?: string;
}

// Anchor Point - unified interface for both NFC and Bluetooth
export interface AnchorPoint {
  id: string;
  name: string;
  type: 'nfc' | 'bluetooth';
  icon: string;
  description?: string;
  enabled: boolean;

  // NFC specific
  nfcUid?: string;

  // Bluetooth specific
  bluetoothDeviceId?: string;
  bluetoothDeviceName?: string;

  // Action configuration
  actionType: 'trigger_reminder' | 'open_stack' | 'complete_task' | 'notification';
  targetReminderId?: string;
  targetStackName?: string;
  notificationMessage?: string;

  // Metadata
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

const STORAGE_KEY = '@anchor_points';
const DB_TABLE = 'anchor_points';

export class AnchorPointsService {
  private static isNFCAvailable = false;
  private static isBluetoothAvailable = false;
  private static listeners: ((point: AnchorPoint) => void)[] = [];

  // Initialize hardware availability checks
  static async initialize(): Promise<void> {
    // Check NFC availability
    if (Platform.OS !== 'web') {
      // NFC check would go here (requires native module)
      // For now, assume available on iOS (iPhone XS and later)
      this.isNFCAvailable = Platform.OS === 'ios' && Platform.Version >= '12';

      // Bluetooth is generally available
      this.isBluetoothAvailable = true;
    }
  }

  // Get all anchor points
  static async getAll(userId: string): Promise<AnchorPoint[]> {
    try {
      // Try database first
      const { data, error } = await supabase
        .from(DB_TABLE)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        return data.map((item: any) => this.deserializeAnchorPoint(item));
      }

      // Fallback to local storage
      const stored = await AsyncStorage.getItem(`${STORAGE_KEY}_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting anchor points:', error);
      // Fallback to local storage
      const stored = await AsyncStorage.getItem(`${STORAGE_KEY}_${userId}`);
      return stored ? JSON.parse(stored) : [];
    }
  }

  // Create new anchor point
  static async create(userId: string, point: Omit<AnchorPoint, 'id' | 'createdAt' | 'triggerCount'>): Promise<AnchorPoint> {
    const newPoint: AnchorPoint = {
      ...point,
      id: `anchor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      triggerCount: 0,
    };

    try {
      // Save to database
      const { error } = await supabase
        .from(DB_TABLE)
        .insert([this.serializeAnchorPoint(newPoint, userId)]);

      if (error) throw error;

      // Also save to local storage as backup
      const points = await this.getAll(userId);
      points.unshift(newPoint);
      await AsyncStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(points));

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      return newPoint;
    } catch (error) {
      console.error('Error creating anchor point:', error);

      // Fallback to local storage only
      const points = await this.getAll(userId);
      points.unshift(newPoint);
      await AsyncStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(points));

      return newPoint;
    }
  }

  // Update anchor point
  static async update(userId: string, id: string, updates: Partial<AnchorPoint>): Promise<void> {
    try {
      // Update in database
      const { error } = await supabase
        .from(DB_TABLE)
        .update(this.serializeAnchorPoint(updates as AnchorPoint, userId))
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      // Update local storage
      const points = await this.getAll(userId);
      const index = points.findIndex((p) => p.id === id);
      if (index !== -1) {
        points[index] = { ...points[index], ...updates };
        await AsyncStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(points));
      }
    } catch (error) {
      console.error('Error updating anchor point:', error);

      // Fallback to local storage
      const points = await this.getAll(userId);
      const index = points.findIndex((p) => p.id === id);
      if (index !== -1) {
        points[index] = { ...points[index], ...updates };
        await AsyncStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(points));
      }
    }
  }

  // Delete anchor point
  static async delete(userId: string, id: string): Promise<void> {
    try {
      // Delete from database
      const { error } = await supabase
        .from(DB_TABLE)
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      // Delete from local storage
      const points = await this.getAll(userId);
      const filtered = points.filter((p) => p.id !== id);
      await AsyncStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(filtered));

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error deleting anchor point:', error);

      // Fallback to local storage
      const points = await this.getAll(userId);
      const filtered = points.filter((p) => p.id !== id);
      await AsyncStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(filtered));
    }
  }

  // Trigger an anchor point (when NFC tag is scanned or Bluetooth connects)
  static async trigger(userId: string, pointId: string): Promise<void> {
    const points = await this.getAll(userId);
    const point = points.find((p) => p.id === pointId);

    if (!point || !point.enabled) {
      console.warn('Anchor point not found or disabled:', pointId);
      return;
    }

    // Update trigger metadata
    await this.update(userId, pointId, {
      lastTriggered: new Date().toISOString(),
      triggerCount: point.triggerCount + 1,
    });

    // Notify listeners
    this.notifyListeners(point);

    // Haptic feedback
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Execute action based on type
    switch (point.actionType) {
      case 'notification':
        Alert.alert('Anchor Point Triggered', point.notificationMessage || `${point.name} activated`);
        break;
      case 'trigger_reminder':
        // This would integrate with ReminderService to trigger notification
        console.log('Trigger reminder:', point.targetReminderId);
        break;
      case 'open_stack':
        // This would navigate to the stack view
        console.log('Open stack:', point.targetStackName);
        break;
      case 'complete_task':
        // This would mark the reminder as complete
        console.log('Complete task:', point.targetReminderId);
        break;
    }
  }

  // Check NFC availability
  static async isNFCSupported(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    // This would integrate with expo-nfc or react-native-nfc-manager
    // For now, return true on iOS 13+ and Android 4.4+
    if (Platform.OS === 'ios') {
      return parseFloat(Platform.Version as string) >= 13;
    }
    return Platform.OS === 'android'; // Most modern Android devices support NFC
  }

  // Check Bluetooth availability
  static async isBluetoothSupported(): Promise<boolean> {
    return Platform.OS !== 'web';
  }

  // Scan NFC tag
  static async scanNFCTag(): Promise<{ uid: string; data?: string } | null> {
    if (!(await this.isNFCSupported())) {
      Alert.alert('NFC Not Available', 'NFC is not supported on this device');
      return null;
    }

    // This would integrate with NFC scanning library
    // For now, return a mock result
    if (Platform.OS !== 'web') {
      Alert.alert('NFC Scan', 'Hold your phone near the NFC tag');
    }

    return {
      uid: `nfc_${Date.now()}`,
      data: 'mock_nfc_data',
    };
  }

  // Scan for Bluetooth devices
  static async scanBluetoothDevices(): Promise<Array<{ id: string; name: string; rssi: number }>> {
    if (!(await this.isBluetoothSupported())) {
      Alert.alert('Bluetooth Not Available', 'Bluetooth is not supported on this device');
      return [];
    }

    // This would integrate with BLE scanning library
    // For now, return mock devices
    return [
      { id: 'device_1', name: 'Car Audio', rssi: -45 },
      { id: 'device_2', name: 'Desk Speaker', rssi: -60 },
      { id: 'device_3', name: 'Smart Watch', rssi: -38 },
    ];
  }

  // Add listener for anchor point triggers
  static addListener(listener: (point: AnchorPoint) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  // Notify all listeners
  private static notifyListeners(point: AnchorPoint): void {
    this.listeners.forEach((listener) => listener(point));
  }

  // Serialize for database
  private static serializeAnchorPoint(point: AnchorPoint, userId: string): any {
    return {
      id: point.id,
      user_id: userId,
      name: point.name,
      type: point.type,
      icon: point.icon,
      description: point.description,
      enabled: point.enabled,
      nfc_uid: point.nfcUid,
      bluetooth_device_id: point.bluetoothDeviceId,
      bluetooth_device_name: point.bluetoothDeviceName,
      action_type: point.actionType,
      target_reminder_id: point.targetReminderId,
      target_stack_name: point.targetStackName,
      notification_message: point.notificationMessage,
      created_at: point.createdAt,
      last_triggered: point.lastTriggered,
      trigger_count: point.triggerCount,
    };
  }

  // Deserialize from database
  private static deserializeAnchorPoint(data: any): AnchorPoint {
    return {
      id: data.id,
      name: data.name,
      type: data.type,
      icon: data.icon,
      description: data.description,
      enabled: data.enabled,
      nfcUid: data.nfc_uid,
      bluetoothDeviceId: data.bluetooth_device_id,
      bluetoothDeviceName: data.bluetooth_device_name,
      actionType: data.action_type,
      targetReminderId: data.target_reminder_id,
      targetStackName: data.target_stack_name,
      notificationMessage: data.notification_message,
      createdAt: data.created_at,
      lastTriggered: data.last_triggered,
      triggerCount: data.trigger_count || 0,
    };
  }

  // Get anchor points by type
  static async getByType(userId: string, type: 'nfc' | 'bluetooth'): Promise<AnchorPoint[]> {
    const points = await this.getAll(userId);
    return points.filter((p) => p.type === type);
  }

  // Get enabled anchor points
  static async getEnabled(userId: string): Promise<AnchorPoint[]> {
    const points = await this.getAll(userId);
    return points.filter((p) => p.enabled);
  }

  // Phase 6: Get nearest anchor point (simulated for now)
  static async getNearestAnchor(
    userId: string
  ): Promise<{
    name: string;
    type: 'wifi' | 'bluetooth' | 'nfc' | 'location';
    distance?: number;
    actionType: 'commute' | 'focus' | 'home' | 'office';
  } | null> {
    try {
      const points = await this.getEnabled(userId);
      if (points.length === 0) return null;

      // For now, return the first enabled anchor as "nearest"
      // In production, this would use actual location/proximity detection
      const nearest = points[0];

      // Map anchor point action to actionType
      const actionTypeMap: Record<string, 'commute' | 'focus' | 'home' | 'office'> = {
        trigger_commute: 'commute',
        trigger_focus: 'focus',
        trigger_home: 'home',
        trigger_office: 'office',
        trigger_reminder: 'home',
        open_stack: 'office',
      };

      return {
        name: nearest.name,
        type: nearest.type === 'bluetooth' ? 'bluetooth' : 'nfc',
        distance: Math.floor(Math.random() * 100) + 10, // Simulated distance
        actionType: actionTypeMap[nearest.actionType] || 'home',
      };
    } catch (err) {
      console.error('Error getting nearest anchor:', err);
      return null;
    }
  }
}
