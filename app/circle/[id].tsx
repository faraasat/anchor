// Circle Detail Screen - Member management, shared tasks, and wellness goals
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import type { Database } from '@/types/database';

type Household = Database['public']['Tables']['households']['Row'];
type HouseholdMember = Database['public']['Tables']['household_members']['Row'] & {
  profile?: { email: string; full_name: string | null; avatar_url: string | null };
};
type WellnessGoal = Database['public']['Tables']['circle_wellness_goals']['Row'];
type Reminder = Database['public']['Tables']['reminders']['Row'];

export default function CircleDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [circle, setCircle] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [wellnessGoals, setWellnessGoals] = useState<WellnessGoal[]>([]);
  const [sharedTasks, setSharedTasks] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'wellness' | 'members'>('tasks');

  useEffect(() => {
    if (user && id) {
      loadCircleData();
    }
  }, [user, id]);

  const loadCircleData = async () => {
    try {
      setIsLoading(true);

      // Load circle details
      const { data: circleData, error: circleError } = await supabase
        .from('households')
        .select('*')
        .eq('id', id)
        .single();

      if (circleError) throw circleError;
      setCircle(circleData);

      // Load members
      const { data: membersData, error: membersError } = await supabase
        .from('household_members')
        .select(`
          *,
          profile:profiles(email, full_name, avatar_url)
        `)
        .eq('household_id', id);

      if (membersError) throw membersError;
      setMembers(membersData || []);

      // Load wellness goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('circle_wellness_goals')
        .select('*')
        .eq('circle_id', id)
        .order('created_at', { ascending: false });

      if (goalsError) throw goalsError;
      setWellnessGoals(goalsData || []);

      // Load shared tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('reminders')
        .select('*')
        .eq('household_id', id)
        .neq('is_sensitive', true)
        .order('due_date', { ascending: true });

      if (tasksError) throw tasksError;
      setSharedTasks(tasksData || []);
    } catch (error: any) {
      console.error('Error loading circle:', error);
      Alert.alert('Error', error.message || 'Failed to load circle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaimTask = async (taskId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('reminders')
        .update({ assigned_to: user.id })
        .eq('id', taskId);

      if (error) throw error;

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert('Task Claimed! 💪', 'You are now responsible for this task.');
      await loadCircleData();
    } catch (error: any) {
      console.error('Error claiming task:', error);
      Alert.alert('Error', error.message || 'Failed to claim task');
    }
  };

  const handleSendNudge = async (task: Reminder) => {
    // TODO: Integrate with Newell AI to generate personalized nudge message
    Alert.alert(
      'Send Nudge',
      `Send a gentle reminder to ${task.assigned_to ? 'the assigned member' : 'the team'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            // Will be implemented with AI integration
            Alert.alert('Coming Soon', 'AI-powered nudges will be available soon!');
          },
        },
      ]
    );
  };

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getMemberById = (userId: string) => {
    return members.find((m) => m.user_id === userId);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.secondary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading circle...
          </Text>
        </View>
      </View>
    );
  }

  if (!circle) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.error} />
          <Text style={[styles.errorTitle, { color: theme.text }]}>Circle Not Found</Text>
          <Pressable
            style={[styles.backButton, { backgroundColor: theme.secondary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        <LinearGradient
          colors={[theme.secondary, theme.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerTop}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="arrow-back" size={24} color={theme.textInverse} />
          </Pressable>
          <Pressable onPress={() => {}} hitSlop={10}>
            <Ionicons name="ellipsis-horizontal" size={24} color={theme.textInverse} />
          </Pressable>
        </View>
        <Text style={[styles.headerTitle, { color: theme.textInverse }]}>{circle.name}</Text>
        {circle.description && (
          <Text style={[styles.headerSubtitle, { color: theme.textInverse, opacity: 0.9 }]}>
            {circle.description}
          </Text>
        )}
        <View style={styles.headerStats}>
          <View style={styles.headerStat}>
            <Text style={[styles.headerStatValue, { color: theme.textInverse }]}>
              {members.length}
            </Text>
            <Text style={[styles.headerStatLabel, { color: theme.textInverse, opacity: 0.8 }]}>
              Members
            </Text>
          </View>
          <View style={styles.headerStat}>
            <Text style={[styles.headerStatValue, { color: theme.textInverse }]}>
              {sharedTasks.filter((t) => t.status === 'pending').length}
            </Text>
            <Text style={[styles.headerStatLabel, { color: theme.textInverse, opacity: 0.8 }]}>
              Active Tasks
            </Text>
          </View>
          <View style={styles.headerStat}>
            <Text style={[styles.headerStatValue, { color: theme.textInverse }]}>
              {wellnessGoals.length}
            </Text>
            <Text style={[styles.headerStatLabel, { color: theme.textInverse, opacity: 0.8 }]}>
              Goals
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Tab Bar */}
      <View style={[styles.tabBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Pressable
          style={[styles.tab, activeTab === 'tasks' && styles.tabActive]}
          onPress={() => setActiveTab('tasks')}
        >
          <Text
            style={[
              styles.tabText,
              { color: theme.textSecondary },
              activeTab === 'tasks' && { color: theme.secondary, fontWeight: Typography.weight.semibold },
            ]}
          >
            Shared Tasks
          </Text>
          {activeTab === 'tasks' && (
            <View style={[styles.tabIndicator, { backgroundColor: theme.secondary }]} />
          )}
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'wellness' && styles.tabActive]}
          onPress={() => setActiveTab('wellness')}
        >
          <Text
            style={[
              styles.tabText,
              { color: theme.textSecondary },
              activeTab === 'wellness' && { color: theme.secondary, fontWeight: Typography.weight.semibold },
            ]}
          >
            Wellness
          </Text>
          {activeTab === 'wellness' && (
            <View style={[styles.tabIndicator, { backgroundColor: theme.secondary }]} />
          )}
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'members' && styles.tabActive]}
          onPress={() => setActiveTab('members')}
        >
          <Text
            style={[
              styles.tabText,
              { color: theme.textSecondary },
              activeTab === 'members' && { color: theme.secondary, fontWeight: Typography.weight.semibold },
            ]}
          >
            Members
          </Text>
          {activeTab === 'members' && (
            <View style={[styles.tabIndicator, { backgroundColor: theme.secondary }]} />
          )}
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'tasks' && (
          <View style={styles.tasksTab}>
            {sharedTasks.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkbox-outline" size={64} color={theme.textMuted} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No Shared Tasks</Text>
                <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                  Create tasks in the Today view and assign them to this circle
                </Text>
              </View>
            ) : (
              sharedTasks.map((task, index) => {
                const assignedMember = task.assigned_to ? getMemberById(task.assigned_to) : null;
                return (
                  <Animated.View
                    key={task.id}
                    entering={FadeInDown.delay(index * 50).springify()}
                    layout={Layout.springify()}
                  >
                    <View style={[styles.taskCard, { backgroundColor: theme.surface }]}>
                      <View style={styles.taskHeader}>
                        <Text style={[styles.taskTitle, { color: theme.text }]} numberOfLines={2}>
                          {task.title}
                        </Text>
                        <View style={styles.taskBadge}>
                          <Text style={[styles.taskTag, { color: theme.textInverse }]}>
                            {task.tag}
                          </Text>
                        </View>
                      </View>

                      {task.description && (
                        <Text
                          style={[styles.taskDescription, { color: theme.textSecondary }]}
                          numberOfLines={2}
                        >
                          {task.description}
                        </Text>
                      )}

                      <View style={styles.taskMeta}>
                        <Text style={[styles.taskTime, { color: theme.textSecondary }]}>
                          {new Date(task.due_date).toLocaleDateString()} at {task.due_time}
                        </Text>
                      </View>

                      {assignedMember ? (
                        <View style={styles.taskAssigned}>
                          <View style={[styles.memberAvatar, { backgroundColor: theme.secondary + '20' }]}>
                            <Text style={[styles.memberAvatarText, { color: theme.secondary }]}>
                              {getInitials(assignedMember.profile?.full_name || null)}
                            </Text>
                          </View>
                          <Text style={[styles.taskAssignedText, { color: theme.text }]}>
                            {assignedMember.profile?.full_name || assignedMember.profile?.email}
                          </Text>
                          <Pressable
                            style={styles.nudgeButton}
                            onPress={() => handleSendNudge(task)}
                            hitSlop={10}
                          >
                            <Ionicons name="notifications-outline" size={18} color={theme.secondary} />
                          </Pressable>
                        </View>
                      ) : (
                        <Pressable
                          style={[styles.claimButton, { backgroundColor: theme.secondary }]}
                          onPress={() => handleClaimTask(task.id)}
                        >
                          <Ionicons name="hand-right" size={16} color="#FFFFFF" />
                          <Text style={styles.claimButtonText}>Claim Task</Text>
                        </Pressable>
                      )}
                    </View>
                  </Animated.View>
                );
              })
            )}
          </View>
        )}

        {activeTab === 'wellness' && (
          <View style={styles.wellnessTab}>
            <Text style={[styles.comingSoon, { color: theme.textSecondary }]}>
              🎯 Collaborative Wellness Goals Coming Soon!
            </Text>
            <Text style={[styles.comingSoonSubtitle, { color: theme.textMuted }]}>
              Track shared fitness goals, step challenges, and wellness milestones with your circle
            </Text>
          </View>
        )}

        {activeTab === 'members' && (
          <View style={styles.membersTab}>
            {members.map((member, index) => (
              <Animated.View
                key={member.id}
                entering={FadeInDown.delay(index * 50).springify()}
                layout={Layout.springify()}
              >
                <View style={[styles.memberCard, { backgroundColor: theme.surface }]}>
                  <View style={[styles.memberAvatarLarge, { backgroundColor: theme.secondary + '20' }]}>
                    <Text style={[styles.memberAvatarTextLarge, { color: theme.secondary }]}>
                      {getInitials(member.profile?.full_name || null)}
                    </Text>
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: theme.text }]}>
                      {member.profile?.full_name || 'Unknown User'}
                    </Text>
                    <Text style={[styles.memberEmail, { color: theme.textSecondary }]}>
                      {member.profile?.email}
                    </Text>
                    <View style={[styles.memberRoleBadge, { backgroundColor: theme.background }]}>
                      <Text style={[styles.memberRoleText, { color: theme.textSecondary }]}>
                        {member.role}
                      </Text>
                    </View>
                  </View>
                  {member.user_id === user?.id && (
                    <View style={[styles.youBadge, { backgroundColor: theme.secondary }]}>
                      <Text style={styles.youBadgeText}>You</Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.size.base,
    marginBottom: Spacing.md,
  },
  headerStats: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing.sm,
  },
  headerStat: {
    alignItems: 'center',
  },
  headerStatValue: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  headerStatLabel: {
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  tabActive: {},
  tabText: {
    fontSize: Typography.size.sm,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  tasksTab: {
    gap: Spacing.md,
  },
  taskCard: {
    borderRadius: 16,
    padding: Spacing.lg,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  taskTitle: {
    flex: 1,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    marginRight: Spacing.sm,
  },
  taskBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#3D8B7A',
  },
  taskTag: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
  taskDescription: {
    fontSize: Typography.size.sm,
    marginBottom: Spacing.sm,
  },
  taskMeta: {
    marginBottom: Spacing.md,
  },
  taskTime: {
    fontSize: Typography.size.xs,
  },
  taskAssigned: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  memberAvatarText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  taskAssignedText: {
    flex: 1,
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  nudgeButton: {
    padding: Spacing.xs,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    marginTop: Spacing.sm,
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  wellnessTab: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
  },
  comingSoon: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.semibold,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  comingSoonSubtitle: {
    fontSize: Typography.size.base,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  membersTab: {
    gap: Spacing.md,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: Spacing.lg,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  memberAvatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  memberAvatarTextLarge: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: Typography.size.sm,
    marginBottom: Spacing.xs,
  },
  memberRoleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  memberRoleText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
    textTransform: 'capitalize',
  },
  youBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  youBadgeText: {
    color: '#FFFFFF',
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
  },
  emptySubtitle: {
    fontSize: Typography.size.base,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  errorTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  backButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    marginTop: Spacing.lg,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
});
