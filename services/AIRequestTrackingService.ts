// AI Request Tracking Service - Persistent tracking of AI usage
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const AI_REQUESTS_KEY = '@anchor_ai_requests';
const AI_REQUESTS_DATE_KEY = '@anchor_ai_requests_date';

interface AIRequestUsage {
  count: number;
  date: string; // ISO date string
  lastReset: string; // ISO timestamp
}

export class AIRequestTrackingService {
  /**
   * Get current AI request count for today
   */
  static async getTodayRequestCount(): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [storedDate, storedCount] = await Promise.all([
        AsyncStorage.getItem(AI_REQUESTS_DATE_KEY),
        AsyncStorage.getItem(AI_REQUESTS_KEY),
      ]);

      // Reset if it's a new day
      if (storedDate !== today) {
        await this.resetDailyCount();
        return 0;
      }

      return parseInt(storedCount || '0', 10);
    } catch (error) {
      console.error('Error getting AI request count:', error);
      return 0;
    }
  }

  /**
   * Increment AI request count
   */
  static async incrementRequestCount(): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentCount = await this.getTodayRequestCount();
      const newCount = currentCount + 1;

      // Store locally
      await Promise.all([
        AsyncStorage.setItem(AI_REQUESTS_KEY, newCount.toString()),
        AsyncStorage.setItem(AI_REQUESTS_DATE_KEY, today),
      ]);

      // Log to database for analytics (fire and forget)
      this.logAIRequest().catch(console.error);

      return newCount;
    } catch (error) {
      console.error('Error incrementing AI request count:', error);
      return 0;
    }
  }

  /**
   * Reset daily count
   */
  static async resetDailyCount(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      await Promise.all([
        AsyncStorage.setItem(AI_REQUESTS_KEY, '0'),
        AsyncStorage.setItem(AI_REQUESTS_DATE_KEY, today),
      ]);
    } catch (error) {
      console.error('Error resetting AI request count:', error);
    }
  }

  /**
   * Log AI request to database for analytics
   */
  private static async logAIRequest(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('ai_requests_log').insert({
        user_id: user.id,
        request_type: 'voice_command',
        tokens_used: 0, // Can be updated with actual token count
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      // Silent fail - logging is non-critical
      console.debug('Failed to log AI request to database:', error);
    }
  }

  /**
   * Get usage stats for display
   */
  static async getUsageStats(): Promise<AIRequestUsage> {
    const count = await this.getTodayRequestCount();
    const today = new Date().toISOString().split('T')[0];
    
    return {
      count,
      date: today,
      lastReset: new Date(today).toISOString(),
    };
  }

  /**
   * Check if user can make AI request (considering limits)
   */
  static async canMakeRequest(isPro: boolean): Promise<{
    allowed: boolean;
    remaining: number;
    reason?: string;
  }> {
    const limit = isPro ? 1000 : 5; // Pro: 1000/day, Free: 5/day
    const currentCount = await this.getTodayRequestCount();
    const remaining = Math.max(0, limit - currentCount);

    if (currentCount >= limit) {
      return {
        allowed: false,
        remaining: 0,
        reason: isPro
          ? 'Daily AI request limit reached (1000/day)'
          : 'Free tier limit: 5 AI requests/day. Upgrade to Pro for 1000+!',
      };
    }

    return {
      allowed: true,
      remaining,
    };
  }

  /**
   * Clear all stored data (for testing or account deletion)
   */
  static async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(AI_REQUESTS_KEY),
        AsyncStorage.removeItem(AI_REQUESTS_DATE_KEY),
      ]);
    } catch (error) {
      console.error('Error clearing AI request data:', error);
    }
  }
}
