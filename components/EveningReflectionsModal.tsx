// Evening Reflections Modal - AI-powered end-of-day summary and reflection
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { useTheme, useColorScheme } from '@/hooks/useColorScheme';
import { Reminder } from '@/types/reminder';
import { NewellAI } from '@fastshot/ai';
import { Spacing, Typography, Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface EveningReflectionsModalProps {
  visible: boolean;
  onClose: () => void;
  completedTasks: Reminder[];
  pendingTasks: Reminder[];
  userName?: string;
}

interface DailyReflection {
  summary: string;
  achievements: string[];
  insights: string[];
  tomorrowSuggestions: string[];
  mood: 'productive' | 'balanced' | 'challenging' | 'excellent';
  encouragement: string;
}

export function EveningReflectionsModal({
  visible,
  onClose,
  completedTasks,
  pendingTasks,
  userName = 'there',
}: EveningReflectionsModalProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();

  const [loading, setLoading] = useState(true);
  const [reflection, setReflection] = useState<DailyReflection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      generateReflection();
    }
  }, [visible, completedTasks, pendingTasks]);

  const generateReflection = async () => {
    try {
      setLoading(true);
      setError(null);

      const completionRate =
        completedTasks.length / (completedTasks.length + pendingTasks.length) || 0;

      const prompt = `You are a thoughtful AI coach helping a user reflect on their day. Generate a personalized evening reflection based on their task completion.

Today's Tasks:
- Completed: ${completedTasks.length}
- Pending: ${pendingTasks.length}
- Completion Rate: ${Math.round(completionRate * 100)}%

Completed Tasks:
${completedTasks.slice(0, 10).map((t, i) => `${i + 1}. ${t.title} (${t.tag})`).join('\n')}

Pending Tasks:
${pendingTasks.slice(0, 5).map((t, i) => `${i + 1}. ${t.title} (${t.tag})`).join('\n')}

Generate a warm, encouraging reflection in JSON format:
{
  "summary": "1-2 sentence summary of their day",
  "achievements": ["2-3 specific accomplishments to celebrate"],
  "insights": ["2-3 insightful observations about their productivity patterns"],
  "tomorrowSuggestions": ["2-3 actionable suggestions for tomorrow"],
  "mood": "productive|balanced|challenging|excellent",
  "encouragement": "A warm, personalized encouragement message"
}

Be specific, reference actual tasks when possible, and maintain a supportive, non-judgmental tone.`;

      const response = await NewellAI.generateText(prompt, {
        model: 'gpt-4o',
        temperature: 0.8,
        maxTokens: 800,
      });

      const cleanedResponse = response.text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      const parsedReflection: DailyReflection = JSON.parse(cleanedResponse);

      setReflection(parsedReflection);
    } catch (err: any) {
      console.error('Error generating reflection:', err);
      setError('Unable to generate reflection. Please try again.');

      // Fallback reflection
      setReflection(getFallbackReflection());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackReflection = (): DailyReflection => {
    const completionRate =
      completedTasks.length / (completedTasks.length + pendingTasks.length) || 0;

    return {
      summary: `You completed ${completedTasks.length} tasks today. That's ${Math.round(completionRate * 100)}% of your planned work!`,
      achievements: [
        `Finished ${completedTasks.length} tasks`,
        'Stayed focused on your priorities',
        'Made progress towards your goals',
      ],
      insights: [
        'You work best when you break tasks into smaller steps',
        'Regular breaks help maintain your productivity',
      ],
      tomorrowSuggestions: [
        `Focus on completing the ${pendingTasks.length} remaining tasks`,
        'Start with your most important task first',
        'Set clear priorities for the day',
      ],
      mood: completionRate > 0.8 ? 'excellent' : completionRate > 0.5 ? 'productive' : 'balanced',
      encouragement:
        completionRate > 0.8
          ? '🌟 Excellent work today! You crushed it!'
          : completionRate > 0.5
          ? '💪 Great progress today! Keep it up!'
          : '🌱 Every step forward counts. Tomorrow is a new opportunity!',
    };
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'excellent':
        return 'trophy';
      case 'productive':
        return 'flame';
      case 'balanced':
        return 'leaf';
      case 'challenging':
        return 'shield';
      default:
        return 'happy';
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'excellent':
        return '#F59E0B';
      case 'productive':
        return '#10B981';
      case 'balanced':
        return '#3B82F6';
      case 'challenging':
        return '#8B5CF6';
      default:
        return theme.secondary;
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" transparent>
      <View style={styles.overlay}>
        <Animated.View
          entering={SlideInDown.duration(400).springify()}
          style={[styles.container, { backgroundColor: theme.background }]}
        >
          {/* Header */}
          <LinearGradient
            colors={[theme.secondary + 'CC', theme.accent + 'AA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View>
                <Text style={[styles.greeting, { color: theme.textInverse }]}>
                  Evening, {userName}
                </Text>
                <Text style={[styles.headerSubtitle, { color: theme.textInverse + 'CC' }]}>
                  Let's reflect on your day
                </Text>
              </View>
              <Pressable onPress={handleClose} hitSlop={10}>
                <Ionicons name="close" size={28} color={theme.textInverse} />
              </Pressable>
            </View>
          </LinearGradient>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.secondary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                  Generating your reflection...
                </Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={48} color={theme.error} />
                <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
                <Pressable
                  style={[styles.retryButton, { backgroundColor: theme.secondary }]}
                  onPress={generateReflection}
                >
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </Pressable>
              </View>
            ) : reflection ? (
              <>
                {/* Mood Badge */}
                <Animated.View entering={FadeInDown.delay(100).duration(300)} style={styles.section}>
                  <View
                    style={[
                      styles.moodBadge,
                      { backgroundColor: getMoodColor(reflection.mood) + '20' },
                    ]}
                  >
                    <Ionicons
                      name={getMoodIcon(reflection.mood) as any}
                      size={32}
                      color={getMoodColor(reflection.mood)}
                    />
                    <Text style={[styles.moodText, { color: getMoodColor(reflection.mood) }]}>
                      {reflection.mood.charAt(0).toUpperCase() + reflection.mood.slice(1)} Day
                    </Text>
                  </View>
                </Animated.View>

                {/* Summary */}
                <Animated.View entering={FadeInDown.delay(200).duration(300)} style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Today's Summary</Text>
                  <View style={[styles.card, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.summaryText, { color: theme.textSecondary }]}>
                      {reflection.summary}
                    </Text>
                  </View>
                </Animated.View>

                {/* Achievements */}
                {reflection.achievements.length > 0 && (
                  <Animated.View entering={FadeInDown.delay(300).duration(300)} style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      🎉 Achievements
                    </Text>
                    <View style={[styles.card, { backgroundColor: theme.surface }]}>
                      {reflection.achievements.map((achievement, index) => (
                        <View key={index} style={styles.listItem}>
                          <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                          <Text style={[styles.listItemText, { color: theme.text }]}>
                            {achievement}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </Animated.View>
                )}

                {/* Insights */}
                {reflection.insights.length > 0 && (
                  <Animated.View entering={FadeInDown.delay(400).duration(300)} style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>💡 Insights</Text>
                    <View style={[styles.card, { backgroundColor: theme.surface }]}>
                      {reflection.insights.map((insight, index) => (
                        <View key={index} style={styles.listItem}>
                          <Ionicons name="bulb" size={20} color={theme.secondary} />
                          <Text style={[styles.listItemText, { color: theme.text }]}>
                            {insight}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </Animated.View>
                )}

                {/* Tomorrow's Suggestions */}
                {reflection.tomorrowSuggestions.length > 0 && (
                  <Animated.View entering={FadeInDown.delay(500).duration(300)} style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      🌅 For Tomorrow
                    </Text>
                    <View style={[styles.card, { backgroundColor: theme.surface }]}>
                      {reflection.tomorrowSuggestions.map((suggestion, index) => (
                        <View key={index} style={styles.listItem}>
                          <Ionicons name="arrow-forward-circle" size={20} color={theme.accent} />
                          <Text style={[styles.listItemText, { color: theme.text }]}>
                            {suggestion}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </Animated.View>
                )}

                {/* Encouragement */}
                <Animated.View entering={FadeInDown.delay(600).duration(300)} style={styles.section}>
                  <View style={[styles.encouragementCard, { backgroundColor: theme.secondary + '20' }]}>
                    <Text style={[styles.encouragementText, { color: theme.text }]}>
                      {reflection.encouragement}
                    </Text>
                  </View>
                </Animated.View>
              </>
            ) : null}
          </ScrollView>

          {/* Footer Button */}
          <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
            <Pressable
              onPress={handleClose}
              style={[styles.doneButton, { backgroundColor: theme.secondary }]}
            >
              <Text style={[styles.doneButtonText, { color: theme.textInverse }]}>
                Done
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Spacing['4xl'],
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.md,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: 12,
    ...Shadows.sm,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: 16,
    alignSelf: 'center',
  },
  moodText: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  summaryText: {
    fontSize: Typography.size.base,
    lineHeight: 24,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  listItemText: {
    flex: 1,
    fontSize: Typography.size.sm,
    lineHeight: 20,
  },
  encouragementCard: {
    padding: Spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
  },
  encouragementText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    textAlign: 'center',
    lineHeight: 26,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['4xl'],
    gap: Spacing.md,
  },
  errorText: {
    fontSize: Typography.size.base,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    marginTop: Spacing.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    ...Shadows.lg,
  },
  doneButton: {
    paddingVertical: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    ...Shadows.md,
  },
  doneButtonText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
});
