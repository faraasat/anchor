// Limited Mode Service - Manage feature restrictions for free users
import { isProUser } from '@/utils/revenueCat';

export interface FeatureLimits {
  maxRemindersPerDay: number;
  maxHouseholds: number;
  maxAnchorPoints: number;
  maxStacksImports: number;
  maxAIRequestsPerDay: number;
  enabledFeatures: {
    communityHub: boolean;
    aiScheduling: boolean;
    eveningReflections: boolean;
    advancedNotifications: boolean;
    customThemes: boolean;
    privacyMode: boolean;
    smartDefer: boolean;
    voiceCommands: boolean;
    weatherIntegration: boolean;
    calendarSync: boolean;
  };
}

export class LimitedModeService {
  // Free tier limits
  private static readonly FREE_LIMITS: FeatureLimits = {
    maxRemindersPerDay: 10,
    maxHouseholds: 1,
    maxAnchorPoints: 3,
    maxStacksImports: 2,
    maxAIRequestsPerDay: 5,
    enabledFeatures: {
      communityHub: true,
      aiScheduling: false,
      eveningReflections: false,
      advancedNotifications: false,
      customThemes: false,
      privacyMode: false,
      smartDefer: true,
      voiceCommands: true,
      weatherIntegration: true,
      calendarSync: false,
    },
  };

  // Pro tier limits (essentially unlimited)
  private static readonly PRO_LIMITS: FeatureLimits = {
    maxRemindersPerDay: 10000,
    maxHouseholds: 10,
    maxAnchorPoints: 50,
    maxStacksImports: 10000,
    maxAIRequestsPerDay: 1000,
    enabledFeatures: {
      communityHub: true,
      aiScheduling: true,
      eveningReflections: true,
      advancedNotifications: true,
      customThemes: true,
      privacyMode: true,
      smartDefer: true,
      voiceCommands: true,
      weatherIntegration: true,
      calendarSync: true,
    },
  };

  /**
   * Get feature limits for current user
   */
  static async getFeatureLimits(): Promise<FeatureLimits> {
    const isPro = await isProUser();
    return isPro ? this.PRO_LIMITS : this.FREE_LIMITS;
  }

  /**
   * Check if a feature is available
   */
  static async isFeatureAvailable(feature: keyof FeatureLimits['enabledFeatures']): Promise<boolean> {
    const limits = await this.getFeatureLimits();
    return limits.enabledFeatures[feature];
  }

  /**
   * Check if user can create more reminders today
   */
  static async canCreateReminder(currentCount: number): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const limits = await this.getFeatureLimits();
    const isPro = await isProUser();

    if (currentCount >= limits.maxRemindersPerDay) {
      return {
        allowed: false,
        reason: isPro
          ? 'Daily limit reached'
          : 'Free tier limit: 10 reminders/day. Upgrade to Pro for unlimited!',
      };
    }

