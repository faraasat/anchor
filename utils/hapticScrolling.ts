// Haptic Scrolling - Subtle "ticks" when scrolling through task lists
// Phase 2: Premium mechanical sensation
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

interface HapticScrollConfig {
  itemHeight: number;  // Height of each list item
  threshold: number;   // Minimum scroll distance to trigger haptic
}

export class HapticScrollManager {
  private lastHapticPosition = 0;
  private config: HapticScrollConfig;

  constructor(config: HapticScrollConfig) {
    this.config = config;
  }

  /**
   * Call this in your ScrollView's onScroll handler
   * @param scrollY - Current scroll Y position
   */
  handleScroll(scrollY: number) {
    if (Platform.OS === 'web') return;

    const currentItem = Math.floor(scrollY / this.config.itemHeight);
    const lastItem = Math.floor(this.lastHapticPosition / this.config.itemHeight);

    // Trigger haptic when crossing item boundaries
    if (currentItem !== lastItem) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      this.lastHapticPosition = scrollY;
    }
  }

  /**
   * Reset the haptic state (call when list changes)
   */
  reset() {
    this.lastHapticPosition = 0;
  }
}

// Simplified function for one-off haptic feedback
export function triggerScrollHaptic() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

// Haptic feedback for completing tasks
export function triggerCompletionHaptic() {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
}

// Haptic feedback for deletions or errors
export function triggerErrorHaptic() {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}

// Haptic feedback for selections
export function triggerSelectionHaptic() {
  if (Platform.OS !== 'web') {
    Haptics.selectionAsync();
  }
}
