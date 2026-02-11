// Wellness Screen - Pomodoro, Water, Steps with AI Insights
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { PomodoroTimer } from '@/components/wellness/PomodoroTimer';
import { WaterTracker } from '@/components/wellness/WaterTracker';
import { Pedometer } from '@/components/wellness/Pedometer';
import { WellnessAIService, type WellnessData, type WellnessInsight } from '@/services/WellnessAIService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WELLNESS_STORAGE_KEY = '@anchor_wellness_tracking';

export default function WellnessScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [aiInsights, setAiInsights] = useState<WellnessInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [wellnessData, setWellnessData] = useState<WellnessData>({
    pomodoroSessions: 0,
    waterIntake: 0,
    steps: 0,
    sleepHours: 7,
  });

  useEffect(() => {
    loadWellnessData();
  }, []);

  useEffect(() => {
    if (wellnessData.pomodoroSessions || wellnessData.waterIntake || wellnessData.steps) {
      generateAIInsights();
    }
  }, [wellnessData]);

  const loadWellnessData = async () => {
    try {
      const stored = await AsyncStorage.getItem(WELLNESS_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setWellnessData(data);
      }
    } catch (error) {
      console.error('Error loading wellness data:', error);
    }
  };

  const saveWellnessData = async (data: Partial<WellnessData>) => {
    try {
      const updated = { ...wellnessData, ...data };
      setWellnessData(updated);
      await AsyncStorage.setItem(WELLNESS_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving wellness data:', error);
    }
  };

  const generateAIInsights = async () => {
    setInsightsLoading(true);
    try {
      const data: WellnessData = {
        steps: wellnessData.steps || 0,
        stepsGoal: 10000,
        sleepHours: wellnessData.sleepHours || 7,
        sleepQuality: (wellnessData.sleepHours || 7) >= 7 ? 'good' : (wellnessData.sleepHours || 7) >= 6 ? 'fair' : 'poor',
        waterIntake: wellnessData.waterIntake || 0,
        waterGoal: 8,
        pomodoroSessions: wellnessData.pomodoroSessions || 0,
        focusTime: (wellnessData.pomodoroSessions || 0) * 25,
        activityLevel: (wellnessData.steps || 0) > 8000 ? 'active' : (wellnessData.steps || 0) > 5000 ? 'moderate' : 'light',
      };

      const insights = await WellnessAIService.generateWellnessInsights(data);
      setAiInsights(insights);
    } catch (error) {
      console.error('Error generating AI insights:', error);
    } finally {
      setInsightsLoading(false);
    }
  };

  const handlePomodoroComplete = () => {
    saveWellnessData({ pomodoroSessions: (wellnessData.pomodoroSessions || 0) + 1 });
  };

  const handleWaterUpdate = (glasses: number) => {
    saveWellnessData({ waterIntake: glasses });
  };

  const handleStepsUpdate = (steps: number) => {
    saveWellnessData({ steps });
  };

  const handleRefreshInsights = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    generateAIInsights();
  };

  const getInsightIcon = (icon: string) => {
    return icon as any;
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'suggestion':
        return theme.accent;
      case 'warning':
        return theme.warning;
      case 'achievement':
        return theme.success;
      case 'tip':
        return theme.info;
      default:
        return theme.secondary;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Wellness Tools',
          headerStyle: { backgroundColor: theme.primary },
          headerTintColor: theme.textInverse,
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={{ marginLeft: Spacing.sm }}>
              <Ionicons name="arrow-back" size={24} color={theme.textInverse} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={handleRefreshInsights}
              disabled={insightsLoading}
              style={{ marginRight: Spacing.sm }}
            >
              <Ionicons
                name="refresh"
                size={24}
                color={insightsLoading ? theme.textMuted : theme.textInverse}
              />
            </Pressable>
          ),
        }}
      />

      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing['3xl'] }]}
          showsVerticalScrollIndicator={false}
        >
          {/* AI Insights Card */}
          {(aiInsights.length > 0 || insightsLoading) && (
            <Animated.View
              entering={FadeInDown.delay(50).duration(300)}
              style={[
                styles.insightsCard,
                { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
                Shadows.md,
              ]}
            >
              <View style={styles.insightsHeader}>
                <LinearGradient
                  colors={[theme.secondary, theme.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.aiIcon}
                >
                  <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.insightsTitle, { color: theme.text }]}>AI Insights</Text>
                {insightsLoading && <ActivityIndicator size="small" color={theme.secondary} />}
              </View>

              {insightsLoading && aiInsights.length === 0 ? (
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                  Analyzing your wellness data...
                </Text>
              ) : (
                <View style={styles.insightsList}>
                  {aiInsights.map((insight, index) => (
                    <View
                      key={index}
                      style={[
                        styles.insightItem,
                        { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight },
                      ]}
                    >
                      <View
                        style={[
                          styles.insightIconBadge,
                          { backgroundColor: getInsightColor(insight.type) + '20' },
                        ]}
                      >
                        <Ionicons
                          name={getInsightIcon(insight.icon)}
                          size={18}
                          color={getInsightColor(insight.type)}
                        />
                      </View>
                      <View style={styles.insightContent}>
                        <Text style={[styles.insightTitle, { color: theme.text }]}>
                          {insight.title}
                        </Text>
                        <Text style={[styles.insightMessage, { color: theme.textSecondary }]}>
                          {insight.message}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </Animated.View>
          )}

          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <PomodoroTimer onComplete={handlePomodoroComplete} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <WaterTracker onUpdate={handleWaterUpdate} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <Pedometer onUpdate={handleStepsUpdate} />
          </Animated.View>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  insightsCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  aiIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightsTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    flex: 1,
  },
  loadingText: {
    fontSize: Typography.size.sm,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  insightsList: {
    gap: Spacing.sm,
  },
  insightItem: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  insightIconBadge: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
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
});