    return { allowed: true };
  }

  /**
   * Check if user can join/create more households
   */
  static async canJoinHousehold(currentCount: number): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const limits = await this.getFeatureLimits();
    const isPro = await isProUser();

    if (currentCount >= limits.maxHouseholds) {
      return {
        allowed: false,
        reason: isPro
          ? 'Household limit reached'
          : 'Free tier limit: 1 household. Upgrade to Pro for up to 10!',
      };
    }

    return { allowed: true };
  }

  /**
   * Check if user can create more anchor points
   */
  static async canCreateAnchorPoint(currentCount: number): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const limits = await this.getFeatureLimits();
    const isPro = await isProUser();

    if (currentCount >= limits.maxAnchorPoints) {
      return {
        allowed: false,
        reason: isPro
          ? 'Anchor point limit reached'
          : 'Free tier limit: 3 anchor points. Upgrade to Pro for up to 50!',
      };
    }

    return { allowed: true };
  }

  /**
   * Check if user can import more stacks
   */
  static async canImportStack(currentImports: number): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const limits = await this.getFeatureLimits();
    const isPro = await isProUser();

    if (currentImports >= limits.maxStacksImports) {
      return {
        allowed: false,
        reason: isPro
          ? 'Daily import limit reached'
          : 'Free tier limit: 2 stack imports. Upgrade to Pro for unlimited!',
      };
    }

    return { allowed: true };
  }

  /**
   * Check if user has AI requests remaining
   * Note: Use AIRequestTrackingService for persistent tracking
   */
  static async canMakeAIRequest(currentRequests: number): Promise<{
    allowed: boolean;
    remaining: number;
    reason?: string;
  }> {
    const limits = await this.getFeatureLimits();
    const isPro = await isProUser();
    const remaining = limits.maxAIRequestsPerDay - currentRequests;

    if (currentRequests >= limits.maxAIRequestsPerDay) {
      return {
        allowed: false,
        remaining: 0,
        reason: isPro
          ? 'Daily AI request limit reached'
          : 'Free tier limit: 5 AI requests/day. Upgrade to Pro for 1000+!',
      };
    }

    return { allowed: true, remaining };
  }

  /**
   * @deprecated Use AIRequestTrackingService.incrementRequestCount() instead
   * This method is kept for backward compatibility
   */

  /**
   * Get usage message for display
   */
  static async getUsageMessage(
    feature: 'reminders' | 'households' | 'anchors' | 'stacks' | 'ai',
    currentCount: number
  ): Promise<string> {
    const limits = await this.getFeatureLimits();
    const isPro = await isProUser();

    let max: number;
    let featureName: string;

    switch (feature) {
      case 'reminders':
        max = limits.maxRemindersPerDay;
        featureName = 'reminders';
        break;
      case 'households':
        max = limits.maxHouseholds;
        featureName = 'households';
        break;
      case 'anchors':
        max = limits.maxAnchorPoints;
        featureName = 'anchor points';
        break;
      case 'stacks':
        max = limits.maxStacksImports;
        featureName = 'stack imports';
        break;
      case 'ai':
        max = limits.maxAIRequestsPerDay;
        featureName = 'AI requests';
        break;
      default:
        return '';
    }

    if (isPro) {
      return `${currentCount} of ${max} ${featureName}`;
    } else {
      const remaining = max - currentCount;
      return `${remaining} of ${max} ${featureName} remaining (Free tier)`;
    }
  }

  /**
   * @deprecated Use AIRequestTrackingService instead
   * These methods are kept for backward compatibility but will be removed in future versions.
   * The new service provides persistent storage using AsyncStorage and database logging.
   */
  private static aiRequestCount = 0;
  private static aiRequestDate: string | null = null;

  static incrementAIRequestCount(): void {
    console.warn('LimitedModeService.incrementAIRequestCount is deprecated. Use AIRequestTrackingService.incrementRequestCount()');
    const today = new Date().toISOString().split('T')[0];

    // Reset count if it's a new day
    if (this.aiRequestDate !== today) {
      this.aiRequestCount = 0;
      this.aiRequestDate = today;
    }

    this.aiRequestCount++;
  }

  static getAIRequestCount(): number {
    console.warn('LimitedModeService.getAIRequestCount is deprecated. Use AIRequestTrackingService.getTodayRequestCount()');
    const today = new Date().toISOString().split('T')[0];

    // Reset count if it's a new day
    if (this.aiRequestDate !== today) {
      this.aiRequestCount = 0;
      this.aiRequestDate = today;
    }

    return this.aiRequestCount;
  }

  /**
   * Get upgrade message for a specific feature
   */
  static getUpgradeMessage(feature: string): string {
    const messages: Record<string, string> = {
      aiScheduling: 'Unlock AI-powered scheduling with Anchor Pro',
      eveningReflections: 'Get personalized evening reflections with Pro',
      advancedNotifications: 'Enable advanced notification features with Pro',
      customThemes: 'Customize your theme with Anchor Pro',
      privacyMode: 'Enable maximum privacy mode with Pro',
      calendarSync: 'Sync with external calendars with Anchor Pro',
    };

    return messages[feature] || 'Upgrade to Anchor Pro to unlock this feature';
  }
}
