// Custom Haptic Patterns Service - Advanced haptic feedback
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export enum HapticPattern {
  TAP = 'tap',
  DOUBLE_TAP = 'double_tap',
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  MILESTONE = 'milestone',
  STACK_COMPLETE = 'stack_complete',
  GOAL_REACHED = 'goal_reached',
  LEVEL_UP = 'level_up',
  MAGIC_MOMENT = 'magic_moment',
  SUBTLE_TICK = 'subtle_tick',
  DEEP_THRUM = 'deep_thrum',
  SCROLL_EDGE = 'scroll_edge',
}

class HapticPatternsServiceClass {
  private isEnabled: boolean = true;

  /**
   * Enable or disable haptic feedback
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Play a custom haptic pattern
   */
  async playPattern(pattern: HapticPattern): Promise<void> {
    if (!this.isEnabled || Platform.OS === 'web') return;

    switch (pattern) {
      case HapticPattern.TAP:
        await this.playTap();
        break;

      case HapticPattern.DOUBLE_TAP:
        await this.playDoubleTap();
        break;

      case HapticPattern.SUCCESS:
        await this.playSuccess();
        break;

      case HapticPattern.ERROR:
        await this.playError();
        break;

      case HapticPattern.WARNING:
        await this.playWarning();
        break;

      case HapticPattern.MILESTONE:
        await this.playMilestone();
        break;

      case HapticPattern.STACK_COMPLETE:
        await this.playStackComplete();
        break;

      case HapticPattern.GOAL_REACHED:
        await this.playGoalReached();
        break;

      case HapticPattern.LEVEL_UP:
        await this.playLevelUp();
        break;

      case HapticPattern.MAGIC_MOMENT:
        await this.playMagicMoment();
        break;

      case HapticPattern.SUBTLE_TICK:
        await this.playSubtleTick();
        break;

      case HapticPattern.DEEP_THRUM:
        await this.playDeepThrum();
        break;

      case HapticPattern.SCROLL_EDGE:
        await this.playScrollEdge();
        break;

      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  /**
   * Light tap - standard interaction
   */
  private async playTap() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  /**
   * Double tap - quick double pulse
   */
  private async playDoubleTap() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await this.wait(80);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  /**
   * Success - satisfying upward pattern
   */
  private async playSuccess() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await this.wait(50);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await this.wait(50);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  /**
   * Error - distinct warning pattern
   */
  private async playError() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await this.wait(100);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await this.wait(100);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }

  /**
   * Warning - medium alert
   */
  private async playWarning() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await this.wait(100);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }

  /**
   * Milestone - celebratory burst
   */
  private async playMilestone() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await this.wait(30);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await this.wait(30);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await this.wait(50);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  /**
   * Stack Complete - powerful completion feel
   */
  private async playStackComplete() {
    // Triple impact crescendo
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await this.wait(60);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await this.wait(60);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await this.wait(80);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await this.wait(100);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  /**
   * Goal Reached - triumphant sequence
   */
  private async playGoalReached() {
    // Rising pattern
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await this.wait(40);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await this.wait(40);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await this.wait(60);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await this.wait(80);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await this.wait(40);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  /**
   * Level Up - exciting achievement
   */
  private async playLevelUp() {
    // Quick ascending burst
    for (let i = 0; i < 5; i++) {
      const intensity =
        i < 2
          ? Haptics.ImpactFeedbackStyle.Light
          : i < 4
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Heavy;
      await Haptics.impactAsync(intensity);
      await this.wait(40 - i * 5);
    }
    await this.wait(60);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  /**
   * Magic Moment - delightful surprise
   */
  private async playMagicMoment() {
    // Sparkle pattern
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await this.wait(30);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await this.wait(30);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await this.wait(50);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await this.wait(30);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  /**
   * Subtle Tick - minimal feedback
   */
  private async playSubtleTick() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  /**
   * Deep Thrum - powerful sustained feedback
   */
  private async playDeepThrum() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await this.wait(100);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }

  /**
   * Scroll Edge - subtle boundary notification
   */
  private async playScrollEdge() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await this.wait(50);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }

  /**
   * Helper to wait/delay
   */
  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Play selection change haptic
   */
  async playSelectionChange() {
    if (!this.isEnabled || Platform.OS === 'web') return;
    await Haptics.selectionAsync();
  }

  /**
   * Play custom impact
   */
  async playImpact(style: 'light' | 'medium' | 'heavy' = 'medium') {
    if (!this.isEnabled || Platform.OS === 'web') return;

    const styleMap = {
      light: Haptics.ImpactFeedbackStyle.Light,
      medium: Haptics.ImpactFeedbackStyle.Medium,
      heavy: Haptics.ImpactFeedbackStyle.Heavy,
    };

    await Haptics.impactAsync(styleMap[style]);
  }

  /**
   * Play notification haptic
   */
  async playNotification(type: 'success' | 'warning' | 'error' = 'success') {
    if (!this.isEnabled || Platform.OS === 'web') return;

    const typeMap = {
      success: Haptics.NotificationFeedbackType.Success,
      warning: Haptics.NotificationFeedbackType.Warning,
      error: Haptics.NotificationFeedbackType.Error,
    };

    await Haptics.notificationAsync(typeMap[type]);
  }
}

export const HapticPatternsService = new HapticPatternsServiceClass();
