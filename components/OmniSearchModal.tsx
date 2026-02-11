// Omni-Search Modal - Global search with pull-down gesture
// Phase 2: Universal access to tasks, Circles, Anchors, and templates
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import type { Reminder, TagType } from '@/types/reminder';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SearchResult {
  type: 'task' | 'circle' | 'anchor' | 'template';
  id: string;
  title: string;
  subtitle?: string;
  tag?: TagType;
  icon: string;
  data: any;
}

interface OmniSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectResult: (result: SearchResult) => void;
  reminders?: Reminder[];
  circles?: Array<{ id: string; name: string }>;
  anchorPoints?: Array<{ id: string; name: string }>;
  templates?: Array<{ id: string; name: string }>;
}

export function OmniSearchModal({
  visible,
  onClose,
  onSelectResult,
  reminders = [],
  circles = [],
  anchorPoints = [],
  templates = [],
}: OmniSearchModalProps) {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = React.useRef<TextInput>(null);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (visible && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [visible]);

  // Perform search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    performSearch(query);
  }, [query, reminders, circles, anchorPoints, templates]);

  const performSearch = useCallback(
    (searchQuery: string) => {
      setIsSearching(true);

      const lowerQuery = searchQuery.toLowerCase();
      const searchResults: SearchResult[] = [];

      // Search tasks
      reminders.forEach(reminder => {
        if (
          reminder.title.toLowerCase().includes(lowerQuery) ||
          reminder.description?.toLowerCase().includes(lowerQuery)
        ) {
          searchResults.push({
            type: 'task',
            id: reminder.id,
            title: reminder.title,
            subtitle: `${reminder.dueDate} at ${reminder.dueTime}`,
            tag: reminder.tag,
            icon: 'checkbox-outline',
            data: reminder,
          });
        }
      });

      // Search circles
      circles.forEach(circle => {
        if (circle.name.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            type: 'circle',
            id: circle.id,
            title: circle.name,
            subtitle: 'Circle',
            icon: 'people',
            data: circle,
          });
        }
      });

      // Search anchor points
      anchorPoints.forEach(anchor => {
        if (anchor.name.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            type: 'anchor',
            id: anchor.id,
            title: anchor.name,
            subtitle: 'Anchor Point',
            icon: 'radio',
            data: anchor,
          });
        }
      });

      // Search templates
      templates.forEach(template => {
        if (template.name.toLowerCase().includes(lowerQuery)) {
          searchResults.push({
            type: 'template',
            id: template.id,
            title: template.name,
            subtitle: 'Template',
            icon: 'document-text',
            data: template,
          });
        }
      });

      // Sort by relevance (exact match first, then partial)
      searchResults.sort((a, b) => {
        const aExact = a.title.toLowerCase() === lowerQuery;
        const bExact = b.title.toLowerCase() === lowerQuery;
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;

        const aStarts = a.title.toLowerCase().startsWith(lowerQuery);
        const bStarts = b.title.toLowerCase().startsWith(lowerQuery);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;

        return 0;
      });

      setResults(searchResults.slice(0, 20));  // Limit to 20 results
      setIsSearching(false);
    },
    [reminders, circles, anchorPoints, templates]
  );

  const handleSelectResult = (result: SearchResult) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    onSelectResult(result);
    handleClose();
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    onClose();
  };

  const getResultIcon = (type: string): string => {
    switch (type) {
      case 'task':
        return 'checkbox-outline';
      case 'circle':
        return 'people';
      case 'anchor':
        return 'radio';
      case 'template':
        return 'document-text';
      default:
        return 'search';
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'task':
        return theme.secondary;
      case 'circle':
        return theme.accent;
      case 'anchor':
        return theme.info;
      case 'template':
        return theme.warning;
      default:
        return theme.textSecondary;
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
      </Pressable>

      <Animated.View
        entering={SlideInDown.springify().damping(20)}
        exiting={SlideOutDown.springify().damping(20)}
        style={[
          styles.container,
          { backgroundColor: theme.background },
          Shadows.xl,
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: theme.surfaceElevated }]}>
            <Ionicons name="search" size={20} color={theme.secondary} />
          </View>
          <Text style={[styles.headerTitle, { color: theme.text, fontFamily: Typography.family.serif }]}>
            Omni-Search
          </Text>
          <Pressable onPress={handleClose} hitSlop={10}>
            <Ionicons name="close" size={24} color={theme.textSecondary} />
          </Pressable>
        </View>

        {/* Search Input */}
        <View style={[styles.searchContainer, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            ref={inputRef}
            style={[
              styles.searchInput,
              {
                color: theme.text,
                fontFamily: Typography.family.sans,
              },
            ]}
            placeholder="Search tasks, circles, anchors, templates..."
            placeholderTextColor={theme.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={10}>
              <Ionicons name="close-circle" size={20} color={theme.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Results */}
        <ScrollView
          style={styles.resultsContainer}
          contentContainerStyle={styles.resultsContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.secondary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Searching...
              </Text>
            </View>
          ) : results.length > 0 ? (
            results.map((result, index) => (
              <Animated.View
                key={result.id}
                entering={FadeIn.delay(index * 30)}
              >
                <Pressable
                  style={[
                    styles.resultItem,
                    { backgroundColor: theme.surfaceElevated, borderColor: theme.borderLight },
                  ]}
                  onPress={() => handleSelectResult(result)}
                >
                  <View style={[styles.resultIcon, { backgroundColor: getTypeColor(result.type) + '20' }]}>
                    <Ionicons
                      name={result.icon as any}
                      size={20}
                      color={getTypeColor(result.type)}
                    />
                  </View>
                  <View style={styles.resultContent}>
                    <Text style={[styles.resultTitle, { color: theme.text }]} numberOfLines={1}>
                      {result.title}
                    </Text>
                    {result.subtitle && (
                      <Text style={[styles.resultSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                        {result.subtitle}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.typeBadge, { backgroundColor: getTypeColor(result.type) + '15' }]}>
                    <Text style={[styles.typeText, { color: getTypeColor(result.type) }]}>
                      {result.type}
                    </Text>
                  </View>
                </Pressable>
              </Animated.View>
            ))
          ) : query.length > 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color={theme.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No results found</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Try a different search term
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="sparkles-outline" size={48} color={theme.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>Universal Search</Text>
              <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                Search across all your tasks, circles, anchor points, and templates
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Quick tips */}
        {!query && (
          <View style={[styles.tips, { borderTopColor: theme.borderLight }]}>
            <Text style={[styles.tipsTitle, { color: theme.textSecondary }]}>
              Pro tip: Pull down from any screen to search
            </Text>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    maxHeight: '80%',
    borderBottomLeftRadius: BorderRadius['2xl'],
    borderBottomRightRadius: BorderRadius['2xl'],
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.size.base,
    paddingVertical: Spacing.sm,
  },
  resultsContainer: {
    flex: 1,
    marginTop: Spacing.md,
  },
  resultsContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultContent: {
    flex: 1,
    gap: 2,
  },
  resultTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
  resultSubtitle: {
    fontSize: Typography.size.sm,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  typeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    textTransform: 'capitalize',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.size.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
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
    maxWidth: SCREEN_WIDTH - Spacing.xl * 4,
  },
  tips: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  tipsTitle: {
    fontSize: Typography.size.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
