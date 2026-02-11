// Anchor Points Screen - Physical trigger management (NFC & Bluetooth)
// Phase 1: Premium UI for environmental awareness
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';
import { AnchorPointsService, AnchorPoint } from '@/services/AnchorPointsService';

export default function AnchorsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [anchorPoints, setAnchorPoints] = useState<AnchorPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nfcSupported, setNfcSupported] = useState(false);
  const [bluetoothSupported, setBluetoothSupported] = useState(false);

  useEffect(() => {
    if (user) {
      checkHardwareSupport();
      loadAnchorPoints();
    }
  }, [user]);

  const checkHardwareSupport = async () => {
    const nfc = await AnchorPointsService.isNFCSupported();
    const bluetooth = await AnchorPointsService.isBluetoothSupported();
    setNfcSupported(nfc);
    setBluetoothSupported(bluetooth);
  };

  const loadAnchorPoints = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const points = await AnchorPointsService.getAll(user.id);
      setAnchorPoints(points);
    } catch (error) {
      console.error('Error loading anchor points:', error);
      Alert.alert('Error', 'Failed to load anchor points');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAnchorPoints();
    setRefreshing(false);
  }, [user]);

  const handleToggleEnabled = async (point: AnchorPoint) => {
    if (!user) return;

    try {
      await AnchorPointsService.update(user.id, point.id, {
        enabled: !point.enabled,
      });

      if (!point.enabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      await loadAnchorPoints();
    } catch (error) {
      Alert.alert('Error', 'Failed to update anchor point');
    }
  };

  const handleDelete = async (point: AnchorPoint) => {
    if (!user) return;

    Alert.alert('Delete Anchor Point', `Are you sure you want to delete "${point.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await AnchorPointsService.delete(user.id, point.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await loadAnchorPoints();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete anchor point');
          }
        },
      },
    ]);
  };

  const handleAddNFC = async () => {
    if (!user) return;

    if (!nfcSupported) {
      Alert.alert('NFC Not Supported', 'NFC is not available on this device');
      return;
    }

    // Scan NFC tag
    const tag = await AnchorPointsService.scanNFCTag();

    if (tag) {
      // Create new anchor point
      try {
        await AnchorPointsService.create(user.id, {
          name: 'New NFC Tag',
          type: 'nfc',
          icon: '🏷️',
          description: 'Tap to configure',
          enabled: true,
          nfcUid: tag.uid,
          actionType: 'notification',
          notificationMessage: 'NFC tag scanned!',
        });

        await loadAnchorPoints();
      } catch (error) {
        Alert.alert('Error', 'Failed to create NFC anchor');
      }
    }
  };

  const handleAddBluetooth = async () => {
    if (!user) return;

    if (!bluetoothSupported) {
      Alert.alert('Bluetooth Not Supported', 'Bluetooth is not available on this device');
      return;
    }

    // Scan for Bluetooth devices
    const devices = await AnchorPointsService.scanBluetoothDevices();

    if (devices.length > 0) {
      // Show device picker (simplified - in production use a modal)
      Alert.alert(
        'Select Device',
        'Choose a Bluetooth device',
        devices.map((device) => ({
          text: `${device.name} (${device.rssi} dBm)`,
          onPress: async () => {
            try {
              await AnchorPointsService.create(user.id, {
                name: device.name,
                type: 'bluetooth',
                icon: '📡',
                description: 'Triggers when connected',
                enabled: true,
                bluetoothDeviceId: device.id,
                bluetoothDeviceName: device.name,
                actionType: 'notification',
                notificationMessage: `Connected to ${device.name}`,
              });

              await loadAnchorPoints();
            } catch (error) {
              Alert.alert('Error', 'Failed to create Bluetooth anchor');
            }
          },
        }))
      );
    } else {
      Alert.alert('No Devices Found', 'No Bluetooth devices detected nearby');
    }
  };

  const renderAnchorCard = (point: AnchorPoint, index: number) => {
    const isNFC = point.type === 'nfc';

    return (
      <Animated.View
        key={point.id}
        entering={FadeInDown.delay(index * 50).springify()}
        style={[
          styles.anchorCard,
          {
            backgroundColor: theme.surface,
            borderColor: point.enabled ? theme.secondary : theme.border,
          },
          Shadows.md,
        ]}
      >
        {/* Ambient glow for enabled anchors */}
        {point.enabled && (
          <View style={[styles.anchorGlow, { backgroundColor: theme.anchorHighlight }]} />
        )}

        <View style={styles.anchorHeader}>
          <View style={styles.anchorLeft}>
            <View
              style={[
                styles.anchorIconContainer,
                {
                  backgroundColor: point.enabled ? theme.secondary + '20' : theme.surfaceElevated,
                },
              ]}
            >
              <Text style={styles.anchorIcon}>{point.icon}</Text>
            </View>
            <View style={styles.anchorInfo}>
              <Text style={[styles.anchorName, { color: theme.text }]}>{point.name}</Text>
              <View style={styles.anchorMeta}>
                <View style={[styles.typeBadge, { backgroundColor: isNFC ? '#E0F2FE' : '#FEE2E2' }]}>
                  <Ionicons
                    name={isNFC ? 'radio' : 'bluetooth'}
                    size={12}
                    color={isNFC ? '#0284C7' : '#DC2626'}
                  />
                  <Text style={[styles.typeBadgeText, { color: isNFC ? '#0284C7' : '#DC2626' }]}>
                    {isNFC ? 'NFC' : 'Bluetooth'}
                  </Text>
                </View>
                {point.lastTriggered && (
                  <Text style={[styles.lastTriggered, { color: theme.textMuted }]}>
                    {formatLastTriggered(point.lastTriggered)}
                  </Text>
                )}
              </View>
            </View>
          </View>

          <Pressable
            style={[
              styles.enableToggle,
              {
                backgroundColor: point.enabled ? theme.secondary : theme.border,
              },
            ]}
            onPress={() => handleToggleEnabled(point)}
          >
            <Ionicons name={point.enabled ? 'checkmark' : 'close'} size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        {point.description && (
          <Text style={[styles.anchorDescription, { color: theme.textSecondary }]}>
            {point.description}
          </Text>
        )}

        <View style={styles.anchorStats}>
          <View style={styles.statItem}>
            <Ionicons name="flash" size={14} color={theme.accent} />
            <Text style={[styles.statText, { color: theme.textSecondary }]}>
              {point.triggerCount} triggers
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="notifications" size={14} color={theme.secondary} />
            <Text style={[styles.statText, { color: theme.textSecondary }]}>
              {point.actionType.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <View style={styles.anchorActions}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: theme.surfaceElevated }]}
            onPress={() => Alert.alert('Edit', 'Edit functionality coming soon')}
          >
            <Ionicons name="pencil" size={16} color={theme.textSecondary} />
            <Text style={[styles.actionButtonText, { color: theme.text }]}>Edit</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: theme.error + '15' }]}
            onPress={() => handleDelete(point)}
          >
            <Ionicons name="trash" size={16} color={theme.error} />
            <Text style={[styles.actionButtonText, { color: theme.error }]}>Delete</Text>
          </Pressable>
        </View>
      </Animated.View>
    );
  };

  const formatLastTriggered = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const nfcAnchors = anchorPoints.filter((p) => p.type === 'nfc');
  const bluetoothAnchors = anchorPoints.filter((p) => p.type === 'bluetooth');

  if (isLoading && anchorPoints.length === 0) {
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
          <Text style={[styles.headerTitle, { color: theme.textInverse }]}>Anchor Points</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textInverse }]}>
            Physical-world triggers for your reminders
          </Text>
        </Animated.View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.secondary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading anchor points...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Premium Header */}
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
        <Text style={[styles.headerTitle, { color: theme.textInverse }]}>Anchor Points</Text>
        <Text style={[styles.headerSubtitle, { color: theme.textInverse }]}>
          Physical-world triggers for your reminders
        </Text>

        {/* Hardware Status */}
        <View style={styles.hardwareStatus}>
          <View style={styles.hardwareItem}>
            <Ionicons
              name={nfcSupported ? 'radio' : 'radio-outline'}
              size={16}
              color={theme.textInverse}
            />
            <Text style={[styles.hardwareText, { color: theme.textInverse }]}>
              NFC: {nfcSupported ? 'Ready' : 'Not Available'}
            </Text>
          </View>
          <View style={styles.hardwareItem}>
            <Ionicons
              name={bluetoothSupported ? 'bluetooth' : 'bluetooth-outline'}
              size={16}
              color={theme.textInverse}
            />
            <Text style={[styles.hardwareText, { color: theme.textInverse }]}>
              Bluetooth: {bluetoothSupported ? 'Ready' : 'Not Available'}
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.secondary}
            colors={[theme.secondary]}
          />
        }
      >
        {/* Quick Add Buttons */}
        <View style={styles.quickAddSection}>
          <Pressable
            style={[
              styles.quickAddButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
              Shadows.md,
              !nfcSupported && styles.quickAddButtonDisabled,
            ]}
            onPress={handleAddNFC}
            disabled={!nfcSupported}
          >
            <View style={[styles.quickAddIcon, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="radio" size={28} color="#0284C7" />
            </View>
            <Text style={[styles.quickAddTitle, { color: theme.text }]}>Add NFC Tag</Text>
            <Text style={[styles.quickAddSubtitle, { color: theme.textMuted }]}>
              {nfcSupported ? 'Tap to scan' : 'Not available'}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.quickAddButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
              Shadows.md,
              !bluetoothSupported && styles.quickAddButtonDisabled,
            ]}
            onPress={handleAddBluetooth}
            disabled={!bluetoothSupported}
          >
            <View style={[styles.quickAddIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="bluetooth" size={28} color="#DC2626" />
            </View>
            <Text style={[styles.quickAddTitle, { color: theme.text }]}>Add Bluetooth</Text>
            <Text style={[styles.quickAddSubtitle, { color: theme.textMuted }]}>
              {bluetoothSupported ? 'Scan devices' : 'Not available'}
            </Text>
          </Pressable>
        </View>

        {/* Empty State */}
        {anchorPoints.length === 0 ? (
          <Animated.View entering={FadeIn.delay(200)} style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏷️</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No Anchor Points Yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              Create your first physical trigger by adding an NFC tag or Bluetooth device
            </Text>
          </Animated.View>
        ) : (
          <>
            {/* NFC Section */}
            {nfcAnchors.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="radio" size={20} color={theme.secondary} />
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    NFC Tags ({nfcAnchors.length})
                  </Text>
                </View>
                {nfcAnchors.map((point, index) => renderAnchorCard(point, index))}
              </View>
            )}

            {/* Bluetooth Section */}
            {bluetoothAnchors.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="bluetooth" size={20} color={theme.secondary} />
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    Bluetooth Devices ({bluetoothAnchors.length})
                  </Text>
                </View>
                {bluetoothAnchors.map((point, index) => renderAnchorCard(point, index))}
              </View>
            )}
          </>
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
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.extrabold,
    marginBottom: Spacing.xs,
    letterSpacing: Typography.letterSpacing.tight,
  },
  headerSubtitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
    opacity: 0.9,
    marginBottom: Spacing.lg,
  },
  hardwareStatus: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  hardwareItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  hardwareText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xl,
  },
  quickAddSection: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickAddButton: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quickAddButtonDisabled: {
    opacity: 0.5,
  },
  quickAddIcon: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAddTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
  },
  quickAddSubtitle: {
    fontSize: Typography.size.xs,
  },
  section: {
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  anchorCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 2,
    gap: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  anchorGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.3,
  },
  anchorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 1,
  },
  anchorLeft: {
    flexDirection: 'row',
    gap: Spacing.md,
    flex: 1,
  },
  anchorIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  anchorIcon: {
    fontSize: 24,
  },
  anchorInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  anchorName: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
  },
  anchorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  typeBadgeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  lastTriggered: {
    fontSize: Typography.size.xs,
  },
  enableToggle: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  anchorDescription: {
    fontSize: Typography.size.sm,
    lineHeight: Typography.size.sm * Typography.lineHeight.normal,
  },
  anchorStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statText: {
    fontSize: Typography.size.xs,
  },
  anchorActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  actionButtonText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['5xl'],
    gap: Spacing.md,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  emptySubtitle: {
    fontSize: Typography.size.base,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: Typography.size.base * Typography.lineHeight.relaxed,
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
});
