// Phase 6: Optimistic UI Service
// Instant UI updates with background sync for buttery-smooth UX
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReminderService } from './ReminderService';
import { Reminder } from '@/types/reminder';

interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'complete';
  timestamp: number;
  data: any;
  retryCount: number;
}

const PENDING_OPS_KEY = '@anchor_pending_ops';
const MAX_RETRIES = 3;

class OptimisticUIServiceClass {
  private pendingOperations: Map<string, PendingOperation> = new Map();
  private processingQueue = false;

  // Initialize service and load pending operations
  async initialize() {
    try {
      const stored = await AsyncStorage.getItem(PENDING_OPS_KEY);
      if (stored) {
        const ops: PendingOperation[] = JSON.parse(stored);
        ops.forEach((op) => this.pendingOperations.set(op.id, op));
      }
      // Process any pending operations
      await this.processQueue();
    } catch (err) {
      console.error('Failed to initialize OptimisticUIService:', err);
    }
  }

  // Save pending operations to storage
  private async savePendingOperations() {
    try {
      const ops = Array.from(this.pendingOperations.values());
      await AsyncStorage.setItem(PENDING_OPS_KEY, JSON.stringify(ops));
    } catch (err) {
      console.error('Failed to save pending operations:', err);
    }
  }

  // Add operation to pending queue
  private async addPendingOperation(op: PendingOperation) {
    this.pendingOperations.set(op.id, op);
    await this.savePendingOperations();
    // Start processing queue
    this.processQueue();
  }

  // Process pending operations queue
  private async processQueue() {
    if (this.processingQueue || this.pendingOperations.size === 0) return;

    this.processingQueue = true;

    try {
      const ops = Array.from(this.pendingOperations.values()).sort(
        (a, b) => a.timestamp - b.timestamp
      );

      for (const op of ops) {
        try {
          await this.executeOperation(op);
          this.pendingOperations.delete(op.id);
        } catch (err) {
          console.error(`Failed to execute operation ${op.id}:`, err);

          // Retry logic
          if (op.retryCount < MAX_RETRIES) {
            op.retryCount++;
            this.pendingOperations.set(op.id, op);
          } else {
            // Max retries reached, remove operation
            console.error(`Max retries reached for operation ${op.id}, removing`);
            this.pendingOperations.delete(op.id);
          }
        }
      }

      await this.savePendingOperations();
    } finally {
      this.processingQueue = false;

      // If there are still pending operations, retry after delay
      if (this.pendingOperations.size > 0) {
        setTimeout(() => this.processQueue(), 5000);
      }
    }
  }

  // Execute a single operation
  private async executeOperation(op: PendingOperation) {
    switch (op.type) {
      case 'create':
        await ReminderService.create(op.data.userId, op.data.reminder);
        break;
      case 'update':
        await ReminderService.update(op.data.id, op.data.updates);
        break;
      case 'delete':
        await ReminderService.delete(op.data.id);
        break;
      case 'complete':
        await ReminderService.markComplete(op.data.id);
        break;
      default:
        throw new Error(`Unknown operation type: ${op.type}`);
    }
  }

  // Optimistic create reminder
  async createReminder(userId: string, reminder: Reminder): Promise<Reminder> {
    const optimisticReminder = { ...reminder };

    // Add to pending operations
    await this.addPendingOperation({
      id: `create_${reminder.id}`,
      type: 'create',
      timestamp: Date.now(),
      data: { userId, reminder },
      retryCount: 0,
    });

    return optimisticReminder;
  }

  // Optimistic update reminder
  async updateReminder(id: string, updates: Partial<Reminder>): Promise<void> {
    await this.addPendingOperation({
      id: `update_${id}_${Date.now()}`,
      type: 'update',
      timestamp: Date.now(),
      data: { id, updates },
      retryCount: 0,
    });
  }

  // Optimistic delete reminder
  async deleteReminder(id: string): Promise<void> {
    await this.addPendingOperation({
      id: `delete_${id}`,
      type: 'delete',
      timestamp: Date.now(),
      data: { id },
      retryCount: 0,
    });
  }

  // Optimistic complete reminder
  async completeReminder(id: string): Promise<void> {
    await this.addPendingOperation({
      id: `complete_${id}`,
      type: 'complete',
      timestamp: Date.now(),
      data: { id },
      retryCount: 0,
    });
  }

  // Check if operation is pending
  isPending(operationId: string): boolean {
    return this.pendingOperations.has(operationId);
  }

  // Get pending operations count
  getPendingCount(): number {
    return this.pendingOperations.size;
  }

  // Clear all pending operations (use with caution)
  async clearPendingOperations() {
    this.pendingOperations.clear();
    await AsyncStorage.removeItem(PENDING_OPS_KEY);
  }
}

export const OptimisticUIService = new OptimisticUIServiceClass();
