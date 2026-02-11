// Context Chips - Prominent Weather and Traffic with Frosted Glass
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, useColorScheme } from '@/hooks/useColorScheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { ContextData } from '@/types/reminder';
import Animated, { FadeInRight } from 'react-native-reanimated';

interface ContextChipsProps {
  context: ContextData;
  onWeatherPress?: () => void;
  onTrafficPress?: () => void;
}

export function ContextChips({ context, onWeatherPress, onTrafficPress }: ContextChipsProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();

  if (!context.weather && !context.traffic) {
    return null;
  }

  return (
    <View style={styles.container}>
      {context.weather && (
        <Animated.View
          entering={FadeInRight.delay(100).duration(400).springify()}
          style={styles.chipContainer}
        >
          <Pressable
            onPress={onWeatherPress}
            style={({ pressed }) => [
              styles.chipWrapper,
              pressed && styles.chipPressed,
            ]}
          >
            <BlurView
              intensity={80}
              tint={colorScheme === 'dark' ? 'dark' : 'light'}
              style={styles.blurContainer}
            >
              <LinearGradient
                colors={
                  colorScheme === 'dark'
                    ? ['rgba(94, 234, 212, 0.25)', 'rgba(94, 234, 212, 0.15)']
                    : ['rgba(45, 122, 107, 0.15)', 'rgba(45, 122, 107, 0.1)']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.chip, Shadows.md]}
              >
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]}>
                  <Text style={styles.chipIcon}>
                    {getWeatherIcon(context.weather.condition)}
                  </Text>
                </View>
                <View style={styles.chipContent}>
                  <Text style={[styles.chipLabel, { color: theme.textInverse }]}>
                    Weather
                  </Text>
                  <Text style={[styles.chipValue, { color: theme.textInverse }]}>
                    {context.weather.temperature}°F, {context.weather.condition}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={`${theme.textInverse}80`} />
              </LinearGradient>
            </BlurView>
          </Pressable>
        </Animated.View>
      )}

      {context.traffic && (
        <Animated.View
          entering={FadeInRight.delay(200).duration(400).springify()}
          style={styles.chipContainer}
        >
          <Pressable
            onPress={onTrafficPress}
            style={({ pressed }) => [
              styles.chipWrapper,
              pressed && styles.chipPressed,
            ]}
          >
            <BlurView
              intensity={80}
              tint={colorScheme === 'dark' ? 'dark' : 'light'}
              style={styles.blurContainer}
            >
              <LinearGradient
                colors={
                  colorScheme === 'dark'
                    ? ['rgba(252, 211, 77, 0.25)', 'rgba(252, 211, 77, 0.15)']
                    : ['rgba(197, 149, 48, 0.15)', 'rgba(197, 149, 48, 0.1)']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.chip, Shadows.md]}
              >
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]}>
                  <Text style={styles.chipIcon}>🚗</Text>
                </View>
                <View style={styles.chipContent}>
                  <Text style={[styles.chipLabel, { color: theme.textInverse }]}>
                    To {context.traffic.destination}
                  </Text>
                  <Text style={[styles.chipValue, { color: theme.textInverse }]}>
                    {context.traffic.duration} drive
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={`${theme.textInverse}80`} />
              </LinearGradient>
            </BlurView>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

function getWeatherIcon(condition: string): string {
  const lowerCondition = condition.toLowerCase();
  if (lowerCondition.includes('sun') || lowerCondition.includes('clear')) return '☀️';
  if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) return '⛅';
  if (lowerCondition.includes('rain')) return '🌧️';
  if (lowerCondition.includes('snow')) return '❄️';
  if (lowerCondition.includes('storm') || lowerCondition.includes('thunder')) return '⛈️';
  if (lowerCondition.includes('fog') || lowerCondition.includes('mist')) return '🌫️';
  return '🌤️';
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  chipContainer: {
    overflow: 'visible',
  },
  chipWrapper: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  blurContainer: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  chipPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipIcon: {
    fontSize: 20,
  },
  chipContent: {
    flex: 1,
    gap: 2,
  },
  chipLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
    opacity: 0.9,
  },
  chipValue: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
});
