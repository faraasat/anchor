// Offline Sync Manager - Robust offline support with automatic sync queue
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { Alert } from 'react-native';

export interface QueuedOperation {
  id: string;
  operation: 'insert' | 'update' | 'delete';
  table: string;
  recordId?: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

const QUEUE_STORAGE_KEY = '@anchor_offline_queue';
const MAX_RETRY_COUNT = 3;
const SYNC_INTERVAL = 30000; // 30 seconds

export class OfflineSyncManager {
  private userId: string;
  private queue: QueuedOperation[] = [];
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private networkUnsubscribe: (() => void) | null = null;

  constructor(userId: string) {
    this.userId = userId;
    this.initialize();
  }

  // Initialize the sync manager
  private async initialize() {
    // Load queue from storage
    await this.loadQueue();

    // Listen for network changes
    this.networkUnsubscribe = NetInfo.addEventListener((state) => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected === true;

      // Trigger sync when coming back online
      if (!wasOnline && this.isOnline) {
        console.log('Network restored, syncing queue...');
        this.syncQueue();
      }
    });

    // Start periodic sync
    this.startPeriodicSync();

    // Initial sync
    if (this.isOnline) {
      this.syncQueue();
    }
  }

  // Load queue from AsyncStorage
  private async loadQueue() {
    try {
      const queueJson = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      if (queueJson) {
        this.queue = JSON.parse(queueJson);
        console.log(`Loaded ${this.queue.length} operations from queue`);
      }
    } catch (error) {
      console.error('Error loading queue:', error);
    }
  }

  // Save queue to AsyncStorage
  private async saveQueue() {
    try {
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Error saving queue:', error);
    }
  }

  // Add operation to queue
  async queueOperation(
    operation: 'insert' | 'update' | 'delete',
    table: string,
    data: any,
    recordId?: string
  ): Promise<string> {
    const queueItem: QueuedOperation = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation,
      table,
      recordId,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(queueItem);
    await this.saveQueue();

    // Try to sync immediately if online
    if (this.isOnline && !this.isSyncing) {
      this.syncQueue();
    }

    return queueItem.id;
  }

  // Sync queue with server
  async syncQueue(): Promise<number> {
    if (this.isSyncing || this.queue.length === 0) {
      return 0;
    }

    if (!this.isOnline) {
      console.log('Cannot sync: offline');
      return 0;
    }

    this.isSyncing = true;
    let syncedCount = 0;
    const failedItems: QueuedOperation[] = [];

    console.log(`Syncing ${this.queue.length} operations...`);

    for (const item of this.queue) {
      try {
        const success = await this.executeOperation(item);

        if (success) {
          syncedCount++;

          // Also save to offline_sync_queue table for tracking
          await supabase.from('offline_sync_queue').upsert({
            user_id: this.userId,
            operation: item.operation,
            table_name: item.table,
            record_id: item.recordId,
            data: item.data,
            created_at: new Date(item.timestamp).toISOString(),
            synced_at: new Date().toISOString(),
            retry_count: item.retryCount,
          });
        } else {
          item.retryCount++;
          if (item.retryCount < MAX_RETRY_COUNT) {
            failedItems.push(item);
          } else {
            console.error('Max retries exceeded for operation:', item);
          }
        }
      } catch (error) {
        console.error('Error executing operation:', error);
        item.retryCount++;
        if (item.retryCount < MAX_RETRY_COUNT) {
          failedItems.push(item);
        }
      }
    }

    // Update queue with failed items
    this.queue = failedItems;
    await this.saveQueue();

    this.isSyncing = false;

    if (syncedCount > 0) {
      console.log(`Successfully synced ${syncedCount} operations`);
    }

    if (failedItems.length > 0) {
      console.log(`${failedItems.length} operations still pending`);
    }

    return syncedCount;
  }

  // Execute a single operation
  private async executeOperation(item: QueuedOperation): Promise<boolean> {
    try {
      switch (item.operation) {
        case 'insert':
          const { error: insertError } = await supabase
            .from(item.table)
            .insert(item.data);
          return !insertError;

        case 'update':
          if (!item.recordId) return false;
          const { error: updateError } = await supabase
            .from(item.table)
            .update(item.data)
            .eq('id', item.recordId);
          return !updateError;

        case 'delete':
          if (!item.recordId) return false;
          const { error: deleteError } = await supabase
            .from(item.table)
            .delete()
            .eq('id', item.recordId);
          return !deleteError;

        default:
          return false;
      }
    } catch (error) {
      console.error('Error executing operation:', error);
      return false;
    }
  }

  // Start periodic sync
  private startPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.queue.length > 0) {
        this.syncQueue();
      }
    }, SYNC_INTERVAL);
  }

  // Stop periodic sync
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Get queue status
  getQueueStatus(): {
    count: number;
    isOnline: boolean;
    isSyncing: boolean;
  } {
    return {
      count: this.queue.length,
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
    };
  }

  // Clear queue (use with caution)
  async clearQueue() {
    this.queue = [];
    await this.saveQueue();
  }

  // Cleanup
  destroy() {
    this.stopPeriodicSync();
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
    }
  }

  // Check if network is available
  isNetworkAvailable(): boolean {
    return this.isOnline;
  }

  // Force sync now
  async forceSyncNow(): Promise<number> {
    if (!this.isOnline) {
      Alert.alert('Offline', 'Cannot sync while offline. Changes will sync automatically when connection is restored.');
      return 0;
    }

    return await this.syncQueue();
  }
}

// Singleton instance manager
let syncManagerInstance: OfflineSyncManager | null = null;

export const getOfflineSyncManager = (userId: string): OfflineSyncManager => {
  if (!syncManagerInstance || syncManagerInstance['userId'] !== userId) {
    if (syncManagerInstance) {
      syncManagerInstance.destroy();
    }
    syncManagerInstance = new OfflineSyncManager(userId);
  }
  return syncManagerInstance;
};

export const destroyOfflineSyncManager = () => {
  if (syncManagerInstance) {
    syncManagerInstance.destroy();
    syncManagerInstance = null;
  }
};

// Helper function to check if operation should be queued
export const shouldQueueOperation = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected !== true;
};
