// Me Tab - Glassmorphism Wellness Cockpit
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
// import { Canvas, Group, Circle, Path, Skia } from '@shopify/react-native-skia';
import { useAuth } from '@fastshot/auth';
import { useTheme, useColorScheme } from '@/hooks/useColorScheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { EnhancedPaywallModal } from '@/components/EnhancedPaywallModal';
import { AnchorChain } from '@/components/AnchorChain';
import { useProStatus } from '@/hooks/useProStatus';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { ReminderService } from '@/services/ReminderService';
import { PedometerService, StepTrend } from '@/services/PedometerService';
import { WaterTrackerService, DailyWaterData } from '@/services/WaterTrackerService';
import { EnhancedNotificationService, HapticSignature } from '@/services/EnhancedNotificationService';
import type { Reminder } from '@/types/reminder';
import { VisualGarden } from '@/components/VisualGarden';
import { BentoGridLayout, BentoLayouts } from '@/components/BentoGridLayout';

const { width } = Dimensions.get('window');

interface ProgressRingProps {
  progress: number;
  size: number;
  strokeWidth: number;
  color: string;
  label: string;
  value: string | number;
  subtitle: string;
}

function ProgressRing({ progress, size, strokeWidth, color, label, value, subtitle }: ProgressRingProps) {
  const theme = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressValue = useSharedValue(0);

  useEffect(() => {
    progressValue.value = withSpring(progress, { damping: 15 });
  }, [progress]);

  // const animatedStyle = useAnimatedStyle(() => {
  //   const strokeDashoffset = circumference - (progressValue.value / 100) * circumference;
  //   return { strokeDashoffset };
  // });

  return (
    <View style={[styles.progressRing, { width: size, height: size }]}>
      <svg width={size} height={size}>
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={theme.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress Circle */}
        {/* <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={animatedStyle}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        /> */}
      </svg>
      <View style={styles.progressRingContent}>
        <Text style={[styles.progressRingValue, { color }]}>{value}</Text>
        <Text style={[styles.progressRingLabel, { color: theme.textMuted }]}>{label}</Text>
      </View>
    </View>
  );
}

// Animated Circle component (placeholder - replace with actual animated SVG)
const AnimatedCircle = Animated.createAnimatedComponent(View);

