// Pro Badge - Indicate premium features and prompt upgrades
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useColorScheme';
import { useProStatus } from '@/hooks/useProStatus';
import { Spacing, Typography } from '@/constants/theme';

interface ProBadgeProps {
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  onPress?: () => void;
}

export function ProBadge({ size = 'small', showIcon = true, onPress }: ProBadgeProps) {
  const theme = useTheme();
  const { isPro } = useProStatus();

  if (isPro) return null;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const fontSize = size === 'large' ? Typography.size.base : size === 'medium' ? Typography.size.sm : Typography.size.xs;
  const padding = size === 'large' ? Spacing.sm : size === 'medium' ? Spacing.xs : 4;

  return (
    <Pressable
      onPress={handlePress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.badge,
        {
          backgroundColor: '#F59E0B',
          paddingHorizontal: padding,
          paddingVertical: padding / 2,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {showIcon && <Ionicons name="star" size={fontSize} color="#FFFFFF" />}
      <Text style={[styles.text, { color: '#FFFFFF', fontSize }]}>PRO</Text>
    </Pressable>
  );
}

interface FeatureGateProps {
  children: React.ReactNode;
  featureName: string;
  onUpgradePress: () => void;
  isLocked: boolean;
}

export function FeatureGate({ children, featureName, onUpgradePress, isLocked }: FeatureGateProps) {
  const theme = useTheme();
  const { isPro } = useProStatus();

  if (!isLocked || isPro) {
    return <>{children}</>;
  }

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUpgradePress();
  };

  return (
    <View style={styles.gateContainer}>
      <View style={styles.lockedOverlay} />
      <View style={styles.contentWrapper}>{children}</View>
      <Pressable
        onPress={handlePress}
        style={[styles.unlockButton, { backgroundColor: theme.secondary }]}
      >
        <Ionicons name="lock-closed" size={16} color={theme.textInverse} />
        <Text style={[styles.unlockText, { color: theme.textInverse }]}>
          Upgrade to unlock {featureName}
        </Text>
      </Pressable>
    </View>
  );
}

interface FeatureLimitBannerProps {
  message: string;
  onUpgradePress: () => void;
}

export function FeatureLimitBanner({ message, onUpgradePress }: FeatureLimitBannerProps) {
  const theme = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpgradePress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.limitBanner, { backgroundColor: '#FEF3C7' }]}
    >
      <View style={styles.limitBannerContent}>
        <Ionicons name="information-circle" size={20} color="#F59E0B" />
        <Text style={[styles.limitBannerText, { color: '#92400E' }]}>{message}</Text>
      </View>
      <View style={styles.upgradeBadge}>
        <Ionicons name="star" size={14} color="#FFFFFF" />
        <Text style={styles.upgradeBadgeText}>Upgrade</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
  },
  text: {
    fontWeight: Typography.weight.bold,
    letterSpacing: 0.5,
  },
  gateContainer: {
    position: 'relative',
  },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    zIndex: 1,
  },
  contentWrapper: {
    opacity: 0.5,
  },
  unlockButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -80 }, { translateY: -20 }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    zIndex: 2,
  },
  unlockText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderRadius: 12,
  },
  limitBannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  limitBannerText: {
    flex: 1,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  upgradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F59E0B',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 12,
  },
  upgradeBadgeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
  },
});
