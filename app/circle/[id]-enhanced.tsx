// Enhanced Circle Detail - Phase 8: Permissions, Activity Halos, Chore Rotation
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@fastshot/auth';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { ReminderService } from '@/services/ReminderService';
import { CirclePermissionsService } from '@/services/CirclePermissionsService';
import { ChoreRotationService } from '@/services/ChoreRotationService';
import { OverlappingAvatars } from '@/components/OverlappingAvatars';
import { ActivityHaloAvatar } from '@/components/ActivityHaloAvatar';
import type { Reminder } from '@/types/reminder';
import type {
  CircleMember,
  CircleRole,
  ActivityHalo,
  ChoreRotation,
} from '@/types/phase8';

export default function EnhancedCircleDetailScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [circleName, setCircleName] = useState('');
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<CircleRole>('viewer');
  const [activityHalos, setActivityHalos] = useState<Record<string, ActivityHalo>>({});
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [rotations, setRotations] = useState<ChoreRotation[]>([]);

  // UI states
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CircleMember | null>(null);
  const [showRotationModal, setShowRotationModal] = useState(false);

  useEffect(() => {
    if (user && id) {
      loadCircleData();
    }
  }, [user, id]);

  const loadCircleData = async () => {
    if (!user || !id) return;

    try {
      setLoading(true);

      // Load circle details
      const { data: circle, error: circleError } = await supabase
        .from('households')
        .select('*')
        .eq('id', id)
        .single();

      if (circleError) throw circleError;
      setCircleName(circle.name);

      // Load members with profiles
      const { data: membersData, error: membersError } = await supabase
        .from('household_members')
        .select(`
          *,
          profile:profiles(email, full_name, avatar_url)
        `)
        .eq('household_id', id);

      if (membersError) throw membersError;

      // Map database fields to CircleMember type
      const mappedMembers: CircleMember[] = (membersData || []).map((m: any) => ({
        id: m.id,
        userId: m.user_id,
        circleId: m.household_id,
        role: m.role as CircleRole,
        joinedAt: m.joined_at,
        profile: m.profile ? {
          email: m.profile.email,
          fullName: m.profile.full_name,
          avatarUrl: m.profile.avatar_url,
        } : undefined,
      }));

      setMembers(mappedMembers);

      // Find current user's role
      const currentMember = mappedMembers.find((m) => m.userId === user.id);
      if (currentMember) {
        setCurrentUserRole(currentMember.role);
      }

      // Load reminders
      const circleReminders = await ReminderService.getHouseholdReminders(id as string);
      setReminders(circleReminders);

      // Load chore rotations
      const circleRotations = await ChoreRotationService.getCircleRotations(id as string);
      setRotations(circleRotations);

      // Generate activity halos based on recent completions
      const halos = await generateActivityHalos(mappedMembers, circleReminders);
      setActivityHalos(halos);
    } catch (error) {
      console.error('Error loading circle data:', error);
      Alert.alert('Error', 'Failed to load circle data');
    } finally {
      setLoading(false);
    }
  };

  const generateActivityHalos = async (
    membersList: CircleMember[],
    remindersList: Reminder[]
  ): Promise<Record<string, ActivityHalo>> => {
    const halos: Record<string, ActivityHalo> = {};
    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1000;

    for (const member of membersList) {
      // Count recent completions
      const recentCompletions = remindersList.filter(
        (r) =>
          r.status === 'completed' &&
          r.assignedTo === member.user_id &&
          r.completedAt &&
          new Date(r.completedAt).getTime() > last24Hours
      ).length;

      if (recentCompletions > 0) {
        // Generate halo color based on user
        const haloColors = ['#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B'];
        const colorIndex =
          member.userId.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) %
          haloColors.length;

        halos[member.userId] = {
          userId: member.userId,
          color: haloColors[colorIndex],
          glowIntensity: Math.min(1, recentCompletions / 5),
          lastActivity: new Date().toISOString(),
          recentCompletionCount: recentCompletions,
        };
      }
    }

    return halos;
  };

  const handleChangeMemberRole = async (member: CircleMember, newRole: CircleRole) => {
    try {
      const { error } = await supabase
        .from('household_members')
        .update({ role: newRole })
        .eq('id', member.id);

      if (error) throw error;

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        'Role Updated',
        `${member.profile?.full_name || 'Member'} is now ${CirclePermissionsService.getRoleDisplayName(newRole)}`
      );

      setShowRoleModal(false);
      await loadCircleData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update role');
    }
  };

  const handleCreateRotation = () => {
    // Navigate to rotation creation (to be implemented)
    Alert.alert('Create Rotation', 'Coming soon!');
  };

  const permissions = CirclePermissionsService.getPermissions(currentUserRole);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.secondary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(300)}
        style={[
          styles.header,
          { paddingTop: insets.top + Spacing.md, backgroundColor: theme.surface },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {circleName}
        </Text>
        <View style={{ width: 24 }} />
      </Animated.View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Members Section with Activity Halos */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(200)}
          style={[
            styles.card,
            { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
          ]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="people" size={20} color={theme.secondary} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Members</Text>
            <View style={styles.memberCount}>
              <Text style={[styles.memberCountText, { color: theme.textSecondary }]}>
                {members.length}
              </Text>
            </View>
          </View>

          {/* Overlapping Avatars Preview */}
          <View style={styles.avatarsPreview}>
            <OverlappingAvatars
              members={members}
              halos={activityHalos}
              maxVisible={5}
              size={48}
            />
          </View>

          {/* Member List */}
          <View style={styles.memberList}>
            {members.map((member) => {
              const initials = member.profile?.full_name
                ? member.profile.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                : '?';

              const isCurrentUser = member.user_id === user?.id;
              const canChangeRole =
                permissions.canAssign && !isCurrentUser;

              return (
                <Pressable
                  key={member.id}
                  style={[
                    styles.memberItem,
                    {
                      backgroundColor: theme.surfaceElevated,
                      borderColor: theme.borderLight,
                    },
                  ]}
                  onPress={() => {
                    if (canChangeRole) {
                      setSelectedMember(member);
                      setShowRoleModal(true);
                    }
                  }}
                  disabled={!canChangeRole}
                >
                  <ActivityHaloAvatar
                    userId={member.user_id}
                    avatarUrl={member.profile?.avatar_url}
                    initials={initials}
                    halo={activityHalos[member.user_id]}
                    size={44}
                  />

                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: theme.text }]}>
                      {member.profile?.full_name || member.profile?.email || 'Unknown'}
                      {isCurrentUser && ' (You)'}
                    </Text>
                    <Text style={[styles.memberEmail, { color: theme.textSecondary }]}>
                      {member.profile?.email}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.roleBadge,
                      {
                        backgroundColor:
                          member.role === 'owner'
                            ? theme.accent + '20'
                            : member.role === 'editor'
                              ? theme.secondary + '20'
                              : theme.textMuted + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.roleBadgeText,
                        {
                          color:
                            member.role === 'owner'
                              ? theme.accent
                              : member.role === 'editor'
                                ? theme.secondary
                                : theme.textMuted,
                        },
                      ]}
                    >
                      {CirclePermissionsService.getRoleDisplayName(member.role as CircleRole)}
                    </Text>
                  </View>

                  {canChangeRole && (
                    <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Chore Rotations */}
        {permissions.canEdit && (
          <Animated.View
            entering={FadeInDown.delay(200).duration(200)}
            style={[
              styles.card,
              { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
            ]}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="repeat" size={20} color={theme.accent} />
              <Text style={[styles.cardTitle, { color: theme.text }]}>Chore Rotations</Text>
              {permissions.canAssign && (
                <Pressable
                  style={[styles.addButton, { backgroundColor: theme.secondary }]}
                  onPress={handleCreateRotation}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                </Pressable>
              )}
            </View>

            {rotations.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="repeat-outline" size={48} color={theme.textMuted} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  No chore rotations yet
                </Text>
                {permissions.canAssign && (
                  <Text style={[styles.emptyHint, { color: theme.textMuted }]}>
                    Create one to automatically assign chores
                  </Text>
                )}
              </View>
            ) : (
              <View style={styles.rotationList}>
                {rotations.map((rotation) => {
                  const currentAssignee = rotation.memberIds[rotation.currentIndex];
                  const currentMember = members.find((m) => m.user_id === currentAssignee);

                  return (
                    <View
                      key={rotation.id}
                      style={[
                        styles.rotationItem,
                        {
                          backgroundColor: theme.surfaceElevated,
                          borderColor: theme.borderLight,
                        },
                      ]}
                    >
                      <View style={styles.rotationHeader}>
                        <Text style={[styles.rotationName, { color: theme.text }]}>
                          {rotation.name}
                        </Text>
                        <View
                          style={[
                            styles.rotationTypeBadge,
                            { backgroundColor: theme.info + '20' },
                          ]}
                        >
                          <Text style={[styles.rotationTypeText, { color: theme.info }]}>
                            {rotation.rotationType}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.rotationCurrent}>
                        <Text style={[styles.rotationLabel, { color: theme.textSecondary }]}>
                          Current assignee:
                        </Text>
                        {currentMember && (
                          <View style={styles.rotationAssignee}>
                            <ActivityHaloAvatar
                              userId={currentMember.user_id}
                              avatarUrl={currentMember.profile?.avatar_url}
                              initials={
                                currentMember.profile?.full_name
                                  ?.split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2) || '?'
                              }
                              size={24}
                              showHalo={false}
                            />
                            <Text style={[styles.assigneeName, { color: theme.text }]}>
                              {currentMember.profile?.full_name || 'Unknown'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </Animated.View>
        )}

        {/* Circle Permissions Info */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(200)}
          style={[
            styles.card,
            { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
          ]}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="shield-checkmark" size={20} color={theme.success} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Your Permissions</Text>
          </View>
          <Text style={[styles.roleDescription, { color: theme.textSecondary }]}>
            {CirclePermissionsService.getRoleDescription(currentUserRole)}
          </Text>
          <View style={styles.permissionsList}>
            {[
              { key: 'canEdit', label: 'Edit tasks', icon: 'create' },
              { key: 'canComplete', label: 'Complete tasks', icon: 'checkmark-circle' },
              { key: 'canAssign', label: 'Assign tasks', icon: 'person-add' },
              { key: 'canInvite', label: 'Invite members', icon: 'mail' },
              { key: 'canDelete', label: 'Delete tasks', icon: 'trash' },
            ].map((perm) => (
              <View key={perm.key} style={styles.permissionItem}>
                <Ionicons
                  name={perm.icon as any}
                  size={18}
                  color={
                    permissions[perm.key as keyof typeof permissions]
                      ? theme.success
                      : theme.textMuted
                  }
                />
                <Text
                  style={[
                    styles.permissionLabel,
                    {
                      color: permissions[perm.key as keyof typeof permissions]
                        ? theme.text
                        : theme.textMuted,
                    },
                  ]}
                >
                  {perm.label}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Role Change Modal */}
      {showRoleModal && selectedMember && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[styles.modal, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowRoleModal(false)} />
          <Animated.View
            entering={FadeInDown.springify()}
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>Change Role</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Select a new role for {selectedMember.profile?.full_name}
            </Text>

            {CirclePermissionsService.getAssignableRoles(currentUserRole).map((role) => (
              <Pressable
                key={role}
                style={[
                  styles.roleOption,
                  {
                    backgroundColor: theme.background,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => handleChangeMemberRole(selectedMember, role)}
              >
                <View>
                  <Text style={[styles.roleOptionTitle, { color: theme.text }]}>
                    {CirclePermissionsService.getRoleDisplayName(role)}
                  </Text>
                  <Text style={[styles.roleOptionDescription, { color: theme.textSecondary }]}>
                    {CirclePermissionsService.getRoleDescription(role)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.textMuted} />
              </Pressable>
            ))}
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    flex: 1,
  },
  memberCount: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberCountText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  avatarsPreview: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  memberList: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
  memberEmail: {
    fontSize: Typography.size.sm,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  roleBadgeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.size.base,
    marginTop: Spacing.sm,
  },
  emptyHint: {
    fontSize: Typography.size.sm,
    textAlign: 'center',
  },
  rotationList: {
    gap: Spacing.sm,
  },
  rotationItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  rotationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  rotationName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
  rotationTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  rotationTypeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
    textTransform: 'capitalize',
  },
  rotationCurrent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rotationLabel: {
    fontSize: Typography.size.sm,
  },
  rotationAssignee: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  assigneeName: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  roleDescription: {
    fontSize: Typography.size.sm,
    marginBottom: Spacing.md,
  },
  permissionsList: {
    gap: Spacing.sm,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  permissionLabel: {
    fontSize: Typography.size.sm,
  },
  modal: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: Typography.size.sm,
    marginBottom: Spacing.lg,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  roleOptionTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    marginBottom: 2,
  },
  roleOptionDescription: {
    fontSize: Typography.size.xs,
  },
});
