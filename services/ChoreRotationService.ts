// Chore Rotation Service - Automated task assignment cycling
import { supabase } from '@/lib/supabase';
import type { ChoreRotation } from '@/types/phase8';
import { ReminderService } from './ReminderService';

export class ChoreRotationService {
  /**
   * Create a new chore rotation
   */
  static async createRotation(
    circleId: string,
    name: string,
    choreIds: string[],
    memberIds: string[],
    rotationType: ChoreRotation['rotationType'],
    rotationDay?: number
  ): Promise<ChoreRotation> {
    const rotation: ChoreRotation = {
      id: Math.random().toString(36).substring(7),
      circleId,
      name,
      choreIds,
      memberIds,
      currentIndex: 0,
      rotationType,
      rotationDay,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store in Supabase (you'll need to create this table)
    const { error } = await supabase.from('chore_rotations').insert(rotation);

    if (error) throw error;

    // Assign first chore
    await this.assignCurrentChore(rotation);

    return rotation;
  }

  /**
   * Get all rotations for a circle
   */
  static async getCircleRotations(circleId: string): Promise<ChoreRotation[]> {
    const { data, error } = await supabase
      .from('chore_rotations')
      .select('*')
      .eq('circleId', circleId);

    if (error) throw error;

    return data || [];
  }

  /**
   * Rotate to next member
   */
  static async rotateNext(rotationId: string): Promise<void> {
    const { data: rotation, error } = await supabase
      .from('chore_rotations')
      .select('*')
      .eq('id', rotationId)
      .single();

    if (error) throw error;
    if (!rotation) return;

    const nextIndex = (rotation.currentIndex + 1) % rotation.memberIds.length;

    await supabase
      .from('chore_rotations')
      .update({
        currentIndex: nextIndex,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', rotationId);

    // Reassign chore to next member
    await this.assignCurrentChore({ ...rotation, currentIndex: nextIndex });
  }

  /**
   * Assign chore to current member
   */
  private static async assignCurrentChore(rotation: ChoreRotation): Promise<void> {
    const currentUserId = rotation.memberIds[rotation.currentIndex];

    // Update all chores in rotation to be assigned to current user
    for (const choreId of rotation.choreIds) {
      await ReminderService.update(choreId, {
        assignedTo: currentUserId,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  /**
   * Check if rotation should trigger (based on rotation type)
   */
  static async checkAndRotate(): Promise<void> {
    const { data: rotations, error } = await supabase
      .from('chore_rotations')
      .select('*');

    if (error || !rotations) return;

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0-6
    const dayOfMonth = now.getDate();

    for (const rotation of rotations) {
      let shouldRotate = false;

      switch (rotation.rotationType) {
        case 'daily':
          // Check if last rotation was yesterday
          const lastUpdate = new Date(rotation.updatedAt);
          const daysSinceUpdate = Math.floor(
            (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24)
          );
          shouldRotate = daysSinceUpdate >= 1;
          break;

        case 'weekly':
          // Rotate on specific day of week
          shouldRotate = dayOfWeek === (rotation.rotationDay || 0);
          break;

        case 'completion':
          // Rotation triggered manually on chore completion
          shouldRotate = false;
          break;

        default:
          shouldRotate = false;
      }

      if (shouldRotate) {
        await this.rotateNext(rotation.id);
      }
    }
  }

  /**
   * Trigger rotation on chore completion
   */
  static async onChoreComplete(choreId: string): Promise<void> {
    // Find rotation containing this chore
    const { data: rotations, error } = await supabase
      .from('chore_rotations')
      .select('*')
      .contains('choreIds', [choreId]);

    if (error || !rotations || rotations.length === 0) return;

    for (const rotation of rotations) {
      if (rotation.rotationType === 'completion') {
        await this.rotateNext(rotation.id);
      }
    }
  }

  /**
   * Get current assignee for a rotation
   */
  static getCurrentAssignee(rotation: ChoreRotation): string {
    return rotation.memberIds[rotation.currentIndex];
  }

  /**
   * Add member to rotation
   */
  static async addMember(rotationId: string, userId: string): Promise<void> {
    const { data: rotation, error } = await supabase
      .from('chore_rotations')
      .select('*')
      .eq('id', rotationId)
      .single();

    if (error) throw error;
    if (!rotation) return;

    const updatedMembers = [...rotation.memberIds, userId];

    await supabase
      .from('chore_rotations')
      .update({
        memberIds: updatedMembers,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', rotationId);
  }

  /**
   * Remove member from rotation
   */
  static async removeMember(rotationId: string, userId: string): Promise<void> {
    const { data: rotation, error } = await supabase
      .from('chore_rotations')
      .select('*')
      .eq('id', rotationId)
      .single();

    if (error) throw error;
    if (!rotation) return;

    const updatedMembers = rotation.memberIds.filter((id) => id !== userId);

    // Adjust current index if needed
    let newCurrentIndex = rotation.currentIndex;
    if (rotation.currentIndex >= updatedMembers.length) {
      newCurrentIndex = 0;
    }

    await supabase
      .from('chore_rotations')
      .update({
        memberIds: updatedMembers,
        currentIndex: newCurrentIndex,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', rotationId);
  }
}
