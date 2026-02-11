// Smart Defer Button - AI-powered task deferral
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing, Typography } from '@/constants/theme';
import { SmartDeferService } from '@/services/SmartDeferService';
import type { Reminder } from '@/types/reminder';

interface SmartDeferButtonProps {
  reminders: Reminder[];
  userId: string;
  onDefer: () => void;
}

export function SmartDeferButton({ reminders, userId, onDefer }: SmartDeferButtonProps) {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const handleDefer = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsLoading(true);

      const result = await SmartDeferService.executeDefer(reminders, userId);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Tasks Deferred ✨',
        `${result.deferredCount} low-priority ${result.deferredCount === 1 ? 'task has' : 'tasks have'} been automatically pushed back. You can focus on what matters most!`,
        [{ text: 'Got it', style: 'default' }]
      );

      onDefer();
    } catch (error) {
      console.error('Error deferring tasks:', error);
      Alert.alert('Error', 'Failed to defer tasks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Animated.View
      entering={FadeInUp.springify()}
      exiting={FadeOutUp}
      style={[styles.container, { backgroundColor: theme.surface }]}
    >
      <LinearGradient
        colors={['#EC4899', '#F43F5E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="flash" size={24} color="#FFFFFF" />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>Feeling Overwhelmed?</Text>
            <Text style={styles.subtitle}>
              We can defer low-priority tasks to help you focus
            </Text>
          </View>
        </View>

        <Pressable
          style={styles.button}
          onPress={handleDefer}
          disabled={isLoading}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.2)' }}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.buttonText}>De-stress</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </>
          )}
        </Pressable>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  gradient: {
    padding: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: Typography.size.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: 12,
    gap: Spacing.xs,
    minHeight: 44,
  },
  buttonText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    color: '#FFFFFF',
  },
});
