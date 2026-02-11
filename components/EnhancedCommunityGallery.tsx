// Enhanced Community Gallery - Social discovery with follow system and trending AI recommendations
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing } from '@/constants/theme';
import { NewellAIClient } from '@/lib/groq';

const newellClient = new NewellAIClient({
  baseURL: process.env.EXPO_PUBLIC_NEWELL_API_URL,
  projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
});

interface Creator {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  follower_count: number;
  stack_count: number;
  is_following: boolean;
}

interface CommunityStack {
  id: string;
  name: string;
  description: string | null;
  creator_id: string;
  downloads: number;
  creator?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface EnhancedCommunityGalleryProps {
  userId: string;
  onStackSelect: (stackId: string) => void;
}

export default function EnhancedCommunityGallery({
  userId,
  onStackSelect,
}: EnhancedCommunityGalleryProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'trending' | 'following' | 'creators'>('trending');
  const [trendingStacks, setTrendingStacks] = useState<CommunityStack[]>([]);
  const [followingStacks, setFollowingStacks] = useState<CommunityStack[]>([]);
  const [topCreators, setTopCreators] = useState<Creator[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);

  useEffect(() => {
    loadContent();
    loadAIRecommendations();
  }, [activeTab]);

  const loadContent = async () => {
    setLoading(true);
    try {
      if (activeTab === 'trending') {
        await loadTrendingStacks();
      } else if (activeTab === 'following') {
        await loadFollowingStacks();
      } else {
        await loadTopCreators();
      }
    } catch (error) {
      console.error('Error loading content:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingStacks = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_stacks')
        .select(`
          *,
          creator:profiles!creator_id(full_name, avatar_url)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTrendingStacks(data || []);
    } catch (error) {
      console.error('Error loading trending stacks:', error);
    }
  };

  const loadFollowingStacks = async () => {
    try {
      // Get users that current user is following
      const { data: following, error: followError } = await supabase
        .from('user_followers')
        .select('following_id')
        .eq('follower_id', userId);

      if (followError) throw followError;

      const followingIds = following?.map((f) => f.following_id) || [];

      if (followingIds.length === 0) {
        setFollowingStacks([]);
        return;
      }

      // Get stacks from followed users
      const { data, error } = await supabase
        .from('shared_stacks')
        .select(`
          *,
          creator:profiles!creator_id(full_name, avatar_url)
        `)
        .in('creator_id', followingIds)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setFollowingStacks(data || []);
    } catch (error) {
      console.error('Error loading following stacks:', error);
    }
  };

  const loadTopCreators = async () => {
    try {
      // This would ideally be a database function, but we'll do it client-side for now
      const { data: stacks, error: stackError } = await supabase
        .from('shared_stacks')
        .select('creator_id')
        .eq('is_public', true);

      if (stackError) throw stackError;

      // Count stacks per creator
      const creatorCounts = (stacks || []).reduce((acc: any, stack) => {
        acc[stack.creator_id] = (acc[stack.creator_id] || 0) + 1;
        return acc;
      }, {});

      const topCreatorIds = Object.keys(creatorCounts)
        .sort((a, b) => creatorCounts[b] - creatorCounts[a])
        .slice(0, 10);

      // Get creator profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', topCreatorIds);

      if (profileError) throw profileError;

      // Get follower counts
      const { data: followers, error: followerError } = await supabase
        .from('user_followers')
        .select('following_id')
        .in('following_id', topCreatorIds);

      if (followerError) throw followerError;

      const followerCounts = (followers || []).reduce((acc: any, f) => {
        acc[f.following_id] = (acc[f.following_id] || 0) + 1;
        return acc;
      }, {});

      // Check if current user is following
      const { data: currentFollowing, error: currentError } = await supabase
        .from('user_followers')
        .select('following_id')
        .eq('follower_id', userId)
        .in('following_id', topCreatorIds);

      if (currentError) throw currentError;

      const followingSet = new Set(
        (currentFollowing || []).map((f) => f.following_id)
      );

      const creators: Creator[] = (profiles || []).map((profile) => ({
        id: profile.id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        follower_count: followerCounts[profile.id] || 0,
        stack_count: creatorCounts[profile.id] || 0,
        is_following: followingSet.has(profile.id),
      }));

      setTopCreators(creators);
    } catch (error) {
      console.error('Error loading top creators:', error);
    }
  };

  const loadAIRecommendations = async () => {
    try {
      const response = await newellClient.generateText({
        messages: [
          {
            role: 'user',
            content: `Based on current productivity trends and user behavior, recommend 3-4 trending routine categories that would be most valuable right now. Format as a JSON array of short category names (e.g., ["Morning Energy Boost", "Deep Work Focus", "Evening Wind-down"]). Only return the JSON array, nothing else.`,
          },
        ],
        systemPrompt: 'You are a productivity assistant that recommends trending routine categories.',
      });

      const text = response.text.trim();
      const parsed = JSON.parse(text);
      setAiRecommendations(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.error('Error loading AI recommendations:', error);
      setAiRecommendations([]);
    }
  };

  const handleFollowToggle = async (creatorId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const creator = topCreators.find((c) => c.id === creatorId);
      if (!creator) return;

      if (creator.is_following) {
        // Unfollow
        const { error } = await supabase
          .from('user_followers')
          .delete()
          .eq('follower_id', userId)
          .eq('following_id', creatorId);

        if (error) throw error;
      } else {
        // Follow
        const { error } = await supabase.from('user_followers').insert({
          follower_id: userId,
          following_id: creatorId,
        });

        if (error) throw error;
      }

      // Update local state
      setTopCreators((prev) =>
        prev.map((c) =>
          c.id === creatorId
            ? {
                ...c,
                is_following: !c.is_following,
                follower_count: c.is_following
                  ? c.follower_count - 1
                  : c.follower_count + 1,
              }
            : c
        )
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const renderStackCard = ({ item }: { item: CommunityStack }) => (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onStackSelect(item.id);
      }}
      style={[styles.stackCard, { backgroundColor: theme.card }]}
    >
      <View style={styles.stackHeader}>
        <View style={[styles.stackIcon, { backgroundColor: theme.primary + '22' }]}>
          <Ionicons name="layers" size={24} color={theme.primary} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.stackName, { color: theme.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text
            style={[styles.stackDescription, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {item.description || 'No description'}
          </Text>
        </View>
      </View>

      <View style={styles.stackFooter}>
        <View style={styles.creatorInfo}>
          <View
            style={[styles.creatorAvatar, { backgroundColor: theme.primary + '33' }]}
          >
            <Text style={[styles.creatorAvatarText, { color: theme.primary }]}>
              {item.creator?.full_name?.[0] || '?'}
            </Text>
          </View>
          <Text style={[styles.creatorName, { color: theme.textSecondary }]}>
            {item.creator?.full_name || 'Unknown'}
          </Text>
        </View>
        <View style={styles.statsRow}>
          <Ionicons name="download-outline" size={16} color={theme.textSecondary} />
          <Text style={[styles.statText, { color: theme.textSecondary }]}>
            {item.downloads || 0}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCreatorCard = ({ item }: { item: Creator }) => (
    <View style={[styles.creatorCard, { backgroundColor: theme.card }]}>
      <View style={styles.creatorCardContent}>
        <View
          style={[styles.creatorCardAvatar, { backgroundColor: theme.primary + '33' }]}
        >
          <Text style={[styles.creatorCardAvatarText, { color: theme.primary }]}>
            {item.full_name?.[0] || '?'}
          </Text>
        </View>
        <View style={styles.flex}>
          <Text style={[styles.creatorCardName, { color: theme.text }]}>
            {item.full_name || 'User'}
          </Text>
          <View style={styles.creatorStats}>
            <Text style={[styles.creatorStat, { color: theme.textSecondary }]}>
              {item.follower_count} followers
            </Text>
            <Text style={[styles.creatorStat, { color: theme.textSecondary }]}>
              • {item.stack_count} stacks
            </Text>
          </View>
        </View>
      </View>
      <TouchableOpacity
        onPress={() => handleFollowToggle(item.id)}
        style={[
          styles.followButton,
          {
            backgroundColor: item.is_following
              ? theme.card
              : theme.primary,
            borderWidth: item.is_following ? 1 : 0,
            borderColor: theme.border,
          },
        ]}
      >
        <Text
          style={[
            styles.followButtonText,
            { color: item.is_following ? theme.text : '#FFFFFF' },
          ]}
        >
          {item.is_following ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* AI Recommendations Banner */}
      {aiRecommendations.length > 0 && (
        <View style={styles.aiSection}>
          <View style={styles.aiHeader}>
            <Ionicons name="sparkles" size={20} color={theme.primary} />
            <Text style={[styles.aiTitle, { color: theme.text }]}>
              Trending Now
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.aiChips}
          >
            {aiRecommendations.map((category, index) => (
              <View
                key={index}
                style={[styles.aiChip, { backgroundColor: theme.primary + '22' }]}
              >
                <Text style={[styles.aiChipText, { color: theme.primary }]}>
                  {category}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {['trending', 'following', 'creators'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => {
              setActiveTab(tab as any);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={[
              styles.tab,
              activeTab === tab && [
                styles.tabActive,
                { borderBottomColor: theme.primary },
              ],
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === tab ? theme.primary : theme.textSecondary },
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : activeTab === 'creators' ? (
        <FlatList
          data={topCreators}
          renderItem={renderCreatorCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={activeTab === 'trending' ? trendingStacks : followingStacks}
          renderItem={renderStackCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          numColumns={2}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  aiSection: {
    padding: Spacing.md,
    paddingBottom: 0,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  aiChips: {
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  aiChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },
  aiChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    marginTop: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {},
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: Spacing.md,
  },
  row: {
    gap: Spacing.md,
  },
  stackCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 16,
    marginBottom: Spacing.md,
  },
  stackHeader: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  stackIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  stackName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  stackDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  stackFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  creatorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorAvatarText: {
    fontSize: 12,
    fontWeight: '600',
  },
  creatorName: {
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
  },
  creatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: 16,
    marginBottom: Spacing.sm,
  },
  creatorCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  creatorCardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creatorCardAvatarText: {
    fontSize: 20,
    fontWeight: '600',
  },
  creatorCardName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  creatorStats: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  creatorStat: {
    fontSize: 13,
  },
  followButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
