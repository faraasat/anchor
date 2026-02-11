// Pomodoro Timer - Focus sessions with breaks
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';

const FOCUS_TIME = 25 * 60; // 25 minutes in seconds
const SHORT_BREAK = 5 * 60; // 5 minutes
const LONG_BREAK = 15 * 60; // 15 minutes

type TimerMode = 'focus' | 'shortBreak' | 'longBreak';

interface PomodoroTimerProps {
  onComplete?: () => void;
}

export function PomodoroTimer({ onComplete }: PomodoroTimerProps) {
  const theme = useTheme();
  const [mode, setMode] = useState<TimerMode>('focus');
  const [timeLeft, setTimeLeft] = useState(FOCUS_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const progress = useSharedValue(1);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          const total = mode === 'focus' ? FOCUS_TIME : mode === 'shortBreak' ? SHORT_BREAK : LONG_BREAK;
          progress.value = newTime / total;

          if (newTime === 0) {
            handleTimerComplete();
          }

          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, mode]);

  const handleTimerComplete = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setIsRunning(false);

    if (mode === 'focus') {
      const newSessions = sessions + 1;
      setSessions(newSessions);
      onComplete?.();

      // After 4 focus sessions, take a long break
      if (newSessions % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(LONG_BREAK);
      } else {
        setMode('shortBreak');
        setTimeLeft(SHORT_BREAK);
      }
    } else {
      setMode('focus');
      setTimeLeft(FOCUS_TIME);
    }
  };

  const handleStartPause = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setIsRunning(false);
    setMode('focus');
    setTimeLeft(FOCUS_TIME);
    progress.value = 1;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: withTiming(progress.value, { duration: 1000 }) }],
  }));

  const getModeColor = () => {
    switch (mode) {
      case 'focus':
        return theme.secondary;
      case 'shortBreak':
        return theme.info;
      case 'longBreak':
        return theme.success;
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'focus':
        return 'Focus Time';
      case 'shortBreak':
        return 'Short Break';
      case 'longBreak':
        return 'Long Break';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }, Shadows.md]}>
      <View style={styles.header}>
        <Text style={[styles.modeLabel, { color: getModeColor() }]}>{getModeLabel()}</Text>
        <Text style={[styles.sessionsLabel, { color: theme.textSecondary }]}>
          {sessions} {sessions === 1 ? 'session' : 'sessions'} today
        </Text>
      </View>

      <View style={styles.timerContainer}>
        <Text style={[styles.timerText, { color: theme.text }]}>
          {formatTime(timeLeft)}
        </Text>

        {/* Progress Bar */}
        <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
          <Animated.View
            style={[
              styles.progressFill,
              { backgroundColor: getModeColor() },
              progressAnimatedStyle,
            ]}
          />
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={handleStartPause}
          style={[styles.mainButton, { backgroundColor: getModeColor() }, Shadows.md]}
        >
          <Ionicons
            name={isRunning ? 'pause' : 'play'}
            size={32}
            color="#FFFFFF"
          />
        </Pressable>

        <Pressable
          onPress={handleReset}
          style={[styles.secondaryButton, { borderColor: theme.border }]}
        >
          <Ionicons name="reload" size={24} color={theme.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modeLabel: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.xs,
  },
  sessionsLabel: {
    fontSize: Typography.size.sm,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  timerText: {
    fontSize: 64,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.lg,
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    transformOrigin: 'left',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  mainButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
