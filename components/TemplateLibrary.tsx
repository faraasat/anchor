// Quick-Template Library - Common life tasks
import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme, useColorScheme } from '@/hooks/useColorScheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { Reminder, TagType, TAG_COLORS } from '@/types/reminder';

interface ReminderTemplate {
  id: string;
  title: string;
  description: string;
  tag: TagType;
  defaultTime: string;
  icon: string;
  recurrence?: {
    type: 'daily' | 'weekly' | 'monthly' | 'custom_days';
    interval?: number;
    daysOfWeek?: number[];
  };
  priority: 'low' | 'medium' | 'high';
}

const TEMPLATES: ReminderTemplate[] = [
  // Health
  {
    id: 'vitamins',
    title: 'Take Vitamins',
    description: 'Daily morning vitamins',
    tag: 'Health',
    defaultTime: '08:00',
    icon: 'medical',
    recurrence: { type: 'daily' },
    priority: 'medium',
  },
  {
    id: 'workout',
    title: 'Workout Session',
    description: 'Exercise routine',
    tag: 'Health',
    defaultTime: '07:00',
    icon: 'barbell',
    recurrence: { type: 'weekly', daysOfWeek: [1, 3, 5] },
    priority: 'high',
  },
  {
    id: 'water',
    title: 'Drink Water',
    description: 'Stay hydrated',
    tag: 'Health',
    defaultTime: '10:00',
    icon: 'water',
    recurrence: { type: 'custom_days', interval: 2 },
    priority: 'low',
  },
  // Finance
  {
    id: 'bills',
    title: 'Pay Bills',
    description: 'Monthly bill payment',
    tag: 'Finance',
    defaultTime: '18:00',
    icon: 'card',
    recurrence: { type: 'monthly' },
    priority: 'high',
  },
  {
    id: 'budget',
    title: 'Review Budget',
    description: 'Check spending',
    tag: 'Finance',
    defaultTime: '20:00',
    icon: 'wallet',
    recurrence: { type: 'weekly', daysOfWeek: [0] },
    priority: 'medium',
  },
  // Work
  {
    id: 'meeting-prep',
    title: 'Meeting Prep',
    description: 'Prepare for weekly meeting',
    tag: 'Work',
    defaultTime: '09:00',
    icon: 'briefcase',
    recurrence: { type: 'weekly', daysOfWeek: [1] },
    priority: 'high',
  },
  {
    id: 'email-check',
    title: 'Check Emails',
    description: 'Review inbox',
    tag: 'Work',
    defaultTime: '08:30',
    icon: 'mail',
    recurrence: { type: 'daily' },
    priority: 'medium',
  },
  // Home
  {
    id: 'laundry',
    title: 'Do Laundry',
    description: 'Wash clothes',
    tag: 'Home',
    defaultTime: '10:00',
    icon: 'shirt',
    recurrence: { type: 'weekly', daysOfWeek: [6] },
    priority: 'medium',
  },
  {
    id: 'plants',
    title: 'Water Plants',
    description: 'Water indoor plants',
    tag: 'Home',
    defaultTime: '09:00',
    icon: 'leaf',
    recurrence: { type: 'custom_days', interval: 3 },
    priority: 'low',
  },
  {
    id: 'clean',
    title: 'House Cleaning',
    description: 'Weekly cleaning',
    tag: 'Home',
    defaultTime: '11:00',
    icon: 'home',
    recurrence: { type: 'weekly', daysOfWeek: [6] },
    priority: 'medium',
  },
  // Errands
  {
    id: 'groceries',
    title: 'Buy Groceries',
    description: 'Weekly shopping',
    tag: 'Errands',
    defaultTime: '15:00',
    icon: 'cart',
    recurrence: { type: 'weekly', daysOfWeek: [5] },
    priority: 'high',
  },
  {
    id: 'pharmacy',
    title: 'Pharmacy Run',
    description: 'Pick up prescriptions',
    tag: 'Errands',
    defaultTime: '16:00',
    icon: 'medkit',
    priority: 'medium',
  },
  // Personal
  {
    id: 'journal',
    title: 'Daily Journal',
    description: 'Evening reflection',
    tag: 'Personal',
    defaultTime: '21:00',
    icon: 'book',
    recurrence: { type: 'daily' },
    priority: 'low',
  },
  {
    id: 'family-call',
    title: 'Call Family',
    description: 'Weekly check-in',
    tag: 'Social',
    defaultTime: '19:00',
    icon: 'call',
    recurrence: { type: 'weekly', daysOfWeek: [0] },
    priority: 'medium',
  },
];

