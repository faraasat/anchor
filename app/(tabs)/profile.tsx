// Profile/Me Screen - User profile and settings
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/lib/auth';
import { useTheme, useColorScheme } from '@/hooks/useColorScheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { EnhancedPaywallModal } from '@/components/EnhancedPaywallModal';
import { AnchorChain } from '@/components/AnchorChain';
import { useProStatus } from '@/hooks/useProStatus';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { ReminderService } from '@/services/ReminderService';
import { DemoMode } from '@/utils/demoMode';
import type { Reminder } from '@/types/reminder';

interface WellnessToolProps {
  title: string;
  value: string | number;
  subtitle: string;
  progress?: number;
  color: string;
}

function WellnessTool({ title, value, subtitle, progress, color }: WellnessToolProps) {
  const theme = useTheme();

  return (
    <View style={[styles.wellnessTool, { backgroundColor: theme.surfaceElevated }]}>
      <Text style={[styles.wellnessTitle, { color: theme.textSecondary }]}>{title}</Text>
      <View style={styles.wellnessValueContainer}>
        {progress !== undefined ? (
          <View style={[styles.progressCircle, { borderColor: theme.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: color,
                  height: `${progress * 100}%`,
                },
              ]}
            />
            <Text style={[styles.wellnessValue, { color }]}>{value}</Text>
          </View>
        ) : (
          <Text style={[styles.wellnessValue, { color }]}>{value}</Text>
        )}
      </View>
      <Text style={[styles.wellnessSubtitle, { color: theme.textMuted }]}>{subtitle}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { isPro, refreshProStatus } = useProStatus();
  const { isPrivacyMode, setPrivacyMode } = usePrivacy();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [smartSnoozeEnabled, setSmartSnoozeEnabled] = useState(true);
  const [demoModeEnabled, setDemoModeEnabled] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [topChains, setTopChains] = useState<{ reminder: Reminder; chain: number }[]>([]);

  useEffect(() => {
    checkDemoMode();
    loadTopChains();
  }, []);

  const checkDemoMode = async () => {
    const enabled = await DemoMode.isEnabled();
    setDemoModeEnabled(enabled);
  };

  const loadTopChains = async () => {
    if (!user) return;
    try {
      const chains = await ReminderService.getTopChains(user.id);
      setTopChains(chains);
    } catch (error) {
      console.error('Error loading top chains:', error);
    }
  };

  const handleToggleDemoMode = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const newState = await DemoMode.toggle();
    setDemoModeEnabled(newState);
  };

  const handleTogglePrivacyMode = async (value: boolean) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await setPrivacyMode(value);
  };

  const handleUpgradeToPro = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setPaywallVisible(true);
  };

  const handlePurchaseComplete = () => {
    refreshProStatus();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[
          styles.header,
          { paddingTop: insets.top + Spacing.md, backgroundColor: theme.primary },
        ]}
      >
        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={[styles.avatar, { backgroundColor: theme.secondary }]}>
            <Text style={styles.avatarText}>AC</Text>
          </View>
          <Text style={[styles.userName, { color: theme.textInverse }]}>Alex Chen</Text>
        </View>
      </Animated.View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Pro Upgrade Card */}
        {!isPro && (
          <Animated.View entering={FadeInDown.delay(50).duration(200)}>
            <Pressable onPress={handleUpgradeToPro}>
              <LinearGradient
                colors={[theme.secondary, theme.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.proCard, Shadows.lg]}
              >
                <View style={styles.proCardContent}>
                  <View style={styles.proIconBadge}>
                    <Ionicons name="diamond" size={24} color="#FFFFFF" />
                  </View>
                  <View style={styles.proCardText}>
                    <Text style={styles.proCardTitle}>Upgrade to Pro</Text>
                    <Text style={styles.proCardSubtitle}>
                      Unlock advanced AI, sync, and more
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.9)" />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {/* Pro Badge */}
        {isPro && (
          <Animated.View entering={FadeInDown.delay(50).duration(200)}>
            <View style={[styles.proBadgeCard, { backgroundColor: theme.cardBackground }, Shadows.md]}>
              <LinearGradient
                colors={[theme.secondary, theme.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.proBadgeGradient}
              >
                <Ionicons name="diamond" size={20} color="#FFFFFF" />
                <Text style={styles.proBadgeText}>Pro Member</Text>
              </LinearGradient>
              <Text style={[styles.proActiveSince, { color: theme.textSecondary }]}>
                Active since Dec 2025
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Wellness Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(200)}>
          <Pressable
            onPress={() => router.push('/wellness')}
            style={[styles.section, { backgroundColor: theme.cardBackground }, Shadows.md]}
          >
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Wellness Tools</Text>
                <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
                  Track your focus, hydration, and activity
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
            </View>

            <View style={styles.wellnessGrid}>
              <WellnessTool
                title="Pomodoro"
                value="25:00"
                subtitle="Focus"
                color={theme.secondary}
              />
              <WellnessTool
                title="Water"
                value="4/8"
                subtitle="Progress"
                progress={0.5}
                color={theme.info}
              />
              <WellnessTool
                title="Pedometer"
                value="6,500"
                subtitle="Daily goal"
                color={theme.success}
              />
            </View>
          </Pressable>
        </Animated.View>

        {/* Top Chains */}
        {topChains.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(150).duration(200)}
            style={[styles.section, { backgroundColor: theme.cardBackground }, Shadows.md]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>🏆 Top Chains</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
                Your best habit streaks
              </Text>
            </View>
            <View style={styles.chainsGrid}>
              {topChains.slice(0, 3).map((item, index) => (
                <View key={item.reminder.id} style={styles.chainItem}>
                  <AnchorChain
                    chainCount={item.chain}
                    longestChain={item.chain}
                    size="medium"
                    showLabel={false}
                  />
                  <Text style={[styles.chainLabel, { color: theme.text }]} numberOfLines={2}>
                    {item.reminder.title}
                  </Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Insights Preview */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(200)}
          style={[styles.section, { backgroundColor: theme.cardBackground }, Shadows.md]}
        >
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Insights</Text>
          </View>

          {/* Completion Rate Mini */}
          <View style={[styles.insightCard, { backgroundColor: theme.surfaceElevated }]}>
            <Ionicons name="analytics-outline" size={20} color={theme.secondary} />
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: theme.text }]}>Completion Rate</Text>
              <Text style={[styles.insightValue, { color: theme.textSecondary }]}>
                Current Streak: 12 days
              </Text>
            </View>
            {/* Mini Chart */}
            <View style={styles.miniChart}>
              {[40, 60, 80, 65, 90].map((h, i) => (
                <View
                  key={i}
                  style={[
                    styles.miniBar,
                    {
                      height: h * 0.4,
                      backgroundColor: i === 4 ? theme.secondary : theme.border,
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Productivity Pulse Mini */}
          <Pressable style={[styles.insightCard, { backgroundColor: theme.surfaceElevated }]}>
            <Ionicons name="pulse-outline" size={20} color={theme.accent} />
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: theme.text }]}>Productivity Pulse</Text>
            </View>
            <View style={[styles.peakBadge, { backgroundColor: theme.accent }]}>
              <Text style={styles.peakText}>Peak</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
          </Pressable>
        </Animated.View>

        {/* Settings */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(200)}
          style={[styles.section, { backgroundColor: theme.cardBackground }, Shadows.md]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: Spacing.md }]}>
            Settings
          </Text>

          <View style={styles.settingsList}>
            <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications-outline" size={22} color={theme.secondary} />
                <Text style={[styles.settingLabel, { color: theme.text }]}>Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: theme.border, true: theme.secondary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
              <View style={styles.settingLeft}>
                <Ionicons name="sparkles-outline" size={22} color={theme.accent} />
                <Text style={[styles.settingLabel, { color: theme.text }]}>Smart Snooze</Text>
              </View>
              <Switch
                value={smartSnoozeEnabled}
                onValueChange={setSmartSnoozeEnabled}
                trackColor={{ false: theme.border, true: theme.secondary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
              <View style={styles.settingLeft}>
                <Ionicons name="shield-checkmark-outline" size={22} color={theme.success} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingLabel, { color: theme.text }]}>Maximum Privacy</Text>
                  <Text style={[styles.settingDescription, { color: theme.textMuted }]}>
                    Store all data locally only
                  </Text>
                </View>
              </View>
              <Switch
                value={isPrivacyMode}
                onValueChange={handleTogglePrivacyMode}
                trackColor={{ false: theme.border, true: theme.success }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={[styles.settingItem, { borderBottomColor: theme.border }]}>
              <View style={styles.settingLeft}>
                <Ionicons name="flask-outline" size={22} color={theme.warning} />
                <Text style={[styles.settingLabel, { color: theme.text }]}>Demo Mode</Text>
              </View>
              <Switch
                value={demoModeEnabled}
                onValueChange={handleToggleDemoMode}
                trackColor={{ false: theme.border, true: theme.warning }}
                thumbColor="#FFFFFF"
              />
            </View>

            <Pressable style={[styles.settingItem, { borderBottomColor: theme.border }]}>
              <View style={styles.settingLeft}>
                <Ionicons name="color-palette-outline" size={22} color={theme.secondary} />
                <Text style={[styles.settingLabel, { color: theme.text }]}>Appearance</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={[styles.settingValue, { color: theme.textSecondary }]}>
                  {colorScheme === 'dark' ? 'Dark' : 'Light'}
                </Text>
                <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
              </View>
            </Pressable>

            <Pressable style={[styles.settingItem, { borderBottomWidth: 0 }]}>
              <View style={styles.settingLeft}>
                <Ionicons name="cloud-outline" size={22} color={theme.secondary} />
                <Text style={[styles.settingLabel, { color: theme.text }]}>Sync & Backup</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Settings Button */}
        <Animated.View entering={FadeInDown.delay(400).duration(200)}>
          <Pressable style={[styles.settingsButton, { backgroundColor: theme.secondary }]}>
            <Text style={styles.settingsButtonText}>Settings</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* Paywall Modal */}
      <EnhancedPaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onPurchaseComplete={handlePurchaseComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileInfo: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
  },
  userName: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  section: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
    flex: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
  },
  sectionSubtitle: {
    fontSize: Typography.size.sm,
    marginTop: 2,
  },
  wellnessGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  wellnessTool: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  wellnessTitle: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
    marginBottom: Spacing.sm,
  },
  wellnessValueContainer: {
    marginBottom: Spacing.xs,
  },
  wellnessValue: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  wellnessSubtitle: {
    fontSize: Typography.size.xs,
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
  insightValue: {
    fontSize: Typography.size.sm,
    marginTop: 2,
  },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 40,
  },
  miniBar: {
    width: 6,
    borderRadius: 3,
  },
  peakBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  peakText: {
    color: '#FFFFFF',
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  settingsList: {
    gap: 0,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  settingLabel: {
    fontSize: Typography.size.base,
  },
  settingDescription: {
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  chainsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-around',
  },
  chainItem: {
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  chainLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
    textAlign: 'center',
  },
  settingValue: {
    fontSize: Typography.size.sm,
  },
  settingsButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  proCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  proCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  proIconBadge: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proCardText: {
    flex: 1,
  },
  proCardTitle: {
    color: '#FFFFFF',
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    marginBottom: 2,
  },
  proCardSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: Typography.size.sm,
  },
  proBadgeCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  proBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
  proActiveSince: {
    fontSize: Typography.size.sm,
  },
});
