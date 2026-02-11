// Enhanced Snooze Modal - With Smart Snooze AI integration
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useTheme, useColorScheme } from '@/hooks/useColorScheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { Reminder } from '@/types/reminder';
import { SmartSnoozeService, SmartSnoozeOption } from '@/services/SmartSnoozeService';
import { ProGateService, ProFeature } from '@/services/ProGateService';
import { useAuth } from '@fastshot/auth';

interface EnhancedSnoozeModalProps {
  visible: boolean;
  reminder: Reminder | null;
  onClose: () => void;
  onSnooze: (reminder: Reminder, snoozeUntil: Date) => void;
  onUpgradePress?: () => void;
}

export function EnhancedSnoozeModal({
  visible,
  reminder,
  onClose,
  onSnooze,
  onUpgradePress,
}: EnhancedSnoozeModalProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [smartOptions, setSmartOptions] = useState<SmartSnoozeOption[]>([]);
  const [loadingSmartOptions, setLoadingSmartOptions] = useState(false);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    checkProStatus();
  }, []);

  useEffect(() => {
    if (visible && reminder && user && isPro) {
      loadSmartOptions();
    }
  }, [visible, reminder, user, isPro]);

  const checkProStatus = async () => {
    const pro = await ProGateService.isPro();
    setIsPro(pro);
  };

  const loadSmartOptions = async () => {
    if (!reminder || !user) return;

    try {
      setLoadingSmartOptions(true);
      const options = await SmartSnoozeService.getSmartSnoozeOptions(reminder, user.id);
      setSmartOptions(options);
    } catch (error) {
      console.error('Error loading smart snooze options:', error);
      setSmartOptions([]);
    } finally {
      setLoadingSmartOptions(false);
    }
  };

  const handleQuickSnooze = (minutes: number) => {
    if (!reminder) return;

    const snoozeUntil = new Date();
    snoozeUntil.setMinutes(snoozeUntil.getMinutes() + minutes);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    onSnooze(reminder, snoozeUntil);
    onClose();
  };

  const handleContextualSnooze = (time: Date) => {
    if (!reminder) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    onSnooze(reminder, time);
    onClose();
  };

  const handleSmartSnooze = (option: SmartSnoozeOption) => {
    if (!reminder) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    onSnooze(reminder, option.time);
    onClose();
  };

  const handleUpgrade = () => {
    onClose();
    onUpgradePress?.();
  };

  if (!visible || !reminder) return null;

  const quickPresets = SmartSnoozeService.getQuickSnoozePresets();
  const contextualPresets = SmartSnoozeService.getContextualSnoozePresets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View entering={FadeIn.duration(200)} style={styles.overlayContent}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
          )}
        </Animated.View>
      </Pressable>

      <View style={[styles.modalContainer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <Animated.View
            entering={FadeInDown.duration(300).springify()}
            style={[
              styles.modal,
              { backgroundColor: theme.cardBackground },
              Shadows.xl,
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Ionicons name="time-outline" size={24} color={theme.secondary} />
                <Text style={[styles.title, { color: theme.text }]}>Snooze Until</Text>
              </View>
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </Pressable>
            </View>

            {/* Reminder Info */}
            <View style={[styles.reminderInfo, { backgroundColor: theme.surfaceElevated }]}>
              <Text style={[styles.reminderTitle, { color: theme.text }]} numberOfLines={2}>
                {reminder.title}
              </Text>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Quick Snooze */}
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Quick Snooze</Text>
              <View style={styles.quickGrid}>
                {quickPresets.map((preset) => (
                  <Pressable
                    key={preset.label}
                    onPress={() => handleQuickSnooze(preset.minutes)}
                    style={[styles.quickButton, { backgroundColor: theme.surfaceElevated }]}
                  >
                    <Text style={[styles.quickButtonText, { color: theme.text }]}>
                      {preset.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Contextual Snooze */}
              <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Contextual</Text>
              <View style={styles.optionsList}>
                {contextualPresets.map((preset, index) => (
                  <Pressable
                    key={index}
                    onPress={() => handleContextualSnooze(preset.time)}
                    style={[styles.optionItem, { backgroundColor: theme.surfaceElevated }]}
                  >
                    <Text style={[styles.optionLabel, { color: theme.text }]}>{preset.label}</Text>
                    <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                  </Pressable>
                ))}
              </View>

              {/* Smart Snooze (Pro) */}
              <View style={styles.smartSection}>
                <View style={styles.smartHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                    ✨ Smart Snooze
                  </Text>
                  {!isPro && (
                    <View style={[styles.proBadge, { backgroundColor: theme.accent }]}>
                      <Text style={styles.proBadgeText}>PRO</Text>
                    </View>
                  )}
                </View>

                {!isPro ? (
                  <Pressable
                    onPress={handleUpgrade}
                    style={[styles.upgradeCard, { backgroundColor: theme.surfaceElevated }]}
                  >
                    <Ionicons name="sparkles" size={24} color={theme.accent} />
                    <View style={styles.upgradeContent}>
                      <Text style={[styles.upgradeTitle, { color: theme.text }]}>
                        Unlock AI-Powered Snooze
                      </Text>
                      <Text style={[styles.upgradeDescription, { color: theme.textSecondary }]}>
                        Get smart suggestions based on your calendar and context
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                  </Pressable>
                ) : loadingSmartOptions ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color={theme.secondary} />
                    <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                      Analyzing your calendar...
                    </Text>
                  </View>
                ) : smartOptions.length > 0 ? (
                  <View style={styles.optionsList}>
                    {smartOptions.map((option, index) => (
                      <Pressable
                        key={index}
                        onPress={() => handleSmartSnooze(option)}
                        style={[styles.smartOption, { backgroundColor: theme.surfaceElevated }]}
                      >
                        <View style={styles.smartOptionContent}>
                          <View style={styles.smartOptionHeader}>
                            <Text style={[styles.smartOptionLabel, { color: theme.text }]}>
                              {option.label}
                            </Text>
                            <View style={[styles.confidenceBadge, { backgroundColor: theme.success }]}>
                              <Text style={styles.confidenceText}>
                                {Math.round(option.confidence * 100)}%
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.smartOptionReason, { color: theme.textSecondary }]}>
                            {option.reason}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <Text style={[styles.noSmartOptions, { color: theme.textMuted }]}>
                    No smart suggestions available right now
                  </Text>
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayContent: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '80%',
  },
  modal: {
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    paddingTop: Spacing.lg,
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  reminderInfo: {
    marginHorizontal: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  reminderTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  quickButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  quickButtonText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
  optionsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  optionLabel: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
  smartSection: {
    marginTop: Spacing.md,
  },
  smartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  proBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: Typography.weight.bold,
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  upgradeContent: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    marginBottom: 2,
  },
  upgradeDescription: {
    fontSize: Typography.size.sm,
    lineHeight: 18,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  loadingText: {
    fontSize: Typography.size.sm,
  },
  smartOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  smartOptionContent: {
    flex: 1,
  },
  smartOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  smartOptionLabel: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
  confidenceBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  confidenceText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: Typography.weight.bold,
  },
  smartOptionReason: {
    fontSize: Typography.size.sm,
    lineHeight: 18,
  },
  noSmartOptions: {
    fontSize: Typography.size.sm,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
});
