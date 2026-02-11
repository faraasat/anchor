// Productivity Peaks Chart - Thin-line SVG chart for peak performance times
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, { Path, Circle, Line, G } from 'react-native-svg';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/hooks/useColorScheme';
import type { ProductivityPeak } from '@/types/phase8';

interface ProductivityPeaksChartProps {
  peaks: ProductivityPeak[];
  width?: number;
  height?: number;
}

export function ProductivityPeaksChart({
  peaks,
  width = 320,
  height = 160,
}: ProductivityPeaksChartProps) {
  const theme = useTheme();

  if (peaks.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={[styles.emptyText, { color: theme.textMuted }]}>
          Not enough data yet
        </Text>
      </View>
    );
  }

  // Calculate dimensions
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Find max value
  const maxRate = Math.max(...peaks.map((p) => p.completionRate));

  // Create path data
  const points = peaks.map((peak, index) => {
    const x = padding + (index / (peaks.length - 1)) * chartWidth;
    const y = padding + chartHeight - (peak.completionRate / maxRate) * chartHeight;
    return { x, y, peak };
  });

  // Create SVG path
  const pathData = points
    .map((point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      return `L ${point.x} ${point.y}`;
    })
    .join(' ');

  // Find peak point
  const peakPoint = points.reduce((max, p) =>
    p.peak.completionRate > max.peak.completionRate ? p : max
  );

  return (
    <Animated.View
      entering={FadeInDown.delay(300).springify()}
      style={[
        styles.container,
        {
          backgroundColor: theme.cardBackground,
          borderColor: theme.cardBorder,
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          Productivity Peaks
        </Text>
        <View style={[styles.peakBadge, { backgroundColor: theme.secondary }]}>
          <Text style={styles.peakBadgeText}>
            {peakPoint.peak.timeSlot}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: Spacing.md }}
      >
        <Svg width={width} height={height}>
          {/* Grid lines */}
          <G>
            {[0, 25, 50, 75, 100].map((value) => {
              const y = padding + chartHeight - (value / maxRate) * chartHeight;
              return (
                <Line
                  key={value}
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke={theme.border}
                  strokeWidth="1"
                  strokeDasharray="4,4"
                  opacity={0.3}
                />
              );
            })}
          </G>

          {/* Gradient area under curve */}
          <Path
            d={`${pathData} L ${width - padding} ${padding + chartHeight} L ${padding} ${padding + chartHeight} Z`}
            fill={theme.secondary}
            opacity={0.1}
          />

          {/* Main line */}
          <Path
            d={pathData}
            stroke={theme.secondary}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {points.map((point, index) => (
            <Circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={4}
              fill={point === peakPoint ? theme.accent : theme.secondary}
              opacity={point === peakPoint ? 1 : 0.6}
            />
          ))}

          {/* Peak indicator */}
          <Circle
            cx={peakPoint.x}
            cy={peakPoint.y}
            r={8}
            stroke={theme.accent}
            strokeWidth="2"
            fill="transparent"
          />
        </Svg>
      </ScrollView>

      {/* Time labels */}
      <View style={styles.timeLabels}>
        {peaks.filter((_, i) => i % 4 === 0).map((peak, index) => (
          <Text
            key={index}
            style={[styles.timeLabel, { color: theme.textMuted }]}
          >
            {peak.timeSlot}
          </Text>
        ))}
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            Peak Time
          </Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {peakPoint.peak.timeSlot}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            Peak Rate
          </Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {Math.round(peakPoint.peak.completionRate)}%
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>
            Avg Tasks
          </Text>
          <Text style={[styles.summaryValue, { color: theme.text }]}>
            {Math.round(peakPoint.peak.averageTasksCompleted)}
          </Text>
        </View>
      </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  peakBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  peakBadgeText: {
    color: '#FFFFFF',
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: Typography.size.sm,
  },
  timeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  timeLabel: {
    fontSize: Typography.size.xs,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: Typography.size.xs,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
  },
});
