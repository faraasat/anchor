// Enhanced Paywall Modal - Editorial-style Pro upgrade screen
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import type { PurchasesPackage } from 'react-native-purchases';
import { useTheme, useColorScheme } from '@/hooks/useColorScheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import {
  getMockOfferings,
  getOfferings,
  purchasePackage,
  restorePurchases,
} from '@/utils/revenueCat';

interface EnhancedPaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onPurchaseComplete: () => void;
}

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
  isPro: boolean;
}

function FeatureItem({ icon, title, description, isPro }: FeatureItemProps) {
  const theme = useTheme();

  return (
    <Animated.View
      entering={FadeInDown.duration(300)}
      style={[styles.featureItem, { backgroundColor: theme.surfaceElevated }]}
    >
      <View style={[styles.featureIcon, { backgroundColor: theme.secondary }]}>
        <Ionicons name={icon as any} size={24} color="#FFFFFF" />
      </View>
      <View style={styles.featureContent}>
        <View style={styles.featureTitleRow}>
          <Text style={[styles.featureTitle, { color: theme.text }]}>{title}</Text>
          {isPro && (
            <View style={[styles.proBadge, { backgroundColor: theme.accent }]}>
              <Text style={styles.proBadgeText}>PRO</Text>
            </View>
          )}
        </View>
        <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
          {description}
        </Text>
      </View>
    </Animated.View>
  );
}

