// Snooze Modal - Custom snooze options with Smart Snooze
import React from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import { useTheme, useColorScheme } from '@/hooks/useColorScheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { Reminder, DEFAULT_SNOOZE_OPTIONS, SnoozeOption } from '@/types/reminder';

interface SnoozeModalProps {
  visible: boolean;
  reminder: Reminder | null;
  onClose: () => void;
  onSnooze: (reminder: Reminder, snoozeUntil: Date) => void;
}

export function SnoozeModal({ visible, reminder, onClose, onSnooze }: SnoozeModalProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();

  if (!reminder) return null;

  const handleSnooze = (option: SnoozeOption) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const snoozeUntil = calculateSnoozeTime(option);
    onSnooze(reminder, snoozeUntil);
    onClose();
  };

  const handleSmartSnooze = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Smart snooze logic - snooze to a smart time based on context
    const now = new Date();
    const hour = now.getHours();
    let snoozeUntil: Date;

    if (hour < 9) {
      // Before work - snooze to 9 AM
      snoozeUntil = new Date(now);
      snoozeUntil.setHours(9, 0, 0, 0);
    } else if (hour < 12) {
      // Morning - snooze to after lunch
      snoozeUntil = new Date(now);
      snoozeUntil.setHours(13, 0, 0, 0);
    } else if (hour < 17) {
      // Afternoon - snooze to evening
      snoozeUntil = new Date(now);
      snoozeUntil.setHours(18, 0, 0, 0);
    } else {
      // Evening - snooze to tomorrow morning
      snoozeUntil = new Date(now);
      snoozeUntil.setDate(snoozeUntil.getDate() + 1);
      snoozeUntil.setHours(9, 0, 0, 0);
    }

    onSnooze(reminder, snoozeUntil);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(150)}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose}>
          <BlurView
            intensity={40}
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        </Pressable>

        <Animated.View
          entering={SlideInDown.springify().damping(20)}
          exiting={SlideOutDown.duration(200)}
          style={[styles.modal, { backgroundColor: theme.surface }, Shadows.xl]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Ionicons name="alarm-outline" size={20} color={theme.warning} />
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Reminder: {reminder.title}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              is due now.
            </Text>
          </View>

          {/* Snooze Label */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Custom snooze:
          </Text>

          {/* Quick Options */}
          <View style={styles.quickOptions}>
            {DEFAULT_SNOOZE_OPTIONS.slice(0, 4).map((option) => (
              <Pressable
                key={option.label}
                style={[
                  styles.quickOption,
                  { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                ]}
                onPress={() => handleSnooze(option)}
              >
                <Text style={[styles.quickOptionText, { color: theme.text }]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Extended Options */}
          <View style={styles.extendedOptions}>
            {DEFAULT_SNOOZE_OPTIONS.slice(4).map((option) => (
              <Pressable
                key={option.label}
                style={[
                  styles.extendedOption,
                  { backgroundColor: theme.surfaceElevated, borderColor: theme.border },
                ]}
                onPress={() => handleSnooze(option)}
              >
                <Text style={[styles.extendedOptionText, { color: theme.text }]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Smart Snooze */}
          <Pressable
            style={[styles.smartSnooze, { backgroundColor: theme.accent }]}
            onPress={handleSmartSnooze}
          >
            <Text style={styles.smartSnoozeEmoji}>😴</Text>
            <Text style={[styles.smartSnoozeText, { color: theme.textInverse }]}>
              Smart Snooze
            </Text>
          </Pressable>

          {/* Cancel Button */}
          <Pressable style={styles.cancelButton} onPress={onClose}>
            <Text style={[styles.cancelText, { color: theme.textSecondary }]}>
              Cancel
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function calculateSnoozeTime(option: SnoozeOption): Date {
  const now = new Date();

  if (option.type === 'duration') {
    const minutes = parseInt(option.value, 10);
    return new Date(now.getTime() + minutes * 60 * 1000);
  }

  // Time-based options
  switch (option.value) {
    case 'tomorrow_9am': {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow;
    }
    case 'next_business_day': {
      const next = new Date(now);
      do {
        next.setDate(next.getDate() + 1);
      } while (next.getDay() === 0 || next.getDay() === 6);
      next.setHours(9, 0, 0, 0);
      return next;
    }
    default: {
      // Specific time today (e.g., "21:00")
      const [hours, minutes] = option.value.split(':').map(Number);
      const result = new Date(now);
      result.setHours(hours, minutes, 0, 0);
      if (result <= now) {
        result.setDate(result.getDate() + 1);
      }
      return result;
    }
  }
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modal: {
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  headerSubtitle: {
    fontSize: Typography.size.md,
  },
  label: {
    fontSize: Typography.size.sm,
    marginBottom: Spacing.md,
  },
  quickOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  quickOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickOptionText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
  extendedOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  extendedOption: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  extendedOptionText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  smartSnooze: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  smartSnoozeEmoji: {
    fontSize: 20,
  },
  smartSnoozeText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  cancelText: {
    fontSize: Typography.size.md,
  },
});
