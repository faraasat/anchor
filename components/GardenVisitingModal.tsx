// Garden Visiting Modal - View friends' digital gardens with privacy controls
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing } from '@/constants/theme';
import Svg, { Circle, Path } from 'react-native-svg';

interface GardenData {
  plants: PlantType[];
  totalProgress: number;
  streakDays: number;
  lastActive: string;
}

interface PlantType {
  id: string;
  type: 'flower' | 'tree' | 'succulent' | 'vine';
  growth: number;
  color: string;
  x: number;
  y: number;
}

interface GardenVisitingModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  ownerId: string;
  ownerName: string;
}

export default function GardenVisitingModal({
  visible,
  onClose,
  userId,
  ownerId,
  ownerName,
}: GardenVisitingModalProps) {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [gardenData, setGardenData] = useState<GardenData | null>(null);
  const [privacyAllowed, setPrivacyAllowed] = useState(false);
  const [hasVisited, setHasVisited] = useState(false);

  useEffect(() => {
    if (visible) {
      checkPrivacyAndLoad();
    }
  }, [visible, ownerId]);

  const checkPrivacyAndLoad = async () => {
    setLoading(true);
    try {
      // Check if user is following the owner
      const { data: followData, error: followError } = await supabase
        .from('user_followers')
        .select('*')
        .eq('follower_id', userId)
        .eq('following_id', ownerId)
        .maybeSingle();

      if (followError && followError.code !== 'PGRST116') {
        throw followError;
      }

      const isFollowing = !!followData;

      // Check if they're in the same household
      const { data: householdData, error: householdError } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', userId);

      if (householdError) throw householdError;

      const userHouseholds = householdData?.map((h) => h.household_id) || [];

      const { data: ownerHouseholdData, error: ownerError } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', ownerId);

      if (ownerError) throw ownerError;

      const ownerHouseholds = ownerHouseholdData?.map((h) => h.household_id) || [];
      const inSameHousehold = userHouseholds.some((h) =>
        ownerHouseholds.includes(h)
      );

      setPrivacyAllowed(isFollowing || inSameHousehold);

      if (isFollowing || inSameHousehold) {
        await loadGardenData();
        await recordVisit();
      }
    } catch (error) {
      console.error('Error checking privacy:', error);
      Alert.alert('Error', 'Failed to load garden');
    } finally {
      setLoading(false);
    }
  };

  const loadGardenData = async () => {
    try {
      // Get owner's productivity stats
      const { data: stats, error: statsError } = await supabase
        .from('productivity_stats')
        .select('*')
        .eq('user_id', ownerId)
        .order('date', { ascending: false })
        .limit(30);

      if (statsError) throw statsError;

      // Calculate garden based on productivity
      const totalCompleted = stats?.reduce(
        (sum, s) => sum + (s.completed_count || 0),
        0
      ) || 0;
      const avgCompletionRate =
        stats?.reduce((sum, s) => sum + (s.completion_rate || 0), 0) /
          (stats?.length || 1) || 0;
      const streakDays = stats?.[0]?.streak_days || 0;

      // Generate plants based on activity
      const plants: PlantType[] = [];
      const plantCount = Math.min(Math.floor(totalCompleted / 10), 15);

      const plantTypes: PlantType['type'][] = ['flower', 'tree', 'succulent', 'vine'];
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'];

      for (let i = 0; i < plantCount; i++) {
        plants.push({
          id: `plant-${i}`,
          type: plantTypes[i % plantTypes.length],
          growth: Math.min((totalCompleted / (i + 1)) * 10, 100),
          color: colors[i % colors.length],
          x: 20 + (i % 4) * 70,
          y: 80 + Math.floor(i / 4) * 80,
        });
      }

      setGardenData({
        plants,
        totalProgress: avgCompletionRate,
        streakDays,
        lastActive: stats?.[0]?.date || new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error loading garden data:', error);
    }
  };

  const recordVisit = async () => {
    try {
      const { error } = await supabase.from('garden_visits').insert({
        visitor_id: userId,
        owner_id: ownerId,
      });

      if (error && error.code !== '23505') {
        throw error;
      }

      setHasVisited(true);
    } catch (error) {
      console.error('Error recording visit:', error);
    }
  };

  const renderPlant = (plant: PlantType) => {
    const size = 40 + (plant.growth / 100) * 20;

    return (
      <View
        key={plant.id}
        style={[
          styles.plant,
          {
            left: plant.x,
            top: plant.y,
            width: size,
            height: size,
          },
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 100 100">
          {plant.type === 'flower' && (
            <>
              {/* Stem */}
              <Path
                d="M50 80 L50 50"
                stroke={plant.color}
                strokeWidth="3"
                fill="none"
              />
              {/* Petals */}
              <Circle cx="50" cy="40" r="8" fill={plant.color} opacity={0.8} />
              <Circle cx="42" cy="48" r="8" fill={plant.color} opacity={0.8} />
              <Circle cx="58" cy="48" r="8" fill={plant.color} opacity={0.8} />
              <Circle cx="50" cy="56" r="8" fill={plant.color} opacity={0.8} />
              <Circle cx="42" cy="32" r="8" fill={plant.color} opacity={0.8} />
              <Circle cx="58" cy="32" r="8" fill={plant.color} opacity={0.8} />
              {/* Center */}
              <Circle cx="50" cy="48" r="6" fill="#FFD700" />
            </>
          )}
          {plant.type === 'tree' && (
            <>
              {/* Trunk */}
              <Path
                d="M45 80 L45 50 L55 50 L55 80 Z"
                fill="#8B4513"
              />
              {/* Foliage */}
              <Circle cx="50" cy="40" r="20" fill={plant.color} opacity={0.9} />
              <Circle cx="35" cy="45" r="15" fill={plant.color} opacity={0.8} />
              <Circle cx="65" cy="45" r="15" fill={plant.color} opacity={0.8} />
            </>
          )}
          {plant.type === 'succulent' && (
            <>
              <Circle cx="50" cy="60" r="18" fill={plant.color} opacity={0.9} />
              <Circle cx="50" cy="45" r="14" fill={plant.color} opacity={0.85} />
              <Circle cx="50" cy="32" r="10" fill={plant.color} opacity={0.8} />
            </>
          )}
          {plant.type === 'vine' && (
            <>
              <Path
                d="M30 80 Q40 60 50 50 Q60 40 70 30"
                stroke={plant.color}
                strokeWidth="4"
                fill="none"
              />
              <Circle cx="35" cy="70" r="6" fill={plant.color} />
              <Circle cx="45" cy="55" r="6" fill={plant.color} />
              <Circle cx="55" cy="42" r="6" fill={plant.color} />
              <Circle cx="65" cy="35" r="6" fill={plant.color} />
            </>
          )}
        </Svg>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <LinearGradient
          colors={['#4ECDC4', '#44A08D']}
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
          <Text style={styles.headerTitle}>{ownerName}'s Garden</Text>
          <View style={styles.placeholder} />
        </LinearGradient>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading garden...
            </Text>
          </View>
        ) : !privacyAllowed ? (
          <View style={styles.privacyContainer}>
            <View
              style={[styles.privacyIcon, { backgroundColor: theme.primary + '22' }]}
            >
              <Ionicons name="lock-closed" size={48} color={theme.primary} />
            </View>
            <Text style={[styles.privacyTitle, { color: theme.text }]}>
              Private Garden
            </Text>
            <Text style={[styles.privacyMessage, { color: theme.textSecondary }]}>
              Follow {ownerName} or join their household to visit their garden.
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Stats */}
            <View style={[styles.statsCard, { backgroundColor: theme.card }]}>
              <View style={styles.statItem}>
                <Ionicons name="trending-up" size={24} color="#4ECDC4" />
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {gardenData?.totalProgress.toFixed(0)}%
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Avg Completion
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="flame" size={24} color="#FF6B6B" />
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {gardenData?.streakDays}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Day Streak
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="leaf" size={24} color="#44A08D" />
                <Text style={[styles.statValue, { color: theme.text }]}>
                  {gardenData?.plants.length}
                </Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Plants
                </Text>
              </View>
            </View>

            {/* Garden Canvas */}
            <View style={[styles.gardenCanvas, { backgroundColor: theme.card }]}>
              <LinearGradient
                colors={['rgba(78, 205, 196, 0.1)', 'rgba(68, 160, 141, 0.1)']}
                style={StyleSheet.absoluteFill}
              />
              {gardenData?.plants.map((plant) => renderPlant(plant))}

              {gardenData?.plants.length === 0 && (
                <View style={styles.emptyGarden}>
                  <Ionicons
                    name="leaf-outline"
                    size={48}
                    color={theme.textSecondary}
                  />
                  <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    Garden is just starting to grow
                  </Text>
                </View>
              )}
            </View>

            {/* Visit Badge */}
            {hasVisited && (
              <View style={[styles.visitBadge, { backgroundColor: theme.card }]}>
                <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
                <Text style={[styles.visitText, { color: theme.text }]}>
                  You visited this garden!
                </Text>
              </View>
            )}
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
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  privacyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  privacyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  privacyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  privacyMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: Spacing.lg,
    borderRadius: 16,
    marginBottom: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  gardenCanvas: {
    height: 400,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  plant: {
    position: 'absolute',
  },
  emptyGarden: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
  },
  visitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: 12,
    marginTop: Spacing.lg,
    justifyContent: 'center',
  },
  visitText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