export function EnhancedPaywallModal({ visible, onClose, onPurchaseComplete }: EnhancedPaywallModalProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (visible) {
      loadOfferings();
    }
  }, [visible]);

  const loadOfferings = async () => {
    try {
      setLoading(true);
      const offerings = await getOfferings();
      const fallbackOfferings = getMockOfferings();
      const availablePackages = offerings?.availablePackages ?? fallbackOfferings.availablePackages;
      setPackages(availablePackages);

      // Auto-select annual package (best value)
      const annualPackage = availablePackages.find(
        (pkg) => pkg.identifier === '$rc_annual' || pkg.packageType === 'ANNUAL'
      );
      setSelectedPackage(annualPackage || availablePackages[0] || null);
    } catch (error) {
      console.error('Error loading offerings:', error);
      Alert.alert('Error', 'Failed to load subscription options');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    try {
      setPurchasing(true);

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const customerInfo = await purchasePackage(selectedPackage);

      // Check if user has pro entitlement
      if (customerInfo && customerInfo.entitlements.active['pro']) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }

        onPurchaseComplete();
        onClose();

        Alert.alert(
          '🎉 Welcome to Pro!',
          'You now have access to all premium features including True Sync, Advanced AI, and unlimited recurrence rules.'
        );
      }
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error('Purchase error:', error);
        Alert.alert('Purchase Failed', error.message || 'Unable to complete purchase');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setLoading(true);

      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const customerInfo = await restorePurchases();

      if (customerInfo && customerInfo.entitlements.active['pro']) {
        onPurchaseComplete();
        onClose();
        Alert.alert('Success', 'Your purchases have been restored');
      } else {
        Alert.alert('No Purchases', 'No active purchases found to restore');
      }
    } catch (error: any) {
      console.error('Restore error:', error);
      Alert.alert('Restore Failed', error.message || 'Unable to restore purchases');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (pkg: PurchasesPackage): string => {
    return pkg.product.priceString;
  };

  const formatPeriod = (pkg: PurchasesPackage): string => {
    if (pkg.identifier.includes('annual') || pkg.packageType === 'ANNUAL') {
      return 'year';
    } else if (pkg.identifier.includes('monthly') || pkg.packageType === 'MONTHLY') {
      return 'month';
    }
    return 'period';
  };

  const calculateSavings = (pkg: PurchasesPackage): string | null => {
    if (pkg.identifier.includes('annual') || pkg.packageType === 'ANNUAL') {
      // Assuming annual is 12 months at a discount
      return 'Save 40%';
    }
    return null;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <Animated.View
          entering={FadeIn.duration(300)}
          style={[
            styles.header,
            {
              paddingTop: insets.top + Spacing.md,
              backgroundColor: theme.background,
            },
          ]}
        >
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={28} color={theme.text} />
          </Pressable>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.hero}>
            <LinearGradient
              colors={[theme.secondary, theme.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            >
              <View style={styles.heroIcon}>
                <Ionicons name="diamond" size={48} color="#FFFFFF" />
              </View>
            </LinearGradient>

            <Text style={[styles.heroTitle, { color: theme.text }]}>Unlock Anchor Pro</Text>
            <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
              Experience clarity and control with professional-grade productivity tools
            </Text>
          </Animated.View>

          {/* Features Grid */}
          <View style={styles.featuresSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Pro Features</Text>

            <FeatureItem
              icon="sync"
              title="True Sync"
              description="Real-time sync across all your devices. Dismiss or snooze on one device, it updates everywhere instantly."
              isPro
            />

            <FeatureItem
              icon="repeat"
              title="Advanced Recurrence"
              description="Complex recurring rules: 2nd Tuesday of every month, last Friday, every 3 weeks, and more."
              isPro
            />

            <FeatureItem
              icon="sparkles"
              title="AI-Powered Context"
              description="Weather-aware reminders, traffic notifications, and smart snooze suggestions based on your calendar."
              isPro
            />

            <FeatureItem
              icon="link"
              title="Conditional Reminders"
              description="Link tasks with dependencies. Task B triggers only when Task A is complete."
              isPro
            />

            <FeatureItem
              icon="location"
              title="Smart Location Triggers"
              description="Category-based POI triggers: 'Near any supermarket' instead of specific addresses."
              isPro
            />

            <FeatureItem
              icon="fitness"
              title="Wellness Tools"
              description="Pedometer, water tracker, Pomodoro timer with progress tracking and micro-reminders."
              isPro
            />
          </View>

          {/* Social Proof */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={[styles.socialProof, { backgroundColor: theme.surfaceElevated }]}
          >
            <Text style={[styles.socialProofText, { color: theme.textSecondary }]}>
              "Anchor Pro transformed my productivity. The AI context and True Sync are game-changers."
            </Text>
            <Text style={[styles.socialProofAuthor, { color: theme.textMuted }]}>
              - Sarah K., Product Manager
            </Text>
          </Animated.View>
        </ScrollView>

        {/* Pricing Footer */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          style={[
            styles.footer,
            {
              paddingBottom: insets.bottom + Spacing.lg,
              backgroundColor: theme.background,
            },
            Shadows.xl,
          ]}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.secondary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Loading plans...
              </Text>
            </View>
          ) : (
            <>
              {/* Package Selection */}
              <View style={styles.packagesContainer}>
                {packages.map((pkg) => {
                  const isSelected = selectedPackage?.identifier === pkg.identifier;
                  const savings = calculateSavings(pkg);

                  return (
                    <Pressable
                      key={pkg.identifier}
                      onPress={() => {
                        setSelectedPackage(pkg);
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                      style={[
                        styles.packageCard,
                        {
                          backgroundColor: isSelected
                            ? theme.secondary
                            : theme.surfaceElevated,
                          borderColor: isSelected ? theme.secondary : theme.border,
                        },
                      ]}
                    >
                      {savings && (
                        <View style={styles.savingsBadge}>
                          <Text style={styles.savingsBadgeText}>{savings}</Text>
                        </View>
                      )}
                      <View style={styles.packageContent}>
                        <Text
                          style={[
                            styles.packagePeriod,
                            { color: isSelected ? '#FFFFFF' : theme.text },
                          ]}
                        >
                          {formatPeriod(pkg) === 'year' ? 'Annual' : 'Monthly'}
                        </Text>
                        <Text
                          style={[
                            styles.packagePrice,
                            { color: isSelected ? '#FFFFFF' : theme.text },
                          ]}
                        >
                          {formatPrice(pkg)}
                        </Text>
                        <Text
                          style={[
                            styles.packagePer,
                            { color: isSelected ? 'rgba(255,255,255,0.8)' : theme.textMuted },
                          ]}
                        >
                          per {formatPeriod(pkg)}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.checkmark}>
                          <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              {/* Purchase Button */}
              <Pressable
                onPress={handlePurchase}
                disabled={!selectedPackage || purchasing}
                style={[
                  styles.purchaseButton,
                  {
                    backgroundColor: theme.secondary,
                    opacity: !selectedPackage || purchasing ? 0.6 : 1,
                  },
                ]}
              >
                {purchasing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.purchaseButtonText}>Start Free Trial</Text>
                )}
              </Pressable>

              {/* Restore & Terms */}
              <View style={styles.footerLinks}>
                <Pressable onPress={handleRestore} hitSlop={10}>
                  <Text style={[styles.linkText, { color: theme.textSecondary }]}>
                    Restore Purchases
                  </Text>
                </Pressable>
                <Text style={[styles.termsText, { color: theme.textMuted }]}>
                  7-day free trial, then {selectedPackage && formatPrice(selectedPackage)}
                  /{selectedPackage && formatPeriod(selectedPackage)}. Cancel anytime.
                </Text>
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  hero: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  heroGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    fontSize: Typography.size.base,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
  },
  featuresSection: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureContent: {
    flex: 1,
  },
  featureTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
  proBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  proBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: Typography.weight.bold,
  },
  featureDescription: {
    fontSize: Typography.size.sm,
    lineHeight: 20,
  },
  socialProof: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
  },
  socialProofText: {
    fontSize: Typography.size.base,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  socialProofAuthor: {
    fontSize: Typography.size.sm,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: Typography.size.sm,
  },
  packagesContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  packageCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    position: 'relative',
  },
  savingsBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  savingsBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: Typography.weight.bold,
  },
  packageContent: {
    alignItems: 'center',
  },
  packagePeriod: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    marginBottom: 4,
  },
  packagePrice: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    marginBottom: 2,
  },
  packagePer: {
    fontSize: Typography.size.xs,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  purchaseButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  footerLinks: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  linkText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  termsText: {
    fontSize: Typography.size.xs,
    textAlign: 'center',
    lineHeight: 16,
  },
});