export default function MeScreen() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { isPro, refreshProStatus } = useProStatus();
  const { isPrivacyMode, isPrivacyVeilEnabled, setPrivacyMode, setPrivacyVeil } = usePrivacy();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [smartSnoozeEnabled, setSmartSnoozeEnabled] = useState(true);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [topChains, setTopChains] = useState<{ reminder: Reminder; chain: number }[]>([]);

  // Wellness State
  const [todaySteps, setTodaySteps] = useState(0);
  const [stepGoal, setStepGoal] = useState(10000);
  const [stepTrends, setStepTrends] = useState<StepTrend | null>(null);
  const [waterData, setWaterData] = useState<DailyWaterData | null>(null);
  const [pomodoroTime, setPomodoroTime] = useState('25:00');
  const [pomodoroActive, setPomodoroActive] = useState(false);

  useEffect(() => {
    if (user) {
      loadWellnessData();
      loadTopChains();
    }
  }, [user]);

  const loadWellnessData = async () => {
    if (!user) return;

    try {
      // Load pedometer data
      const stepsToday = await PedometerService.getTodaySteps(user.id);
      setTodaySteps(stepsToday.steps);
      setStepGoal(stepsToday.goal);

      const trends = await PedometerService.getStepTrends(user.id);
      setStepTrends(trends);

      // Load water tracker data
      const water = await WaterTrackerService.getTodayWater(user.id);
      setWaterData(water);

      // Start tracking steps
      await PedometerService.startTracking(user.id);
    } catch (error) {
      console.error('Error loading wellness data:', error);
    }
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

  const handleAddWater = async (glasses: number = 1) => {
    if (!user) return;

    try {
      const updated = await WaterTrackerService.addWater(user.id, 0, glasses);
      setWaterData(updated);

      await EnhancedNotificationService.playHapticSignature(HapticSignature.TASK_CREATED);

      // Check if goal reached
      if (updated.total >= updated.goal) {
        await EnhancedNotificationService.playHapticSignature(HapticSignature.GOAL_REACHED);
      }
    } catch (error) {
      console.error('Error adding water:', error);
    }
  };

  const handleTogglePomodoro = () => {
    setPomodoroActive((prev) => !prev);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleTogglePrivacyMode = async (value: boolean) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await setPrivacyMode(value);
  };

  const handleTogglePrivacyVeil = async (value: boolean) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    await setPrivacyVeil(value);
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

  const stepProgress = (todaySteps / stepGoal) * 100;
  const waterProgress = waterData ? (waterData.glassesConsumed / waterData.glassesGoal) * 100 : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header with Avatar */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        <View style={styles.profileInfo}>
          <LinearGradient
            colors={[theme.secondary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </LinearGradient>
          <Text style={[styles.userName, { color: theme.text }]}>
            {user?.email?.split('@')[0] || 'User'}
          </Text>
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
                      Unlock True Sync, Advanced AI & More
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="rgba(255, 255, 255, 0.9)" />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {/* Wellness Cockpit - Glassmorphism Design */}
        <Animated.View entering={FadeInDown.delay(100).duration(200)}>
          <View style={[styles.wellnessCockpit, Shadows.lg]}>
            {Platform.OS === 'ios' ? (
              <BlurView intensity={80} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={styles.glassBlur}>
                <View style={[styles.wellnessContent, { backgroundColor: colorScheme === 'dark' ? 'rgba(30, 30, 40, 0.7)' : 'rgba(255, 255, 255, 0.7)' }]}>
                  {/* Content */}
                </View>
              </BlurView>
            ) : (
              <View style={[styles.wellnessContent, { backgroundColor: theme.cardBackground }]}>
                {/* Content */}
              </View>
            )}

            <View style={styles.wellnessContent}>
              <Text style={[styles.wellnessTitle, { color: theme.text }]}>Wellness</Text>
              <Text style={[styles.wellnessSubtitle, { color: theme.textMuted }]}>
                Micro-tools nmme sortbúm:
              </Text>

              {/* Progress Rings Grid */}
              <View style={styles.progressGrid}>
                {/* Pomodoro */}
                <Pressable onPress={handleTogglePomodoro} style={styles.progressItem}>
                  <View style={[styles.progressRingWrapper, { borderColor: theme.border }]}>
                    <View style={styles.progressRingInner}>
                      <Text style={[styles.progressValue, { color: theme.secondary }]}>{pomodoroTime}</Text>
                      <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>Pomodoro</Text>
                      <Text style={[styles.progressSubLabel, { color: theme.textMuted }]}>
                        {pomodoroActive ? 'Focus' : 'Tap to start'}
                      </Text>
                    </View>
                  </View>
                </Pressable>

                {/* Water Tracker */}
                <Pressable onPress={() => handleAddWater(1)} style={styles.progressItem}>
                  <View style={[styles.progressRingWrapper, { borderColor: theme.border }]}>
                    <svg width={110} height={110} style={styles.progressSvg}>
                      <circle
                        cx={55}
                        cy={55}
                        r={48}
                        stroke={theme.border}
                        strokeWidth={8}
                        fill="none"
                      />
                      <circle
                        cx={55}
                        cy={55}
                        r={48}
                        stroke={theme.info}
                        strokeWidth={8}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={301.59}
                        strokeDashoffset={301.59 * (1 - waterProgress / 100)}
                        transform={`rotate(-90 55 55)`}
                      />
                    </svg>
                    <View style={styles.progressRingInner}>
                      <Text style={[styles.progressValue, { color: theme.info }]}>
                        {waterData?.glassesConsumed || 0}/{waterData?.glassesGoal || 8}
                      </Text>
                      <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>Water</Text>
                      <Text style={[styles.progressSubLabel, { color: theme.textMuted }]}>Progress</Text>
                    </View>
                  </View>
                </Pressable>

                {/* Pedometer */}
                <Pressable style={styles.progressItem}>
                  <View style={[styles.progressRingWrapper, { borderColor: theme.border }]}>
                    <svg width={110} height={110} style={styles.progressSvg}>
                      <circle
                        cx={55}
                        cy={55}
                        r={48}
                        stroke={theme.border}
                        strokeWidth={8}
                        fill="none"
                      />
                      <circle
                        cx={55}
                        cy={55}
                        r={48}
                        stroke={theme.success}
                        strokeWidth={8}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={301.59}
                        strokeDashoffset={301.59 * (1 - stepProgress / 100)}
                        transform={`rotate(-90 55 55)`}
                      />
                    </svg>
                    <View style={styles.progressRingInner}>
                      <Text style={[styles.progressValue, { color: theme.success }]}>
                        {(todaySteps / 1000).toFixed(1)}k
                      </Text>
                      <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>Pedometer</Text>
                      <Text style={[styles.progressSubLabel, { color: theme.textMuted }]}>Daily goal</Text>
                    </View>
                  </View>
                </Pressable>
              </View>

              {/* Insights Section */}
              <View style={styles.insightsSection}>
                <View style={styles.insightHeader}>
                  <Text style={[styles.insightTitle, { color: theme.text }]}>Insights</Text>
                  <Ionicons name="arrow-forward" size={18} color={theme.textMuted} />
                </View>

                {/* Completion Rate */}
                <View style={[styles.insightCard, { backgroundColor: theme.surfaceElevated }]}>
                  <Ionicons name="trending-up" size={20} color={theme.secondary} />
                  <View style={styles.insightContent}>
                    <Text style={[styles.insightLabel, { color: theme.text }]}>Completion Rate</Text>
                    <Text style={[styles.insightValue, { color: theme.textSecondary }]}>
                      Current Streak: 12 days
                    </Text>
                  </View>
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

                {/* Productivity Pulse */}
                <Pressable style={[styles.insightCard, { backgroundColor: theme.surfaceElevated }]}>
                  <Ionicons name="pulse" size={20} color={theme.accent} />
                  <View style={styles.insightContent}>
                    <Text style={[styles.insightLabel, { color: theme.text }]}>Productivity Pulse</Text>
                  </View>
                  <View style={[styles.peakBadge, { backgroundColor: theme.accent }]}>
                    <Text style={styles.peakText}>Peak</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
                </Pressable>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Settings Card */}
        <Animated.View entering={FadeInDown.delay(150).duration(200)}>
          <View style={[styles.settingsCard, { backgroundColor: theme.cardBackground }, Shadows.md]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Settings</Text>

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
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingLabel, { color: theme.text }]}>Smart Snooze</Text>
                    {!isPro && (
                      <Text style={[styles.proLabel, { color: theme.accent }]}>Pro</Text>
                    )}
                  </View>
                </View>
                <Switch
                  value={smartSnoozeEnabled && isPro}
                  onValueChange={(v) => {
                    if (!isPro) {
                      handleUpgradeToPro();
                    } else {
                      setSmartSnoozeEnabled(v);
                    }
                  }}
                  trackColor={{ false: theme.border, true: theme.secondary }}
                  thumbColor="#FFFFFF"
                  disabled={!isPro}
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

              <View style={[styles.settingItem, { borderBottomWidth: 0 }]}>
                <View style={styles.settingLeft}>
                  <Ionicons name="eye-off-outline" size={22} color={theme.secondary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingLabel, { color: theme.text }]}>Privacy Veil</Text>
                    <Text style={[styles.settingDescription, { color: theme.textMuted }]}>
                      Blur sensitive tasks and tags
                    </Text>
                  </View>
                </View>
                <Switch
                  value={isPrivacyVeilEnabled}
                  onValueChange={handleTogglePrivacyVeil}
                  trackColor={{ false: theme.border, true: theme.secondary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Settings Button */}
        <Animated.View entering={FadeInDown.delay(200).duration(200)}>
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
    paddingBottom: Spacing.lg,
    alignItems: 'center',
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
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  proCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
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
  wellnessCockpit: {
    borderRadius: BorderRadius['2xl'],
    overflow: 'hidden',
  },
  glassBlur: {
    ...StyleSheet.absoluteFillObject,
  },
  wellnessContent: {
    padding: Spacing.lg,
  },
  wellnessTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  wellnessSubtitle: {
    fontSize: Typography.size.sm,
    marginTop: 2,
    marginBottom: Spacing.lg,
  },
  progressGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  progressItem: {
    flex: 1,
    alignItems: 'center',
  },
  progressRingWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressSvg: {
    position: 'absolute',
  },
  progressRingInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressValue: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  progressLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
    marginTop: 2,
  },
  progressSubLabel: {
    fontSize: 10,
    marginTop: 1,
  },
  insightsSection: {
    marginTop: Spacing.md,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  insightTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
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
  insightLabel: {
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
  settingsCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.md,
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
    flex: 1,
  },
  settingLabel: {
    fontSize: Typography.size.base,
  },
  settingDescription: {
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
  proLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    marginTop: 2,
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
  progressRing: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  progressRingValue: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  progressRingLabel: {
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
});
