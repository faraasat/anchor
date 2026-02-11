// Reminder Card - Timeline card with completion animation and haptics
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  FadeIn,
  Layout,
} from 'react-native-reanimated';
import { useTheme, useColorScheme } from '@/hooks/useColorScheme';
import { Spacing, BorderRadius, Typography, Shadows, Animation } from '@/constants/theme';
import { Reminder, TAG_COLORS } from '@/types/reminder';

interface ReminderCardProps {
  reminder: Reminder;
  onComplete?: (id: string) => void;
  onPress?: (reminder: Reminder) => void;
  onSnooze?: (reminder: Reminder) => void;
  showTimeline?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ReminderCard({
  reminder,
  onComplete,
  onPress,
  onSnooze,
  showTimeline = true,
  isFirst = false,
  isLast = false,
}: ReminderCardProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();

  const scale = useSharedValue(1);
  const checkScale = useSharedValue(1);
  const rippleOpacity = useSharedValue(0);
  const rippleScale = useSharedValue(0);

  const tagColors = colorScheme === 'dark' ? TAG_COLORS[reminder.tag].dark : TAG_COLORS[reminder.tag];
  const isCompleted = reminder.status === 'completed';
  const isOverdue = reminder.status === 'overdue';

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const handleComplete = useCallback(() => {
    if (isCompleted) return;

    // Trigger haptic
    triggerHaptic();

    // Animate check
    checkScale.value = withSequence(
      withSpring(1.3, { damping: 8, stiffness: 400 }),
      withSpring(1, { damping: 12, stiffness: 400 })
    );

    // Ripple effect
    rippleOpacity.value = withSequence(
      withTiming(0.3, { duration: Animation.fast }),
      withTiming(0, { duration: Animation.slow })
    );
    rippleScale.value = withSequence(
      withTiming(0, { duration: 0 }),
      withTiming(2, { duration: Animation.slow })
    );

    // Notify parent
    onComplete?.(reminder.id);
  }, [isCompleted, checkScale, rippleOpacity, rippleScale, onComplete, reminder.id, triggerHaptic]);

  const handlePress = useCallback(() => {
    onPress?.(reminder);
  }, [onPress, reminder]);

  const handleSnooze = useCallback(() => {
    onSnooze?.(reminder);
  }, [onSnooze, reminder]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedCheckStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const animatedRippleStyle = useAnimatedStyle(() => ({
    opacity: rippleOpacity.value,
    transform: [{ scale: rippleScale.value }],
  }));

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getStatusIcon = (): React.ReactNode => {
    if (isCompleted) {
      return (
        <Animated.View style={[styles.statusIcon, styles.statusCompleted, animatedCheckStyle]}>
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        </Animated.View>
      );
    }
    if (isOverdue) {
      return (
        <View style={[styles.statusIcon, styles.statusOverdue]}>
          <Ionicons name="alert" size={14} color="#FFFFFF" />
        </View>
      );
    }
    return (
      <View style={[styles.statusIcon, styles.statusPending, { borderColor: theme.border }]} />
    );
  };

  return (
    <Animated.View
      entering={FadeIn.duration(Animation.normal)}
      layout={Layout.springify()}
      style={styles.wrapper}
    >
      {/* Timeline */}
      {showTimeline && (
        <View style={styles.timeline}>
          {!isFirst && (
            <View style={[styles.timelineLine, styles.timelineTop, { backgroundColor: theme.border }]} />
          )}
          <Pressable onPress={handleComplete} disabled={isCompleted}>
            {getStatusIcon()}
            {/* Ripple overlay */}
            <Animated.View
              style={[
                styles.ripple,
                { backgroundColor: theme.success },
                animatedRippleStyle,
              ]}
            />
          </Pressable>
          {!isLast && (
            <View style={[styles.timelineLine, styles.timelineBottom, { backgroundColor: theme.border }]} />
          )}
        </View>
      )}

      {/* Card */}
      <AnimatedPressable
        style={[
          animatedCardStyle,
          styles.card,
          {
            backgroundColor: theme.cardBackground,
            borderColor: isOverdue ? theme.error : theme.cardBorder,
            borderWidth: isOverdue ? 1.5 : 1,
          },
          Shadows.md,
          isCompleted && styles.cardCompleted,
        ]}
        onPress={handlePress}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15, stiffness: 400 });
        }}
      >
        <View style={styles.cardContent}>
          {/* Left Content */}
          <View style={styles.cardMain}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.title,
                  { color: theme.text },
                  isCompleted && styles.titleCompleted,
                ]}
                numberOfLines={1}
              >
                {reminder.title}
              </Text>
              {isOverdue && (
                <View style={[styles.overdueBadge, { backgroundColor: theme.error }]}>
                  <Text style={styles.overdueBadgeText}>Overdue</Text>
                </View>
              )}
            </View>
            <View style={styles.metaRow}>
              <Text style={[styles.time, { color: theme.textSecondary }]}>
                {formatTime(reminder.dueTime)}
              </Text>
              <View style={styles.metaRight}>
                <View style={[styles.tag, { backgroundColor: tagColors.bg }]}>
                  <Text style={[styles.tagText, { color: tagColors.text }]}>{reminder.tag}</Text>
                </View>
                {reminder.isRecurring && (reminder.chainCount ?? 0) > 0 && (
                  <View style={[styles.chainBadge, { backgroundColor: theme.success }]}>
                    <Ionicons name="link" size={10} color="#FFFFFF" />
                    <Text style={styles.chainCount}>{reminder.chainCount}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Right Actions */}
          {!isCompleted && (
            <Pressable
              style={[styles.snoozeButton, { backgroundColor: theme.surfaceElevated }]}
              onPress={handleSnooze}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="checkmark" size={20} color={theme.success} />
            </Pressable>
          )}
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  timeline: {
    width: 40,
    alignItems: 'center',
    position: 'relative',
  },
  timelineLine: {
    width: 2,
    position: 'absolute',
  },
  timelineTop: {
    top: 0,
    height: 12,
  },
  timelineBottom: {
    top: 36,
    bottom: 0,
    height: '100%',
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  statusPending: {
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  statusCompleted: {
    backgroundColor: '#10B981',
  },
  statusOverdue: {
    backgroundColor: '#EF4444',
  },
  ripple: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    top: 12,
  },
  card: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  cardCompleted: {
    opacity: 0.6,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  cardMain: {
    flex: 1,
    marginRight: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    flex: 1,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  overdueBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  overdueBadgeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: '#FFFFFF',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: Typography.size.sm,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
  chainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  chainCount: {
    fontSize: 9,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
  },
  snoozeButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
