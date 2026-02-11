// Ambient Context Panel - Weather-aware contextual information card
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Location from 'expo-location';
import { useTheme, useColorScheme } from '@/hooks/useColorScheme';
import { WeatherData } from '@/services/WeatherService';
import { Spacing, Typography, Shadows } from '@/constants/theme';
import { NewellAI } from '@fastshot/ai';

interface AmbientContextPanelProps {
  weather: WeatherData | null;
  location?: Location.LocationObject | null;
  upcomingTasks?: number;
  onPress?: () => void;
}

interface ContextualNudge {
  type: 'traffic' | 'rain' | 'time' | 'task' | 'commute' | 'general';
  icon: string;
  message: string;
  color: string;
  priority: number;
}

export function AmbientContextPanel({ weather, location, upcomingTasks = 0, onPress }: AmbientContextPanelProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();

  const [nudges, setNudges] = useState<ContextualNudge[]>([]);
  const [commuteTime, setCommuteTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    generateContextualNudges();
  }, [weather, upcomingTasks, location]);

  const generateContextualNudges = async () => {
    if (!weather) return;

    const generatedNudges: ContextualNudge[] = [];

    // Weather-based nudges
    if (weather.condition.toLowerCase().includes('rain')) {
      generatedNudges.push({
        type: 'rain',
        icon: 'umbrella',
        message: 'Rain expected - bring an umbrella',
        color: '#3B82F6',
        priority: 9,
      });
    }

    if (weather.temperature < 50) {
      generatedNudges.push({
        type: 'general',
        icon: 'snow',
        message: 'Chilly today - dress warm',
        color: '#60A5FA',
        priority: 6,
      });
    }

    if (weather.temperature > 85) {
      generatedNudges.push({
        type: 'general',
        icon: 'sunny',
        message: 'Hot day - stay hydrated',
        color: '#F59E0B',
        priority: 7,
      });
    }

    // Time-based nudges
    const hour = new Date().getHours();
    if (hour >= 7 && hour <= 9 && upcomingTasks > 0) {
      // Try to get commute estimate with AI
      try {
        setLoading(true);
        const commuteEstimate = await getCommuteEstimate();
        if (commuteEstimate) {
          setCommuteTime(commuteEstimate.duration);
          generatedNudges.push({
            type: 'commute',
            icon: 'car',
            message: `${commuteEstimate.duration} to work`,
            color: '#8B5CF6',
            priority: 10,
          });

          if (commuteEstimate.hasTraffic) {
            generatedNudges.push({
              type: 'traffic',
              icon: 'alert-circle',
              message: commuteEstimate.trafficMessage || 'Heavy traffic - leave early',
              color: '#EF4444',
              priority: 10,
            });
          }
        }
      } catch (error) {
        console.error('Error getting commute estimate:', error);
      } finally {
        setLoading(false);
      }
    }

    if (hour >= 17 && hour <= 19 && upcomingTasks > 0) {
      generatedNudges.push({
        type: 'time',
        icon: 'time',
        message: 'Evening - perfect time to wrap up tasks',
        color: '#F59E0B',
        priority: 5,
      });
    }

    // Task-based nudges
    if (upcomingTasks > 5) {
      generatedNudges.push({
        type: 'task',
        icon: 'checkmark-circle',
        message: `${upcomingTasks} tasks today - stay focused!`,
        color: '#10B981',
        priority: 8,
      });
    } else if (upcomingTasks === 0) {
      generatedNudges.push({
        type: 'task',
        icon: 'happy',
        message: 'All clear! Enjoy your day',
        color: '#10B981',
        priority: 4,
      });
    }

    // Sort by priority
    generatedNudges.sort((a, b) => b.priority - a.priority);

    // Take top 3 nudges
    setNudges(generatedNudges.slice(0, 3));
  };

  const getCommuteEstimate = async (): Promise<{
    duration: string;
    hasTraffic: boolean;
    trafficMessage?: string;
  } | null> => {
    try {
      // Use Newell AI to estimate commute with current conditions
      const hour = new Date().getHours();
      const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18);

      const prompt = `Based on current conditions, estimate commute time:
- Time: ${hour}:00 ${hour >= 12 ? 'PM' : 'AM'}
- Weather: ${weather?.condition}
- Day: ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}

Provide a JSON response with:
{
  "duration": "15-20 min",
  "hasTraffic": boolean,
  "trafficMessage": "optional message about traffic"
}`;

      const response = await NewellAI.generateText(prompt, {
        model: 'gpt-4o-mini',
        temperature: 0.5,
        maxTokens: 150,
      });

      const cleanedResponse = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const result = JSON.parse(cleanedResponse);

      return result;
    } catch (error) {
      console.error('Error estimating commute:', error);
      // Fallback to simple estimation
      const hour = new Date().getHours();
      const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18);

      return {
        duration: isRushHour ? '20-25 min' : '15 min',
        hasTraffic: isRushHour,
        trafficMessage: isRushHour ? 'Moderate traffic expected' : undefined,
      };
    }
  };

  if (!weather && nudges.length === 0) return null;

  const getWeatherIcon = (condition: string): string => {
    const conditionLower = condition.toLowerCase();
    if (conditionLower.includes('rain')) return 'rainy';
    if (conditionLower.includes('cloud')) return 'cloudy';
    if (conditionLower.includes('sun')) return 'sunny';
    if (conditionLower.includes('snow')) return 'snow';
    if (conditionLower.includes('thunder')) return 'thunderstorm';
    return 'partly-sunny';
  };

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.container}>
      <Pressable onPress={onPress} disabled={!onPress}>
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={80}
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            style={[styles.card, { backgroundColor: theme.surface + '40' }]}
          >
            <LinearGradient
              colors={[
                theme.secondary + '20',
                theme.accent + '10',
                'transparent',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.content}>
              {weather && (
                <View style={styles.weatherSection}>
                  <Ionicons
                    name={getWeatherIcon(weather.condition) as any}
                    size={32}
                    color={theme.secondary}
                  />
                  <View style={styles.weatherInfo}>
                    <Text style={[styles.temperature, { color: theme.text }]}>
                      {Math.round(weather.temperature)}°F
                    </Text>
                    <Text style={[styles.condition, { color: theme.textSecondary }]}>
                      {weather.condition}
                    </Text>
                  </View>
                </View>
              )}

              {nudges.length > 0 && (
                <View style={styles.nudgesSection}>
                  {nudges.map((nudge, index) => (
                    <Animated.View
                      key={`${nudge.type}-${index}`}
                      entering={FadeIn.duration(300).delay(index * 100)}
                      style={styles.nudgeItem}
                    >
                      <View style={[styles.nudgeIcon, { backgroundColor: nudge.color + '20' }]}>
                        <Ionicons name={nudge.icon as any} size={16} color={nudge.color} />
                      </View>
                      <Text style={[styles.nudgeText, { color: theme.textSecondary }]} numberOfLines={1}>
                        {nudge.message}
                      </Text>
                    </Animated.View>
                  ))}
                </View>
              )}
            </View>
          </BlurView>
        ) : (
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <LinearGradient
              colors={[
                theme.secondary + '20',
                theme.accent + '10',
                'transparent',
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.content}>
              {weather && (
                <View style={styles.weatherSection}>
                  <Ionicons
                    name={getWeatherIcon(weather.condition) as any}
                    size={32}
                    color={theme.secondary}
                  />
                  <View style={styles.weatherInfo}>
                    <Text style={[styles.temperature, { color: theme.text }]}>
                      {Math.round(weather.temperature)}°F
                    </Text>
                    <Text style={[styles.condition, { color: theme.textSecondary }]}>
                      {weather.condition}
                    </Text>
                  </View>
                </View>
              )}

              {nudges.length > 0 && (
                <View style={styles.nudgesSection}>
                  {nudges.map((nudge, index) => (
                    <Animated.View
                      key={`${nudge.type}-${index}`}
                      entering={FadeIn.duration(300).delay(index * 100)}
                      style={styles.nudgeItem}
                    >
                      <View style={[styles.nudgeIcon, { backgroundColor: nudge.color + '20' }]}>
                        <Ionicons name={nudge.icon as any} size={16} color={nudge.color} />
                      </View>
                      <Text style={[styles.nudgeText, { color: theme.textSecondary }]} numberOfLines={1}>
                        {nudge.message}
                      </Text>
                    </Animated.View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadows.md,
  },
  content: {
    padding: Spacing.lg,
  },
  weatherSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  weatherInfo: {
    flex: 1,
  },
  temperature: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
  },
  condition: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  nudgesSection: {
    gap: Spacing.sm,
  },
  nudgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  nudgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nudgeText: {
    flex: 1,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
});
