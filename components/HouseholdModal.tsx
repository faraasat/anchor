// Household Modal - Manage households and members
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useColorScheme';
import { useHousehold } from '@/contexts/HouseholdContext';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';

interface HouseholdModalProps {
  visible: boolean;
  onClose: () => void;
}

export function HouseholdModal({ visible, onClose }: HouseholdModalProps) {
  const theme = useTheme();
  const {
    households,
    currentHousehold,
    members,
    setCurrentHousehold,
    createHousehold,
    inviteMember,
    removeMember,
    updateMemberRole,
  } = useHousehold();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [householdName, setHouseholdName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateHousehold = async () => {
    if (!householdName.trim()) {
      Alert.alert('Error', 'Please enter a household name');
      return;
    }

    setIsLoading(true);
    try {
      const newHousehold = await createHousehold(householdName);
      setCurrentHousehold(newHousehold);
      setHouseholdName('');
      setShowCreateForm(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Household created successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    setIsLoading(true);
    try {
      await inviteMember(inviteEmail, inviteRole);
      setInviteEmail('');
      setShowInviteForm(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Member invited successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = (memberId: string, memberName: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${memberName} from this household?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeMember(memberId);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <Animated.View
          entering={SlideInDown.springify()}
          style={[styles.modal, { backgroundColor: theme.surface }]}
        >
          {/* Header */}
          <LinearGradient
            colors={[theme.secondary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Text style={styles.headerTitle}>Households</Text>
            <Pressable onPress={handleClose} hitSlop={10}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </LinearGradient>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Current Household */}
            {currentHousehold && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Current Household</Text>
                <View style={[styles.card, { backgroundColor: theme.cardBackground }, Shadows.sm]}>
                  <View style={styles.cardHeader}>
                    <Ionicons name="home" size={24} color={theme.secondary} />
                    <Text style={[styles.cardTitle, { color: theme.text }]}>{currentHousehold.name}</Text>
                  </View>

                  <Pressable
                    style={[styles.button, { backgroundColor: theme.secondary }]}
                    onPress={() => setShowInviteForm(!showInviteForm)}
                  >
                    <Ionicons name="person-add" size={20} color="#FFFFFF" />
                    <Text style={styles.buttonText}>Invite Member</Text>
                  </Pressable>

                  {showInviteForm && (
                    <Animated.View entering={FadeIn.duration(200)} style={styles.form}>
                      <TextInput
                        style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                        placeholder="Email address"
                        placeholderTextColor={theme.textMuted}
                        value={inviteEmail}
                        onChangeText={setInviteEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />

                      <View style={styles.roleSelector}>
                        <Pressable
                          style={[
                            styles.roleButton,
                            { backgroundColor: inviteRole === 'editor' ? theme.secondary : theme.background },
                          ]}
                          onPress={() => setInviteRole('editor')}
                        >
                          <Text style={[styles.roleText, { color: inviteRole === 'editor' ? '#FFFFFF' : theme.text }]}>
                            Editor
                          </Text>
                        </Pressable>
                        <Pressable
                          style={[
                            styles.roleButton,
                            { backgroundColor: inviteRole === 'viewer' ? theme.secondary : theme.background },
                          ]}
                          onPress={() => setInviteRole('viewer')}
                        >
                          <Text style={[styles.roleText, { color: inviteRole === 'viewer' ? '#FFFFFF' : theme.text }]}>
                            Viewer
                          </Text>
                        </Pressable>
                      </View>

                      <Pressable
                        style={[styles.button, { backgroundColor: theme.accent }]}
                        onPress={handleInviteMember}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <Text style={styles.buttonText}>Send Invitation</Text>
                        )}
                      </Pressable>
                    </Animated.View>
                  )}
                </View>

                {/* Members List */}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Members ({members.length})</Text>
                {members.map((member) => (
                  <View
                    key={member.id}
                    style={[styles.memberCard, { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder }]}
                  >
                    <View style={styles.memberInfo}>
                      <View style={[styles.avatar, { backgroundColor: theme.secondary + '20' }]}>
                        <Text style={[styles.avatarText, { color: theme.secondary }]}>
                          {member.profile?.full_name?.[0] || member.profile?.email[0].toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.memberDetails}>
                        <Text style={[styles.memberName, { color: theme.text }]}>
                          {member.profile?.full_name || member.profile?.email}
                        </Text>
                        <Text style={[styles.memberEmail, { color: theme.textSecondary }]}>
                          {member.profile?.email}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.memberActions}>
                      <View style={[styles.roleBadge, { backgroundColor: theme.accent + '20' }]}>
                        <Text style={[styles.roleBadgeText, { color: theme.accent }]}>
                          {member.role}
                        </Text>
                      </View>
                      {member.role !== 'owner' && (
                        <Pressable
                          onPress={() => handleRemoveMember(member.id, member.profile?.full_name || 'this member')}
                          hitSlop={10}
                        >
                          <Ionicons name="close-circle" size={24} color={theme.error} />
                        </Pressable>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* All Households */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>All Households</Text>

              {households.map((household) => (
                <Pressable
                  key={household.id}
                  style={[
                    styles.householdCard,
                    { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
                    currentHousehold?.id === household.id && { borderColor: theme.secondary, borderWidth: 2 },
                  ]}
                  onPress={() => {
                    setCurrentHousehold(household);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Ionicons name="home" size={24} color={theme.secondary} />
                  <Text style={[styles.householdName, { color: theme.text }]}>{household.name}</Text>
                  {currentHousehold?.id === household.id && (
                    <Ionicons name="checkmark-circle" size={24} color={theme.secondary} />
                  )}
                </Pressable>
              ))}

              <Pressable
                style={[styles.createButton, { backgroundColor: theme.background, borderColor: theme.secondary }]}
                onPress={() => setShowCreateForm(!showCreateForm)}
              >
                <Ionicons name="add-circle" size={24} color={theme.secondary} />
                <Text style={[styles.createButtonText, { color: theme.secondary }]}>Create New Household</Text>
              </Pressable>

              {showCreateForm && (
                <Animated.View entering={FadeIn.duration(200)} style={styles.form}>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                    placeholder="Household name (e.g., Smith Family)"
                    placeholderTextColor={theme.textMuted}
                    value={householdName}
                    onChangeText={setHouseholdName}
                  />
                  <Pressable
                    style={[styles.button, { backgroundColor: theme.secondary }]}
                    onPress={handleCreateHousehold}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.buttonText}>Create Household</Text>
                    )}
                  </Pressable>
                </Animated.View>
              )}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
  },
  headerTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
  },
  content: {
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.md,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
  form: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: Typography.size.base,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  roleButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  roleText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
  memberCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
  memberEmail: {
    fontSize: Typography.size.sm,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  roleBadgeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
    textTransform: 'capitalize',
  },
  householdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  householdName: {
    flex: 1,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    gap: Spacing.sm,
  },
  createButtonText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
});
