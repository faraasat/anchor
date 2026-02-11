// Household Context - Manages family/group collaboration
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase, subscribeToHousehold, subscribeToNudges } from '@/lib/supabase';
import type { Database } from '@/types/database';
import * as Haptics from 'expo-haptics';
import { Platform, Alert } from 'react-native';

type Household = Database['public']['Tables']['households']['Row'];
type HouseholdMember = Database['public']['Tables']['household_members']['Row'] & {
  profile?: { email: string; full_name: string | null; avatar_url: string | null };
};
type Nudge = Database['public']['Tables']['nudges']['Row'] & {
  sender?: { full_name: string | null; email: string };
  reminder?: { title: string };
};

interface HouseholdContextType {
  households: Household[];
  currentHousehold: Household | null;
  members: HouseholdMember[];
  unreadNudges: Nudge[];
  isLoading: boolean;
  setCurrentHousehold: (household: Household | null) => void;
  createHousehold: (name: string) => Promise<Household>;
  inviteMember: (email: string, role: 'editor' | 'viewer') => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: 'editor' | 'viewer') => Promise<void>;
  sendNudge: (recipientId: string, reminderId: string, message?: string) => Promise<void>;
  markNudgeRead: (nudgeId: string) => Promise<void>;
  refreshHouseholds: () => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [unreadNudges, setUnreadNudges] = useState<Nudge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load households
  useEffect(() => {
    if (user) {
      loadHouseholds();
      loadNudges();
    }
  }, [user]);

  // Subscribe to household changes
  useEffect(() => {
    if (!currentHousehold) return;

    const channel = subscribeToHousehold(currentHousehold.id, (payload) => {
      console.log('Household change:', payload);
      loadMembers();
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentHousehold]);

  // Subscribe to nudges
  useEffect(() => {
    if (!user) return;

    const channel = subscribeToNudges(user.id, (payload) => {
      console.log('New nudge:', payload);
      const newNudge = payload.new as Nudge;
      setUnreadNudges((prev) => [newNudge, ...prev]);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      Alert.alert(
        'Gentle Nudge',
        newNudge.message || `You have a reminder that needs attention`,
        [{ text: 'View', onPress: () => markNudgeRead(newNudge.id) }]
      );
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Load members when household changes
  useEffect(() => {
    if (currentHousehold) {
      loadMembers();
    }
  }, [currentHousehold]);

  const loadHouseholds = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Get households where user is owner
      const { data: ownedHouseholds, error: ownedError } = await supabase
        .from('households')
        .select('*')
        .eq('owner_id', user.id);

      if (ownedError) throw ownedError;

      // Get households where user is member
      const { data: memberHouseholds, error: memberError } = await supabase
        .from('household_members')
        .select('household_id, households(*)')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      const allHouseholds = [
        ...(ownedHouseholds || []),
        ...(memberHouseholds?.map((m: any) => m.households) || []),
      ];

      setHouseholds(allHouseholds);

      // Set first household as current if none selected
      if (!currentHousehold && allHouseholds.length > 0) {
        setCurrentHousehold(allHouseholds[0]);
      }
    } catch (error) {
      console.error('Error loading households:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMembers = async () => {
    if (!currentHousehold) return;

    try {
      const { data, error } = await supabase
        .from('household_members')
        .select(`
          *,
          profile:profiles(email, full_name, avatar_url)
        `)
        .eq('household_id', currentHousehold.id);

      if (error) throw error;

      setMembers(data || []);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  const loadNudges = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('nudges')
        .select(`
          *,
          sender:profiles!sender_id(full_name, email),
          reminder:reminders(title)
        `)
        .eq('recipient_id', user.id)
        .is('read_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUnreadNudges(data || []);
    } catch (error) {
      console.error('Error loading nudges:', error);
    }
  };

  const createHousehold = async (name: string): Promise<Household> => {
    if (!user) throw new Error('Not authenticated');

    // Generate invite code
    const { data: inviteCode, error: codeError } = await supabase.rpc('generate_invite_code');
    if (codeError) throw codeError;

    const { data, error } = await supabase
      .from('households')
      .insert({ name, owner_id: user.id, invite_code: inviteCode })
      .select()
      .single();

    if (error) throw error;

    // Add owner as member
    await supabase.from('household_members').insert({
      household_id: data.id,
      user_id: user.id,
      role: 'owner',
    });

    await loadHouseholds();
    return data;
  };

  const inviteMember = async (email: string, role: 'editor' | 'viewer') => {
    if (!currentHousehold || !user) throw new Error('No household selected');

    // Find user by email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profileError || !profile) {
      throw new Error('User not found. They need to sign up first.');
    }

    // Add member
    const { error } = await supabase.from('household_members').insert({
      household_id: currentHousehold.id,
      user_id: profile.id,
      role,
    });

    if (error) {
      if (error.code === '23505') {
        throw new Error('This user is already a member');
      }
      throw error;
    }

    await loadMembers();
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase
      .from('household_members')
      .delete()
      .eq('id', memberId);

    if (error) throw error;

    await loadMembers();
  };

  const updateMemberRole = async (memberId: string, role: 'editor' | 'viewer') => {
    const { error } = await supabase
      .from('household_members')
      .update({ role })
      .eq('id', memberId);

    if (error) throw error;

    await loadMembers();
  };

  const sendNudge = async (recipientId: string, reminderId: string, message?: string) => {
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase.from('nudges').insert({
      sender_id: user.id,
      recipient_id: recipientId,
      reminder_id: reminderId,
      message,
    });

    if (error) throw error;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const markNudgeRead = async (nudgeId: string) => {
    const { error } = await supabase
      .from('nudges')
      .update({ read_at: new Date().toISOString() })
      .eq('id', nudgeId);

    if (error) throw error;

    setUnreadNudges((prev) => prev.filter((n) => n.id !== nudgeId));
  };

  const refreshHouseholds = async () => {
    await loadHouseholds();
  };

  return (
    <HouseholdContext.Provider
      value={{
        households,
        currentHousehold,
        members,
        unreadNudges,
        isLoading,
        setCurrentHousehold,
        createHousehold,
        inviteMember,
        removeMember,
        updateMemberRole,
        sendNudge,
        markNudgeRead,
        refreshHouseholds,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const context = useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error('useHousehold must be used within a HouseholdProvider');
  }
  return context;
}
