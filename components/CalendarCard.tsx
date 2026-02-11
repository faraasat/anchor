// Calendar Card Component - Display device calendar events
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing, Typography } from '@/constants/theme';
import type { CalendarEvent } from '@/types/reminder';

interface CalendarCardProps {
  event: CalendarEvent;
  index: number;
}

export function CalendarCard({ event, index }: CalendarCardProps) {
  const theme = useTheme();

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = () => {
    if (event.allDay) return 'All day';

    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      style={[styles.container, { backgroundColor: theme.surface }]}
    >
      <LinearGradient
        colors={['#8B5CF6', '#7C3AED']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.accentBar}
      />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="calendar" size={16} color="#8B5CF6" />
          </View>
          <Text style={[styles.badge, { backgroundColor: theme.surfaceElevated, color: theme.textSecondary }]}>
            Calendar Event
          </Text>
        </View>

        {/* Title */}
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {event.title}
        </Text>

        {/* Time and Duration */}
        <View style={styles.timeContainer}>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
            <Text style={[styles.timeText, { color: theme.textSecondary }]}>
              {event.allDay ? 'All day' : formatTime(event.startDate)}
            </Text>
          </View>
          <Text style={[styles.durationText, { color: theme.textMuted }]}>
            {formatDuration()}
          </Text>
        </View>

        {/* Location */}
        {event.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
            <Text style={[styles.locationText, { color: theme.textSecondary }]} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
        )}

        {/* Notes preview */}
        {event.notes && (
          <Text style={[styles.notes, { color: theme.textMuted }]} numberOfLines={2}>
            {event.notes}
          </Text>
        )}
      </View>

      {/* Non-editable indicator */}
      <View style={styles.lockContainer}>
        <Ionicons name="lock-closed" size={12} color={theme.textMuted} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  accentBar: {
    height: 4,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  title: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    lineHeight: 22,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  durationText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: Typography.size.sm,
    flex: 1,
  },
  notes: {
    fontSize: Typography.size.xs,
    lineHeight: 16,
    marginTop: Spacing.xs,
  },
  lockContainer: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    opacity: 0.5,
  },
});
