// Stack Card - Display stack in gallery
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useColorScheme';
import { Stack } from '@/types/stack';
import { Spacing, Typography, Shadows } from '@/constants/theme';

interface StackCardProps {
  stack: Stack;
  onPress: (stack: Stack) => void;
  index?: number;
}

export function StackCard({ stack, onPress, index = 0 }: StackCardProps) {
  const theme = useTheme();

  const difficultyColors = {
    easy: '#10B981',
    medium: '#F59E0B',
    hard: '#EF4444',
  };

  const difficultyIcons: Record<string, any> = {
    easy: 'sunny',
    medium: 'flash',
    hard: 'flame',
  };

  return (
    <Animated.View entering={FadeIn.delay(index * 100).duration(300)}>
      <Pressable
        onPress={() => onPress(stack)}
        style={({ pressed }) => [
          styles.container,
          { backgroundColor: theme.surface },
          pressed && styles.pressed,
        ]}
      >
        {/* Header with gradient */}
        <LinearGradient
          colors={[theme.secondary + '40', theme.accent + '40']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
                {stack.title}
              </Text>
              <Text style={[styles.category, { color: theme.textSecondary }]}>
                {stack.category}
              </Text>
            </View>
            {stack.isFeatured && (
              <View style={styles.featuredBadge}>
                <Ionicons name="star" size={16} color="#F59E0B" />
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.description, { color: theme.textSecondary }]} numberOfLines={2}>
            {stack.description}
          </Text>

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Ionicons name="checkmark-circle" size={16} color={theme.textMuted} />
              <Text style={[styles.statText, { color: theme.textMuted }]}>
                {stack.tasks.length} tasks
              </Text>
            </View>

            <View style={styles.stat}>
              <Ionicons name="time" size={16} color={theme.textMuted} />
              <Text style={[styles.statText, { color: theme.textMuted }]}>
                {stack.estimatedTime}
              </Text>
            </View>

            <View style={styles.stat}>
              <Ionicons name={difficultyIcons[stack.difficulty]} size={16} color={difficultyColors[stack.difficulty]} />
              <Text style={[styles.statText, { color: difficultyColors[stack.difficulty] }]}>
                {stack.difficulty}
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.rating}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={[styles.ratingText, { color: theme.text }]}>
                {stack.rating.toFixed(1)}
              </Text>
              <Text style={[styles.reviewCount, { color: theme.textMuted }]}>
                ({stack.reviewCount})
              </Text>
            </View>

            <View style={styles.downloads}>
              <Ionicons name="download" size={16} color={theme.textMuted} />
              <Text style={[styles.downloadText, { color: theme.textMuted }]}>
                {stack.downloads.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: 16,
    overflow: 'hidden',
    ...Shadows.md,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
  },
  category: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  featuredBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  description: {
    fontSize: Typography.size.sm,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ratingText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  reviewCount: {
    fontSize: Typography.size.xs,
  },
  downloads: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  downloadText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
});
