// Pedometer - Daily step tracking
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { DemoMode } from '@/utils/demoMode';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function Pedometer() {
  const theme = useTheme();
  const [steps, setSteps] = useState(0);
  const [goal] = useState(10000);
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);
  const progress = useSharedValue(0);

  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    loadStepData();
  }, []);

  useEffect(() => {
    progress.value = withTiming(Math.min(steps / goal, 1), { duration: 600 });
  }, [steps, goal]);

  const loadStepData = async () => {
    const wellness = await DemoMode.getDemoWellness();
    setSteps(wellness.steps.stepsToday);
    setDistance(wellness.steps.distance);
    setCalories(wellness.steps.calories);
  };

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return { strokeDashoffset };
  });

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const percentage = Math.round((steps / goal) * 100);

  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }, Shadows.md]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Daily Steps</Text>
        <Ionicons name="walk" size={24} color={theme.success} />
      </View>

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
            stroke={theme.success}
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
          <Text style={[styles.stepsText, { color: theme.text }]}>
            {formatNumber(steps)}
          </Text>
          <Text style={[styles.goalText, { color: theme.textSecondary }]}>
            of {formatNumber(goal)}
          </Text>
          <Text style={[styles.percentageText, { color: theme.success }]}>
            {percentage}%
          </Text>
        </View>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Ionicons name="navigate" size={20} color={theme.secondary} />
          <Text style={[styles.statValue, { color: theme.text }]}>
            {distance.toFixed(1)} km
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Distance</Text>
        </View>

        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />

        <View style={styles.statItem}>
          <Ionicons name="flame" size={20} color={theme.warning} />
          <Text style={[styles.statValue, { color: theme.text }]}>
            {calories}
          </Text>
          <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Calories</Text>
        </View>
      </View>

      {steps >= goal && (
        <View style={[styles.completeBadge, { backgroundColor: theme.success + '20' }]}>
          <Ionicons name="trophy" size={20} color={theme.success} />
          <Text style={[styles.completeText, { color: theme.success }]}>
            Goal achieved! Great job!
          </Text>
        </View>
      )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
  },
  progressContainer: {
    position: 'relative',
    alignSelf: 'center',
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
  stepsText: {
    fontSize: 36,
    fontWeight: Typography.weight.bold,
  },
  goalText: {
    fontSize: Typography.size.sm,
    marginTop: 2,
  },
  percentageText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    marginTop: Spacing.xs,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  statValue: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  statLabel: {
    fontSize: Typography.size.xs,
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  completeText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
});
