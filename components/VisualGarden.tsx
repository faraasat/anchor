// Visual Garden - 3D plant growth based on user progress
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
  withRepeat,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Ellipse, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '@/hooks/useColorScheme';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { Spacing, Typography } from '@/constants/theme';

interface VisualGardenProps {
  weeklyStreak: number; // 0-7
  taskCompletion: number; // 0-100
  level: number; // Plant evolution level 0-5
}

type PlantStage = 'seed' | 'sprout' | 'seedling' | 'young' | 'mature' | 'blooming';

const PLANT_STAGES: PlantStage[] = ['seed', 'sprout', 'seedling', 'young', 'mature', 'blooming'];

export function VisualGarden({ weeklyStreak, taskCompletion, level }: VisualGardenProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [currentStage, setCurrentStage] = useState<PlantStage>('seed');

  // Animation values
  const plantHeight = useSharedValue(0);
  const leafScale = useSharedValue(0);
  const flowerBloom = useSharedValue(0);
  const sway = useSharedValue(0);
  const shimmer = useSharedValue(0);

  // Determine plant stage based on metrics
  useEffect(() => {
    const stageIndex = Math.min(
      Math.floor((weeklyStreak / 7) * PLANT_STAGES.length),
      PLANT_STAGES.length - 1
    );
    const newStage = PLANT_STAGES[Math.max(0, Math.min(level, stageIndex))];
    setCurrentStage(newStage);

    // Animate to new stage
    animateToStage(newStage);
  }, [weeklyStreak, taskCompletion, level]);

  // Continuous animations
  useEffect(() => {
    // Gentle sway
    sway.value = withRepeat(
      withSequence(
        withTiming(5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-5, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );

    // Shimmer effect
    shimmer.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animateToStage = (stage: PlantStage) => {
    switch (stage) {
      case 'seed':
        plantHeight.value = withSpring(0);
        leafScale.value = withSpring(0);
        flowerBloom.value = withSpring(0);
        break;

      case 'sprout':
        plantHeight.value = withSpring(0.2, { damping: 10 });
        leafScale.value = withSpring(0.3, { damping: 12 });
        flowerBloom.value = withSpring(0);
        break;

      case 'seedling':
        plantHeight.value = withSpring(0.4, { damping: 10 });
        leafScale.value = withSpring(0.6, { damping: 12 });
        flowerBloom.value = withSpring(0);
        break;

      case 'young':
        plantHeight.value = withSpring(0.6, { damping: 10 });
        leafScale.value = withSpring(0.8, { damping: 12 });
        flowerBloom.value = withSpring(0);
        break;

      case 'mature':
        plantHeight.value = withSpring(0.8, { damping: 10 });
        leafScale.value = withSpring(1, { damping: 12 });
        flowerBloom.value = withSpring(0.3, { damping: 15 });
        break;

      case 'blooming':
        plantHeight.value = withSpring(1, { damping: 10 });
        leafScale.value = withSpring(1, { damping: 12 });
        flowerBloom.value = withSpring(1, { damping: 15 });
        break;
    }
  };

  const plantStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${sway.value}deg` },
      { scale: interpolate(plantHeight.value, [0, 1], [0.5, 1]) },
    ],
    opacity: interpolate(plantHeight.value, [0, 0.1], [0, 1]),
  }));

  const leafStyle = useAnimatedStyle(() => ({
    transform: [{ scale: leafScale.value }],
  }));

  const flowerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: flowerBloom.value }],
    opacity: flowerBloom.value,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
  }));

  const getStageMessage = () => {
    switch (currentStage) {
      case 'seed':
        return 'Plant your first task to begin!';
      case 'sprout':
        return 'Your garden is sprouting!';
      case 'seedling':
        return 'Growing strong!';
      case 'young':
        return 'Looking healthy!';
      case 'mature':
        return 'Almost in bloom!';
      case 'blooming':
        return '🌸 Fully bloomed!';
      default:
        return '';
    }
  };

  const renderPlant = () => {
    const plantSize = width * 0.6;
    const centerX = plantSize / 2;
    const centerY = plantSize / 2;

    return (
      <Svg width={plantSize} height={plantSize} viewBox="0 0 200 200">
        <Defs>
          <RadialGradient id="leafGradient" cx="50%" cy="50%">
            <Stop offset="0%" stopColor="#10B981" stopOpacity="1" />
            <Stop offset="100%" stopColor="#059669" stopOpacity="1" />
          </RadialGradient>
          <RadialGradient id="flowerGradient" cx="50%" cy="50%">
            <Stop offset="0%" stopColor="#F472B6" stopOpacity="1" />
            <Stop offset="100%" stopColor="#EC4899" stopOpacity="1" />
          </RadialGradient>
        </Defs>

        {/* Pot */}
        <Path
          d="M 60 160 L 70 180 L 130 180 L 140 160 Z"
          fill="#8B4513"
          stroke="#654321"
          strokeWidth="2"
        />

        {/* Soil */}
        <Ellipse cx="100" cy="160" rx="40" ry="10" fill="#654321" />

        {/* Stem */}
        {currentStage !== 'seed' && (
          <Path
            d="M 100 160 Q 95 140 100 120 Q 105 100 100 80 Q 95 60 100 40"
            fill="none"
            stroke="#059669"
            strokeWidth="4"
            strokeLinecap="round"
          />
        )}

        {/* Leaves */}
        {(currentStage === 'seedling' || currentStage === 'young' || currentStage === 'mature' || currentStage === 'blooming') && (
          <>
            {/* Left leaf */}
            <Ellipse
              cx="75"
              cy="100"
              rx="25"
              ry="15"
              fill="url(#leafGradient)"
              transform="rotate(-30 75 100)"
            />
            {/* Right leaf */}
            <Ellipse
              cx="125"
              cy="100"
              rx="25"
              ry="15"
              fill="url(#leafGradient)"
              transform="rotate(30 125 100)"
            />
            {/* Additional leaves for mature stages */}
            {(currentStage === 'mature' || currentStage === 'blooming') && (
              <>
                <Ellipse
                  cx="70"
                  cy="70"
                  rx="20"
                  ry="12"
                  fill="url(#leafGradient)"
                  transform="rotate(-45 70 70)"
                />
                <Ellipse
                  cx="130"
                  cy="70"
                  rx="20"
                  ry="12"
                  fill="url(#leafGradient)"
                  transform="rotate(45 130 70)"
                />
              </>
            )}
          </>
        )}

        {/* Flower */}
        {(currentStage === 'mature' || currentStage === 'blooming') && (
          <>
            {/* Flower petals */}
            {[0, 72, 144, 216, 288].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const petalX = 100 + Math.cos(rad) * 15;
              const petalY = 40 + Math.sin(rad) * 15;
              return (
                <Circle
                  key={i}
                  cx={petalX}
                  cy={petalY}
                  r="12"
                  fill="url(#flowerGradient)"
                />
              );
            })}
            {/* Flower center */}
            <Circle cx="100" cy="40" r="10" fill="#FCD34D" />
          </>
        )}

        {/* Seed/Sprout */}
        {currentStage === 'seed' && (
          <Circle cx="100" cy="155" r="8" fill="#8B4513" />
        )}
        {currentStage === 'sprout' && (
          <>
            <Circle cx="100" cy="155" r="6" fill="#8B4513" />
            <Path
              d="M 100 155 Q 95 145 100 140"
              fill="none"
              stroke="#10B981"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </>
        )}
      </Svg>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#E0F2FE', '#BAE6FD', '#7DD3FC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.background}
      >
        {/* Shimmer effect */}
        <Animated.View style={[styles.shimmer, shimmerStyle]}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Plant */}
        <Animated.View style={[styles.plantContainer, plantStyle]}>
          {renderPlant()}
        </Animated.View>

        {/* Progress Info */}
        <View style={styles.infoContainer}>
          <Text style={[styles.stageText, { color: theme.text }]}>{getStageMessage()}</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressItem}>
              <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
                Streak
              </Text>
              <Text style={[styles.progressValue, { color: theme.text }]}>
                {weeklyStreak}/7
              </Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
                Level
              </Text>
              <Text style={[styles.progressValue, { color: theme.text }]}>
                {level + 1}/6
              </Text>
            </View>
            <View style={styles.progressItem}>
              <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>
                Growth
              </Text>
              <Text style={[styles.progressValue, { color: theme.text }]}>
                {taskCompletion}%
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
  },
  background: {
    padding: Spacing.xl,
    minHeight: 350,
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
  },
  plantContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.lg,
  },
  infoContainer: {
    marginTop: Spacing.xl,
  },
  stageText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressItem: {
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
    marginBottom: Spacing.xs,
  },
  progressValue: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
});