interface TemplateLibraryProps {
  onSelectTemplate: (template: ReminderTemplate) => void;
}

export function TemplateLibrary({ onSelectTemplate }: TemplateLibraryProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();

  const handleSelectTemplate = (template: ReminderTemplate) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSelectTemplate(template);
  };

  // Group templates by category
  const groupedTemplates: Record<TagType, ReminderTemplate[]> = TEMPLATES.reduce(
    (acc, template) => {
      if (!acc[template.tag]) {
        acc[template.tag] = [];
      }
      acc[template.tag].push(template);
      return acc;
    },
    {} as Record<TagType, ReminderTemplate[]>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Quick Templates</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Start with common tasks
        </Text>
      </View>

      {Object.entries(groupedTemplates).map(([category, templates], categoryIndex) => {
        const tagColors = colorScheme === 'dark' ? TAG_COLORS[category as TagType].dark : TAG_COLORS[category as TagType];

        return (
          <Animated.View
            key={category}
            entering={FadeInDown.delay(categoryIndex * 50).duration(200)}
            style={styles.categorySection}
          >
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryBadge, { backgroundColor: tagColors.bg }]}>
                <Text style={[styles.categoryBadgeText, { color: tagColors.text }]}>
                  {category}
                </Text>
              </View>
              <Text style={[styles.categoryCount, { color: theme.textMuted }]}>
                {templates.length} templates
              </Text>
            </View>

            <View style={styles.templatesGrid}>
              {templates.map((template) => (
                <Pressable
                  key={template.id}
                  style={[
                    styles.templateCard,
                    { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
                    Shadows.sm,
                  ]}
                  onPress={() => handleSelectTemplate(template)}
                >
                  <View style={[styles.templateIcon, { backgroundColor: tagColors.bg + '20' }]}>
                    <Ionicons name={template.icon as any} size={24} color={tagColors.bg} />
                  </View>
                  <View style={styles.templateContent}>
                    <Text style={[styles.templateTitle, { color: theme.text }]} numberOfLines={1}>
                      {template.title}
                    </Text>
                    <Text style={[styles.templateDescription, { color: theme.textSecondary }]} numberOfLines={1}>
                      {template.description}
                    </Text>
                    <View style={styles.templateMeta}>
                      <View style={styles.templateMetaItem}>
                        <Ionicons name="time-outline" size={12} color={theme.textMuted} />
                        <Text style={[styles.templateMetaText, { color: theme.textMuted }]}>
                          {template.defaultTime}
                        </Text>
                      </View>
                      {template.recurrence && (
                        <View style={styles.templateMetaItem}>
                          <Ionicons name="repeat-outline" size={12} color={theme.textMuted} />
                          <Text style={[styles.templateMetaText, { color: theme.textMuted }]}>
                            {template.recurrence.type}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.size.sm,
  },
  categorySection: {
    marginBottom: Spacing.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  categoryBadgeText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  categoryCount: {
    fontSize: Typography.size.xs,
  },
  templatesGrid: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  templateCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  templateIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateContent: {
    flex: 1,
    gap: 2,
  },
  templateTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
  templateDescription: {
    fontSize: Typography.size.xs,
  },
  templateMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  templateMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  templateMetaText: {
    fontSize: Typography.size.xs,
  },
});

// Export templates for use elsewhere
export { TEMPLATES, type ReminderTemplate };
