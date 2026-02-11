// Smart 'Near You' Contextual Panel - Shows relevant location and environmental context
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import type { Reminder, CalendarEvent } from '@/types/reminder';

interface ContextInsight {
  id: string;
  type: 'traffic' | 'weather' | 'proximity' | 'calendar';
  icon: string;
  title: string;
  message: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
  color: string;
}

interface NearYouPanelProps {
  reminders: Reminder[];
  calendarEvents?: CalendarEvent[];
  weather?: {
    temperature: number;
    condition: string;
    icon: string;
  };
}

export function NearYouPanel({ reminders, calendarEvents = [], weather }: NearYouPanelProps) {
  const theme = useTheme();
  const [insights, setInsights] = useState<ContextInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    loadContextInsights();
  }, [reminders, calendarEvents, weather]);

  const loadContextInsights = async () => {
    setLoading(true);
    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }

      // Try to get AI-powered recommendations first
      try {
        const { ContextualAIService } = await import('@/services/ContextualAIService');
        const now = new Date();
        const contextData = {
          location: location
            ? { latitude: location.coords.latitude, longitude: location.coords.longitude }
            : undefined,
          weather,
          time: {
            hour: now.getHours(),
            dayOfWeek: now.getDay(),
            isWeekend: now.getDay() === 0 || now.getDay() === 6,
          },
          reminders,
          calendarEvents,
        };

        const aiRecommendations = await ContextualAIService.generateRecommendations(contextData);
        if (aiRecommendations.length > 0) {
          const mapped: ContextInsight[] = aiRecommendations.map((rec) => ({
            id: rec.id,
            type: rec.type as any,
            icon: rec.icon,
            title: rec.title,
            message: rec.message,
            action: rec.action,
            priority: rec.priority,
            color: rec.color,
          }));
          setInsights(mapped);
          setLoading(false);
          return;
        }
      } catch (aiError) {
        console.warn('AI recommendations failed, using fallback:', aiError);
      }

      // Fallback to rule-based insights
      const contextInsights: ContextInsight[] = [];

      // Check for upcoming calendar events and traffic
      if (calendarEvents.length > 0) {
        const nextEvent = calendarEvents[0];
        const eventTime = new Date(nextEvent.startDate);
        const now = new Date();
        const minutesUntil = Math.floor((eventTime.getTime() - now.getTime()) / 60000);

        if (minutesUntil > 0 && minutesUntil <= 60) {
          contextInsights.push({
            id: 'traffic-1',
            type: 'traffic',
            icon: 'car-outline',
            title: 'Traffic Update',
            message: `15 min drive to ${nextEvent.title}. Leave in ${Math.max(0, minutesUntil - 20)} minutes to arrive on time.`,
            action: 'View Route',
            priority: 'high',
            color: theme.warning,
          });
        }
      }

      // Check for outdoor tasks with bad weather
      const outdoorTasks = reminders.filter(
        (r) =>
          (r.tags?.includes('outdoor') ||
            r.title.toLowerCase().includes('walk') ||
            r.title.toLowerCase().includes('run') ||
            r.title.toLowerCase().includes('garden')) &&
          r.status === 'pending'
      );

      if (outdoorTasks.length > 0 && weather) {
        const badWeatherConditions = ['rain', 'snow', 'storm', 'thunderstorm'];
        const isBadWeather = badWeatherConditions.some((cond) =>
          weather.condition.toLowerCase().includes(cond)
        );

        if (isBadWeather) {
          contextInsights.push({
            id: 'weather-1',
            type: 'weather',
            icon: 'rainy-outline',
            title: 'Weather Alert',
            message: `${weather.condition} expected. Consider rescheduling "${outdoorTasks[0].title}" or moving indoors.`,
            action: 'Reschedule',
            priority: 'medium',
            color: theme.info,
          });
        } else if (weather.temperature > 85) {
          contextInsights.push({
            id: 'weather-2',
            type: 'weather',
            icon: 'sunny-outline',
            title: 'Hot Weather',
            message: `${weather.temperature}°F outside. Stay hydrated during "${outdoorTasks[0].title}".`,
            priority: 'low',
            color: theme.warning,
          });
        }
      }

      // Check for location-tagged reminders (mock - would use actual geofencing)
      const locationReminders = reminders.filter(
        (r) =>
          r.tags?.includes('errands') ||
          r.tags?.includes('shopping') ||
          r.title.toLowerCase().includes('store') ||
          r.title.toLowerCase().includes('buy')
      );

      if (locationReminders.length > 0 && location) {
        // Mock proximity check - in real app would check against actual store locations
        const isNearStore = Math.random() > 0.7; // Simulate 30% chance of being near a store

        if (isNearStore) {
          contextInsights.push({
            id: 'proximity-1',
            type: 'proximity',
            icon: 'location-outline',
            title: 'Near Store',
            message: `You're close to Whole Foods. Don't forget: "${locationReminders[0].title}"`,
            action: 'Navigate',
            priority: 'high',
            color: theme.success,
          });
        }
      }

      // Check for time-sensitive tasks
      const now = new Date();
      const currentHour = now.getHours();
      const urgentTasks = reminders.filter((r) => {
        if (r.status !== 'pending') return false;
        const [taskHour] = r.dueTime.split(':').map(Number);
        return taskHour === currentHour;
      });

      if (urgentTasks.length > 0) {
        contextInsights.push({
          id: 'calendar-1',
          type: 'calendar',
          icon: 'time-outline',
          title: 'Due Now',
          message: `"${urgentTasks[0].title}" is scheduled for this hour. Time to focus!`,
          priority: 'high',
          color: theme.error,
        });
      }

      // Sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      contextInsights.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      setInsights(contextInsights.slice(0, 3)); // Show top 3
    } catch (error) {
      console.error('Error loading context insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInsightPress = (insight: ContextInsight) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Handle different action types
    switch (insight.type) {
      case 'traffic':
        // Open maps or navigation
        console.log('Open navigation');
        break;
      case 'weather':
        // Open weather details or reschedule
        console.log('Open weather or reschedule');
        break;
      case 'proximity':
        // Open navigation to location
        console.log('Navigate to location');
        break;
      case 'calendar':
        // Navigate to task
        console.log('Navigate to task');
        break;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.surfaceElevated }]}>
        <ActivityIndicator size="small" color={theme.secondary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Checking your surroundings...
        </Text>
      </View>
    );
  }

  if (insights.length === 0) {
    return null; // Don't show panel if no insights
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={[styles.container, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }, Shadows.lg]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBadge, { backgroundColor: theme.secondary + '20' }]}>
            <Ionicons name="navigate" size={16} color={theme.secondary} />
          </View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Near You</Text>
        </View>
        <View style={[styles.liveBadge, { backgroundColor: theme.success + '20' }]}>
          <View style={[styles.liveDot, { backgroundColor: theme.success }]} />
          <Text style={[styles.liveText, { color: theme.success }]}>Live</Text>
        </View>
      </View>

      {/* Insights List */}
      <View style={styles.insightsList}>
        {insights.map((insight, index) => (
          <Pressable
            key={insight.id}
            onPress={() => handleInsightPress(insight)}
            style={[
              styles.insightItem,
              { backgroundColor: theme.surfaceElevated },
              index < insights.length - 1 && { marginBottom: Spacing.sm },
            ]}
          >
            <View style={[styles.insightIconContainer, { backgroundColor: insight.color + '20' }]}>
              <Ionicons name={insight.icon as any} size={20} color={insight.color} />
            </View>
            <View style={styles.insightContent}>
              <Text style={[styles.insightTitle, { color: theme.text }]}>{insight.title}</Text>
              <Text style={[styles.insightMessage, { color: theme.textSecondary }]} numberOfLines={2}>
                {insight.message}
              </Text>
            </View>
            {insight.action && (
              <View style={styles.actionButton}>
                <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
              </View>
            )}
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderWidth: 1,
  },
  loadingText: {
    fontSize: Typography.size.sm,
    marginTop: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  insightsList: {
    gap: 0,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  insightIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightContent: {
    flex: 1,
    gap: 2,
  },
  insightTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
  insightMessage: {
    fontSize: Typography.size.sm,
    lineHeight: Typography.size.sm * 1.4,
  },
  actionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
