// Offline Indicator - Shows sync status and queued operations
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withSequence,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing } from '@/constants/theme';

interface OfflineIndicatorProps {
  isOnline: boolean;
  queueCount: number;
  isSyncing: boolean;
  onPress?: () => void;
}

export default function OfflineIndicator({
  isOnline,
  queueCount,
  isSyncing,
  onPress,
}: OfflineIndicatorProps) {
  const theme = useTheme();
  const pulseAnimation = useSharedValue(1);

  React.useEffect(() => {
    if (isSyncing) {
      pulseAnimation.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );
    } else {
      pulseAnimation.value = withTiming(1);
    }
  }, [isSyncing]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  if (isOnline && queueCount === 0) {
    return null;
  }

  const getStatusColor = () => {
    if (!isOnline) return '#FF6B6B';
    if (isSyncing) return '#FFA500';
    return '#4ECDC4';
  };

  const getStatusText = () => {
    if (!isOnline) return `Offline - ${queueCount} pending`;
    if (isSyncing) return 'Syncing...';
    if (queueCount > 0) return `${queueCount} to sync`;
    return 'All synced';
  };

  const getStatusIcon = (): any => {
    if (!isOnline) return 'cloud-offline';
    if (isSyncing) return 'sync';
    return 'cloud-done';
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Animated.View style={[styles.container, { backgroundColor: theme.card }, animatedStyle]}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        <Ionicons name={getStatusIcon()} size={16} color={getStatusColor()} />
        <Text style={[styles.text, { color: theme.text }]}>
          {getStatusText()}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
});
