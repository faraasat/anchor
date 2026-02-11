// Stack Detail Modal - View stack details and AI scheduling suggestions
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useColorScheme';
import { useAuth } from '@fastshot/auth';
import { Stack, StackImportResult } from '@/types/stack';
import { StackService } from '@/services/StackService';
import { Spacing, Typography, Shadows } from '@/constants/theme';
import { Reminder } from '@/types/reminder';

interface StackDetailModalProps {
  visible: boolean;
  stack: Stack;
  onClose: () => void;
  onImport: (stackId: string) => Promise<void>;
  importing: boolean;
  userReminders: Reminder[];
}

export function StackDetailModal({
  visible,
  stack,
  onClose,
  onImport,
  importing,
  userReminders,
}: StackDetailModalProps) {
  const theme = useTheme();
  const { user } = useAuth();

  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiSchedule, setAiSchedule] = useState<StackImportResult | null>(null);
  const [showAiSchedule, setShowAiSchedule] = useState(false);

  useEffect(() => {
    if (visible && user) {
      analyzeWithAI();
    }
  }, [visible, user]);

  const analyzeWithAI = async () => {
    if (!user) return;

    try {
      setAiAnalyzing(true);
      const result = await StackService.importStackWithAI(user.id, stack.id, userReminders);
      setAiSchedule(result);
    } catch (error) {
      console.error('Error analyzing with AI:', error);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleImport = async () => {
    try {
      await onImport(stack.id);
    } catch (error) {
      console.error('Error importing:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const difficultyColors = {
    easy: '#10B981',
    medium: '#F59E0B',
    hard: '#EF4444',
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <LinearGradient
          colors={[theme.secondary, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="arrow-back" size={28} color={theme.textInverse} />
            </Pressable>
            {stack.isFeatured && (
              <View style={styles.featuredBadge}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text style={styles.featuredText}>Featured</Text>
              </View>
            )}
          </View>

          <Text style={[styles.title, { color: theme.textInverse }]}>{stack.title}</Text>
          <Text style={[styles.category, { color: theme.textInverse + 'CC' }]}>
            {stack.category}
          </Text>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={[styles.statText, { color: theme.textInverse }]}>
                {stack.rating.toFixed(1)}
              </Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="download" size={16} color={theme.textInverse} />
              <Text style={[styles.statText, { color: theme.textInverse }]}>
                {stack.downloads.toLocaleString()}
              </Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="time" size={16} color={theme.textInverse} />
              <Text style={[styles.statText, { color: theme.textInverse }]}>
                {stack.estimatedTime}
              </Text>
            </View>
            <View
              style={[styles.difficultyBadge, { backgroundColor: difficultyColors[stack.difficulty] }]}
            >
              <Text style={styles.difficultyText}>{stack.difficulty.toUpperCase()}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Description */}
          <Animated.View entering={FadeIn.duration(300)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {stack.description}
            </Text>
          </Animated.View>

          {/* Creator */}
          <Animated.View entering={FadeIn.duration(300).delay(100)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Creator</Text>
            <View style={styles.creatorRow}>
              <View style={[styles.creatorAvatar, { backgroundColor: theme.secondary }]}>
                <Text style={[styles.creatorInitial, { color: theme.textInverse }]}>
                  {stack.creatorName[0]}
                </Text>
              </View>
              <Text style={[styles.creatorName, { color: theme.text }]}>
                {stack.creatorName}
              </Text>
            </View>
          </Animated.View>

          {/* Tasks */}
          <Animated.View entering={FadeIn.duration(300).delay(200)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Tasks ({stack.tasks.length})
            </Text>
            {stack.tasks.map((task, index) => (
              <View
                key={task.id}
                style={[styles.taskItem, { backgroundColor: theme.surface }]}
              >
                <View style={styles.taskLeft}>
                  <Text style={[styles.taskNumber, { color: theme.textMuted }]}>
                    {index + 1}
                  </Text>
                  <View style={styles.taskContent}>
                    <Text style={[styles.taskTitle, { color: theme.text }]}>
                      {task.title}
                    </Text>
                    {task.description && (
                      <Text
                        style={[styles.taskDescription, { color: theme.textSecondary }]}
                        numberOfLines={2}
                      >
                        {task.description}
                      </Text>
                    )}
                    {task.estimatedDuration && (
                      <Text style={[styles.taskDuration, { color: theme.textMuted }]}>
                        ~{task.estimatedDuration} min
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </Animated.View>

          {/* AI Schedule Preview */}
          {aiSchedule && (
            <Animated.View entering={FadeIn.duration(300).delay(300)} style={styles.section}>
              <View style={styles.aiHeader}>
                <Ionicons name="sparkles" size={20} color={theme.secondary} />
                <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>
                  AI Suggested Schedule
                </Text>
              </View>
              <View style={[styles.aiCard, { backgroundColor: theme.secondary + '10' }]}>
                <Text style={[styles.aiReasoning, { color: theme.textSecondary }]}>
                  {aiSchedule.aiSuggestions.reasoning}
                </Text>

                {aiSchedule.aiSuggestions.conflictWarnings &&
                  aiSchedule.aiSuggestions.conflictWarnings.length > 0 && (
                    <View style={styles.warningsContainer}>
                      {aiSchedule.aiSuggestions.conflictWarnings.map((warning, index) => (
                        <View key={index} style={styles.warningRow}>
                          <Ionicons name="warning" size={16} color="#F59E0B" />
                          <Text style={[styles.warningText, { color: theme.textSecondary }]}>
                            {warning}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                <Pressable
                  onPress={() => setShowAiSchedule(!showAiSchedule)}
                  style={styles.toggleButton}
                >
                  <Text style={[styles.toggleButtonText, { color: theme.secondary }]}>
                    {showAiSchedule ? 'Hide' : 'View'} Schedule Details
                  </Text>
                  <Ionicons
                    name={showAiSchedule ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={theme.secondary}
                  />
                </Pressable>

                {showAiSchedule && (
                  <View style={styles.scheduleList}>
                    {aiSchedule.aiSuggestions.suggestedSchedule.map((suggestion, index) => (
                      <View key={index} style={[styles.scheduleItem, { borderLeftColor: theme.secondary }]}>
                        <Text style={[styles.scheduleTaskTitle, { color: theme.text }]}>
                          {suggestion.taskTitle}
                        </Text>
                        <Text style={[styles.scheduleTime, { color: theme.textSecondary }]}>
                          {formatDate(suggestion.suggestedDate)} at {suggestion.suggestedTime}
                        </Text>
                        <Text style={[styles.scheduleReasoning, { color: theme.textMuted }]}>
                          {suggestion.reasoning}
                        </Text>
                        <View style={styles.confidenceBadge}>
                          <Text style={[styles.confidenceText, { color: theme.textMuted }]}>
                            {Math.round(suggestion.confidence * 100)}% confidence
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {aiAnalyzing && (
            <View style={styles.aiLoadingContainer}>
              <ActivityIndicator size="small" color={theme.secondary} />
              <Text style={[styles.aiLoadingText, { color: theme.textSecondary }]}>
                AI is analyzing your schedule...
              </Text>
            </View>
          )}

          {/* Tags */}
          {stack.tags.length > 0 && (
            <Animated.View entering={FadeIn.duration(300).delay(400)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Tags</Text>
              <View style={styles.tagsContainer}>
                {stack.tags.map((tag, index) => (
                  <View key={index} style={[styles.tag, { backgroundColor: theme.surface }]}>
                    <Text style={[styles.tagText, { color: theme.textSecondary }]}>
                      #{tag}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* Import Button */}
        <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <Pressable
            onPress={handleImport}
            disabled={importing || aiAnalyzing}
            style={({ pressed }) => [
              styles.importButton,
              { backgroundColor: theme.secondary },
              (importing || aiAnalyzing || pressed) && styles.importButtonDisabled,
            ]}
          >
            {importing ? (
              <ActivityIndicator size="small" color={theme.textInverse} />
            ) : (
              <>
                <Ionicons name="download" size={20} color={theme.textInverse} />
                <Text style={[styles.importButtonText, { color: theme.textInverse }]}>
                  Import Stack ({stack.tasks.length} tasks)
                </Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 12,
  },
  featuredText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: '#F59E0B',
  },
  title: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
  },
  category: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  difficultyBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: Typography.size.base,
    lineHeight: 22,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  creatorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorInitial: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
  },
  creatorName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
  taskItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  taskLeft: {
    flexDirection: 'row',
    flex: 1,
    gap: Spacing.md,
  },
  taskNumber: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    width: 24,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.xs,
  },
  taskDescription: {
    fontSize: Typography.size.sm,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  taskDuration: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  aiCard: {
    padding: Spacing.lg,
    borderRadius: 12,
  },
  aiReasoning: {
    fontSize: Typography.size.sm,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  warningsContainer: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  warningText: {
    flex: 1,
    fontSize: Typography.size.xs,
    lineHeight: 18,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  toggleButtonText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  scheduleList: {
    marginTop: Spacing.md,
  },
  scheduleItem: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  scheduleTaskTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.xs,
  },
  scheduleTime: {
    fontSize: Typography.size.sm,
    marginBottom: Spacing.xs,
  },
  scheduleReasoning: {
    fontSize: Typography.size.xs,
    lineHeight: 16,
    marginBottom: Spacing.xs,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  confidenceText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
  aiLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  aiLoadingText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  tagText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    ...Shadows.lg,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: 12,
    ...Shadows.md,
  },
  importButtonDisabled: {
    opacity: 0.6,
  },
  importButtonText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
});
