// Backlog Health Meter - Visual indicator of task overload risk
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useColorScheme';
import type { BacklogRiskScore } from '@/types/phase8';
import { BacklogRiskService } from '@/services/BacklogRiskService';

interface BacklogHealthMeterProps {
  riskScore: BacklogRiskScore;
  onPurgeSession?: () => void;
  onViewDetails?: () => void;
}

export function BacklogHealthMeter({
  riskScore,
  onPurgeSession,
  onViewDetails,
}: BacklogHealthMeterProps) {
  const theme = useTheme();
  const meterColor = BacklogRiskService.getHealthMeterColor(riskScore.score);
  const message = BacklogRiskService.getHealthMeterMessage(riskScore.level);

  const getIcon = () => {
    switch (riskScore.level) {
      case 'healthy':
        return 'checkmark-circle';
      case 'moderate':
        return 'alert-circle';
      case 'concerning':
        return 'warning';
      case 'critical':
        return 'close-circle';
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(200).springify()}
      style={[
        styles.container,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.cardBorder,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconBadge, { backgroundColor: meterColor + '20' }]}>
          <Ionicons name={getIcon() as any} size={20} color={meterColor} />
        </View>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: theme.text }]}>
            Backlog Health
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {message}
          </Text>
        </View>
      </View>

      {/* Health Meter */}
      <View style={styles.meterContainer}>
        <View
          style={[
            styles.meterTrack,
            { backgroundColor: theme.border },
          ]}
        >
          <Animated.View
            entering={FadeInDown.delay(400).springify()}
            style={[
              styles.meterFill,
              {
                width: `${riskScore.score}%`,
                backgroundColor: meterColor,
              },
            ]}
          />
        </View>
        <View style={styles.meterLabels}>
          <Text style={[styles.meterLabel, { color: theme.textMuted }]}>
            Healthy
          </Text>
          <Text style={[styles.meterScore, { color: meterColor }]}>
            {riskScore.score}
          </Text>
          <Text style={[styles.meterLabel, { color: theme.textMuted }]}>
            Critical
          </Text>
        </View>
      </View>

      {/* Metrics */}
      <View style={styles.metricsGrid}>
        <View style={styles.metric}>
          <Text style={[styles.metricValue, { color: theme.text }]}>
            {riskScore.totalPending}
          </Text>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
            Pending
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.metricValue, { color: theme.error }]}>
            {riskScore.overdueCount}
          </Text>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
            Overdue
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.metricValue, { color: theme.text }]}>
            {riskScore.averageAge}d
          </Text>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
            Avg Age
          </Text>
        </View>
        <View style={styles.metric}>
          <Text style={[styles.metricValue, { color: theme.text }]}>
            {riskScore.healthMetrics.completionRate}%
          </Text>
          <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
            Completion
          </Text>
        </View>
      </View>

      {/* Actions */}
      {riskScore.level === 'critical' || riskScore.level === 'concerning' ? (
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: theme.error }]}
            onPress={onPurgeSession}
          >
            <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>
              Start Purge Session
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.actionButton,
              styles.actionButtonSecondary,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
            onPress={onViewDetails}
          >
            <Text
              style={[
                styles.actionButtonText,
                styles.actionButtonTextSecondary,
                { color: theme.text },
              ]}
            >
              View Details
            </Text>
          </Pressable>
        </View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  subtitle: {
    fontSize: Typography.size.sm,
    marginTop: 2,
  },
  meterContainer: {
    marginBottom: Spacing.lg,
  },
  meterTrack: {
    height: 12,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  meterLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  meterLabel: {
    fontSize: Typography.size.xs,
  },
  meterScore: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  metricLabel: {
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  actionButtonSecondary: {
    borderWidth: 1,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  actionButtonTextSecondary: {
    // Will use theme.text color
  },
});
