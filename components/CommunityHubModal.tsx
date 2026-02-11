// Community Hub Modal - Browse and import task stacks
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useColorScheme';
import { Stack, StackCategory } from '@/types/stack';
import { StackService } from '@/services/StackService';
import { StackCard } from './StackCard';
import { StackDetailModal } from './StackDetailModal';
import { Spacing, Typography } from '@/constants/theme';
import { Reminder } from '@/types/reminder';

interface CommunityHubModalProps {
  visible: boolean;
  onClose: () => void;
  onImportStack: (stackId: string) => Promise<void>;
  userReminders: Reminder[];
}

export function CommunityHubModal({ visible, onClose, onImportStack, userReminders }: CommunityHubModalProps) {
  const theme = useTheme();

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<StackCategory[]>([]);
  const [featuredStacks, setFeaturedStacks] = useState<Stack[]>([]);
  const [categoryStacks, setCategoryStacks] = useState<Stack[]>([]);
  const [searchResults, setSearchResults] = useState<Stack[]>([]);
  const [selectedStack, setSelectedStack] = useState<Stack | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (visible) {
      loadInitialData();
    }
  }, [visible]);

  useEffect(() => {
    if (selectedCategory) {
      loadCategoryStacks(selectedCategory);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      searchStacks();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [categoriesData, featured] = await Promise.all([
        StackService.getCategories(),
        StackService.getFeaturedStacks(),
      ]);
      setCategories(categoriesData);
      setFeaturedStacks(featured);
    } catch (error) {
      console.error('Error loading community hub data:', error);
      Alert.alert('Error', 'Failed to load community stacks');
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryStacks = async (category: string) => {
    try {
      const stacks = await StackService.getStacksByCategory(category);
      setCategoryStacks(stacks);
    } catch (error) {
      console.error('Error loading category stacks:', error);
    }
  };

  const searchStacks = async () => {
    try {
      const results = await StackService.searchStacks(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching stacks:', error);
    }
  };

  const handleStackPress = (stack: Stack) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedStack(stack);
    setDetailModalVisible(true);
  };

  const handleImportStack = async (stackId: string) => {
    try {
      setImporting(true);
      await onImportStack(stackId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setDetailModalVisible(false);
      onClose();
    } catch (error) {
      console.error('Error importing stack:', error);
      Alert.alert('Error', 'Failed to import stack');
    } finally {
      setImporting(false);
    }
  };

  const handleCategoryPress = (categoryName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (selectedCategory === categoryName) {
      setSelectedCategory(null);
      setCategoryStacks([]);
    } else {
      setSelectedCategory(categoryName);
    }
  };

  const displayStacks = searchQuery.length > 2 ? searchResults : selectedCategory ? categoryStacks : featuredStacks;

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          {/* Header */}
          <LinearGradient
            colors={[theme.secondary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View>
                <Text style={[styles.headerTitle, { color: theme.textInverse }]}>
                  Community Hub
                </Text>
                <Text style={[styles.headerSubtitle, { color: theme.textInverse + 'CC' }]}>
                  Discover & import task stacks
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={10}>
                <Ionicons name="close" size={28} color={theme.textInverse} />
              </Pressable>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchContainer, { backgroundColor: theme.textInverse + '20' }]}>
              <Ionicons name="search" size={20} color={theme.textInverse} />
              <TextInput
                style={[styles.searchInput, { color: theme.textInverse }]}
                placeholder="Search stacks..."
                placeholderTextColor={theme.textInverse + '80'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={theme.textInverse} />
                </Pressable>
              )}
            </View>
          </LinearGradient>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.secondary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Loading stacks...
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* Categories */}
              {searchQuery.length === 0 && (
                <Animated.View entering={FadeIn.duration(300)}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Categories
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesContainer}
                  >
                    {categories.map((category) => (
                      <Pressable
                        key={category.id}
                        onPress={() => handleCategoryPress(category.name)}
                        style={[
                          styles.categoryChip,
                          {
                            backgroundColor: selectedCategory === category.name
                              ? theme.secondary
                              : theme.surface,
                          },
                        ]}
                      >
                        <Ionicons
                          name={category.icon as any}
                          size={20}
                          color={selectedCategory === category.name ? theme.textInverse : theme.text}
                        />
                        <Text
                          style={[
                            styles.categoryText,
                            {
                              color: selectedCategory === category.name ? theme.textInverse : theme.text,
                            },
                          ]}
                        >
                          {category.name}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </Animated.View>
              )}

              {/* Stacks List */}
              <Animated.View entering={FadeIn.duration(300).delay(200)}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                  {searchQuery.length > 2
                    ? `Search Results (${searchResults.length})`
                    : selectedCategory
                    ? selectedCategory
                    : 'Featured Stacks'}
                </Text>

                {displayStacks.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="folder-open-outline" size={48} color={theme.textMuted} />
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>
                      No stacks found
                    </Text>
                    <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                      {searchQuery.length > 2
                        ? 'Try a different search term'
                        : 'Check back later for new stacks'}
                    </Text>
                  </View>
                ) : (
                  displayStacks.map((stack, index) => (
                    <StackCard
                      key={stack.id}
                      stack={stack}
                      onPress={handleStackPress}
                      index={index}
                    />
                  ))
                )}
              </Animated.View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Stack Detail Modal */}
      {selectedStack && (
        <StackDetailModal
          visible={detailModalVisible}
          stack={selectedStack}
          onClose={() => setDetailModalVisible(false)}
          onImport={handleImportStack}
          importing={importing}
          userReminders={userReminders}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
  },
  headerSubtitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    marginTop: Spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 12,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  categoriesContainer: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    gap: Spacing.xs,
    marginRight: Spacing.sm,
  },
  categoryText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: Typography.size.base,
    textAlign: 'center',
  },
});
