// Enhanced AI Insights Lab - Phase 8: Full Analytics Suite
// NOTE: This is the "Pro" version with all features. Free users see limited version.
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
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/hooks/useColorScheme';
import { useHousehold } from '@/contexts/HouseholdContext';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { ReminderService } from '@/services/ReminderService';
import { ProcrastinationProfilerService } from '@/services/ProcrastinationProfilerService';
import { BacklogRiskService } from '@/services/BacklogRiskService';
import { PatternDetectionService } from '@/services/PatternDetectionService';
import { AnchorStreakService } from '@/services/AnchorStreakService';
import { BacklogHealthMeter } from '@/components/BacklogHealthMeter';
import { ProductivityPeaksChart } from '@/components/ProductivityPeaksChart';
import type { Reminder } from '@/types/reminder';
import type {
  ProcrastinationProfile,
  BacklogRiskScore,
  PatternDetection,
  AnchorStreak,
  ProductivityPeak,
} from '@/types/phase8';

export default function InsightsProScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { currentHousehold } = useHousehold();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Phase 8: AI Insights
  const [procrastinationProfile, setProcrastinationProfile] =
    useState<ProcrastinationProfile | null>(null);
  const [backlogRisk, setBacklogRisk] = useState<BacklogRiskScore | null>(null);
  const [patterns, setPatterns] = useState<PatternDetection[]>([]);
  const [streak, setStreak] = useState<AnchorStreak | null>(null);
  const [productivityPeaks, setProductivityPeaks] = useState<ProductivityPeak[]>(
    []
  );

  // Mock: Check if user is Pro (replace with actual RevenueCat check)
  const [isPro, setIsPro] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, currentHousehold]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load reminders
      const stored = currentHousehold
        ? await ReminderService.getHouseholdReminders(currentHousehold.id)
        : await ReminderService.getAll(user.id);

      setReminders(stored);

      // Load streak
      const userStreak = await AnchorStreakService.getStreak(user.id);
      setStreak(userStreak);

      if (isPro) {
        // Pro features: Full AI Insights Lab
        await loadProInsights(stored);
      }
    } catch (error) {
      console.error('Error loading insights:', error);
      Alert.alert('Error', 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const loadProInsights = async (tasks: Reminder[]) => {
    try {
      // Procrastination Profile
      const profile = await ProcrastinationProfilerService.generateProfile(
        user!.id,
        tasks
      );
      setProcrastinationProfile(profile);

      // Backlog Risk Score
      const risk = await BacklogRiskService.calculateRiskScore(user!.id, tasks);
      setBacklogRisk(risk);

      // Pattern Detection
      const completedTasks = tasks.filter((r) => r.status === 'completed');
      const detectedPatterns = await PatternDetectionService.detectPatterns(
        user!.id,
        completedTasks
      );
      setPatterns(detectedPatterns.filter(PatternDetectionService.shouldShowSuggestion));

      // Productivity Peaks (mock data for demo)
      const peaks = generateProductivityPeaks(tasks);
      setProductivityPeaks(peaks);
    } catch (error) {
      console.error('Error loading pro insights:', error);
    }
  };

  const handleRefresh = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handlePurgeSession = () => {
    Alert.alert(
      'Start Purge Session',
      'This will help you review and clean up old tasks. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: () => {
            // Navigate to purge session screen (to be implemented)
            Alert.alert('Purge Session', 'Feature coming soon!');
          },
        },
      ]
    );
  };

  const handleCreatePatternReminder = (pattern: PatternDetection) => {
    Alert.alert(
      'Create Reminder',
      `Create "${pattern.suggestedReminder.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: async () => {
            try {
              const newReminder: Reminder = {
                id: Math.random().toString(36).substring(7),
                userId: user!.id,
                title: pattern.suggestedReminder.title,
                description: pattern.suggestedReminder.description,
                dueDate: new Date().toISOString().split('T')[0],
                dueTime: pattern.suggestedReminder.dueTime,
                tag: pattern.suggestedReminder.tag as TagType,
                status: 'pending',
                priority: 'medium',
                recurrence: { type: 'none' },
                isRecurring: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                aiPredicted: true,
                aiConfidence: pattern.confidence,
              };

              await ReminderService.create(newReminder, currentHousehold?.id);

              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }

              Alert.alert('Success', 'Reminder created!');
            } catch (error) {
              Alert.alert('Error', 'Failed to create reminder');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <Text style={[styles.title, { color: theme.text }]}>AI Insights Lab</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.secondary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Analyzing your productivity...
          </Text>
        </View>
      </View>
    );
  }

  if (!isPro) {
    // Free tier: Show upgrade prompt
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <Text style={[styles.title, { color: theme.text }]}>AI Insights Lab</Text>
        </View>
        <View style={styles.upgradeContainer}>
          <LinearGradient
            colors={[theme.secondary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.upgradeCard}
          >
            <Ionicons name="sparkles" size={48} color="#FFFFFF" />
            <Text style={styles.upgradeTitle}>Unlock Full Insights</Text>
            <Text style={styles.upgradeSubtitle}>
              Get Procrastination Profiler, Productivity Peaks, and advanced
              analytics with Anchor Pro
            </Text>
            <Pressable style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            </Pressable>
          </LinearGradient>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        <Text style={[styles.title, { color: theme.text }]}>AI Insights Lab</Text>
        <View style={styles.headerBadge}>
          <LinearGradient
            colors={[theme.secondary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.proBadge}
          >
            <Ionicons name="star" size={12} color="#FFFFFF" />
            <Text style={styles.proBadgeText}>PRO</Text>
          </LinearGradient>
        </View>
      </Animated.View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.secondary}
            colors={[theme.secondary]}
          />
        }
      >
        {/* Anchor Streak */}
        {streak && (
          <Animated.View
            entering={FadeInDown.delay(100).duration(200)}
            style={[
              styles.card,
              { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
              Shadows.md,
            ]}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="flame" size={20} color="#F59E0B" />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Anchor Streak
              </Text>
            </View>
            <View style={styles.streakContent}>
              <View style={styles.streakMain}>
                <Text style={[styles.streakNumber, { color: theme.text }]}>
                  {streak.currentStreak}
                </Text>
                <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>
                  Day Streak
                </Text>
              </View>
              <View style={styles.streakStats}>
                <View style={styles.streakStat}>
                  <Text style={[styles.streakStatValue, { color: theme.text }]}>
                    {streak.longestStreak}
                  </Text>
                  <Text style={[styles.streakStatLabel, { color: theme.textSecondary }]}>
                    Longest
                  </Text>
                </View>
                <View style={styles.streakStat}>
                  <Text style={[styles.streakStatValue, { color: theme.text }]}>
                    {streak.totalCompletions}
                  </Text>
                  <Text style={[styles.streakStatLabel, { color: theme.textSecondary }]}>
                    Total
                  </Text>
                </View>
              </View>
            </View>
            <Text style={[styles.streakMessage, { color: theme.textSecondary }]}>
              {AnchorStreakService.getMotivationMessage(streak.currentStreak)}
            </Text>
          </Animated.View>
        )}

        {/* Backlog Health Meter */}
        {backlogRisk && (
          <BacklogHealthMeter
            riskScore={backlogRisk}
            onPurgeSession={handlePurgeSession}
            onViewDetails={() => Alert.alert('Details', 'Coming soon!')}
          />
        )}

        {/* Productivity Peaks */}
        {productivityPeaks.length > 0 && (
          <ProductivityPeaksChart peaks={productivityPeaks} />
        )}

        {/* Procrastination Profile */}
        {procrastinationProfile && (
          <Animated.View
            entering={FadeInDown.delay(400).duration(200)}
            style={[
              styles.card,
              { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
              Shadows.md,
            ]}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="time" size={20} color={theme.warning} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Procrastination Profile
              </Text>
            </View>
            <View style={styles.procrastinationScore}>
              <Text style={[styles.scoreNumber, { color: theme.warning }]}>
                {procrastinationProfile.procrastinationScore}
              </Text>
              <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>
                / 100
              </Text>
            </View>
            <Text style={[styles.peakTimeText, { color: theme.textSecondary }]}>
              Peak procrastination: {procrastinationProfile.peakProcrastinationTime}
            </Text>

            {/* Top Procrastinated Categories */}
            <View style={styles.categoryList}>
              {procrastinationProfile.topProcrastinatedCategories
                .slice(0, 3)
                .map((cat, index) => (
                  <View
                    key={index}
                    style={[
                      styles.categoryItem,
                      {
                        backgroundColor: theme.surfaceElevated,
                        borderColor: theme.borderLight,
                      },
                    ]}
                  >
                    <Text style={[styles.categoryName, { color: theme.text }]}>
                      {cat.category}
                    </Text>
                    <Text style={[styles.categorySnooze, { color: theme.textMuted }]}>
                      {cat.snoozeCount} snoozes
                    </Text>
                  </View>
                ))}
            </View>

            {/* AI Suggestions */}
            <View style={styles.suggestions}>
              {procrastinationProfile.suggestedFixes.map((fix, index) => (
                <View
                  key={index}
                  style={[
                    styles.suggestionItem,
                    {
                      backgroundColor: theme.info + '10',
                      borderColor: theme.info + '30',
                    },
                  ]}
                >
                  <Ionicons name="bulb-outline" size={16} color={theme.info} />
                  <Text style={[styles.suggestionText, { color: theme.text }]}>
                    {fix.suggestion}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Pattern Detection */}
        {patterns.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(500).duration(200)}
            style={[
              styles.card,
              { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
              Shadows.md,
            ]}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="analytics" size={20} color={theme.accent} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Pattern Suggestions
              </Text>
            </View>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
              Based on your habits, we suggest these reminders:
            </Text>

            {patterns.map((pattern, index) => (
              <View
                key={index}
                style={[
                  styles.patternItem,
                  {
                    backgroundColor: theme.surfaceElevated,
                    borderColor: theme.borderLight,
                  },
                ]}
              >
                <View style={styles.patternHeader}>
                  <Text style={[styles.patternTitle, { color: theme.text }]}>
                    {pattern.suggestedReminder.title}
                  </Text>
                  <View
                    style={[
                      styles.confidenceBadge,
                      { backgroundColor: theme.success + '20' },
                    ]}
                  >
                    <Text style={[styles.confidenceText, { color: theme.success }]}>
                      {Math.round(pattern.confidence * 100)}%
                    </Text>
                  </View>
                </View>
                <Text style={[styles.patternDescription, { color: theme.textSecondary }]}>
                  {pattern.pattern}
                </Text>
                <Pressable
                  style={[styles.createButton, { backgroundColor: theme.secondary }]}
                  onPress={() => handleCreatePatternReminder(pattern)}
                >
                  <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.createButtonText}>Create Reminder</Text>
                </Pressable>
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

// Helper function to generate mock productivity peaks
function generateProductivityPeaks(reminders: Reminder[]): ProductivityPeak[] {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const hourStats: Record<
    number,
    { completed: number; total: number }
  > = {};

  // Analyze completion times
  reminders.forEach((r) => {
    if (r.status === 'completed' && r.completedAt) {
      const hour = new Date(r.completedAt).getHours();
      if (!hourStats[hour]) hourStats[hour] = { completed: 0, total: 0 };
      hourStats[hour].completed++;
      hourStats[hour].total++;
    }
  });

  return hours
    .map((hour) => {
      const stats = hourStats[hour] || { completed: 0, total: 1 };
      const rate = (stats.completed / Math.max(stats.total, 1)) * 100;

      return {
        timeSlot: `${String(hour).padStart(2, '0')}:00`,
        completionRate: rate,
        averageTasksCompleted: stats.completed,
        energyLevel: (rate > 70 ? 'high' : rate > 40 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
      };
    })
    .filter((p) => p.completionRate > 0);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.size.base,
  },
  upgradeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  upgradeCard: {
    width: '100%',
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  upgradeTitle: {
    color: '#FFFFFF',
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    marginTop: Spacing.md,
  },
  upgradeSubtitle: {
    color: '#FFFFFF',
    fontSize: Typography.size.base,
    textAlign: 'center',
    opacity: 0.9,
  },
  upgradeButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  upgradeButtonText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    flex: 1,
  },
  cardSubtitle: {
    fontSize: Typography.size.sm,
    marginBottom: Spacing.md,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  streakMain: {
    flex: 1,
    alignItems: 'center',
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: Typography.weight.bold,
  },
  streakLabel: {
    fontSize: Typography.size.sm,
    marginTop: Spacing.xs,
  },
  streakStats: {
    flex: 1,
    gap: Spacing.md,
  },
  streakStat: {
    alignItems: 'center',
  },
  streakStatValue: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  streakStatLabel: {
    fontSize: Typography.size.xs,
  },
  streakMessage: {
    fontSize: Typography.size.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  procrastinationScore: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginVertical: Spacing.md,
  },
  scoreNumber: {
    fontSize: 56,
    fontWeight: Typography.weight.bold,
  },
  scoreLabel: {
    fontSize: Typography.size.xl,
    marginLeft: Spacing.xs,
  },
  peakTimeText: {
    fontSize: Typography.size.sm,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  categoryList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  categoryName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
  categorySnooze: {
    fontSize: Typography.size.sm,
  },
  suggestions: {
    gap: Spacing.sm,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  suggestionText: {
    flex: 1,
    fontSize: Typography.size.sm,
    lineHeight: Typography.size.sm * 1.5,
  },
  patternItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  patternTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  confidenceText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  patternDescription: {
    fontSize: Typography.size.sm,
    marginBottom: Spacing.md,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
});
