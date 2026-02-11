// Phase 5: Commute Mode
// Contextual layout for car anchor triggers with enlarged buttons and voice briefing
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useAuth } from '@fastshot/auth';
import { useThemeEngine, getTimeGreeting } from '@/contexts/ThemeEngineContext';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { Reminder } from '@/types/reminder';
import { ReminderService } from '@/services/ReminderService';
import { WeatherService, WeatherData } from '@/services/WeatherService';

export default function CommuteScreen() {
  const { theme } = useThemeEngine();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
      // Auto-play briefing after a short delay
      setTimeout(() => {
        handlePlayBriefing();
      }, 1500);
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const [loadedReminders, weatherData] = await Promise.all([
        ReminderService.getAll(user.id),
        WeatherService.getCurrentWeather().catch(() => null),
      ]);

      // Get today's reminders
      const today = new Date().toISOString().split('T')[0];
      const todayReminders = loadedReminders.filter((r: Reminder) => r.dueDate === today);
      setReminders(todayReminders);
      setWeather(weatherData);
    } catch (error) {
      console.error('Error loading commute data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateBriefing = (): string => {
    const greeting = getTimeGreeting();
    let briefing = `${greeting}. `;

    // Weather
    if (weather) {
      briefing += `Current temperature is ${weather.temperature} degrees, with ${weather.condition}. `;
    }

    // Reminders
    if (reminders.length === 0) {
      briefing += "You have no tasks scheduled for today. Enjoy your day!";
    } else if (reminders.length === 1) {
      briefing += `You have one task today: ${reminders[0].title}`;
      if (reminders[0].dueTime) {
        briefing += ` at ${reminders[0].dueTime}`;
      }
    } else {
      briefing += `You have ${reminders.length} tasks today. `;

      // List first 3 tasks
      const topReminders = reminders.slice(0, 3);
      topReminders.forEach((reminder, index) => {
        if (index === topReminders.length - 1 && topReminders.length > 1) {
          briefing += "and ";
        }
        briefing += `${reminder.title}`;
        if (reminder.dueTime) {
          briefing += ` at ${reminder.dueTime}`;
        }
        briefing += ". ";
      });

      if (reminders.length > 3) {
        briefing += `Plus ${reminders.length - 3} more.`;
      }
    }

    return briefing;
  };

  const handlePlayBriefing = async () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);
      const briefing = generateBriefing();

      await Speech.speak(briefing, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch (error) {
      console.error('Error speaking briefing:', error);
      setIsSpeaking(false);
    }
  };

  const handleCompleteTask = async (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    try {
      await ReminderService.markComplete(id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleExit = () => {
    if (isSpeaking) {
      Speech.stop();
    }
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <Pressable onPress={handleExit} hitSlop={20}>
          <Ionicons name="close" size={36} color={theme.text} />
        </Pressable>

        <View style={styles.headerContent}>
          <Ionicons name="car" size={32} color={theme.secondary} />
          <Text style={[styles.headerTitle, { color: theme.text }]}>
            Commute Mode
          </Text>
        </View>

        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
      >
        {/* Daily Briefing Card */}
        <Animated.View entering={FadeIn.delay(200).duration(400)}>
          <Pressable
            style={[styles.briefingCard, { backgroundColor: theme.surface }]}
            onPress={handlePlayBriefing}
          >
            <LinearGradient
              colors={[theme.secondary + '20', theme.accent + '20']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.briefingHeader}>
              <Ionicons
                name={isSpeaking ? 'pause-circle' : 'play-circle'}
                size={64}
                color={theme.secondary}
              />
              <View style={styles.briefingText}>
                <Text style={[styles.briefingTitle, { color: theme.text }]}>
                  Daily Briefing
                </Text>
                <Text style={[styles.briefingSubtitle, { color: theme.textSecondary }]}>
                  {isSpeaking ? 'Playing...' : 'Tap to listen'}
                </Text>
              </View>
            </View>

            {/* Weather preview */}
            {weather && (
              <View style={styles.weatherPreview}>
                <Ionicons name="sunny" size={20} color={theme.accent} />
                <Text style={[styles.weatherText, { color: theme.textSecondary }]}>
                  {weather.temperature}°F • {weather.condition}
                </Text>
              </View>
            )}
          </Pressable>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeIn.delay(400).duration(400)}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Quick Actions
          </Text>

          <View style={styles.quickActions}>
            <Pressable
              style={[styles.quickActionButton, { backgroundColor: theme.secondary }]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                router.push('/(tabs)');
              }}
            >
              <Ionicons name="list" size={32} color={theme.textInverse} />
              <Text style={[styles.quickActionText, { color: theme.textInverse }]}>
                View All
              </Text>
            </Pressable>

            <Pressable
              style={[styles.quickActionButton, { backgroundColor: theme.accent }]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                // Open voice command
              }}
            >
              <Ionicons name="mic" size={32} color={theme.textInverse} />
              <Text style={[styles.quickActionText, { color: theme.textInverse }]}>
                Voice Add
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Today's Tasks - Large Touch Targets */}
        {reminders.length > 0 && (
          <Animated.View entering={FadeIn.delay(600).duration(400)}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Today's Tasks ({reminders.length})
            </Text>

            {reminders.slice(0, 5).map((reminder, index) => (
              <Pressable
                key={reminder.id}
                style={[styles.taskCard, { backgroundColor: theme.surface }]}
                onPress={() => handleCompleteTask(reminder.id)}
              >
                <View style={styles.taskContent}>
                  <View
                    style={[
                      styles.checkCircle,
                      {
                        borderColor: theme.border,
                        backgroundColor: theme.background,
                      },
                    ]}
                  >
                    <Ionicons name="checkmark" size={28} color={theme.success} />
                  </View>

                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskTitle, { color: theme.text }]}>
                      {reminder.title}
                    </Text>

                    {reminder.dueTime && (
                      <View style={styles.taskMeta}>
                        <Ionicons name="time" size={18} color={theme.textMuted} />
                        <Text style={[styles.taskTime, { color: theme.textMuted }]}>
                          {reminder.dueTime}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            ))}

            {reminders.length > 5 && (
              <Text style={[styles.moreText, { color: theme.textSecondary }]}>
                +{reminders.length - 5} more tasks
              </Text>
            )}
          </Animated.View>
        )}

        {/* Safety Notice */}
        <Animated.View entering={FadeIn.delay(800).duration(400)}>
          <View style={[styles.safetyNotice, { backgroundColor: theme.warning + '20' }]}>
            <Ionicons name="warning" size={20} color={theme.warning} />
            <Text style={[styles.safetyText, { color: theme.textSecondary }]}>
              Stay safe. Pull over before interacting extensively with your device.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    gap: Spacing.xl,
  },
  briefingCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  briefingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  briefingText: {
    flex: 1,
  },
  briefingTitle: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
  },
  briefingSubtitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
  weatherPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  weatherText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
  sectionTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickActionButton: {
    flex: 1,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: 120,
  },
  quickActionText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  taskCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    minHeight: 100,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  checkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.xs,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  taskTime: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
  moreText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  safetyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  safetyText: {
    flex: 1,
    fontSize: Typography.size.sm,
    lineHeight: 20,
  },
});
