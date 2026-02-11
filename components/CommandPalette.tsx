// Phase 6: Command Palette - Premium Omni-Action Interface
// Powerful command execution with haptic feedback and instant actions
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  Platform,
  Keyboard,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeEngine } from '@/contexts/ThemeEngineContext';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface Command {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  keywords: string[];
  action: () => void | Promise<void>;
  hapticPattern?: 'success' | 'warning' | 'selection';
}

interface CommandPaletteProps {
  visible: boolean;
  onClose: () => void;
  onCreateReminder?: (title: string) => void;
  onSwitchTheme?: () => void;
  onNavigate?: (route: string) => void;
}

export function CommandPalette({
  visible,
  onClose,
  onCreateReminder,
  onSwitchTheme,
  onNavigate,
}: CommandPaletteProps) {
  const { theme, timeOfDay, triggerInkBleed } = useThemeEngine();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<TextInput>(null);

  // Command registry
  const commands: Command[] = [
    // Navigation
    {
      id: 'nav-today',
      title: 'Go to Today',
      description: 'View your daily timeline',
      icon: 'home-outline',
      keywords: ['today', 'home', 'timeline', 'dashboard'],
      action: () => {
        router.push('/(tabs)');
        onClose();
      },
    },
    {
      id: 'nav-reminders',
      title: 'View All Reminders',
      description: 'See all your tasks and reminders',
      icon: 'list-outline',
      keywords: ['reminders', 'tasks', 'all', 'list'],
      action: () => {
        router.push('/(tabs)/reminders');
        onClose();
      },
    },
    {
      id: 'nav-circles',
      title: 'Open Circles',
      description: 'Manage your circles and stacks',
      icon: 'people-outline',
      keywords: ['circles', 'stacks', 'groups', 'family'],
      action: () => {
        router.push('/(tabs)/circles');
        onClose();
      },
    },
    {
      id: 'nav-anchors',
      title: 'View Anchors',
      description: 'Manage physical anchor points',
      icon: 'radio-outline',
      keywords: ['anchors', 'locations', 'triggers', 'nfc', 'bluetooth'],
      action: () => {
        router.push('/(tabs)/anchors');
        onClose();
      },
    },
    {
      id: 'nav-insights',
      title: 'View Insights',
      description: 'See your productivity analytics',
      icon: 'analytics-outline',
      keywords: ['insights', 'analytics', 'stats', 'data'],
      action: () => {
        router.push('/(tabs)/insights');
        onClose();
      },
    },
    {
      id: 'nav-profile',
      title: 'Open Profile',
      description: 'Manage your account and settings',
      icon: 'person-outline',
      keywords: ['profile', 'settings', 'account', 'me'],
      action: () => {
        router.push('/(tabs)/profile');
        onClose();
      },
    },
    // Quick actions
    {
      id: 'action-create-work',
      title: 'Create Stack: Work',
      description: 'Create a new Work stack',
      icon: 'briefcase-outline',
      keywords: ['create', 'stack', 'work', 'professional'],
      action: () => {
        router.push('/(tabs)/circles');
        onClose();
      },
      hapticPattern: 'success',
    },
    {
      id: 'action-create-personal',
      title: 'Create Stack: Personal',
      description: 'Create a new Personal stack',
      icon: 'heart-outline',
      keywords: ['create', 'stack', 'personal', 'life'],
      action: () => {
        router.push('/(tabs)/circles');
        onClose();
      },
      hapticPattern: 'success',
    },
    {
      id: 'action-focus-mode',
      title: 'Start Focus Session',
      description: 'Begin a focused work session',
      icon: 'timer-outline',
      keywords: ['focus', 'pomodoro', 'concentrate', 'session'],
      action: () => {
        router.push('/focus');
        onClose();
      },
      hapticPattern: 'success',
    },
    {
      id: 'action-wellness',
      title: 'Open Wellness',
      description: 'Track mindfulness and wellness',
      icon: 'leaf-outline',
      keywords: ['wellness', 'mindfulness', 'health', 'meditation'],
      action: () => {
        router.push('/wellness');
        onClose();
      },
    },
    {
      id: 'action-commute',
      title: 'Start Commute Mode',
      description: 'Activate commute-specific reminders',
      icon: 'car-outline',
      keywords: ['commute', 'driving', 'travel', 'mode'],
      action: () => {
        router.push('/commute');
        onClose();
      },
      hapticPattern: 'success',
    },
    // Theme switching
    {
      id: 'theme-switch',
      title: 'Switch Theme',
      description: `Current: ${timeOfDay} mode`,
      icon: 'color-palette-outline',
      keywords: ['theme', 'dark', 'light', 'appearance', 'night'],
      action: async () => {
        if (onSwitchTheme) {
          await onSwitchTheme();
          triggerInkBleed();
        }
        onClose();
      },
      hapticPattern: 'selection',
    },
    // Ink Bleed effect
    {
      id: 'effect-inkbleed',
      title: 'Trigger Ink Bleed',
      description: 'See the ink bleed transition effect',
      icon: 'water-outline',
      keywords: ['ink', 'bleed', 'transition', 'effect', 'animation'],
      action: () => {
        triggerInkBleed();
        onClose();
      },
      hapticPattern: 'selection',
    },
  ];

  // Filter commands based on query
  const filteredCommands = query.trim()
    ? commands.filter((cmd) => {
        const lowerQuery = query.toLowerCase();
        return (
          cmd.title.toLowerCase().includes(lowerQuery) ||
          cmd.description.toLowerCase().includes(lowerQuery) ||
          cmd.keywords.some((kw) => kw.includes(lowerQuery))
        );
      })
    : commands;

  // Parse natural language commands
  const parseCommand = useCallback(
    (input: string) => {
      const lowerInput = input.toLowerCase().trim();

      // Create reminder pattern: "remind me to..." or "create task..."
      if (
        lowerInput.startsWith('remind me to') ||
        lowerInput.startsWith('create task') ||
        lowerInput.startsWith('add reminder')
      ) {
        const title = lowerInput
          .replace(/^(remind me to|create task|add reminder)\s*/i, '')
          .trim();
        if (title && onCreateReminder) {
          onCreateReminder(title);
          onClose();
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
      }
    },
    [onCreateReminder, onClose]
  );

  // Handle command execution
  const executeCommand = useCallback(
    async (command: Command) => {
      try {
        // Trigger haptic feedback
        if (Platform.OS !== 'web' && command.hapticPattern) {
          switch (command.hapticPattern) {
            case 'success':
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              break;
            case 'warning':
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              break;
            case 'selection':
              await Haptics.selectionAsync();
              break;
          }
        }

        // Execute command action
        await command.action();
      } catch (err) {
        console.error('Command execution error:', err);
      }
    },
    []
  );

  // Handle enter key
  const handleSubmit = useCallback(() => {
    if (filteredCommands.length > 0) {
      executeCommand(filteredCommands[selectedIndex]);
    } else {
      // Try to parse as natural language
      parseCommand(query);
    }
  }, [query, filteredCommands, selectedIndex, executeCommand, parseCommand]);

  // Focus input when modal opens
  useEffect(() => {
    if (visible) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[styles.overlay, { backgroundColor: theme.overlay }]}
        />
      </Pressable>

      <Animated.View
        entering={SlideInDown.springify().damping(20)}
        exiting={SlideOutDown.duration(200)}
        style={[
          styles.paletteContainer,
          {
            top: insets.top + 60,
            marginHorizontal: Spacing.lg,
          },
        ]}
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 95 : 80}
          tint={theme.timeOfDay === 'night' ? 'dark' : 'light'}
          style={[
            styles.palette,
            {
              backgroundColor: theme.frostedGlass,
              borderColor: theme.border,
            },
            Shadows.xl,
          ]}
        >
          {/* Search Input */}
          <View style={[styles.searchContainer, { borderBottomColor: theme.borderLight }]}>
            <Ionicons name="search" size={20} color={theme.textMuted} />
            <TextInput
              ref={inputRef}
              style={[
                styles.searchInput,
                {
                  color: theme.text,
                  fontWeight: Typography.weight.medium,
                },
              ]}
              placeholder="Type a command or action..."
              placeholderTextColor={theme.textMuted}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSubmit}
              returnKeyType="go"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          {/* Commands List */}
          <ScrollView
            style={styles.commandsScroll}
            contentContainerStyle={styles.commandsContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {filteredCommands.length > 0 ? (
              filteredCommands.map((cmd, index) => (
                <Pressable
                  key={cmd.id}
                  style={[
                    styles.commandItem,
                    {
                      backgroundColor:
                        index === selectedIndex ? theme.anchorHighlight : 'transparent',
                    },
                  ]}
                  onPress={() => executeCommand(cmd)}
                >
                  <View
                    style={[
                      styles.commandIconContainer,
                      { backgroundColor: theme.secondary + '15' },
                    ]}
                  >
                    <Ionicons name={cmd.icon} size={20} color={theme.secondary} />
                  </View>
                  <View style={styles.commandText}>
                    <Text
                      style={[
                        styles.commandTitle,
                        { color: theme.text, fontWeight: Typography.weight.semibold },
                      ]}
                    >
                      {cmd.title}
                    </Text>
                    <Text
                      style={[
                        styles.commandDescription,
                        { color: theme.textSecondary, fontWeight: Typography.weight.normal },
                      ]}
                    >
                      {cmd.description}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                </Pressable>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={theme.textMuted} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  {query.trim() ? 'No commands found' : 'Start typing to search...'}
                </Text>
                {query.trim() && (
                  <Text style={[styles.emptyHint, { color: theme.textMuted }]}>
                    Try "create task" or "go to today"
                  </Text>
                )}
              </View>
            )}
          </ScrollView>

          {/* Bottom Hint */}
          <View style={[styles.hintContainer, { borderTopColor: theme.borderLight }]}>
            <Text style={[styles.hintText, { color: theme.textMuted }]}>
              ↵ to execute • ESC to close
            </Text>
          </View>
        </BlurView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  paletteContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    maxHeight: '70%',
  },
  palette: {
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    overflow: 'hidden',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.size.base,
    padding: 0,
  },
  commandsScroll: {
    maxHeight: 400,
  },
  commandsContent: {
    paddingVertical: Spacing.xs,
  },
  commandItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  commandIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commandText: {
    flex: 1,
    gap: 2,
  },
  commandTitle: {
    fontSize: Typography.size.base,
  },
  commandDescription: {
    fontSize: Typography.size.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: Typography.size.base,
  },
  emptyHint: {
    fontSize: Typography.size.sm,
  },
  hintContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
  },
  hintText: {
    fontSize: Typography.size.xs,
    textAlign: 'center',
  },
});
