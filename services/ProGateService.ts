// Pro Gate Service - Manages access to Pro features
import { Alert } from 'react-native';
import { isProUser } from '@/utils/revenueCat';

export enum ProFeature {
  TRUE_SYNC = 'true_sync',
  ADVANCED_RECURRENCE = 'advanced_recurrence',
  AI_CONTEXT = 'ai_context',
  CONDITIONAL_REMINDERS = 'conditional_reminders',
  SMART_LOCATION = 'smart_location',
  WELLNESS_TOOLS = 'wellness_tools',
  SMART_SNOOZE = 'smart_snooze',
  PRIORITY_STACKING = 'priority_stacking',
}

export class ProGateService {
  private static proFeatures: Set<ProFeature> = new Set([
    ProFeature.TRUE_SYNC,
    ProFeature.ADVANCED_RECURRENCE,
    ProFeature.AI_CONTEXT,
    ProFeature.CONDITIONAL_REMINDERS,
    ProFeature.SMART_LOCATION,
    ProFeature.SMART_SNOOZE,
    ProFeature.PRIORITY_STACKING,
  ]);

  /**
   * Check if user has Pro access
   */
  static async isPro(): Promise<boolean> {
    try {
      return await isProUser();
    } catch (error) {
      console.error('Error checking Pro status:', error);
      return false;
    }
  }

  /**
   * Check if a specific feature requires Pro
   */
  static isProFeature(feature: ProFeature): boolean {
    return this.proFeatures.has(feature);
  }

  /**
   * Check if user can access a specific feature
   */
  static async canAccessFeature(feature: ProFeature): Promise<boolean> {
    if (!this.isProFeature(feature)) {
      return true; // Non-pro feature, always accessible
    }

    return await this.isPro();
  }

  /**
   * Gate a feature - returns true if user can proceed, false if upgrade required
   */
  static async gateFeature(
    feature: ProFeature,
    showAlert: boolean = true
  ): Promise<boolean> {
    const canAccess = await this.canAccessFeature(feature);

    if (!canAccess && showAlert) {
      this.showUpgradeAlert(feature);
    }

    return canAccess;
  }

  /**
   * Show upgrade alert for a specific feature
   */
  private static showUpgradeAlert(feature: ProFeature): void {
    const featureNames: Record<ProFeature, string> = {
      [ProFeature.TRUE_SYNC]: 'True Sync',
      [ProFeature.ADVANCED_RECURRENCE]: 'Advanced Recurrence',
      [ProFeature.AI_CONTEXT]: 'AI Context',
      [ProFeature.CONDITIONAL_REMINDERS]: 'Conditional Reminders',
      [ProFeature.SMART_LOCATION]: 'Smart Location Triggers',
      [ProFeature.WELLNESS_TOOLS]: 'Wellness Tools',
      [ProFeature.SMART_SNOOZE]: 'Smart Snooze',
      [ProFeature.PRIORITY_STACKING]: 'Priority Stacking',
    };

    const featureDescriptions: Record<ProFeature, string> = {
      [ProFeature.TRUE_SYNC]: 'Sync notifications and tasks across all your devices in real-time.',
      [ProFeature.ADVANCED_RECURRENCE]: 'Create complex recurring rules like "2nd Tuesday" or "last Friday".',
      [ProFeature.AI_CONTEXT]: 'Get weather warnings, traffic updates, and smart suggestions.',
      [ProFeature.CONDITIONAL_REMINDERS]: 'Link tasks with dependencies and automatic triggers.',
      [ProFeature.SMART_LOCATION]: 'Set reminders for any supermarket, gas station, or category.',
      [ProFeature.WELLNESS_TOOLS]: 'Track steps, water intake, and focus time with Pomodoro.',
      [ProFeature.SMART_SNOOZE]: 'AI-powered snooze suggestions based on your calendar and context.',
      [ProFeature.PRIORITY_STACKING]: 'Auto-manage conflicting high-priority reminders with AI.',
    };

    Alert.alert(
      `🔒 ${featureNames[feature]} is a Pro Feature`,
      featureDescriptions[feature] + '\n\nUpgrade to Pro to unlock this and more premium features.',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Upgrade to Pro', onPress: () => this.openPaywall() },
      ]
    );
  }

  /**
   * Open paywall (requires navigation context)
   */
  private static openPaywall(): void {
    // This would be handled by the app's navigation
    // For now, we'll just log it
    console.log('Opening paywall...');
  }

  /**
   * Get feature description for UI
   */
  static getFeatureDescription(feature: ProFeature): { name: string; description: string } {
    const featureNames: Record<ProFeature, string> = {
      [ProFeature.TRUE_SYNC]: 'True Sync',
      [ProFeature.ADVANCED_RECURRENCE]: 'Advanced Recurrence',
      [ProFeature.AI_CONTEXT]: 'AI Context',
      [ProFeature.CONDITIONAL_REMINDERS]: 'Conditional Reminders',
      [ProFeature.SMART_LOCATION]: 'Smart Location',
      [ProFeature.WELLNESS_TOOLS]: 'Wellness Tools',
      [ProFeature.SMART_SNOOZE]: 'Smart Snooze',
      [ProFeature.PRIORITY_STACKING]: 'Priority Stacking',
    };

    const featureDescriptions: Record<ProFeature, string> = {
      [ProFeature.TRUE_SYNC]: 'Real-time sync across devices',
      [ProFeature.ADVANCED_RECURRENCE]: 'Complex recurring patterns',
      [ProFeature.AI_CONTEXT]: 'Weather & traffic awareness',
      [ProFeature.CONDITIONAL_REMINDERS]: 'Task dependencies',
      [ProFeature.SMART_LOCATION]: 'Category-based triggers',
      [ProFeature.WELLNESS_TOOLS]: 'Health & focus tracking',
      [ProFeature.SMART_SNOOZE]: 'AI-powered snooze',
      [ProFeature.PRIORITY_STACKING]: 'Smart priority management',
    };

    return {
      name: featureNames[feature],
      description: featureDescriptions[feature],
    };
  }

  /**
   * Get all Pro features for display
   */
  static getAllProFeatures(): Array<{ feature: ProFeature; name: string; description: string }> {
    return Array.from(this.proFeatures).map((feature) => ({
      feature,
      ...this.getFeatureDescription(feature),
    }));
  }
}
