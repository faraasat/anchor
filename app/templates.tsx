// Community Template Library - Discover and import pre-made routine packs
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@fastshot/auth';
import { useTheme } from '@/hooks/useColorScheme';
import { useHousehold } from '@/contexts/HouseholdContext';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { Reminder } from '@/types/reminder';

interface RoutinePack {
  id: string;
  title: string;
  description: string;
  category: string;
  taskCount: number;
  icon: string;
  color: string;
  tasks: Omit<Reminder, 'id' | 'userId' | 'householdId' | 'createdAt'>[];
}

const ROUTINE_PACKS: RoutinePack[] = [
  {
    id: 'pack-5am-club',
    title: 'The 5 AM Club',
    description: 'Transform your mornings with this powerful routine designed for peak productivity and wellness.',
    category: 'Productivity',
    taskCount: 7,
    icon: 'sunny-outline',
    color: '#F59E0B',
    tasks: [
      {
        title: 'Wake up at 5:00 AM',
        description: 'Start your day with intention',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '05:00',
        priority: 'high',
        tag: 'Personal',
        status: 'pending',
        tags: ['morning', 'routine'],
      },
      {
        title: '20 min exercise',
        description: 'Movement to energize your body',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '05:10',
        priority: 'high',
        tag: 'Personal',
        status: 'pending',
        tags: ['morning', 'health'],
      },
      {
        title: '20 min learning',
        description: 'Read or listen to personal development',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '05:35',
        priority: 'medium',
        tag: 'Personal',
        status: 'pending',
        tags: ['morning', 'learning'],
      },
      {
        title: '20 min planning',
        description: 'Set intentions and prioritize the day',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '06:00',
        priority: 'high',
        tag: 'Work',
        status: 'pending',
        tags: ['morning', 'planning'],
      },
      {
        title: 'Healthy breakfast',
        description: 'Fuel your body with nutrition',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '06:25',
        priority: 'medium',
        tag: 'Personal',
        status: 'pending',
        tags: ['morning', 'health'],
      },
      {
        title: 'Review goals',
        description: 'Check in with your weekly objectives',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '06:45',
        priority: 'medium',
        tag: 'Personal',
        status: 'pending',
        tags: ['morning', 'goals'],
      },
      {
        title: 'Start deep work',
        description: 'Tackle your most important task',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '07:00',
        priority: 'high',
        tag: 'Work',
        status: 'pending',
        tags: ['morning', 'work'],
      },
    ],
  },
  {
    id: 'pack-deep-work',
    title: 'Deep Work Prep',
    description: 'Optimize your environment and mindset for focused, distraction-free productivity.',
    category: 'Productivity',
    taskCount: 5,
    icon: 'bulb-outline',
    color: '#3B82F6',
    tasks: [
      {
        title: 'Clear workspace',
        description: 'Remove distractions from your desk',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '08:00',
        priority: 'medium',
        tag: 'Work',
        status: 'pending',
        tags: ['focus', 'workspace'],
      },
      {
        title: 'Silence notifications',
        description: 'Enable Do Not Disturb mode',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '08:10',
        priority: 'high',
        tag: 'Work',
        status: 'pending',
        tags: ['focus', 'digital'],
      },
      {
        title: 'Hydrate',
        description: 'Get a large glass of water',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '08:15',
        priority: 'low',
        tag: 'Personal',
        status: 'pending',
        tags: ['health', 'hydration'],
      },
      {
        title: 'Set timer for 90 minutes',
        description: 'Use the Pomodoro technique for deep work',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '08:20',
        priority: 'high',
        tag: 'Work',
        status: 'pending',
        tags: ['focus', 'timer'],
      },
      {
        title: 'Begin focused work',
        description: 'Work on your most important task',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '08:30',
        priority: 'high',
        tag: 'Work',
        status: 'pending',
        tags: ['focus', 'work'],
      },
    ],
  },
  {
    id: 'pack-travel',
    title: 'Ultimate Travel Packing',
    description: 'Never forget essentials again with this comprehensive travel preparation checklist.',
    tag: 'Travel',
    taskCount: 10,
    icon: 'airplane-outline',
    color: '#10B981',
    tasks: [
      {
        title: 'Check passport expiration',
        description: 'Ensure it\'s valid for 6+ months',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '09:00',
        priority: 'high',
        tag: 'Travel',
        status: 'pending',
        tags: ['travel', 'documents'],
      },
      {
        title: 'Pack toiletries',
        description: 'Toothbrush, toothpaste, deodorant, etc.',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '09:15',
        priority: 'medium',
        tag: 'Travel',
        status: 'pending',
        tags: ['travel', 'packing'],
      },
      {
        title: 'Pack clothes',
        description: 'Check weather and pack accordingly',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '09:30',
        priority: 'medium',
        tag: 'Travel',
        status: 'pending',
        tags: ['travel', 'packing'],
      },
      {
        title: 'Pack electronics',
        description: 'Phone, laptop, chargers, adapters',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '10:00',
        priority: 'high',
        tag: 'Travel',
        status: 'pending',
        tags: ['travel', 'electronics'],
      },
      {
        title: 'Download offline maps',
        description: 'Save destination maps for offline use',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '10:15',
        priority: 'medium',
        tag: 'Travel',
        status: 'pending',
        tags: ['travel', 'digital'],
      },
      {
        title: 'Pack medications',
        description: 'Include prescriptions and first aid',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '10:30',
        priority: 'high',
        tag: 'Travel',
        status: 'pending',
        tags: ['travel', 'health'],
      },
      {
        title: 'Notify bank of travel',
        description: 'Avoid card being blocked abroad',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '10:45',
        priority: 'high',
        tag: 'Travel',
        status: 'pending',
        tags: ['travel', 'finance'],
      },
      {
        title: 'Set home security',
        description: 'Lock windows, set alarm, notify neighbors',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '11:00',
        priority: 'high',
        tag: 'Home',
        status: 'pending',
        tags: ['travel', 'security'],
      },
      {
        title: 'Print boarding passes',
        description: 'Save digital and physical copies',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '11:15',
        priority: 'medium',
        tag: 'Travel',
        status: 'pending',
        tags: ['travel', 'documents'],
      },
      {
        title: 'Check-in online',
        description: '24 hours before departure',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '11:30',
        priority: 'high',
        tag: 'Travel',
        status: 'pending',
        tags: ['travel', 'checkin'],
      },
    ],
  },
  {
    id: 'pack-evening-wind-down',
    title: 'Evening Wind Down',
    description: 'Prepare for restful sleep with this calming evening routine.',
    category: 'Wellness',
    taskCount: 6,
    icon: 'moon-outline',
    color: '#8B5CF6',
    tasks: [
      {
        title: 'Dim lights',
        description: 'Reduce blue light exposure',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '20:00',
        priority: 'medium',
        tag: 'Personal',
        status: 'pending',
        tags: ['evening', 'sleep'],
      },
      {
        title: 'Stop screen time',
        description: 'Put away devices 1 hour before bed',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '20:30',
        priority: 'high',
        tag: 'Personal',
        status: 'pending',
        tags: ['evening', 'digital'],
      },
      {
        title: 'Light stretching',
        description: 'Gentle yoga or stretching routine',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '20:45',
        priority: 'medium',
        tag: 'Personal',
        status: 'pending',
        tags: ['evening', 'health'],
      },
      {
        title: 'Prepare tomorrow',
        description: 'Lay out clothes, pack bag',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '21:00',
        priority: 'medium',
        tag: 'Personal',
        status: 'pending',
        tags: ['evening', 'planning'],
      },
      {
        title: 'Gratitude journal',
        description: 'Write 3 things you\'re grateful for',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '21:15',
        priority: 'low',
        tag: 'Personal',
        status: 'pending',
        tags: ['evening', 'mindfulness'],
      },
      {
        title: 'Bedtime',
        description: 'Aim for 7-8 hours of sleep',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '21:30',
        priority: 'high',
        tag: 'Personal',
        status: 'pending',
        tags: ['evening', 'sleep'],
      },
    ],
  },
  {
    id: 'pack-meal-prep-sunday',
    title: 'Meal Prep Sunday',
    description: 'Set yourself up for a week of healthy eating with organized meal preparation.',
    category: 'Health',
    taskCount: 8,
    icon: 'restaurant-outline',
    color: '#EF4444',
    tasks: [
      {
        title: 'Plan weekly menu',
        description: 'Choose 5 breakfast, lunch, and dinner recipes',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '09:00',
        priority: 'high',
        tag: 'Personal',
        status: 'pending',
        tags: ['meal-prep', 'planning'],
      },
      {
        title: 'Create shopping list',
        description: 'Check pantry and list ingredients',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '09:30',
        priority: 'high',
        tag: 'Errands',
        status: 'pending',
        tags: ['meal-prep', 'shopping'],
      },
      {
        title: 'Grocery shopping',
        description: 'Buy all ingredients for the week',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '10:00',
        priority: 'high',
        tag: 'Errands',
        status: 'pending',
        tags: ['meal-prep', 'shopping'],
      },
      {
        title: 'Wash and chop vegetables',
        description: 'Prep all produce for the week',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '11:00',
        priority: 'medium',
        tag: 'Personal',
        status: 'pending',
        tags: ['meal-prep', 'cooking'],
      },
      {
        title: 'Cook proteins',
        description: 'Grill chicken, bake fish, etc.',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '12:00',
        priority: 'medium',
        tag: 'Personal',
        status: 'pending',
        tags: ['meal-prep', 'cooking'],
      },
      {
        title: 'Prepare grains',
        description: 'Cook rice, quinoa, or pasta',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '13:00',
        priority: 'medium',
        tag: 'Personal',
        status: 'pending',
        tags: ['meal-prep', 'cooking'],
      },
      {
        title: 'Portion into containers',
        description: 'Divide meals into individual servings',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '14:00',
        priority: 'high',
        tag: 'Personal',
        status: 'pending',
        tags: ['meal-prep', 'organization'],
      },
      {
        title: 'Clean kitchen',
        description: 'Wash dishes and clean counters',
        dueDate: new Date().toISOString().split('T')[0],
        dueTime: '15:00',
        priority: 'medium',
        tag: 'Home',
        status: 'pending',
        tags: ['meal-prep', 'cleaning'],
      },
    ],
  },
];

