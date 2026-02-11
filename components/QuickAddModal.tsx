// Quick Add Modal - AI-powered natural language reminder input
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
  FadeInDown,
} from 'react-native-reanimated';
import { useTheme, useColorScheme } from '@/hooks/useColorScheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { Reminder, AIParseResult, TAG_COLORS, LocationCategory, ContextTrigger } from '@/types/reminder';
import { parseReminderWithAI } from '@/utils/aiParser';
import { formatRecurrence } from '@/utils/recurrence';
import { generateId } from '@/utils/storage';
import { AIInsightsService } from '@/utils/aiInsights';
import { TemplateLibrary, ReminderTemplate } from '@/components/TemplateLibrary';

interface QuickAddModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateReminder: (reminder: Reminder) => void;
}

export function QuickAddModal({ visible, onClose, onCreateReminder }: QuickAddModalProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const inputRef = useRef<TextInput>(null);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parseResult, setParseResult] = useState<AIParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [isSensitive, setIsSensitive] = useState(false);
  const [locationCategory, setLocationCategory] = useState<LocationCategory | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  // Focus input when modal opens
  useEffect(() => {
    if (visible) {
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      setInput('');
      setParseResult(null);
      setError(null);
    }
  }, [visible]);

  const handleParse = useCallback(async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use enhanced AI parsing with voice-first NLP
      const parsed = await AIInsightsService.parseVoiceInput(input.trim());

      // Convert to AIParseResult format
      const result: AIParseResult = {
        title: parsed.title || input.trim(),
        suggestedTag: parsed.tag || 'Personal',
        tagConfidence: 0.9,
        schedule: {
          date: parsed.dueDate,
          time: parsed.dueTime,
          recurrence: parsed.recurrence,
          smartTime: parsed.dueTime,
          smartTimeReason: 'Based on your typical schedule',
        },
        rawInterpretation: `Parsed: ${parsed.title}`,
      };

      setParseResult(result);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      setError('Failed to parse reminder. Please try again.');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [input]);

  const handleCreateReminder = useCallback(() => {
    if (!parseResult) return;

    const now = new Date();

    // Build context triggers if location category is selected
    const contextTriggers: ContextTrigger[] | undefined = locationCategory
      ? [
          {
            type: 'location_category',
            enabled: true,
            locationCategory: locationCategory,
            radius: 500, // 500 meters default
          },
        ]
      : undefined;

    const reminder: Reminder = {
      id: generateId(),
      title: parseResult.title,
      tag: parseResult.suggestedTag,
      status: 'pending',
      priority: 'medium',
      dueDate: parseResult.schedule.date || now.toISOString().split('T')[0],
      dueTime: parseResult.schedule.time || '09:00',
      recurrence: parseResult.schedule.recurrence || { type: 'none' },
      isRecurring: parseResult.schedule.recurrence?.type !== 'none',
      originalText: input,
      isSensitive,
      contextTriggers,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    onCreateReminder(reminder);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    onClose();
  }, [parseResult, input, isSensitive, locationCategory, onCreateReminder, onClose]);

  const handleSelectTemplate = useCallback((template: ReminderTemplate) => {
    const now = new Date();
    const reminder: Reminder = {
      id: generateId(),
      title: template.title,
      tag: template.tag,
      status: 'pending',
      priority: template.priority,
      dueDate: now.toISOString().split('T')[0],
      dueTime: template.defaultTime,
      recurrence: template.recurrence || { type: 'none' },
      isRecurring: !!template.recurrence,
      description: template.description,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    onCreateReminder(reminder);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    onClose();
  }, [onCreateReminder, onClose]);

  const handleVoiceInput = useCallback(() => {
    setVoiceMode(true);
    setShowTemplates(false);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    // In a real app, this would trigger speech recognition
    // For now, we'll show a prompt for voice input
  }, []);

  const handleAddTag = useCallback(() => {
    // Tag is already in parseResult, just confirm
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const tagColors = parseResult
    ? (colorScheme === 'dark' ? TAG_COLORS[parseResult.suggestedTag].dark : TAG_COLORS[parseResult.suggestedTag])
    : null;

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      Work: '💼',
      Personal: '👤',
      Errands: '🛒',
      Health: '❤️',
      Finance: '💰',
      Home: '🏠',
      Social: '👥',
    };
    return icons[category] || '📌';
  };

  const getOptimalTimes = (baseTime: string) => {
    const [hours] = baseTime.split(':').map(Number);

    // Provide 3 time suggestions based on the suggested time
    const times = [
      baseTime, // Original suggested time
      `${((hours + 1) % 24).toString().padStart(2, '0')}:00`, // 1 hour later
      `${((hours + 2) % 24).toString().padStart(2, '0')}:00`, // 2 hours later
    ];

    return times;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.overlay}
        >
          <Pressable style={styles.backdrop} onPress={onClose}>
            <BlurView
              intensity={40}
              tint={colorScheme === 'dark' ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          </Pressable>

          <Animated.View
            entering={SlideInDown.springify().damping(20)}
            exiting={SlideOutDown.duration(200)}
            style={[styles.modal, { backgroundColor: theme.surface }, Shadows.xl]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>New Reminder</Text>
              <View style={styles.headerActions}>
                <Pressable
                  style={[styles.iconButton, { backgroundColor: showTemplates ? theme.secondary : theme.surfaceElevated }]}
                  onPress={() => {
                    setShowTemplates(!showTemplates);
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                >
                  <Ionicons name="albums" size={20} color={showTemplates ? '#FFFFFF' : theme.textSecondary} />
                </Pressable>
                <Pressable
                  style={[styles.iconButton, { backgroundColor: voiceMode ? theme.secondary : theme.surfaceElevated }]}
                  onPress={handleVoiceInput}
                >
                  <Ionicons name="mic" size={20} color={voiceMode ? '#FFFFFF' : theme.textSecondary} />
                </Pressable>
              </View>
            </View>

            {/* Template Library or Input */}
            {showTemplates ? (
              <View style={styles.templatesContainer}>
                <TemplateLibrary onSelectTemplate={handleSelectTemplate} />
              </View>
            ) : (
              <>
                {/* Input */}
                <View style={[styles.inputContainer, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
                  <TextInput
                    ref={inputRef}
                    style={[styles.input, { color: theme.text }]}
                    placeholder={voiceMode ? "Speak: 'Remind me to take vitamins every 3 days at 8am'" : "Type or tap mic for voice input"}
                    placeholderTextColor={theme.textMuted}
                    value={input}
                    onChangeText={setInput}
                    onSubmitEditing={handleParse}
                    multiline
                    returnKeyType="done"
                    blurOnSubmit
                  />
                  {voiceMode && (
                    <View style={[styles.voiceModeIndicator, { backgroundColor: theme.secondary + '20' }]}>
                      <Ionicons name="mic" size={16} color={theme.secondary} />
                      <Text style={[styles.voiceModeText, { color: theme.secondary }]}>
                        Voice Mode: Try complex phrases
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}

            {/* Loading State */}
            {isLoading && (
              <Animated.View
                entering={FadeIn.duration(150)}
                style={styles.loadingContainer}
              >
                <ActivityIndicator size="small" color={theme.secondary} />
                <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                  Parsing with AI...
                </Text>
              </Animated.View>
            )}

            {/* Error State */}
            {error && (
              <Animated.View
                entering={FadeIn.duration(150)}
                style={[styles.errorContainer, { backgroundColor: theme.error + '20' }]}
              >
                <Ionicons name="alert-circle" size={16} color={theme.error} />
                <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
              </Animated.View>
            )}

            {/* AI Parse Result */}
            {parseResult && !isLoading && (
              <Animated.View
                entering={FadeInDown.duration(200).springify()}
                style={[styles.resultContainer, { backgroundColor: theme.surfaceElevated, borderColor: theme.secondary }]}
              >
                <View style={[styles.resultHeader, { backgroundColor: theme.secondary + '15' }]}>
                  <Ionicons name="sparkles" size={20} color={theme.secondary} />
                  <Text style={[styles.resultTitle, { color: theme.text }]}>AI Magic Suggestions</Text>
                </View>

                <View style={styles.resultContent}>
                  {/* Category with icon */}
                  <View style={styles.categoryRow}>
                    <View style={[styles.categoryBadge, { backgroundColor: tagColors?.bg }]}>
                      <Text style={styles.categoryIcon}>{getCategoryIcon(parseResult.suggestedTag)}</Text>
                      <Text style={[styles.categoryText, { color: tagColors?.text }]}>
                        {parseResult.suggestedTag}
                      </Text>
                    </View>
                    <Text style={[styles.confidenceText, { color: theme.textMuted }]}>
                      {Math.round(parseResult.tagConfidence * 100)}% confident
                    </Text>
                  </View>

                  {/* Time suggestions */}
                  <View style={styles.timeSuggestions}>
                    <View style={styles.timeSuggestionsHeader}>
                      <Ionicons name="time-outline" size={16} color={theme.secondary} />
                      <Text style={[styles.timeSuggestionsLabel, { color: theme.textSecondary }]}>
                        Optimal Times
                      </Text>
                    </View>
                    <View style={styles.timeChips}>
                      {getOptimalTimes(parseResult.schedule.time || '09:00').map((time, index) => (
                        <Pressable
                          key={index}
                          style={[
                            styles.timeChip,
                            {
                              backgroundColor: index === 0 ? theme.secondary : theme.border,
                              borderWidth: index === 0 ? 0 : 1,
                              borderColor: theme.border,
                            },
                          ]}
                          onPress={() => {
                            // Update selected time
                            if (Platform.OS !== 'web') {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                          }}
                        >
                          <Text style={[styles.timeChipText, { color: index === 0 ? '#FFFFFF' : theme.text }]}>
                            {formatTime(time)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    {parseResult.schedule.smartTimeReason && (
                      <Text style={[styles.timeReason, { color: theme.textMuted }]}>
                        💡 {parseResult.schedule.smartTimeReason}
                      </Text>
                    )}
                  </View>

                  {/* Recurrence info */}
                  <View style={styles.recurrenceRow}>
                    <Ionicons name="repeat-outline" size={16} color={theme.textSecondary} />
                    <Text style={[styles.recurrenceText, { color: theme.textSecondary }]}>
                      {parseResult.schedule.recurrence?.type !== 'none'
                        ? formatRecurrence(parseResult.schedule.recurrence!)
                        : 'One-time reminder'}
                    </Text>
                  </View>

                  {/* Location Category Picker */}
                  <View style={styles.locationSection}>
                    <Pressable
                      style={[styles.locationHeader, { backgroundColor: showLocationPicker ? theme.anchorHighlight : 'transparent' }]}
                      onPress={() => {
                        setShowLocationPicker(!showLocationPicker);
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                    >
                      <View style={styles.locationHeaderLeft}>
                        <Ionicons name="location" size={18} color={theme.secondary} />
                        <Text style={[styles.locationLabel, { color: theme.text }]}>
                          Location Trigger
                        </Text>
                        {locationCategory && (
                          <View style={[styles.categoryBadgeMini, { backgroundColor: theme.secondary + '20' }]}>
                            <Text style={[styles.categoryBadgeMiniText, { color: theme.secondary }]}>
                              {locationCategory}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Ionicons
                        name={showLocationPicker ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color={theme.textSecondary}
                      />
                    </Pressable>

                    {showLocationPicker && (
                      <Animated.View
                        entering={FadeInDown.duration(200)}
                        style={styles.locationCategories}
                      >
                        <Text style={[styles.locationHelp, { color: theme.textMuted }]}>
                          Trigger this reminder when near any:
                        </Text>
                        <View style={styles.categoryGrid}>
                          {(['supermarket', 'gas_station', 'pharmacy', 'bank', 'gym', 'restaurant'] as LocationCategory[]).map((category) => (
                            <Pressable
                              key={category}
                              style={[
                                styles.categoryButton,
                                {
                                  backgroundColor: locationCategory === category ? theme.secondary : theme.surface,
                                  borderColor: locationCategory === category ? theme.secondary : theme.border,
                                },
                              ]}
                              onPress={() => {
                                setLocationCategory(locationCategory === category ? null : category);
                                if (Platform.OS !== 'web') {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }
                              }}
                            >
                              <Text style={styles.categoryButtonIcon}>
                                {category === 'supermarket' && '🛒'}
                                {category === 'gas_station' && '⛽'}
                                {category === 'pharmacy' && '💊'}
                                {category === 'bank' && '🏦'}
                                {category === 'gym' && '💪'}
                                {category === 'restaurant' && '🍽️'}
                              </Text>
                              <Text
                                style={[
                                  styles.categoryButtonText,
                                  { color: locationCategory === category ? '#FFFFFF' : theme.text },
                                ]}
                              >
                                {category.replace('_', ' ')}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </Animated.View>
                    )}
                  </View>

                  {/* Sensitive Toggle */}
                  <View style={[styles.sensitiveRow, { borderTopColor: theme.border }]}>
                    <View style={styles.sensitiveLeft}>
                      <Ionicons name="lock-closed" size={16} color={theme.textSecondary} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.sensitiveLabel, { color: theme.text }]}>Sensitive</Text>
                        <Text style={[styles.sensitiveDescription, { color: theme.textMuted }]}>
                          Auto-delete 60 min after completion
                        </Text>
                      </View>
                    </View>
                    <Switch
                      value={isSensitive}
                      onValueChange={setIsSensitive}
                      trackColor={{ false: theme.border, true: theme.secondary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.resultActions}>
                  <Pressable
                    style={[styles.actionButton, { backgroundColor: theme.secondary }]}
                    onPress={handleCreateReminder}
                  >
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
                      Create Reminder
                    </Text>
                  </Pressable>
                </View>
              </Animated.View>
            )}

            {/* Create Button */}
            <Pressable
              style={[
                styles.createButton,
                { backgroundColor: parseResult ? theme.secondary : theme.primary },
                (!input.trim() || isLoading) && styles.createButtonDisabled,
              ]}
              onPress={parseResult ? handleCreateReminder : handleParse}
              disabled={!input.trim() || isLoading}
            >
              <Text style={[styles.createButtonText, { color: '#FFFFFF' }]}>
                {parseResult ? 'Create Reminder' : 'Parse with AI'}
              </Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modal: {
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
    paddingBottom: Spacing['4xl'],
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templatesContainer: {
    maxHeight: 400,
    marginBottom: Spacing.lg,
  },
  voiceModeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  voiceModeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
  inputContainer: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    minHeight: 80,
    marginBottom: Spacing.lg,
  },
  input: {
    fontSize: Typography.size.md,
    lineHeight: Typography.size.md * Typography.lineHeight.relaxed,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  loadingText: {
    fontSize: Typography.size.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: Typography.size.sm,
    flex: 1,
  },
  resultContainer: {
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  resultTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
  },
  resultContent: {
    padding: Spacing.md,
    gap: Spacing.lg,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  categoryIcon: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  confidenceText: {
    fontSize: Typography.size.xs,
  },
  timeSuggestions: {
    gap: Spacing.sm,
  },
  timeSuggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  timeSuggestionsLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  timeChips: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  timeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  timeChipText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  timeReason: {
    fontSize: Typography.size.xs,
  },
  recurrenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  recurrenceText: {
    fontSize: Typography.size.sm,
  },
  locationSection: {
    gap: Spacing.sm,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  locationHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  locationLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  categoryBadgeMini: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  categoryBadgeMiniText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    textTransform: 'capitalize',
  },
  locationCategories: {
    paddingHorizontal: Spacing.sm,
    gap: Spacing.md,
  },
  locationHelp: {
    fontSize: Typography.size.xs,
    marginBottom: Spacing.xs,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    minWidth: '47%',
  },
  categoryButtonIcon: {
    fontSize: 18,
  },
  categoryButtonText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    textTransform: 'capitalize',
  },
  sensitiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
    borderTopWidth: 1,
  },
  sensitiveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  sensitiveLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  sensitiveDescription: {
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
  resultActions: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  actionButton: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  actionButtonText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
  createButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
});
