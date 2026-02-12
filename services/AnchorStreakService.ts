// Anchor Streak Service - Gamification and Rewards
import { supabase } from '@/lib/supabase';
import type { AnchorStreak, PremiumReward } from '@/types/phase8';
import type { Reminder } from '@/types/reminder';

export class AnchorStreakService {
  /**
   * Map DB row (snake_case) to AnchorStreak (camelCase)
   */
  private static mapFromDb(row: any): AnchorStreak {
    return {
      userId: row.user_id,
      currentStreak: row.current_streak,
      longestStreak: row.longest_streak,
      streakStartDate: row.streak_start_date,
      lastCompletionDate: row.last_completion_date,
      totalCompletions: row.total_completions,
      unlockedRewards: row.unlocked_rewards,
      nextMilestone: {
        days: row.next_milestone_days || 7,
        reward: row.next_milestone_reward || 'bronze-badge',
      },
    };
  }

  /**
   * Map AnchorStreak (camelCase) to DB row (snake_case)
   */
  private static mapToDb(streak: AnchorStreak): any {
    return {
      user_id: streak.userId,
      current_streak: streak.currentStreak,
      longest_streak: streak.longestStreak,
      streak_start_date: streak.streakStartDate,
      last_completion_date: streak.lastCompletionDate,
      total_completions: streak.totalCompletions,
      unlocked_rewards: streak.unlockedRewards,
      next_milestone_days: streak.nextMilestone?.days,
      next_milestone_reward: streak.nextMilestone?.reward,
    };
  }

  /**
   * Get user's current streak
   */
  static async getStreak(userId: string): Promise<AnchorStreak> {
    const { data, error } = await supabase
      .from('anchor_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      // Initialize new streak
      return await this.initializeStreak(userId);
    }

    return this.mapFromDb(data);
  }

  /**
   * Initialize a new streak for user
   */
  private static async initializeStreak(
    userId: string
  ): Promise<AnchorStreak> {
    const newStreak: AnchorStreak = {
      userId,
      currentStreak: 0,
      longestStreak: 0,
      streakStartDate: new Date().toISOString(),
      lastCompletionDate: '',
      totalCompletions: 0,
      unlockedRewards: [],
      nextMilestone: {
        days: 7,
        reward: 'bronze-badge',
      },
    };

    // Ensure profile exists before creating streak
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!profile) {
      console.warn('Profile not found for user, cannot create streak');
      return newStreak;
    }

    const { error } = await supabase
      .from('anchor_streaks')
      .insert(this.mapToDb(newStreak));

    if (error) console.error('Error initializing streak:', error);

