// Phase 5: Anchor Space (Focus Mode)
// Distraction-free UI with Zen timer and ambient soundscapes
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useThemeEngine } from '@/contexts/ThemeEngineContext';
import { Spacing, Typography } from '@/constants/theme';
import { Reminder } from '@/types/reminder';

type AmbientSoundscape = 'soft-rain' | 'library-hum' | 'white-noise' | 'forest' | 'none';

interface FocusScreenProps {
  task?: Reminder;
}

export default function FocusScreen() {
  const { theme } = useThemeEngine();
  const insets = useSafeAreaInsets();

  // Focus session state
  const [focusTime, setFocusTime] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [selectedSoundscape, setSelectedSoundscape] = useState<AmbientSoundscape>('soft-rain');
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Current task (would normally come from navigation params)
  const [currentTask] = useState<Reminder | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isRunning && focusTime > 0) {
      interval = setInterval(() => {
        setFocusTime((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, focusTime]);

  // Load and play ambient soundscape
  useEffect(() => {
    if (selectedSoundscape !== 'none' && isRunning) {
      loadSound();
    } else if (sound) {
      unloadSound();
    }

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [selectedSoundscape, isRunning]);

  const loadSound = async () => {
    try {
      // In a real app, you'd have audio files in assets
      // For now, we'll simulate ambient sound playback
      const { sound: newSound } = await Audio.Sound.createAsync(
        // Note: You'd need to add actual audio files
        { uri: 'https://example.com/ambient/' + selectedSoundscape + '.mp3' },
        { shouldPlay: true, isLooping: true, volume: 0.3 },
        null,
        false
      );
      setSound(newSound);
    } catch (error) {
      console.log('Error loading sound:', error);
      // Silently fail - ambient sound is optional
    }
  };

  const unloadSound = async () => {
    if (sound) {
      await sound.stopAsync();
      await sound.unloadAsync();
      setSound(null);
    }
  };

  const handleStart = () => {
    setIsRunning(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handlePause = () => {
    setIsRunning(false);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleNotNow = () => {
    // AI-powered rescheduling
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.back();
  };

  const handleSessionComplete = () => {
    setIsRunning(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // Show victory animation
  };

  const handleExit = () => {
    if (isRunning) {
      // Confirm exit
      handlePause();
    }
    router.back();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const soundscapes: { id: AmbientSoundscape; name: string; icon: string }[] = [
    { id: 'soft-rain', name: 'Soft Rain', icon: 'rainy' },
    { id: 'library-hum', name: 'Library', icon: 'book' },
    { id: 'white-noise', name: 'White Noise', icon: 'radio' },
    { id: 'forest', name: 'Forest', icon: 'leaf' },
    { id: 'none', name: 'Silence', icon: 'volume-mute' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Minimal Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable onPress={handleExit} hitSlop={10}>
          <Ionicons name="close" size={28} color={theme.text} />
        </Pressable>
      </View>

      {/* Focus Content */}
      <View style={styles.content}>
        {/* Zen Timer */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.timerContainer}>
          <Text style={[styles.timerLabel, { color: theme.textMuted }]}>
            {isRunning ? 'FOCUSING' : 'READY TO FOCUS'}
          </Text>

          <Text style={[styles.timer, { color: theme.text }]}>
            {formatTime(focusTime)}
          </Text>

          {currentTask && (
            <Text style={[styles.taskTitle, { color: theme.text }]}>
              {currentTask.title}
            </Text>
          )}
        </Animated.View>

        {/* Ambient Soundscape Selector */}
        {!isRunning && (
          <Animated.View
            entering={FadeIn.delay(200).duration(400)}
            exiting={FadeOut.duration(200)}
            style={styles.soundscapeContainer}
          >
            <Text style={[styles.soundscapeLabel, { color: theme.textSecondary }]}>
              Ambient Sound
            </Text>
            <View style={styles.soundscapeGrid}>
              {soundscapes.map((soundscape) => (
                <Pressable
                  key={soundscape.id}
                  style={[
                    styles.soundscapeButton,
                    {
                      backgroundColor: selectedSoundscape === soundscape.id
                        ? theme.secondary
                        : theme.surface,
                      borderColor: selectedSoundscape === soundscape.id
                        ? theme.secondary
                        : theme.border,
                    },
                  ]}
                  onPress={() => setSelectedSoundscape(soundscape.id)}
                >
                  <Ionicons
                    name={soundscape.icon as any}
                    size={24}
                    color={selectedSoundscape === soundscape.id ? theme.textInverse : theme.text}
                  />
                  <Text
                    style={[
                      styles.soundscapeName,
                      {
                        color: selectedSoundscape === soundscape.id
                          ? theme.textInverse
                          : theme.text,
                      },
                    ]}
                  >
                    {soundscape.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Control Buttons */}
        <View style={styles.controls}>
          {!isRunning ? (
            <Animated.View entering={FadeIn.delay(400).duration(400)} style={{ width: '100%' }}>
              <Pressable
                style={[styles.startButton, { backgroundColor: theme.secondary }]}
                onPress={handleStart}
              >
                <LinearGradient
                  colors={[theme.secondary, theme.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <Ionicons name="play" size={28} color={theme.textInverse} />
                <Text style={[styles.startButtonText, { color: theme.textInverse }]}>
                  Begin Focus Session
                </Text>
              </Pressable>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(400)} style={{ width: '100%' }}>
              <Pressable
                style={[styles.pauseButton, { borderColor: theme.border }]}
                onPress={handlePause}
              >
                <Ionicons name="pause" size={24} color={theme.text} />
                <Text style={[styles.pauseButtonText, { color: theme.text }]}>
                  Pause
                </Text>
              </Pressable>
            </Animated.View>
          )}

          {/* Not Now Button */}
          <Pressable
            style={[styles.notNowButton, { borderColor: theme.borderLight }]}
            onPress={handleNotNow}
          >
            <Ionicons name="time-outline" size={20} color={theme.textMuted} />
            <Text style={[styles.notNowText, { color: theme.textMuted }]}>
              Not Now (AI will find a better time)
            </Text>
          </Pressable>
        </View>

        {/* Focus Tips */}
        {!isRunning && (
          <Animated.View
            entering={FadeIn.delay(600).duration(400)}
            style={styles.tipsContainer}
          >
            <View style={[styles.tip, { backgroundColor: theme.surface }]}>
              <Ionicons name="bulb-outline" size={20} color={theme.accent} />
              <Text style={[styles.tipText, { color: theme.textSecondary }]}>
                Close other apps and silence notifications for deep focus
              </Text>
            </View>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: Spacing['4xl'],
  },
  timerLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    letterSpacing: 1.5,
    marginBottom: Spacing.lg,
  },
  timer: {
    fontSize: 96,
    fontWeight: Typography.weight.bold,
    fontFamily: Typography.family.mono,
    letterSpacing: -2,
  },
  taskTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.semibold,
    textAlign: 'center',
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  soundscapeContainer: {
    width: '100%',
    marginBottom: Spacing['4xl'],
  },
  soundscapeLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  soundscapeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  soundscapeButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 24,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  soundscapeName: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  controls: {
    width: '100%',
    gap: Spacing.md,
    alignItems: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: 16,
    gap: Spacing.sm,
    overflow: 'hidden',
  },
  startButtonText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  pauseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: 16,
    gap: Spacing.sm,
    borderWidth: 2,
  },
  pauseButtonText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
  },
  notNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: 12,
    gap: Spacing.xs,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  notNowText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  tipsContainer: {
    marginTop: Spacing['4xl'],
    width: '100%',
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: 12,
  },
  tipText: {
    flex: 1,
    fontSize: Typography.size.sm,
    lineHeight: 20,
  },
});
