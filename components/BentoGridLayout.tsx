// Bento Grid Layout - Sophisticated varying card sizes for visual hierarchy
import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { HapticPatternsService, HapticPattern } from '@/services/HapticPatternsService';

const { width } = Dimensions.get('window');
const cardPadding = Spacing.md;
const cardWidth = (width - cardPadding * 3) / 2;

export type BentoCardSize = 'small' | 'medium' | 'large' | 'wide' | 'tall';

export interface BentoCard {
  id: string;
  size: BentoCardSize;
  title: string;
  subtitle?: string;
  value?: string | number;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  gradient?: string[];
  onPress?: () => void;
  children?: React.ReactNode;
}

interface BentoGridLayoutProps {
  cards: BentoCard[];
}

export function BentoGridLayout({ cards }: BentoGridLayoutProps) {
  const theme = useTheme();

  const getCardDimensions = (size: BentoCardSize) => {
    switch (size) {
      case 'small':
        return { width: cardWidth, height: cardWidth * 0.7 };
      case 'medium':
        return { width: cardWidth, height: cardWidth };
      case 'large':
        return { width: cardWidth * 2 + cardPadding, height: cardWidth * 1.2 };
      case 'wide':
        return { width: cardWidth * 2 + cardPadding, height: cardWidth * 0.6 };
      case 'tall':
        return { width: cardWidth, height: cardWidth * 1.5 };
      default:
        return { width: cardWidth, height: cardWidth };
    }
  };

  const renderCard = (card: BentoCard, index: number) => {
    const dimensions = getCardDimensions(card.size);

    return (
      <Animated.View
        key={card.id}
        entering={FadeInDown.delay(index * 50).duration(300)}
        style={[
          styles.card,
          {
            width: dimensions.width,
            height: dimensions.height,
          },
        ]}
      >
        <Pressable
          onPress={() => {
            HapticPatternsService.playPattern(HapticPattern.TAP);
            card.onPress?.();
          }}
          style={styles.cardPressable}
        >
          {card.gradient ? (
            <LinearGradient
              colors={card.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.cardContent, Shadows.md]}
            >
              {renderCardContent(card, true)}
            </LinearGradient>
          ) : (
            <View
              style={[
                styles.cardContent,
                { backgroundColor: theme.cardBackground },
                Shadows.md,
              ]}
            >
              {renderCardContent(card, false)}
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  };

  const renderCardContent = (card: BentoCard, isGradient: boolean) => {
    const textColor = isGradient ? '#FFFFFF' : theme.text;
    const subtitleColor = isGradient ? 'rgba(255, 255, 255, 0.8)' : theme.textSecondary;

    if (card.children) {
      return card.children;
    }

    return (
      <View style={styles.cardInner}>
        {card.icon && (
          <View style={styles.cardIcon}>
            <Ionicons
              name={card.icon}
              size={card.size === 'small' ? 24 : 32}
              color={textColor}
            />
          </View>
        )}

        <View style={styles.cardTextContainer}>
          <Text
            style={[
              styles.cardTitle,
              {
                color: textColor,
                fontSize: card.size === 'small' ? Typography.size.sm : Typography.size.base,
              },
            ]}
            numberOfLines={2}
          >
            {card.title}
          </Text>

          {card.subtitle && (
            <Text
              style={[
                styles.cardSubtitle,
                {
                  color: subtitleColor,
                  fontSize: card.size === 'small' ? Typography.size.xs : Typography.size.sm,
                },
              ]}
              numberOfLines={1}
            >
              {card.subtitle}
            </Text>
          )}
        </View>

        {card.value !== undefined && (
          <Text
            style={[
              styles.cardValue,
              {
                color: textColor,
                fontSize: card.size === 'large' ? Typography.size['3xl'] : Typography.size.xl,
              },
            ]}
          >
            {card.value}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {cards.map((card, index) => renderCard(card, index))}
      </View>
    </View>
  );
}

// Pre-configured Bento layouts
export const BentoLayouts = {
  // Dashboard layout: Large hero card + smaller cards
  dashboard: (data: any): BentoCard[] => [
    {
      id: '1',
      size: 'large',
      title: 'Your Day',
      subtitle: `${data.completedTasks}/${data.totalTasks} tasks completed`,
      gradient: ['#3B82F6', '#8B5CF6'],
      icon: 'today',
      value: data.streakDays,
    },
    {
      id: '2',
      size: 'medium',
      title: 'Focus Time',
      subtitle: data.pomodoroTime,
      icon: 'timer',
      gradient: ['#10B981', '#059669'],
    },
    {
      id: '3',
      size: 'medium',
      title: 'Wellness',
      subtitle: `${data.stepCount} steps`,
      icon: 'walk',
      gradient: ['#F59E0B', '#EF4444'],
    },
    {
      id: '4',
      size: 'wide',
      title: 'Next Up',
      subtitle: data.nextTask,
      icon: 'arrow-forward',
    },
  ],

  // Insights layout: Mix of data cards
  insights: (data: any): BentoCard[] => [
    {
      id: '1',
      size: 'tall',
      title: 'Completion Rate',
      value: `${data.completionRate}%`,
      icon: 'stats-chart',
      gradient: ['#3B82F6', '#8B5CF6'],
    },
    {
      id: '2',
      size: 'small',
      title: 'Streak',
      value: data.streakDays,
      icon: 'flame',
      gradient: ['#EF4444', '#F59E0B'],
    },
    {
      id: '3',
      size: 'small',
      title: 'Tasks',
      value: data.totalTasks,
      icon: 'checkmark-circle',
    },
    {
      id: '4',
      size: 'wide',
      title: 'Productivity Pulse',
      subtitle: data.productivityTrend,
      icon: 'pulse',
      gradient: ['#10B981', '#059669'],
    },
    {
      id: '5',
      size: 'medium',
      title: 'Focus Score',
      value: data.focusScore,
      icon: 'eye',
    },
  ],

  // Wellness layout: Health-focused cards
  wellness: (data: any): BentoCard[] => [
    {
      id: '1',
      size: 'medium',
      title: 'Steps',
      value: (data.steps / 1000).toFixed(1) + 'k',
      icon: 'walk',
      gradient: ['#10B981', '#059669'],
    },
    {
      id: '2',
      size: 'medium',
      title: 'Water',
      value: `${data.waterGlasses}/8`,
      icon: 'water',
      gradient: ['#3B82F6', '#06B6D4'],
    },
    {
      id: '3',
      size: 'large',
      title: 'Pomodoro',
      subtitle: data.pomodoroActive ? 'Focus mode active' : 'Ready to focus',
      value: data.pomodoroTime,
      icon: 'timer',
      gradient: ['#8B5CF6', '#EC4899'],
    },
    {
      id: '4',
      size: 'small',
      title: 'Sleep',
      value: data.sleepHours + 'h',
      icon: 'moon',
    },
  ],
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: cardPadding,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: cardPadding,
  },
  card: {
    marginBottom: cardPadding,
  },
  cardPressable: {
    flex: 1,
  },
  cardContent: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  cardInner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardIcon: {
    marginBottom: Spacing.sm,
  },
  cardTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    fontWeight: Typography.weight.medium,
  },
  cardValue: {
    fontWeight: Typography.weight.bold,
    marginTop: Spacing.md,
  },
});
