// Circles Hub - Collaborative Groups & Social Features
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
  Share,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth';
import { useThemeEngine } from '@/contexts/ThemeEngineContext';
import { Spacing, Typography } from '@/constants/theme';
import { SocialPulse } from '@/components/SocialPulse';
import { useHousehold } from '@/contexts/HouseholdContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import type { Database } from '@/types/database';

type Household = Database['public']['Tables']['households']['Row'];
type HouseholdMember = Database['public']['Tables']['household_members']['Row'] & {
  profile?: { email: string; full_name: string | null; avatar_url: string | null };
};

export default function CirclesScreen() {
  const { theme } = useThemeEngine();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const router = useRouter();
  const { households, refreshHouseholds, isLoading: householdsLoading } = useHousehold();

  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleDescription, setNewCircleDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [circleMembers, setCircleMembers] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      await refreshHouseholds();
      await loadMemberCounts();
    } catch (error) {
      console.error('Error loading circles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMemberCounts = async () => {
    try {
      const counts: Record<string, number> = {};
      for (const household of households) {
        const { count, error } = await supabase
          .from('household_members')
          .select('*', { count: 'exact', head: true })
          .eq('household_id', household.id);

        if (!error && count !== null) {
          counts[household.id] = count;
        }
      }
      setCircleMembers(counts);
    } catch (error) {
      console.error('Error loading member counts:', error);
    }
  };

  const handleCreateCircle = useCallback(async () => {
    if (!user || !newCircleName.trim()) {
      Alert.alert('Error', 'Please enter a circle name');
      return;
    }

    try {
      setIsCreating(true);

      // Generate invite code
      const { data: inviteCodeData, error: codeError } = await supabase.rpc('generate_invite_code');

      if (codeError) throw codeError;

      // Create household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert({
          name: newCircleName.trim(),
          description: newCircleDescription.trim() || null,
          owner_id: user.id,
          invite_code: inviteCodeData,
        })
        .select()
        .single();

      if (householdError) throw householdError;

      // Add creator as owner member
      const { error: memberError } = await supabase.from('household_members').insert({
        household_id: household.id,
        user_id: user.id,
        role: 'owner',
      });

      if (memberError) throw memberError;

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert(
        'Circle Created! 🎉',
        `Your circle "${newCircleName}" has been created.\n\nInvite Code: ${inviteCodeData}\n\nShare this code with others to invite them!`,
        [
          {
            text: 'Share Invite',
            onPress: () => handleShareInvite(household.invite_code),
          },
          { text: 'Done', style: 'cancel' },
        ]
      );

      setNewCircleName('');
      setNewCircleDescription('');
      setShowCreateModal(false);
      await refreshHouseholds();
    } catch (error: any) {
      console.error('Error creating circle:', error);
      Alert.alert('Error', error.message || 'Failed to create circle');
    } finally {
      setIsCreating(false);
    }
  }, [user, newCircleName, newCircleDescription]);

  const handleJoinCircle = useCallback(async () => {
    if (!user || !inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    try {
      setIsJoining(true);

      const { data, error } = await supabase.rpc('join_circle_by_invite_code', {
        p_invite_code: inviteCode.trim().toUpperCase(),
        p_user_id: user.id,
      });

      if (error) throw error;

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert('Joined Circle! 🎉', 'You have successfully joined the circle.');

      setInviteCode('');
      setShowJoinModal(false);
      await refreshHouseholds();
    } catch (error: any) {
      console.error('Error joining circle:', error);
      if (error.message.includes('Invalid invite code')) {
        Alert.alert('Invalid Code', 'The invite code you entered is invalid.');
      } else if (error.message.includes('Already a member')) {
        Alert.alert('Already Joined', 'You are already a member of this circle.');
      } else {
        Alert.alert('Error', error.message || 'Failed to join circle');
      }
    } finally {
      setIsJoining(false);
    }
  }, [user, inviteCode]);

  const handleShareInvite = async (code: string) => {
    try {
      await Share.share({
        message: `Join my Anchor Circle! Use invite code: ${code}`,
        title: 'Join my Circle',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCirclePress = (circle: Household) => {
    router.push(`/circle/${circle.id}`);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const gradientColors = [
    ['#667eea', '#764ba2'],
    ['#f093fb', '#f5576c'],
    ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'],
    ['#fa709a', '#fee140'],
    ['#30cfd0', '#330867'],
  ];

  if (isLoading || householdsLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
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
          <Text style={[styles.headerTitle, { color: theme.textInverse }]}>Circles</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textInverse, opacity: 0.9 }]}>
            Your collaborative spaces
          </Text>
        </Animated.View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.secondary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading your circles...
          </Text>
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
        <Text style={[styles.headerTitle, { color: theme.textInverse }]}>Circles</Text>
        <Text style={[styles.headerSubtitle, { color: theme.textInverse, opacity: 0.9 }]}>
          Your collaborative spaces
        </Text>
      </Animated.View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: theme.surface }]}
            onPress={() => setShowCreateModal(true)}
            android_ripple={{ color: theme.secondary + '20' }}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionIconGradient}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.actionButtonTitle, { color: theme.text }]}>Create Circle</Text>
            <Text style={[styles.actionButtonSubtitle, { color: theme.textSecondary }]}>
              Start a new collaborative space
            </Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, { backgroundColor: theme.surface }]}
            onPress={() => setShowJoinModal(true)}
            android_ripple={{ color: theme.secondary + '20' }}
          >
            <LinearGradient
              colors={['#4facfe', '#00f2fe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionIconGradient}
            >
              <Ionicons name="enter" size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.actionButtonTitle, { color: theme.text }]}>Join Circle</Text>
            <Text style={[styles.actionButtonSubtitle, { color: theme.textSecondary }]}>
              Enter an invite code
            </Text>
          </Pressable>
        </View>

        {/* Circles Grid */}
        {households.length > 0 ? (
          <View style={styles.circlesGrid}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>My Circles</Text>
            {households.map((circle, index) => (
              <Animated.View
                key={circle.id}
                entering={FadeInDown.delay(index * 100).springify()}
                layout={Layout.springify()}
              >
                <Pressable
                  style={[styles.circleCard, { backgroundColor: theme.surface }]}
                  onPress={() => handleCirclePress(circle)}
                  android_ripple={{ color: theme.secondary + '20' }}
                >
                  <View style={styles.circleCardContent}>
                    {/* Circle Avatar */}
                    <LinearGradient
                      colors={gradientColors[index % gradientColors.length] as [string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.circleAvatar}
                    >
                      <Text style={styles.circleAvatarText}>{getInitials(circle.name)}</Text>
                    </LinearGradient>

                    {/* Circle Info */}
                    <View style={styles.circleInfo}>
                      <Text style={[styles.circleName, { color: theme.text }]} numberOfLines={1}>
                        {circle.name}
                      </Text>
                      {circle.description && (
                        <Text
                          style={[styles.circleDescription, { color: theme.textSecondary }]}
                          numberOfLines={1}
                        >
                          {circle.description}
                        </Text>
                      )}
                      <View style={styles.circleStats}>
                        <View style={styles.circleStat}>
                          <Ionicons name="people" size={14} color={theme.textSecondary} />
                          <Text style={[styles.circleStatText, { color: theme.textSecondary }]}>
                            {circleMembers[circle.id] || 0} members
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Arrow */}
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                  </View>

                  {/* Invite Code Badge */}
                  <View style={[styles.inviteCodeBadge, { backgroundColor: theme.background }]}>
                    <Ionicons name="key" size={12} color={theme.textSecondary} />
                    <Text style={[styles.inviteCodeText, { color: theme.textSecondary }]}>
                      {circle.invite_code}
                    </Text>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        handleShareInvite(circle.invite_code);
                      }}
                      hitSlop={10}
                    >
                      <Ionicons name="share-outline" size={14} color={theme.secondary} />
                    </Pressable>
                  </View>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-circle-outline" size={80} color={theme.textMuted} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Circles Yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Create your first circle or join one with an invite code
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Create Modal */}
      {showCreateModal && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[styles.modal, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowCreateModal(false)} />
          <Animated.View
            entering={FadeInDown.springify()}
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>Create Circle</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Start a new collaborative space for your team or family
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Circle Name *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                ]}
                value={newCircleName}
                onChangeText={setNewCircleName}
                placeholder="e.g., Family, Work Team, Study Group"
                placeholderTextColor={theme.textMuted}
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Description (Optional)</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                ]}
                value={newCircleDescription}
                onChangeText={setNewCircleDescription}
                placeholder="What's this circle for?"
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonSecondary, { borderColor: theme.border }]}
                onPress={() => setShowCreateModal(false)}
                disabled={isCreating}
              >
                <Text style={[styles.modalButtonText, { color: theme.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  { backgroundColor: theme.secondary, opacity: isCreating ? 0.6 : 1 },
                ]}
                onPress={handleCreateCircle}
                disabled={isCreating || !newCircleName.trim()}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonTextPrimary}>Create</Text>
                )}
              </Pressable>
            </View>
          </Animated.View>
        </Animated.View>
      )}

      {/* Join Modal */}
      {showJoinModal && (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[styles.modal, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowJoinModal(false)} />
          <Animated.View
            entering={FadeInDown.springify()}
            style={[styles.modalContent, { backgroundColor: theme.surface }]}
          >
            <Text style={[styles.modalTitle, { color: theme.text }]}>Join Circle</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Enter the 8-character invite code shared with you
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text }]}>Invite Code</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.inviteCodeInput,
                  { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                ]}
                value={inviteCode}
                onChangeText={(text) => setInviteCode(text.toUpperCase())}
                placeholder="XXXXXXXX"
                placeholderTextColor={theme.textMuted}
                autoCapitalize="characters"
                maxLength={8}
                autoFocus
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonSecondary, { borderColor: theme.border }]}
                onPress={() => setShowJoinModal(false)}
                disabled={isJoining}
              >
                <Text style={[styles.modalButtonText, { color: theme.textSecondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  { backgroundColor: theme.secondary, opacity: isJoining ? 0.6 : 1 },
                ]}
                onPress={handleJoinCircle}
                disabled={isJoining || inviteCode.trim().length !== 8}
              >
                {isJoining ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalButtonTextPrimary}>Join</Text>
                )}
              </Pressable>
            </View>
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
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {    flexGrow: 1,    padding: Spacing.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  actionButton: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  actionIconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  actionButtonTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.xs,
  },
  actionButtonSubtitle: {
    fontSize: Typography.size.xs,
    textAlign: 'center',
  },
  circlesGrid: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.sm,
  },
  circleCard: {
    borderRadius: 16,
    padding: Spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  circleCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  circleAvatarText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
  },
  circleInfo: {
    flex: 1,
  },
  circleName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.xs,
  },
  circleDescription: {
    fontSize: Typography.size.sm,
    marginBottom: Spacing.xs,
  },
  circleStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  circleStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  circleStatText: {
    fontSize: Typography.size.xs,
  },
  inviteCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 8,
    marginTop: Spacing.md,
  },
  inviteCodeText: {
    fontSize: Typography.size.xs,
    fontFamily: 'monospace',
    fontWeight: Typography.weight.medium,
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
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
  modal: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: Spacing.xl,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  modalTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: Typography.size.sm,
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: Typography.size.base,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inviteCodeInput: {
    fontFamily: 'monospace',
    fontSize: Typography.size.lg,
    textAlign: 'center',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonSecondary: {
    borderWidth: 1,
  },
  modalButtonPrimary: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalButtonText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
  modalButtonTextPrimary: {
    color: '#FFFFFF',
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
});
