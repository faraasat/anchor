// Enhanced AI Insights Screen - Newell AI powered analytics
// Phase 2: Daily Briefing with conversational intelligence
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Platform, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@fastshot/auth';
import { useTheme } from '@/hooks/useColorScheme';
import { useHousehold } from '@/contexts/HouseholdContext';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { ReminderService } from '@/services/ReminderService';
import { AIInsightsService, type ProductivityInsight } from '@/services/AIInsightsService';
import { DailyBriefingService, type DailyBriefing, type EveningReflection } from '@/services/DailyBriefingService';
import { WeatherService, type WeatherData } from '@/services/WeatherService';
import { DailyBriefingCard } from '@/components/DailyBriefingCard';
import type { Reminder } from '@/types/reminder';

export default function InsightsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { currentHousehold, members } = useHousehold();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [insights, setInsights] = useState<ProductivityInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [streak, setStreak] = useState(12);

  // Phase 2: Daily Briefing state
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [reflection, setReflection] = useState<EveningReflection | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, currentHousehold]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load reminders from Supabase
      const stored = currentHousehold
        ? await ReminderService.getHouseholdReminders(currentHousehold.id)
        : await ReminderService.getAll(user.id);

      setReminders(stored);

      // Load weather data
      const weatherData = await WeatherService.getCurrentWeather();
      setWeather(weatherData);

      // Generate AI insights with mock stats
      const mockStats = Array.from({ length: 14 }, (_, i) => ({
        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
        completion_rate: 70 + Math.random() * 20,
        completed_count: Math.floor(Math.random() * 10) + 5,
      }));

      const aiInsights = await AIInsightsService.generateProductivityInsights(
        user.id,
        stored,
        mockStats
      );

      setInsights(aiInsights);

      // Phase 2: Generate Daily Briefing
      await loadBriefing(stored, weatherData);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBriefing = async (tasks: Reminder[], weatherData: WeatherData | null) => {
    try {
      setBriefingLoading(true);

      const hour = new Date().getHours();
      const today = new Date().toISOString().split('T')[0];

      // Morning briefing (5 AM - 12 PM)
      if (hour >= 5 && hour < 12) {
        const todayTasks = tasks.filter(r => r.dueDate === today);
        const morningBriefing = await DailyBriefingService.generateMorningBriefing(
          todayTasks,
          weatherData || undefined,
          { energyLevel: 'medium' } // Mock wellness data
        );
        setBriefing(morningBriefing);
        setReflection(null);
      }
      // Evening reflection (6 PM - 11 PM)
      else if (hour >= 18 && hour < 23) {
        const completedToday = tasks.filter(
          r => r.dueDate === today && r.status === 'completed'
        );
        const pendingToday = tasks.filter(
          r => r.dueDate === today && r.status === 'pending'
        );
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDate = tomorrow.toISOString().split('T')[0];
        const tomorrowTasks = tasks.filter(r => r.dueDate === tomorrowDate);

        const eveningReflection = await DailyBriefingService.generateEveningReflection(
          completedToday,
          pendingToday,
          tomorrowTasks
        );
        setReflection(eveningReflection);
        setBriefing(null);
      }
      // Default to morning briefing during other times
      else {
        const todayTasks = tasks.filter(r => r.dueDate === today);
        const morningBriefing = await DailyBriefingService.generateMorningBriefing(
          todayTasks,
          weatherData || undefined,
          { energyLevel: 'medium' }
        );
        setBriefing(morningBriefing);
        setReflection(null);
      }
    } catch (error) {
      console.error('Error loading briefing:', error);
    } finally {
      setBriefingLoading(false);
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

  // Calculate stats
  const completedCount = reminders.filter((r) => r.status === 'completed').length;
  const totalCount = reminders.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Mock chart data
  const chartData = [30, 45, 60, 40, 70, 85, 75];
  const maxValue = Math.max(...chartData);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'pattern':
        return 'analytics-outline';
      case 'suggestion':
        return 'bulb-outline';
      case 'warning':
        return 'warning-outline';
      case 'achievement':
        return 'trophy-outline';
      default:
        return 'information-circle-outline';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'pattern':
        return theme.secondary;
      case 'suggestion':
        return theme.accent;
      case 'warning':
        return theme.warning;
      case 'achievement':
        return theme.success;
      default:
        return theme.info;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <Text style={[styles.title, { color: theme.text }]}>Insights</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.secondary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Generating AI insights...
          </Text>
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
        <Text style={[styles.title, { color: theme.text }]}>Insights</Text>
        <Pressable onPress={handleRefresh} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="refresh" size={24} color={theme.textSecondary} />
        </Pressable>
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
        {/* Phase 2: Daily Briefing - AI Narrative Summary */}
        <DailyBriefingCard
          briefing={briefing || undefined}
          reflection={reflection || undefined}
          loading={briefingLoading}
        />

        {/* Completion Rate Card */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(200)}
          style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }, Shadows.md]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="analytics-outline" size={20} color={theme.secondary} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Completion Rate</Text>
          </View>
          <View style={styles.completionContent}>
            <View style={[styles.completionCircle, { borderColor: theme.border }]}>
              <View
                style={[
                  styles.completionProgress,
                  {
                    backgroundColor: theme.secondary,
                    height: `${completionRate}%`,
                  },
                ]}
              />
              <Text style={[styles.completionPercent, { color: theme.text }]}>
                {completionRate}%
              </Text>
            </View>
            <View style={styles.completionStats}>
              <Text style={[styles.streakLabel, { color: theme.textSecondary }]}>
                Current Streak: {streak} days
              </Text>
              <View style={styles.statRow}>
                <View style={[styles.statDot, { backgroundColor: theme.success }]} />
                <Text style={[styles.statText, { color: theme.textSecondary }]}>
                  {completedCount} completed
                </Text>
              </View>
              <View style={styles.statRow}>
                <View style={[styles.statDot, { backgroundColor: theme.warning }]} />
                <Text style={[styles.statText, { color: theme.textSecondary }]}>
                  {totalCount - completedCount} pending
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Productivity Pulse Card */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(200)}
          style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }, Shadows.md]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="pulse-outline" size={20} color={theme.accent} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Productivity Pulse</Text>
          </View>

          {/* Chart */}
          <View style={styles.chartContainer}>
            <View style={styles.chart}>
              {chartData.map((value, index) => (
                <View key={index} style={styles.chartBarContainer}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: `${(value / maxValue) * 100}%`,
                        backgroundColor: index === chartData.length - 2 ? theme.secondary : theme.border,
                      },
                    ]}
                  />
                </View>
              ))}
            </View>
            <View style={[styles.peakBadge, { backgroundColor: theme.secondary }]}>
              <Text style={styles.peakBadgeText}>Peak</Text>
            </View>
          </View>
        </Animated.View>

        {/* AI Insights Card */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(200)}
          style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }, Shadows.md]}
        >
          <View style={styles.cardHeader}>
            <LinearGradient
              colors={[theme.secondary, theme.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.aiIconBadge}
            >
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.cardTitle, { color: theme.text }]}>AI Insights</Text>
          </View>
          <View style={styles.insightsList}>
            {insights.map((insight, index) => (
              <View
                key={index}
                style={[styles.insightItem, { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight }]}
              >
                <Ionicons
                  name={getInsightIcon(insight.type) as any}
                  size={18}
                  color={getInsightColor(insight.type)}
                />
                <View style={styles.insightContent}>
                  <Text style={[styles.insightTitle, { color: theme.text }]}>{insight.title}</Text>
                  <Text style={[styles.insightMessage, { color: theme.textSecondary }]}>
                    {insight.message}
                  </Text>
                </View>
                <View style={[styles.confidenceBadge, { backgroundColor: theme.success + '20' }]}>
                  <Text style={[styles.confidenceText, { color: theme.success }]}>
                    {Math.round((insight.confidence || 0) * 100)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Household Intelligence */}
        {currentHousehold && members.length > 1 && (
          <Animated.View
            entering={FadeInDown.delay(400).duration(200)}
            style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }, Shadows.md]}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="people" size={20} color={theme.accent} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Household Insights</Text>
            </View>
            <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
              {members.length} member{members.length > 1 ? 's' : ''} in {currentHousehold.name}
            </Text>
            <View style={styles.guidelinesList}>
              <View style={styles.guidelineItem}>
                <View style={[styles.guidelineNumber, { backgroundColor: theme.secondary + '20' }]}>
                  <Ionicons name="checkmark" size={16} color={theme.secondary} />
                </View>
                <Text style={[styles.guidelineText, { color: theme.text }]}>
                  Tasks are being completed efficiently across the household
                </Text>
              </View>
              <View style={styles.guidelineItem}>
                <View style={[styles.guidelineNumber, { backgroundColor: theme.accent + '20' }]}>
                  <Ionicons name="location" size={16} color={theme.accent} />
                </View>
                <Text style={[styles.guidelineText, { color: theme.text }]}>
                  Enable location services for smart task suggestions based on member proximity
                </Text>
              </View>
            </View>
          </Animated.View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.size['2xl'],
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
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
    marginBottom: Spacing.lg,
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
  aiIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  completionCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  completionProgress: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 50,
  },
  completionPercent: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  completionStats: {
    flex: 1,
    gap: Spacing.sm,
  },
  streakLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    marginBottom: Spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statText: {
    fontSize: Typography.size.sm,
  },
  chartContainer: {
    height: 120,
    position: 'relative',
  },
  chart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingRight: 50,
  },
  chartBarContainer: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    borderRadius: BorderRadius.sm,
    minHeight: 8,
  },
  peakBadge: {
    position: 'absolute',
    right: 0,
    top: '30%',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  peakBadgeText: {
    color: '#FFFFFF',
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  insightsList: {
    gap: Spacing.sm,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  insightContent: {
    flex: 1,
    gap: 2,
  },
  insightTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  insightMessage: {
    fontSize: Typography.size.sm,
    lineHeight: Typography.size.sm * 1.4,
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
  predictedList: {
    gap: Spacing.sm,
  },
  predictedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  predictedContent: {
    flex: 1,
    gap: 2,
  },
  predictedTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
  predictedReason: {
    fontSize: Typography.size.xs,
    fontStyle: 'italic',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guidelinesList: {
    gap: Spacing.md,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  guidelineNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guidelineNumberText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
  guidelineText: {
    flex: 1,
    fontSize: Typography.size.sm,
    lineHeight: Typography.size.sm * 1.5,
  },
});