export default function TemplatesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { currentHousehold } = useHousehold();
  const { createReminder } = usePrivacy();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [importing, setImporting] = useState<string | null>(null);

  const categories = ['All', 'Productivity', 'Wellness', 'Health', 'Travel'];

  const filteredPacks =
    selectedCategory === 'All'
      ? ROUTINE_PACKS
      : ROUTINE_PACKS.filter((pack) => pack.category === selectedCategory);

  const handleImport = async (pack: RoutinePack) => {
    if (!user) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setImporting(pack.id);

    try {
      // Import all tasks from the pack
      for (const task of pack.tasks) {
        const reminder: Reminder = {
          id: Math.random().toString(36).substring(7),
          userId: user.id,
          householdId: currentHousehold?.id,
          createdAt: new Date().toISOString(),
          ...task,
        };

        await createReminder(user.id, reminder, currentHousehold?.id);
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        'Success!',
        `"${pack.title}" has been added to your reminders.`,
        [
          {
            text: 'View Reminders',
            onPress: () => router.push('/(tabs)/reminders'),
          },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      console.error('Error importing pack:', error);
      Alert.alert('Error', 'Failed to import routine pack. Please try again.');

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setImporting(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={theme.text} />
          </Pressable>
          <Text style={[styles.title, { color: theme.text }]}>Template Library</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Discover pre-made routines to boost your productivity
        </Text>
      </Animated.View>

      {/* Category Filter */}
      <Animated.View entering={FadeInDown.delay(100).duration(200)} style={styles.categorySection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((category, index) => {
            const isSelected = selectedCategory === category;
            return (
              <Pressable
                key={category}
                onPress={() => {
                  setSelectedCategory(category);
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected ? theme.secondary : theme.surface,
                    borderColor: isSelected ? theme.secondary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.categoryText,
                    { color: isSelected ? '#FFFFFF' : theme.text },
                  ]}
                >
                  {category}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* Routine Packs Grid */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {filteredPacks.map((pack, index) => (
          <Animated.View
            key={pack.id}
            entering={FadeInDown.delay(200 + index * 50).duration(200)}
            style={[
              styles.packCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
              Shadows.md,
            ]}
          >
            {/* Header with Icon */}
            <View style={styles.packHeader}>
              <LinearGradient
                colors={[pack.color + 'CC', pack.color]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.packIcon}
              >
                <Ionicons name={pack.icon as any} size={28} color="#FFFFFF" />
              </LinearGradient>
              <View style={[styles.categoryBadge, { backgroundColor: pack.color + '20' }]}>
                <Text style={[styles.categoryBadgeText, { color: pack.color }]}>
                  {pack.category}
                </Text>
              </View>
            </View>

            {/* Content */}
            <View style={styles.packContent}>
              <Text style={[styles.packTitle, { color: theme.text }]}>{pack.title}</Text>
              <Text style={[styles.packDescription, { color: theme.textSecondary }]}>
                {pack.description}
              </Text>

              {/* Task Count */}
              <View style={styles.packMeta}>
                <Ionicons name="list-outline" size={16} color={theme.textMuted} />
                <Text style={[styles.packMetaText, { color: theme.textMuted }]}>
                  {pack.taskCount} tasks
                </Text>
              </View>
            </View>

            {/* Import Button */}
            <Pressable
              onPress={() => handleImport(pack)}
              disabled={importing === pack.id}
              style={[
                styles.importButton,
                { backgroundColor: theme.secondary },
                importing === pack.id && { opacity: 0.6 },
              ]}
            >
              {importing === pack.id ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.importButtonText}>Import Pack</Text>
                </>
              )}
            </Pressable>
          </Animated.View>
        ))}

        {filteredPacks.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No packs in this category
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Try selecting a different category
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
  },
  subtitle: {
    fontSize: Typography.size.base,
    marginTop: Spacing.xs,
  },
  categorySection: {
    paddingVertical: Spacing.md,
  },
  categoryScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  packCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  packHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  packIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  categoryBadgeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  packContent: {
    gap: Spacing.sm,
  },
  packTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  packDescription: {
    fontSize: Typography.size.sm,
    lineHeight: Typography.size.sm * 1.5,
  },
  packMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  packMetaText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
  },
  importButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
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
