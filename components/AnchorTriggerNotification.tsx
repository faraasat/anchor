// Anchor Trigger Notification - Environmental awareness UI
// Phase 1: Premium, non-intrusive trigger feedback
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import type { AnchorPoint } from '@/services/AnchorPointsService';

interface AnchorTriggerNotificationProps {
  point: AnchorPoint | null;
  onDismiss: () => void;
  onAction: () => void;
}

export function AnchorTriggerNotification({
  point,
  onDismiss,
  onAction,
}: AnchorTriggerNotificationProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(-200);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (point) {
      // Animate in
      translateY.value = withSpring(0, {
        damping: 18,
        stiffness: 120,
      });
      opacity.value = withTiming(1, { duration: 200 });

      // Auto-dismiss after 5 seconds
      const timeout = setTimeout(() => {
        dismissNotification();
      }, 5000);

      return () => clearTimeout(timeout);
    } else {
      dismissNotification();
    }
  }, [point]);

  const dismissNotification = () => {
    translateY.value = withSpring(-200, {
      damping: 18,
      stiffness: 120,
    });
    opacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(onDismiss)();
      }
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!point) return null;

  const isNFC = point.type === 'nfc';
  const iconName = isNFC ? 'radio' : 'bluetooth';
  const iconColor = isNFC ? '#0284C7' : '#DC2626';
  const iconBg = isNFC ? '#E0F2FE' : '#FEE2E2';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + Spacing.md,
          backgroundColor: theme.surface,
        },
        Shadows.xl,
        animatedStyle,
      ]}
    >
      {/* Ambient glow */}
      <View style={[styles.glow, { backgroundColor: theme.anchorHighlight }]} />

      {/* Gradient accent */}
      <LinearGradient
        colors={[theme.secondary + '15', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientAccent}
      />

      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName} size={28} color={iconColor} />
        </View>

        {/* Text Content */}
        <View style={styles.textContent}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>{point.name}</Text>
            <View style={[styles.typeBadge, { backgroundColor: iconBg }]}>
              <Text style={[styles.typeBadgeText, { color: iconColor }]}>
                {isNFC ? 'NFC' : 'BT'}
              </Text>
            </View>
          </View>

          <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>
            {point.notificationMessage || point.description || 'Anchor point triggered'}
          </Text>

          {/* Action hint */}
          {point.actionType === 'trigger_reminder' && (
            <View style={styles.actionHint}>
              <Ionicons name="notifications" size={12} color={theme.secondary} />
              <Text style={[styles.actionHintText, { color: theme.secondary }]}>
                Tap to view reminder
              </Text>
            </View>
          )}
          {point.actionType === 'open_stack' && (
            <View style={styles.actionHint}>
              <Ionicons name="layers" size={12} color={theme.secondary} />
              <Text style={[styles.actionHintText, { color: theme.secondary }]}>
                Tap to open {point.targetStackName}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Pressable style={styles.actionButton} onPress={onAction}>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </Pressable>
          <Pressable style={styles.actionButton} onPress={dismissNotification}>
            <Ionicons name="close" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    zIndex: 1000,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.4,
  },
  gradientAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  typeBadgeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.extrabold,
    letterSpacing: Typography.letterSpacing.wide,
  },
  description: {
    fontSize: Typography.size.sm,
    lineHeight: Typography.size.sm * Typography.lineHeight.snug,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  actionHintText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  actions: {
    gap: Spacing.xs,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
