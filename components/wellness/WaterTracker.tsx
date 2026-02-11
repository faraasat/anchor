// Water Tracker - Daily hydration tracking
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { DemoMode } from '@/utils/demoMode';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function WaterTracker() {
  const theme = useTheme();
  const [cups, setCups] = useState(0);
  const [goal] = useState(8);
  const progress = useSharedValue(0);

  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    loadWaterData();
  }, []);

  useEffect(() => {
    progress.value = withTiming(cups / goal, { duration: 600 });
  }, [cups, goal]);

  const loadWaterData = async () => {
    const wellness = await DemoMode.getDemoWellness();
    setCups(wellness.water.cupsToday);
  };

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return { strokeDashoffset };
  });

  const handleAddCup = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newCups = Math.min(cups + 1, goal);
    setCups(newCups);

    await DemoMode.updateWellness({
      water: {
        cupsToday: newCups,
        dailyGoal: goal,
        lastDrink: new Date().toISOString(),
      },
    });
  };

  const handleRemoveCup = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCups(Math.max(0, cups - 1));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }, Shadows.md]}>
      <Text style={[styles.title, { color: theme.text }]}>Water Intake</Text>

      <View style={styles.progressContainer}>
        <Svg width={size} height={size} style={styles.progressRing}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.border}
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Progress circle */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={theme.info}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>

        <View style={styles.progressText}>
          <Text style={[styles.cupsText, { color: theme.text }]}>
            {cups}/{goal}
          </Text>
          <Text style={[styles.cupsLabel, { color: theme.textSecondary }]}>cups</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={handleRemoveCup}
          disabled={cups === 0}
          style={[
            styles.controlButton,
            { borderColor: theme.border },
            cups === 0 && styles.controlButtonDisabled,
          ]}
        >
          <Ionicons name="remove" size={24} color={cups === 0 ? theme.textMuted : theme.textSecondary} />
        </Pressable>

        <Pressable
          onPress={handleAddCup}
          disabled={cups >= goal}
          style={[
            styles.addButton,
            { backgroundColor: theme.info },
            cups >= goal && { opacity: 0.5 },
            Shadows.md,
          ]}
        >
          <Ionicons name="water" size={28} color="#FFFFFF" />
        </Pressable>

        <Pressable
          onPress={handleAddCup}
          disabled={cups >= goal}
          style={[
            styles.controlButton,
            { borderColor: theme.border },
            cups >= goal && styles.controlButtonDisabled,
          ]}
        >
          <Ionicons name="add" size={24} color={cups >= goal ? theme.textMuted : theme.textSecondary} />
        </Pressable>
      </View>

      {cups >= goal && (
        <View style={[styles.completeBadge, { backgroundColor: theme.success + '20' }]}>
          <Ionicons name="checkmark-circle" size={16} color={theme.success} />
          <Text style={[styles.completeText, { color: theme.success }]}>Goal reached!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  title: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.lg,
  },
  progressContainer: {
    position: 'relative',
    marginBottom: Spacing.xl,
  },
  progressRing: {},
  progressText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cupsText: {
    fontSize: 32,
    fontWeight: Typography.weight.bold,
  },
  cupsLabel: {
    fontSize: Typography.size.sm,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonDisabled: {
    opacity: 0.3,
  },
  addButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  completeText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
});
