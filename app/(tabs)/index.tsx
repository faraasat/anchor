// Today Dashboard - Main screen with timeline and reminders
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  FadeIn,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@fastshot/auth';
import { useThemeEngine } from '@/contexts/ThemeEngineContext';
import { Spacing, Typography } from '@/constants/theme';
import { Reminder, ContextData, CalendarEvent } from '@/types/reminder';
import { ReminderService } from '@/services/ReminderService';
import { WeatherService, WeatherData } from '@/services/WeatherService';
import { CalendarIntegrationService } from '@/services/CalendarIntegrationService';
import { SmartDeferService } from '@/services/SmartDeferService';
import { useHousehold } from '@/contexts/HouseholdContext';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { ContextChips } from '@/components/ContextChips';
import { NextUpCard } from '@/components/NextUpCard';
import { ReminderCard } from '@/components/ReminderCard';
import { CalendarCard } from '@/components/CalendarCard';
import { SmartDeferButton } from '@/components/SmartDeferButton';
import { ActionAnchorButton } from '@/components/ActionAnchorButton';
import { QuickAddModal } from '@/components/QuickAddModal';
import { VoiceAnchorModal } from '@/components/VoiceAnchorModal';
import { SnoozeModal } from '@/components/SnoozeModal';
import { CompletionAnimation } from '@/components/CompletionAnimation';
import { HouseholdModal } from '@/components/HouseholdModal';
import { SmartScanModal } from '@/components/SmartScanModal';
import { VictoryAnimation } from '@/components/VictoryAnimation';
import { InkBleedTransition } from '@/components/InkBleedTransition';
import { NearYouPanel } from '@/components/NearYouPanel';
import { AnchorTriggerNotification } from '@/components/AnchorTriggerNotification';
import { useAnchorTriggers } from '@/hooks/useAnchorTriggers';
import { AIParserService } from '@/services/AIParserService';
import { HapticScrollManager } from '@/utils/hapticScrolling';
// Phase 6: New Components
import { CommandPalette } from '@/components/CommandPalette';
import { DailyFocusWidget } from '@/components/DailyFocusWidget';
import { ProximityWidget } from '@/components/ProximityWidget';
import { NextUpSkeleton, ReminderCardSkeleton } from '@/components/SoftPaperSkeleton';
import { OnboardingFlow } from '@/components/OnboardingFlow';
import { OptimisticUIService } from '@/services/OptimisticUIService';
import { AnchorPointsService } from '@/services/AnchorPointsService';
import { useOnboarding } from '@/contexts/OnboardingContext';
// Phase 9: Community Hub & Evening Reflections
import { CommunityHubModal } from '@/components/CommunityHubModal';
import { StackService } from '@/services/StackService';
import { AmbientContextPanel } from '@/components/AmbientContextPanel';
import { EveningReflectionsModal } from '@/components/EveningReflectionsModal';
import { LimitedModeService } from '@/services/LimitedModeService';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

