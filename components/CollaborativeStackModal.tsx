// Collaborative Stack Modal - Real-time shared routines with multiplayer editing
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing } from '@/constants/theme';

interface Collaborator {
  id: string;
  user_id: string;
  role: 'owner' | 'editor' | 'viewer';
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface SharedStack {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  is_public: boolean;
  reminders: any[];
  collaborators?: Collaborator[];
}

interface CollaborativeStackModalProps {
  visible: boolean;
  onClose: () => void;
  stackId?: string;
  userId: string;
}

export default function CollaborativeStackModal({
  visible,
  onClose,
  stackId,
  userId,
}: CollaborativeStackModalProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [stack, setStack] = useState<SharedStack | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');

  // Real-time subscription for stack changes
  useEffect(() => {
    if (!visible || !stackId) return;

    loadStack();

    // Subscribe to real-time changes
    const channel = supabase
      .channel(`stack-${stackId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_stacks',
          filter: `id=eq.${stackId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setStack(payload.new as SharedStack);
            setName(payload.new.name);
            setDescription(payload.new.description || '');
            setIsPublic(payload.new.is_public);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stack_collaborators',
          filter: `stack_id=eq.${stackId}`,
        },
        () => {
          loadCollaborators();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [visible, stackId]);

  const loadStack = async () => {
    if (!stackId) return;

    try {
      const { data, error } = await supabase
        .from('shared_stacks')
        .select('*')
        .eq('id', stackId)
        .single();

      if (error) throw error;

      setStack(data);
      setName(data.name);
      setDescription(data.description || '');
      setIsPublic(data.is_public);

      await loadCollaborators();
    } catch (error) {
      console.error('Error loading stack:', error);
      Alert.alert('Error', 'Failed to load stack');
    }
  };

  const loadCollaborators = async () => {
    if (!stackId) return;

    try {
      const { data, error } = await supabase
        .from('stack_collaborators')
        .select(`
          *,
          profile:profiles(full_name, avatar_url)
        `)
        .eq('stack_id', stackId);

      if (error) throw error;

      setCollaborators(data || []);
    } catch (error) {
      console.error('Error loading collaborators:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      if (stackId) {
        // Update existing stack
        const { error } = await supabase
          .from('shared_stacks')
          .update({
            name,
            description,
            is_public: isPublic,
            updated_at: new Date().toISOString(),
          })
          .eq('id', stackId);

        if (error) throw error;
      } else {
        // Create new stack
        const { data, error } = await supabase
          .from('shared_stacks')
          .insert({
            name,
            description,
            is_public: isPublic,
            creator_id: userId,
            reminders: [],
          })
          .select()
          .single();

        if (error) throw error;

        // Add creator as owner collaborator
        await supabase.from('stack_collaborators').insert({
          stack_id: data.id,
          user_id: userId,
          role: 'owner',
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (error) {
      console.error('Error saving stack:', error);
      Alert.alert('Error', 'Failed to save stack');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteCollaborator = async () => {
    if (!inviteEmail.trim() || !stackId) return;

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Find user by email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteEmail.trim().toLowerCase())
        .single();

      if (profileError || !profile) {
        Alert.alert('Error', 'User not found');
        return;
      }

      // Add as collaborator
      const { error } = await supabase.from('stack_collaborators').insert({
        stack_id: stackId,
        user_id: profile.id,
        role: 'editor',
      });

      if (error) {
        if (error.code === '23505') {
          Alert.alert('Info', 'User is already a collaborator');
        } else {
          throw error;
        }
        return;
      }

      setInviteEmail('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Collaborator invited!');
    } catch (error) {
      console.error('Error inviting collaborator:', error);
      Alert.alert('Error', 'Failed to invite collaborator');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { error } = await supabase
        .from('stack_collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error removing collaborator:', error);
      Alert.alert('Error', 'Failed to remove collaborator');
    }
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
          colors={[theme.primary, theme.secondary]}
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
          <Text style={styles.headerTitle}>
            {stackId ? 'Edit Stack' : 'Create Shared Stack'}
          </Text>
          <View style={styles.placeholder} />
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Stack Name */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>Stack Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
              value={name}
              onChangeText={setName}
              placeholder="My Morning Routine"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.text }]}>Description</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: theme.card, color: theme.text },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="A productive morning routine to start the day..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Public Toggle */}
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={[styles.label, { color: theme.text }]}>Public Stack</Text>
                <Text style={[styles.hint, { color: theme.textSecondary }]}>
                  Anyone can discover and use this stack
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setIsPublic(!isPublic);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={[
                  styles.toggle,
                  isPublic && { backgroundColor: theme.primary },
                  { backgroundColor: isPublic ? theme.primary : theme.textSecondary },
                ]}
              >
                <View
                  style={[
                    styles.toggleKnob,
                    isPublic && styles.toggleKnobActive,
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Collaborators Section */}
          {stackId && (
            <>
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  Collaborators
                </Text>
                <View style={styles.inviteRow}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.inviteInput,
                      { backgroundColor: theme.card, color: theme.text },
                    ]}
                    value={inviteEmail}
                    onChangeText={setInviteEmail}
                    placeholder="user@example.com"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={handleInviteCollaborator}
                    disabled={!inviteEmail.trim() || loading}
                    style={[
                      styles.inviteButton,
                      { backgroundColor: theme.primary },
                      (!inviteEmail.trim() || loading) && styles.buttonDisabled,
                    ]}
                  >
                    <Ionicons name="person-add" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Collaborators List */}
              {collaborators.map((collaborator) => (
                <View
                  key={collaborator.id}
                  style={[styles.collaboratorCard, { backgroundColor: theme.card }]}
                >
                  <View style={styles.collaboratorInfo}>
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: theme.primary + '33' },
                      ]}
                    >
                      <Text style={[styles.avatarText, { color: theme.primary }]}>
                        {collaborator.profile?.full_name?.[0] || '?'}
                      </Text>
                    </View>
                    <View style={styles.flex}>
                      <Text style={[styles.collaboratorName, { color: theme.text }]}>
                        {collaborator.profile?.full_name || 'User'}
                      </Text>
                      <Text
                        style={[styles.collaboratorRole, { color: theme.textSecondary }]}
                      >
                        {collaborator.role}
                      </Text>
                    </View>
                  </View>
                  {collaborator.role !== 'owner' && (
                    <TouchableOpacity
                      onPress={() => handleRemoveCollaborator(collaborator.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close-circle" size={24} color={theme.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </>
          )}

          {/* Real-time Indicator */}
          {stackId && (
            <View style={styles.realtimeIndicator}>
              <View style={[styles.realtimeDot, { backgroundColor: theme.success }]} />
              <Text style={[styles.realtimeText, { color: theme.textSecondary }]}>
                Live syncing enabled
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.footer, { backgroundColor: theme.background }]}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!name.trim() || loading}
            style={[
              styles.saveButton,
              (!name.trim() || loading) && styles.buttonDisabled,
            ]}
          >
            <LinearGradient
              colors={[theme.primary, theme.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>
                    {stackId ? 'Update Stack' : 'Create Stack'}
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  input: {
    borderRadius: 12,
    padding: Spacing.md,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flex: {
    flex: 1,
  },
  hint: {
    fontSize: 14,
    marginTop: 4,
  },
  toggle: {
    width: 56,
    height: 32,
    borderRadius: 16,
    padding: 2,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
  },
  toggleKnobActive: {
    alignSelf: 'flex-end',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  inviteRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  inviteInput: {
    flex: 1,
  },
  inviteButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collaboratorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: 12,
    marginBottom: Spacing.sm,
  },
  collaboratorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
  },
  collaboratorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  collaboratorRole: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  realtimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
  },
  realtimeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  realtimeText: {
    fontSize: 14,
  },
  footer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
