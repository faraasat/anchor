// Reminders Screen - All reminders grouped by tag
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme, useColorScheme } from '@/hooks/useColorScheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { Reminder, TAG_COLORS, TagType } from '@/types/reminder';
import { ReminderStorage } from '@/utils/storage';

export default function RemindersScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set(['Work', 'Personal']));

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const stored = await ReminderStorage.getAll();
      setReminders(stored);
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReminders();
    setRefreshing(false);
  }, []);

  const toggleTag = (tag: string) => {
    setExpandedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  // Group reminders by tag
  const groupedReminders = reminders.reduce((acc, reminder) => {
    if (!acc[reminder.tag]) {
      acc[reminder.tag] = [];
    }
    acc[reminder.tag].push(reminder);
    return acc;
  }, {} as Record<string, Reminder[]>);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: theme.text }]}>Reminders</Text>
          <Pressable
            onPress={() => router.push('/templates')}
            style={[styles.templateButton, { backgroundColor: theme.secondary }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="apps" size={18} color="#FFFFFF" />
            <Text style={styles.templateButtonText}>Templates</Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.secondary}
            colors={[theme.secondary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(groupedReminders).map(([tag, tagReminders], groupIndex) => {
          const isExpanded = expandedTags.has(tag);
          const tagColors = colorScheme === 'dark'
            ? TAG_COLORS[tag as TagType]?.dark || TAG_COLORS.Personal.dark
            : TAG_COLORS[tag as TagType] || TAG_COLORS.Personal;
          const pendingCount = tagReminders.filter((r) => r.status !== 'completed').length;

          return (
            <Animated.View
              key={tag}
              entering={FadeInDown.delay(groupIndex * 50).duration(200)}
              layout={Layout.springify()}
              style={styles.tagGroup}
            >
              {/* Tag Header */}
              <Pressable
                style={[styles.tagHeader, { borderBottomColor: theme.border }]}
                onPress={() => toggleTag(tag)}
              >
                <View style={styles.tagHeaderLeft}>
                  <Text style={[styles.tagName, { color: theme.text }]}>{tag}</Text>
                  <View style={[styles.countBadge, { backgroundColor: theme.surfaceElevated }]}>
                    <Text style={[styles.countText, { color: theme.textSecondary }]}>
                      {pendingCount}
                    </Text>
                  </View>
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.textSecondary}
                />
              </Pressable>

              {/* Tag Reminders */}
              {isExpanded && (
                <View style={styles.remindersList}>
                  {tagReminders.map((reminder, index) => (
                    <Animated.View
                      key={reminder.id}
                      entering={FadeInDown.delay(index * 30).duration(150)}
                      style={[
                        styles.reminderItem,
                        { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
                        Shadows.sm,
                      ]}
                    >
                      <View style={styles.reminderContent}>
                        <Text
                          style={[
                            styles.reminderTitle,
                            { color: theme.text },
                            reminder.status === 'completed' && styles.completedTitle,
                          ]}
                          numberOfLines={1}
                        >
                          {reminder.title}
                        </Text>
                        <Text style={[styles.reminderTime, { color: theme.textSecondary }]}>
                          {formatTime(reminder.dueTime)}
                        </Text>
                      </View>
                      <View style={[styles.tagBadge, { backgroundColor: tagColors.bg }]}>
                        <Text style={[styles.tagBadgeText, { color: tagColors.text }]}>{tag}</Text>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              )}
            </Animated.View>
          );
        })}

        {Object.keys(groupedReminders).length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={48} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No reminders yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Add your first reminder to get started
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  templateButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  tagGroup: {
    marginBottom: Spacing.lg,
  },
  tagHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  tagHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  tagName: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
  },
  countBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  countText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
  remindersList: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  reminderContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  reminderTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
    marginBottom: 2,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  reminderTime: {
    fontSize: Typography.size.sm,
  },
  tagBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  tagBadgeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: Typography.size.base,
    textAlign: 'center',
  },
});