export default function TodayScreen() {
  const { theme, isInkBleedActive, triggerInkBleed } = useThemeEngine();
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const { user } = useAuth();
  const { currentHousehold, unreadNudges } = useHousehold();
  const { getReminders, markComplete: markCompletePrivacy, createReminder: createReminderPrivacy } = usePrivacy();
  const { hasCompletedOnboarding, completeOnboarding, skipOnboarding } = useOnboarding();

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quickAddVisible, setQuickAddVisible] = useState(false);
  const [voiceAnchorVisible, setVoiceAnchorVisible] = useState(false);
  const [snoozeVisible, setSnoozeVisible] = useState(false);
  const [householdModalVisible, setHouseholdModalVisible] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<Reminder | null>(null);
  const [showCompletion, setShowCompletion] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [showSmartDefer, setShowSmartDefer] = useState(false);
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [smartScanVisible, setSmartScanVisible] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  // Phase 6: Command Palette
  const [commandPaletteVisible, setCommandPaletteVisible] = useState(false);
  // Phase 6: Nearest Anchor for Proximity Widget
  const [nearestAnchor, setNearestAnchor] = useState<any>(null);
  // Phase 9: Community Hub
  const [communityHubVisible, setCommunityHubVisible] = useState(false);
  // Phase 9: Evening Reflections
  const [eveningReflectionsVisible, setEveningReflectionsVisible] = useState(false);
  const [hasShownReflectionToday, setHasShownReflectionToday] = useState(false);

  // Phase 2: Haptic scrolling
  const hapticManager = React.useRef(new HapticScrollManager({ itemHeight: 100, threshold: 50 })).current;

  // Anchor triggers for environmental awareness
  const { lastTrigger, clearLastTrigger } = useAnchorTriggers(user?.id || null);

  // Build context data from weather
  const context: ContextData = {
    weather: weather
      ? {
          temperature: weather.temperature,
          condition: weather.condition,
          icon: weather.icon,
        }
      : undefined,
  };

  // Phase 6: Initialize OptimisticUI service
  useEffect(() => {
    OptimisticUIService.initialize();
  }, []);

  // Phase 6: Keyboard shortcut for Command Palette (Cmd+K / Ctrl+K)
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Phase 6: Load nearest anchor for Proximity Widget
  useEffect(() => {
    if (user) {
      loadNearestAnchor();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Load reminders on mount and when user/household changes
  useEffect(() => {
    if (user) {
      loadReminders();
      loadWeather();
      loadCalendarEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentHousehold]);

  // Subscribe to real-time reminder changes
  useEffect(() => {
    if (!user) return;

    const subscription = ReminderService.subscribe(user.id, (updatedReminders) => {
      setReminders(updatedReminders);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [user]);

  // Phase 9: Check for evening time and trigger reflections (Pro only)
  useEffect(() => {
    if (!user || hasShownReflectionToday) return;

    const checkEveningTime = async () => {
      // Check if Evening Reflections feature is available
      const canUseReflections = await LimitedModeService.isFeatureAvailable('eveningReflections');
      if (!canUseReflections) return;

      const hour = new Date().getHours();
      const today = new Date().toISOString().split('T')[0];

      // Show reflections between 6 PM and 11 PM
      if (hour >= 18 && hour <= 23) {
        // Check if we have any completed tasks today
        const completedToday = reminders.filter(
          (r) => r.status === 'completed' && r.completedAt?.startsWith(today)
        );

        // Only show if there's at least one completed task
        if (completedToday.length > 0) {
          // Increment AI request count
          LimitedModeService.incrementAIRequestCount();

          setEveningReflectionsVisible(true);
          setHasShownReflectionToday(true);
        }
      }
    };

    // Check immediately
    checkEveningTime();

    // Check every 30 minutes
    const interval = setInterval(checkEveningTime, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user, reminders, hasShownReflectionToday]);

  const loadReminders = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Load household reminders if household selected, otherwise personal reminders
      const loadedReminders = currentHousehold
        ? await ReminderService.getHouseholdReminders(currentHousehold.id)
        : await getReminders(user.id);

      // Filter to today's reminders
      const today = new Date().toISOString().split('T')[0];
      const todayReminders = loadedReminders.filter((r) => r.dueDate === today);

      setReminders(todayReminders);

      // Check if should offer smart defer
      const shouldDefer = await SmartDeferService.shouldOfferDefer(todayReminders);
      setShowSmartDefer(shouldDefer);
    } catch (err: any) {
      console.error('Error loading reminders:', err);
      setError(err.message || 'Failed to load reminders');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCalendarEvents = async () => {
    try {
      const isAvailable = await CalendarIntegrationService.isAvailable();
      if (!isAvailable) return;

      const events = await CalendarIntegrationService.getTodayEvents();
      setCalendarEvents(events);
    } catch (err) {
      console.error('Error loading calendar events:', err);
    }
  };

  const loadWeather = async () => {
    try {
      setWeatherLoading(true);
      const weatherData = await WeatherService.getCurrentWeather();
      setWeather(weatherData);
    } catch (err) {
      console.error('Error loading weather:', err);
    } finally {
      setWeatherLoading(false);
    }
  };

  // Phase 6: Load nearest anchor
  const loadNearestAnchor = async () => {
    if (!user) return;

    try {
      const nearest = await AnchorPointsService.getNearestAnchor(user.id);
      setNearestAnchor(nearest);
    } catch (err) {
      console.error('Error loading nearest anchor:', err);
    }
  };

  const handleRefresh = useCallback(async () => {
    if (!user) return;

    setRefreshing(true);
    try {
      await Promise.all([loadReminders(), loadWeather(), ReminderService.checkOverdue(user.id)]);
    } catch (err) {
      console.error('Error refreshing:', err);
    } finally {
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentHousehold]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      // Phase 2: Haptic feedback on scroll
      hapticManager.handleScroll(event.contentOffset.y);
    },
  });

  const handleComplete = useCallback(
    async (id: string) => {
      if (!user) return;

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setShowCompletion(true);

      // Phase 6: Optimistic UI - Update immediately
      setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'completed' as const } : r)));

      try {
        // Background sync with OptimisticUI
        await OptimisticUIService.completeReminder(id);
        // Also update via privacy context (will use local storage if privacy mode enabled)
        await markCompletePrivacy(id);
      } catch (err: any) {
        console.error('Error completing reminder:', err);
        // Revert optimistic update on error
        await loadReminders();
        Alert.alert('Error', 'Failed to complete reminder');
      }
    },
    [user, markCompletePrivacy]
  );

  const handleSnooze = useCallback((reminder: Reminder) => {
    setSelectedReminder(reminder);
    setSnoozeVisible(true);
  }, []);

  const handleSnoozeConfirm = useCallback(async (reminder: Reminder, snoozeUntil: Date) => {
    try {
      await ReminderService.snooze(reminder.id, snoozeUntil);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      console.error('Error snoozing reminder:', err);
      Alert.alert('Error', 'Failed to snooze reminder');
    }
  }, []);

  const handleCreateReminder = useCallback(
    async (reminder: Reminder) => {
      if (!user) return;

      try {
        await createReminderPrivacy(user.id, reminder, currentHousehold?.id);

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Reload reminders
        await loadReminders();
      } catch (err: any) {
        console.error('Error creating reminder:', err);
        Alert.alert('Error', 'Failed to create reminder');
      }
    },
    [user, currentHousehold, createReminderPrivacy]
  );

  const handleSmartScanTasks = useCallback(
    async (tasks: Reminder[]) => {
      if (!user) return;

      try {
        // Create all scanned tasks
        for (const task of tasks) {
          await createReminderPrivacy(user.id, task, currentHousehold?.id);
        }

        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        // Reload reminders
        await loadReminders();

        Alert.alert('Success', `Added ${tasks.length} tasks from scan`);
      } catch (err: any) {
        console.error('Error creating scanned tasks:', err);
        Alert.alert('Error', 'Failed to create some tasks');
      }
    },
    [user, currentHousehold, createReminderPrivacy]
  );

  const handleReminderPress = useCallback((reminder: Reminder) => {
    // Navigate to reminder detail or show options
    console.log('Reminder pressed:', reminder.title);
  }, []);

  const handleSmartDefer = useCallback(async () => {
    setShowSmartDefer(false);
    await loadReminders();
  }, []);

  // Phase 9: Handle stack import with AI scheduling
  const handleImportStack = useCallback(async (stackId: string) => {
    if (!user) return;

    try {
      // Check if user can import stacks (Limited Mode)
      const userStacks = await StackService.getUserStacks(user.id);
      const canImport = await LimitedModeService.canImportStack(userStacks.length);

      if (!canImport.allowed) {
        Alert.alert(
          'Upgrade to Pro',
          canImport.reason || 'Upgrade to Anchor Pro to import unlimited stacks',
          [
            { text: 'Maybe Later', style: 'cancel' },
            { text: 'Upgrade Now', onPress: () => console.log('Navigate to paywall') },
          ]
        );
        return;
      }

      // Increment AI request count for scheduling
      LimitedModeService.incrementAIRequestCount();

      const result = await StackService.importStackWithAI(user.id, stackId, reminders);

      // Create all scheduled tasks
      for (const task of result.scheduledTasks) {
        await createReminderPrivacy(user.id, task, currentHousehold?.id);
      }

      // Save the import
      await StackService.saveUserStackImport(user.id, stackId);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Reload reminders
      await loadReminders();

      // Show success message with AI insights
      Alert.alert(
        'Stack Imported!',
        `${result.scheduledTasks.length} tasks have been added to your schedule.\n\n${result.aiSuggestions.reasoning}`,
        [{ text: 'Got it!' }]
      );
    } catch (err: any) {
      console.error('Error importing stack:', err);
      Alert.alert('Error', 'Failed to import stack');
    }
  }, [user, reminders, currentHousehold, createReminderPrivacy]);

  // Phase 2: Handle voice command
  const handleVoiceCommand = useCallback(async (command: string) => {
    if (!user) return;

    try {
      setVoiceProcessing(true);

      // Parse complex command with AI
      const parsed = await AIParserService.parseVoiceCommand(command);

      // Build reminder from parsed data
      const now = new Date();
      const dueDate = parsed.schedule.dueDate || now.toISOString().split('T')[0];
      const dueTime = parsed.schedule.dueTime || '12:00';

      const newReminder: Reminder = {
        id: `temp-${Date.now()}`,
        title: parsed.title,
        description: parsed.description,
        dueDate,
        dueTime,
        tag: parsed.tag,
        status: 'pending',
        priority: parsed.priority,
        recurrence: parsed.schedule.recurrence || { type: 'none' },
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        isRecurring: !!parsed.schedule.recurrence && parsed.schedule.recurrence.type !== 'none',
        originalText: command,
        aiPredicted: true,
        aiConfidence: parsed.overallConfidence,
        // Location trigger
        contextTriggers: parsed.contextTriggers?.map(ct => ({
          type: ct.type as any,
          enabled: true,
          ...(ct.type === 'location_category' ? { locationCategory: ct.value as any } : {}),
        })),
      };

      // Create reminder via privacy context
      await createReminderPrivacy(user.id, newReminder, currentHousehold?.id);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      // Close voice modal and reload
      setVoiceAnchorVisible(false);
      await loadReminders();

      // Show success message
      Alert.alert(
        'Task Created',
        `"${parsed.title}" has been added${parsed.interpretation ? `\n\n${parsed.interpretation}` : ''}`
      );
    } catch (err: any) {
      console.error('Error processing voice command:', err);
      Alert.alert('Error', 'Failed to process voice command');
    } finally {
      setVoiceProcessing(false);
    }
  }, [user, currentHousehold, createReminderPrivacy]);

  // Get next up reminder (first pending, not completed)
  const nextUp = reminders.find((r) => r.status === 'pending' || r.status === 'overdue');

  // Sort reminders by time
  const sortedReminders = [...reminders].sort((a, b) => {
    const timeA = a.dueTime.split(':').map(Number);
    const timeB = b.dueTime.split(':').map(Number);
    return timeA[0] * 60 + timeA[1] - (timeB[0] * 60 + timeB[1]);
  });

  // Format today's date
  const formatDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'short', day: 'numeric' };
    const parts = now.toLocaleDateString('en-US', options).split(', ');
    return `Today, ${parts[1] || parts[0]}`;
  };

  // Show loading state on initial load
  if (isLoading && reminders.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
        >
          <LinearGradient
            colors={[theme.secondary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.headerTop}>
            <Pressable onPress={() => setHouseholdModalVisible(true)} hitSlop={10}>
              <View style={styles.householdButton}>
                <Ionicons name="people" size={20} color={theme.textInverse} />
                {currentHousehold && (
                  <Text style={[styles.householdName, { color: theme.textInverse }]}>
                    {currentHousehold.name}
                  </Text>
                )}
              </View>
            </Pressable>
            <View style={styles.headerActions}>
              {unreadNudges.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadNudges.length}</Text>
                </View>
              )}
              <Ionicons name="notifications-outline" size={24} color={theme.textInverse} />
            </View>
          </View>
          <Text style={[styles.dateText, { color: theme.textInverse }]}>{formatDate()}</Text>
        </Animated.View>
        {/* Phase 6: Soft Paper Skeleton Loaders */}
        <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}>
          <NextUpSkeleton />
          <ReminderCardSkeleton />
          <ReminderCardSkeleton />
          <ReminderCardSkeleton />
        </ScrollView>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
        >
          <LinearGradient
            colors={[theme.secondary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.headerTop}>
            <Pressable onPress={() => setHouseholdModalVisible(true)} hitSlop={10}>
              <View style={styles.householdButton}>
                <Ionicons name="people" size={20} color={theme.textInverse} />
                {currentHousehold && (
                  <Text style={[styles.householdName, { color: theme.textInverse }]}>
                    {currentHousehold.name}
                  </Text>
                )}
              </View>
            </Pressable>
            <View style={styles.headerActions}>
              {unreadNudges.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadNudges.length}</Text>
                </View>
              )}
              <Ionicons name="notifications-outline" size={24} color={theme.textInverse} />
            </View>
          </View>
          <Text style={[styles.dateText, { color: theme.textInverse }]}>{formatDate()}</Text>
        </Animated.View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.error} />
          <Text style={[styles.errorTitle, { color: theme.text }]}>Oops!</Text>
          <Text style={[styles.errorMessage, { color: theme.textSecondary }]}>{error}</Text>
          <Pressable
            style={[styles.retryButton, { backgroundColor: theme.secondary }]}
            onPress={loadReminders}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header with Frosted Glass Effect */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[
          styles.header,
          { paddingTop: insets.top + Spacing.md },
        ]}
      >
        <LinearGradient
          colors={[theme.secondary, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerTop}>
          <Pressable onPress={() => setHouseholdModalVisible(true)} hitSlop={10}>
            <View style={styles.householdButton}>
              <Ionicons name="people" size={20} color={theme.textInverse} />
              {currentHousehold && (
                <Text style={[styles.householdName, { color: theme.textInverse }]}>
                  {currentHousehold.name}
                </Text>
              )}
            </View>
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable onPress={() => setCommandPaletteVisible(true)} hitSlop={10}>
              <Ionicons name="search" size={24} color={theme.textInverse} />
            </Pressable>
            <Pressable onPress={() => setSmartScanVisible(true)} hitSlop={10}>
              <Ionicons name="scan" size={24} color={theme.textInverse} />
            </Pressable>
            <Pressable onPress={() => setCommunityHubVisible(true)} hitSlop={10}>
              <Ionicons name="grid" size={24} color={theme.textInverse} />
            </Pressable>
            {unreadNudges.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadNudges.length}</Text>
              </View>
            )}
            <Ionicons name="notifications-outline" size={24} color={theme.textInverse} />
          </View>
        </View>
        <Text style={[styles.dateText, { color: theme.textInverse }]}>{formatDate()}</Text>

        {/* Context Chips */}
        {weatherLoading ? (
          <View style={styles.weatherLoadingContainer}>
            <ActivityIndicator size="small" color={theme.textInverse} />
            <Text style={[styles.weatherLoadingText, { color: theme.textInverse }]}>
              Loading weather...
            </Text>
          </View>
        ) : (
          <ContextChips context={context} />
        )}
      </Animated.View>

      {/* Content */}
      <AnimatedScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.secondary}
            colors={[theme.secondary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Smart Defer Button */}
        {showSmartDefer && user && (
          <SmartDeferButton
            reminders={reminders}
            userId={user.id}
            onDefer={handleSmartDefer}
          />
        )}

        {/* Phase 9: Ambient Context Panel */}
        {weather && (
          <AmbientContextPanel
            weather={weather}
            upcomingTasks={reminders.filter((r) => r.status === 'pending').length}
          />
        )}

        {/* Phase 6: Daily Focus Widget */}
        <DailyFocusWidget
          currentTask={nextUp || null}
          completedToday={reminders.filter((r) => r.status === 'completed').length}
          totalToday={reminders.length}
          onVoiceAnchorPress={() => setVoiceAnchorVisible(true)}
          onTaskPress={() => nextUp && handleReminderPress(nextUp)}
        />

        {/* Phase 6: Proximity Widget */}
        {nearestAnchor && (
          <ProximityWidget
            nearestAnchor={nearestAnchor}
            relevantRemindersCount={reminders.filter((r) => r.status === 'pending').length}
          />
        )}

        {/* Next Up Card */}
        <NextUpCard reminder={nextUp || null} onPress={() => nextUp && handleReminderPress(nextUp)} />

        {/* Near You Contextual Panel */}
        {weather && <NearYouPanel reminders={reminders} calendarEvents={calendarEvents} weather={weather} />}

        {/* Calendar Events */}
        {calendarEvents.length > 0 && (
          <View style={styles.calendarSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              📅 Calendar Events
            </Text>
            {calendarEvents.map((event, index) => (
              <CalendarCard key={event.id} event={event} index={index} />
            ))}
          </View>
        )}

        {/* Timeline */}
        <View style={styles.timeline}>
          {sortedReminders.map((reminder, index) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onComplete={handleComplete}
              onPress={handleReminderPress}
              onSnooze={handleSnooze}
              showTimeline
              isFirst={index === 0}
              isLast={index === sortedReminders.length - 1}
            />
          ))}

          {sortedReminders.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={theme.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No reminders today</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Tap the + button to add a reminder
              </Text>
            </View>
          )}
        </View>
      </AnimatedScrollView>

      {/* Phase 2: Action Anchor Button with Voice Support */}
      <ActionAnchorButton
        onPress={() => setQuickAddVisible(true)}
        onLongPress={() => setVoiceAnchorVisible(true)}
        scrollY={scrollY}
      />

      {/* Modals */}
      <QuickAddModal
        visible={quickAddVisible}
        onClose={() => setQuickAddVisible(false)}
        onCreateReminder={handleCreateReminder}
      />

      <SnoozeModal
        visible={snoozeVisible}
        reminder={selectedReminder}
        onClose={() => setSnoozeVisible(false)}
        onSnooze={handleSnoozeConfirm}
      />

      <HouseholdModal
        visible={householdModalVisible}
        onClose={() => setHouseholdModalVisible(false)}
      />

      {/* Phase 2: Voice Anchor Modal */}
      <VoiceAnchorModal
        visible={voiceAnchorVisible}
        onClose={() => setVoiceAnchorVisible(false)}
        onVoiceCommand={handleVoiceCommand}
        isProcessing={voiceProcessing}
      />

      {/* Completion Animation */}
      <CompletionAnimation visible={showCompletion} onComplete={() => setShowCompletion(false)} />

      {/* Anchor Trigger Notification - Environmental Awareness */}
      <AnchorTriggerNotification
        point={lastTrigger?.point || null}
        onDismiss={clearLastTrigger}
        onAction={() => {
          // Handle anchor point action
          if (lastTrigger?.point) {
            console.log('Anchor action:', lastTrigger.point.actionType);
          }
          clearLastTrigger();
        }}
      />

      {/* Phase 6: Command Palette */}
      <CommandPalette
        visible={commandPaletteVisible}
        onClose={() => setCommandPaletteVisible(false)}
        onCreateReminder={(title) => {
          if (user) {
            const newReminder: Reminder = {
              id: `temp-${Date.now()}`,
              title,
              dueDate: new Date().toISOString().split('T')[0],
              dueTime: '12:00',
              status: 'pending',
              priority: 'medium',
              tag: 'Personal',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              recurrence: { type: 'none' },
              isRecurring: false,
            };
            handleCreateReminder(newReminder);
          }
        }}
      />

      {/* Phase 9: Community Hub */}
      <CommunityHubModal
        visible={communityHubVisible}
        onClose={() => setCommunityHubVisible(false)}
        onImportStack={handleImportStack}
        userReminders={reminders}
      />

      {/* Phase 9: Evening Reflections */}
      <EveningReflectionsModal
        visible={eveningReflectionsVisible}
        onClose={() => setEveningReflectionsVisible(false)}
        completedTasks={reminders.filter((r) => r.status === 'completed')}
        pendingTasks={reminders.filter((r) => r.status === 'pending' || r.status === 'overdue')}
        userName={user?.email?.split('@')[0] || 'there'}
      />

      {/* Phase 6: Onboarding Flow for First-Time Users */}
      {user && !hasCompletedOnboarding && (
        <OnboardingFlow
          visible={true}
          onComplete={(personality, anchorName) => {
            completeOnboarding(personality, anchorName);
          }}
          onSkip={() => {
            skipOnboarding();
          }}
        />
      )}
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
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  householdButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  householdName: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: Typography.weight.bold,
  },
  dateText: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.md,
  },
  weatherLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  weatherLoadingText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: Spacing.lg,
  },
  calendarSection: {
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.lg,
  },
  timeline: {
    paddingTop: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: Typography.size.base,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    gap: Spacing.md,
  },
  errorTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    marginTop: Spacing.md,
  },
  errorMessage: {
    fontSize: Typography.size.base,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  retryButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
});
