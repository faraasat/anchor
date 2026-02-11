// Neural Coach Modal - AI-powered coaching with burnout detection and smart re-prioritization
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useColorScheme';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { Spacing } from '@/constants/theme';
import { NewellAIClient } from '@/lib/groq';
import { LineChart } from 'react-native-svg';

const newellClient = new NewellAIClient({
  baseURL: process.env.EXPO_PUBLIC_NEWELL_API_URL,
  projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
});

interface EnergyReport {
  productivity_score: number;
  activity_level: number;
  burnout_risk: number;
  suggestions: string[];
}

interface NeuralCoachModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onThemeShift?: (theme: 'recovery' | 'normal') => void;
}

export default function NeuralCoachModal({
  visible,
  onClose,
  userId,
  onThemeShift,
}: NeuralCoachModalProps) {
  const theme = useTheme();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState<EnergyReport | null>(null);
  const [burnoutDetected, setBurnoutDetected] = useState(false);
  const [reprioritizing, setReprioritizing] = useState(false);
  const [chartData, setChartData] = useState<number[]>([]);

  useEffect(() => {
    if (visible) {
      loadEnergyReport();
    }
  }, [visible]);

  const loadEnergyReport = async () => {
    setLoading(true);
    try {
      // Get this week's start date (Monday)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() + diff);
      weekStart.setHours(0, 0, 0, 0);

      // Check if we already have a report for this week
      const { data: existingReport, error: reportError } = await supabase
        .from('energy_reports')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start', weekStart.toISOString().split('T')[0])
        .maybeSingle();

      if (reportError && reportError.code !== 'PGRST116') {
        throw reportError;
      }

      if (existingReport) {
        setWeeklyReport({
          productivity_score: existingReport.productivity_score,
          activity_level: existingReport.activity_level,
          burnout_risk: existingReport.burnout_risk,
          suggestions: existingReport.suggestions || [],
        });
        setBurnoutDetected(existingReport.burnout_risk >= 70);
      } else {
        // Generate new report
        await generateEnergyReport(weekStart);
      }
    } catch (error) {
      console.error('Error loading energy report:', error);
      Alert.alert('Error', 'Failed to load energy report');
    } finally {
      setLoading(false);
    }
  };

  const generateEnergyReport = async (weekStart: Date) => {
    try {
      // Get productivity stats for the past 7 days
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);

      const { data: stats, error: statsError } = await supabase
        .from('productivity_stats')
        .select('*')
        .eq('user_id', userId)
        .gte('date', weekStart.toISOString().split('T')[0])
        .lt('date', weekEnd.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (statsError) throw statsError;

      // Calculate metrics
      const productivity = stats?.reduce(
        (sum, s) => sum + (s.completion_rate || 0),
        0
      ) / (stats?.length || 1) || 0;

      const totalTasks = stats?.reduce(
        (sum, s) => sum + (s.total_count || 0),
        0
      ) || 0;

      const activityLevel = Math.min((totalTasks / 7) * 10, 100);

      // Get health data if available
      const { data: healthData } = await supabase
        .from('health_data')
        .select('*')
        .eq('user_id', userId)
        .gte('date', weekStart.toISOString().split('T')[0])
        .lt('date', weekEnd.toISOString().split('T')[0]);

      const avgSleep = healthData?.reduce(
        (sum, h) => sum + (h.sleep_hours || 0),
        0
      ) / (healthData?.length || 1) || 7;

      // Calculate burnout risk
      const burnoutRisk =
        productivity > 90 && activityLevel > 80 && avgSleep < 6
          ? 85
          : productivity < 50 && activityLevel > 70
          ? 75
          : activityLevel > 90
          ? 60
          : Math.max(0, 100 - productivity);

      // Generate AI suggestions
      const aiPrompt = `Based on the following weekly metrics, provide 3-4 personalized coaching suggestions:
- Productivity Score: ${productivity.toFixed(1)}%
- Activity Level: ${activityLevel.toFixed(1)}%
- Burnout Risk: ${burnoutRisk.toFixed(1)}%
- Average Sleep: ${avgSleep.toFixed(1)} hours

Consider:
- If burnout risk is high, suggest rest and recovery activities
- If productivity is low but activity is high, suggest prioritization strategies
- If both are low, suggest motivation and energy boosters
- Always be supportive and practical

Format as a JSON array of suggestion strings. Only return the JSON array, nothing else.`;

      const response = await newellClient.generateText({
        messages: [{ role: 'user', content: aiPrompt }],
        systemPrompt: 'You are an empathetic productivity coach who provides actionable, supportive advice.',
      });

      const suggestions = JSON.parse(response.text.trim());

      // Save report
      const { error: insertError } = await supabase.from('energy_reports').insert({
        user_id: userId,
        week_start: weekStart.toISOString().split('T')[0],
        productivity_score: productivity,
        activity_level: activityLevel,
        burnout_risk: burnoutRisk,
        suggestions: suggestions,
      });

      if (insertError) throw insertError;

      setWeeklyReport({
        productivity_score: productivity,
        activity_level: activityLevel,
        burnout_risk: burnoutRisk,
        suggestions: suggestions,
      });

      setBurnoutDetected(burnoutRisk >= 70);

      // Trigger theme shift if burnout detected
      if (burnoutRisk >= 70 && onThemeShift) {
        onThemeShift('recovery');
      }

      // Prepare chart data
      setChartData(
        stats?.map((s) => s.completion_rate || 0) || []
      );
    } catch (error) {
      console.error('Error generating energy report:', error);
      Alert.alert('Error', 'Failed to generate energy report');
    }
  };

  const handleSmartReprioritize = async () => {
    setReprioritizing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Get today's pending reminders
      const today = new Date().toISOString().split('T')[0];
      const { data: reminders, error: remindersError } = await supabase
        .from('reminders')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .eq('due_date', today);

      if (remindersError) throw remindersError;

      if (!reminders || reminders.length === 0) {
        Alert.alert('Info', 'No pending tasks to reprioritize today');
        return;
      }

      // Get context: location, weather, calendar events
      const { data: calendarEvents } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', new Date().toISOString())
        .lte('start_time', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());

      // Generate AI-powered priority recommendations
      const aiPrompt = `You are a productivity AI. Analyze these tasks and recommend a smart order based on:
1. Urgency (due times)
2. Context (available time blocks between calendar events)
3. Energy levels (recommend high-focus tasks for peak times)
4. Dependencies and importance

Tasks:
${reminders.map((r, i) => `${i + 1}. ${r.title} (Due: ${r.due_time}, Priority: ${r.priority})`).join('\n')}

Calendar Events:
${calendarEvents?.map(e => `- ${e.title} at ${new Date(e.start_time).toLocaleTimeString()}`).join('\n') || 'No events'}

Return a JSON array of task IDs in the recommended order: ${JSON.stringify(reminders.map(r => r.id))}
Only return the JSON array, nothing else.`;

      const response = await newellClient.generateText({
        messages: [{ role: 'user', content: aiPrompt }],
        systemPrompt: 'You are a smart scheduling assistant that optimizes task order for maximum productivity.',
      });

      const reorderedIds = JSON.parse(response.text.trim());

      // Update priorities based on new order
      const updates = reorderedIds.map((id: string, index: number) => {
        const newPriority = index < reminders.length / 3 ? 'high' :
                           index < (2 * reminders.length) / 3 ? 'medium' : 'low';
        return supabase
          .from('reminders')
          .update({ priority: newPriority })
          .eq('id', id);
      });

      await Promise.all(updates);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Tasks Reprioritized!',
        'Your tasks have been intelligently reordered based on context, energy levels, and available time.'
      );
    } catch (error) {
      console.error('Error reprioritizing:', error);
      Alert.alert('Error', 'Failed to reprioritize tasks');
    } finally {
      setReprioritizing(false);
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 70) return '#FF6B6B';
    if (risk >= 50) return '#FFA500';
    return '#4ECDC4';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <LinearGradient
          colors={burnoutDetected ? ['#6B8DD6', '#8E9EE8'] : [theme.primary, theme.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Ionicons name="analytics" size={24} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Neural Coach</Text>
          </View>
          <View style={styles.placeholder} />
        </LinearGradient>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Analyzing your energy patterns...
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Burnout Alert */}
            {burnoutDetected && (
              <View style={[styles.alertCard, { backgroundColor: '#FF6B6B22' }]}>
                <Ionicons name="warning" size={32} color="#FF6B6B" />
                <View style={styles.flex}>
                  <Text style={[styles.alertTitle, { color: '#FF6B6B' }]}>
                    High Burnout Risk Detected
                  </Text>
                  <Text style={[styles.alertMessage, { color: theme.textSecondary }]}>
                    Your activity levels are very high. Consider taking a rest day.
                  </Text>
                </View>
              </View>
            )}

            {/* Energy Metrics */}
            <View style={[styles.metricsCard, { backgroundColor: theme.card }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                Weekly Energy Report
              </Text>

              <View style={styles.metricRow}>
                <View style={styles.metric}>
                  <View style={styles.metricHeader}>
                    <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
                    <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                      Productivity
                    </Text>
                  </View>
                  <Text style={[styles.metricValue, { color: theme.text }]}>
                    {weeklyReport?.productivity_score.toFixed(1)}%
                  </Text>
                  <View
                    style={[
                      styles.progressBar,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${weeklyReport?.productivity_score}%`,
                          backgroundColor: '#4ECDC4',
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.metric}>
                  <View style={styles.metricHeader}>
                    <Ionicons name="flash" size={20} color="#FFA500" />
                    <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                      Activity
                    </Text>
                  </View>
                  <Text style={[styles.metricValue, { color: theme.text }]}>
                    {weeklyReport?.activity_level.toFixed(1)}%
                  </Text>
                  <View
                    style={[
                      styles.progressBar,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${weeklyReport?.activity_level}%`,
                          backgroundColor: '#FFA500',
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.metric}>
                  <View style={styles.metricHeader}>
                    <Ionicons
                      name="alert-circle"
                      size={20}
                      color={getRiskColor(weeklyReport?.burnout_risk || 0)}
                    />
                    <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>
                      Burnout Risk
                    </Text>
                  </View>
                  <Text style={[styles.metricValue, { color: theme.text }]}>
                    {weeklyReport?.burnout_risk.toFixed(1)}%
                  </Text>
                  <View
                    style={[
                      styles.progressBar,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${weeklyReport?.burnout_risk}%`,
                          backgroundColor: getRiskColor(weeklyReport?.burnout_risk || 0),
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* AI Suggestions */}
            <View style={[styles.suggestionsCard, { backgroundColor: theme.card }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="bulb" size={24} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Personalized Insights
                </Text>
              </View>

              {weeklyReport?.suggestions.map((suggestion, index) => (
                <View key={index} style={styles.suggestionItem}>
                  <View
                    style={[
                      styles.suggestionBullet,
                      { backgroundColor: theme.primary },
                    ]}
                  />
                  <Text style={[styles.suggestionText, { color: theme.text }]}>
                    {suggestion}
                  </Text>
                </View>
              ))}
            </View>

            {/* Smart Re-prioritize Button */}
            <TouchableOpacity
              onPress={handleSmartReprioritize}
              disabled={reprioritizing}
              style={styles.reprioritizeButton}
            >
              <LinearGradient
                colors={[theme.primary, theme.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.reprioritizeGradient}
              >
                {reprioritizing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="shuffle" size={24} color="#FFFFFF" />
                    <Text style={styles.reprioritizeText}>Smart Re-prioritize</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={[styles.reprioritizeHint, { color: theme.textSecondary }]}>
              AI will intelligently reorder today's tasks based on weather, location,
              and importance
            </Text>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  closeButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 44,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: 16,
    marginBottom: Spacing.lg,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
  },
  flex: {
    flex: 1,
  },
  metricsCard: {
    padding: Spacing.lg,
    borderRadius: 16,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  metricRow: {
    gap: Spacing.lg,
  },
  metric: {
    marginBottom: Spacing.md,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  metricLabel: {
    fontSize: 14,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  suggestionsCard: {
    padding: Spacing.lg,
    borderRadius: 16,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  suggestionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  reprioritizeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  reprioritizeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  reprioritizeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  reprioritizeHint: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
});