    return newStreak;
  }

  /**
   * Update streak on task completion
   */
  static async updateStreak(
    userId: string,
    completedDate: string
  ): Promise<AnchorStreak> {
    const streak = await this.getStreak(userId);
    const today = new Date(completedDate).toISOString().split('T')[0];
    const lastDate = streak.lastCompletionDate
      ? new Date(streak.lastCompletionDate).toISOString().split('T')[0]
      : '';

    // Check if this is a new day
    if (today === lastDate) {
      // Same day, no streak update
      return streak;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let newStreak = streak.currentStreak;
    let newStartDate = streak.streakStartDate;

    if (lastDate === yesterdayStr || lastDate === '') {
      // Continuing streak or first completion
      newStreak += 1;
    } else {
      // Streak broken, start new
      newStreak = 1;
      newStartDate = today;
    }

    const newLongestStreak = Math.max(newStreak, streak.longestStreak);

    // Check for milestone rewards
    const newRewards = await this.checkMilestones(
      newStreak,
      streak.unlockedRewards
    );

    // Calculate next milestone
    const nextMilestone = this.getNextMilestone(newStreak, newRewards);

    const updatedStreak: AnchorStreak = {
      ...streak,
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      streakStartDate: newStartDate,
      lastCompletionDate: today,
      totalCompletions: streak.totalCompletions + 1,
      unlockedRewards: newRewards,
      nextMilestone,
    };

    await supabase
      .from('anchor_streaks')
      .update(this.mapToDb(updatedStreak))
      .eq('user_id', userId);

    return updatedStreak;
  }

  /**
   * Check if user has reached any milestones
   */
  private static async checkMilestones(
    currentStreak: number,
    unlockedRewards: string[]
  ): Promise<string[]> {
    const milestones = [
      { days: 7, reward: 'bronze-badge' },
      { days: 14, reward: 'silver-icon-pack-1' },
      { days: 30, reward: 'gold-badge' },
      { days: 60, reward: 'platinum-icon-pack-2' },
      { days: 90, reward: 'diamond-badge' },
      { days: 180, reward: 'master-theme-pack' },
      { days: 365, reward: 'legendary-badge' },
    ];

    const newRewards = [...unlockedRewards];

    for (const milestone of milestones) {
      if (
        currentStreak >= milestone.days &&
        !unlockedRewards.includes(milestone.reward)
      ) {
        newRewards.push(milestone.reward);
      }
    }

    return newRewards;
  }

  /**
   * Get next milestone
   */
  private static getNextMilestone(
    currentStreak: number,
    unlockedRewards: string[]
  ): AnchorStreak['nextMilestone'] {
    const milestones = [
      { days: 7, reward: 'Bronze Badge' },
      { days: 14, reward: 'Silver Icon Pack' },
      { days: 30, reward: 'Gold Badge' },
      { days: 60, reward: 'Platinum Icon Pack' },
      { days: 90, reward: 'Diamond Badge' },
      { days: 180, reward: 'Master Theme Pack' },
      { days: 365, reward: 'Legendary Badge' },
    ];

    for (const milestone of milestones) {
      if (currentStreak < milestone.days) {
        return milestone;
      }
    }

    // Max level reached
    return {
      days: 365,
      reward: 'Max Level Achieved!',
    };
  }

  /**
   * Get available premium rewards
   */
  static async getPremiumRewards(
    isPro: boolean
  ): Promise<PremiumReward[]> {
    const rewards: PremiumReward[] = [
      {
        id: 'bronze-badge',
        name: 'Bronze Anchor Badge',
        type: 'icon',
        unlockAt: 7,
        isPremium: false,
        metadata: {
          icon: '🥉',
          description: 'Your first week of consistency!',
        },
      },
      {
        id: 'silver-icon-pack-1',
        name: 'Silver Icon Pack',
        type: 'icon',
        unlockAt: 14,
        isPremium: false,
        metadata: {
          description: '5 exclusive icons for your reminders',
        },
      },
      {
        id: 'gold-badge',
        name: 'Gold Anchor Badge',
        type: 'icon',
        unlockAt: 30,
        isPremium: false,
        metadata: {
          icon: '🥇',
          description: 'One month of dedication!',
        },
      },
      {
        id: 'platinum-icon-pack-2',
        name: 'Platinum Icon Pack',
        type: 'icon',
        unlockAt: 60,
        isPremium: true,
        metadata: {
          description: '10 premium icons (Pro only)',
        },
      },
      {
        id: 'diamond-badge',
        name: 'Diamond Anchor Badge',
        type: 'icon',
        unlockAt: 90,
        isPremium: true,
        metadata: {
          icon: '💎',
          description: 'Elite consistency! (Pro only)',
        },
      },
      {
        id: 'cream-tint',
        name: 'Cream Paper Tint',
        type: 'tint',
        unlockAt: 30,
        isPremium: false,
        metadata: {
          color: '#FFF8E7',
          description: 'Warm, vintage paper feel',
        },
      },
      {
        id: 'sage-tint',
        name: 'Sage Paper Tint',
        type: 'tint',
        unlockAt: 60,
        isPremium: true,
        metadata: {
          color: '#E8F5E9',
          description: 'Calming green hue (Pro only)',
        },
      },
      {
        id: 'master-theme-pack',
        name: 'Master Theme Pack',
        type: 'theme',
        unlockAt: 180,
        isPremium: true,
        metadata: {
          description:
            'Complete theme customization suite (Pro only)',
        },
      },
      {
        id: 'legendary-badge',
        name: 'Legendary Anchor Badge',
        type: 'icon',
        unlockAt: 365,
        isPremium: true,
        metadata: {
          icon: '👑',
          description: 'One full year of excellence! (Pro only)',
        },
      },
    ];

    // Filter based on Pro status
    if (!isPro) {
      return rewards.map((r) => ({
        ...r,
        metadata: r.isPremium
          ? { ...r.metadata, description: r.metadata?.description + ' 🔒' }
          : r.metadata,
      }));
    }

    return rewards;
  }

  /**
   * Check if user can unlock a reward
   */
  static canUnlockReward(
    streak: AnchorStreak,
    reward: PremiumReward,
    isPro: boolean
  ): boolean {
    // Already unlocked
    if (streak.unlockedRewards.includes(reward.id)) return false;

    // Not enough streak days
    if (streak.currentStreak < reward.unlockAt) return false;

    // Premium reward but not Pro
    if (reward.isPremium && !isPro) return false;

    return true;
  }

  /**
   * Get streak motivation message
   */
  static getMotivationMessage(streak: number): string {
    if (streak === 0) return "Start your journey! Complete a task today.";
    if (streak === 1) return "Great start! Keep it going tomorrow.";
    if (streak < 7) return `${streak} days! You're building momentum.`;
    if (streak < 14) return `${streak} days! You're on fire! 🔥`;
    if (streak < 30) return `${streak} days! Incredible consistency!`;
    if (streak < 60) return `${streak} days! You're a productivity master!`;
    if (streak < 90) return `${streak} days! Elite level achieved! 💎`;
    if (streak < 180) return `${streak} days! Legendary dedication!`;
    if (streak < 365) return `${streak} days! Almost at the ultimate milestone!`;
    return `${streak} days! You are a true Anchor champion! 👑`;
  }
}
