// Premium Paywall Modal with Beautiful Design
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import {
  getMockOfferings,
  purchasePackage,
  restorePurchases,
  getProFeatures,
} from '@/utils/revenueCat';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  onPurchaseComplete?: () => void;
}

interface Feature {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const PRO_FEATURES: Feature[] = [
  {
    icon: 'cloud-done',
    title: 'Cross-Platform Sync',
    description: 'Seamlessly sync across all your devices',
  },
  {
    icon: 'sparkles',
    title: 'Advanced AI Features',
    description: 'Smart time suggestions and contextual triggers',
  },
  {
    icon: 'infinite',
    title: 'Unlimited Reminders',
    description: 'Create as many reminders as you need',
  },
  {
    icon: 'color-palette',
    title: 'Custom Themes',
    description: 'Personalize your experience with custom colors',
  },
  {
    icon: 'headset',
    title: 'Priority Support',
    description: 'Get help when you need it most',
  },
];

export function PaywallModal({ visible, onClose, onPurchaseComplete }: PaywallModalProps) {
  const theme = useTheme();
  const [selectedPackage, setSelectedPackage] = useState<'monthly' | 'annual'>('annual');
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const offerings = getMockOfferings();
  const monthlyPackage = offerings.availablePackages[0];
  const annualPackage = offerings.availablePackages[1];

  const monthlySavings = 0;
  const annualSavings = Math.round(((monthlyPackage.product.price * 12 - annualPackage.product.price) / (monthlyPackage.product.price * 12)) * 100);

  const handlePurchase = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsLoading(true);

    // Mock purchase for demonstration
    setTimeout(() => {
      setIsLoading(false);
      onPurchaseComplete?.();
      onClose();
    }, 1500);

    /* Real implementation:
    const pkg = selectedPackage === 'monthly' ? monthlyPackage : annualPackage;
    const customerInfo = await purchasePackage(pkg);
    setIsLoading(false);

    if (customerInfo?.entitlements.active['pro']) {
      onPurchaseComplete?.();
      onClose();
    }
    */
  };

  const handleRestore = async () => {
    setIsRestoring(true);

    // Mock restore
    setTimeout(() => {
      setIsRestoring(false);
    }, 1000);

    /* Real implementation:
    const customerInfo = await restorePurchases();
    setIsRestoring(false);

    if (customerInfo?.entitlements.active['pro']) {
      onPurchaseComplete?.();
      onClose();
    }
    */
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <LinearGradient
          colors={[theme.secondary, theme.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={28} color={theme.textInverse} />
            </Pressable>

            <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.headerContent}>
              <View style={styles.proIconContainer}>
                <Ionicons name="diamond" size={48} color={theme.textInverse} />
              </View>
              <Text style={[styles.headerTitle, { color: theme.textInverse }]}>
                Upgrade to Pro
              </Text>
              <Text style={[styles.headerSubtitle, { color: theme.textInverse }]}>
                Unlock the full power of Anchor
              </Text>
            </Animated.View>
          </Animated.View>
        </LinearGradient>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Features List */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.featuresSection}>
            {PRO_FEATURES.map((feature, index) => (
              <Animated.View
                key={feature.title}
                entering={FadeInDown.delay(300 + index * 50).duration(400)}
                style={[styles.featureItem, { backgroundColor: theme.cardBackground }, Shadows.sm]}
              >
                <View style={[styles.featureIcon, { backgroundColor: theme.secondary + '20' }]}>
                  <Ionicons name={feature.icon} size={24} color={theme.secondary} />
                </View>
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: theme.text }]}>{feature.title}</Text>
                  <Text style={[styles.featureDescription, { color: theme.textSecondary }]}>
                    {feature.description}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          {/* Pricing Plans */}
          <Animated.View entering={FadeInDown.delay(600).duration(400)} style={styles.pricingSection}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Choose Your Plan</Text>

            {/* Annual Plan */}
            <Pressable
              onPress={() => {
                setSelectedPackage('annual');
                if (Platform.OS !== 'web') {
                  Haptics.selectionAsync();
                }
              }}
              style={[
                styles.planCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: selectedPackage === 'annual' ? theme.secondary : theme.border,
                  borderWidth: selectedPackage === 'annual' ? 2 : 1,
                },
                selectedPackage === 'annual' && Shadows.md,
              ]}
            >
              {annualSavings > 0 && (
                <View style={[styles.savingsBadge, { backgroundColor: theme.success }]}>
                  <Text style={styles.savingsBadgeText}>Save {annualSavings}%</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View>
                  <Text style={[styles.planTitle, { color: theme.text }]}>Annual</Text>
                  <Text style={[styles.planPrice, { color: theme.text }]}>
                    {annualPackage.product.priceString}
                    <Text style={[styles.planPeriod, { color: theme.textSecondary }]}>/year</Text>
                  </Text>
                  <Text style={[styles.planMonthly, { color: theme.textSecondary }]}>
                    ${(annualPackage.product.price / 12).toFixed(2)}/month
                  </Text>
                </View>

                <View
                  style={[
                    styles.radioButton,
                    {
                      borderColor: selectedPackage === 'annual' ? theme.secondary : theme.border,
                      backgroundColor: selectedPackage === 'annual' ? theme.secondary : 'transparent',
                    },
                  ]}
                >
                  {selectedPackage === 'annual' && (
                    <Ionicons name="checkmark" size={18} color={theme.textInverse} />
                  )}
                </View>
              </View>
            </Pressable>

            {/* Monthly Plan */}
            <Pressable
              onPress={() => {
                setSelectedPackage('monthly');
                if (Platform.OS !== 'web') {
                  Haptics.selectionAsync();
                }
              }}
              style={[
                styles.planCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: selectedPackage === 'monthly' ? theme.secondary : theme.border,
                  borderWidth: selectedPackage === 'monthly' ? 2 : 1,
                },
                selectedPackage === 'monthly' && Shadows.md,
              ]}
            >
              <View style={styles.planHeader}>
                <View>
                  <Text style={[styles.planTitle, { color: theme.text }]}>Monthly</Text>
                  <Text style={[styles.planPrice, { color: theme.text }]}>
                    {monthlyPackage.product.priceString}
                    <Text style={[styles.planPeriod, { color: theme.textSecondary }]}>/month</Text>
                  </Text>
                </View>

                <View
                  style={[
                    styles.radioButton,
                    {
                      borderColor: selectedPackage === 'monthly' ? theme.secondary : theme.border,
                      backgroundColor: selectedPackage === 'monthly' ? theme.secondary : 'transparent',
                    },
                  ]}
                >
                  {selectedPackage === 'monthly' && (
                    <Ionicons name="checkmark" size={18} color={theme.textInverse} />
                  )}
                </View>
              </View>
            </Pressable>
          </Animated.View>

          {/* Subscribe Button */}
          <Animated.View entering={FadeInDown.delay(700).duration(400)}>
            <Pressable
              onPress={handlePurchase}
              disabled={isLoading}
              style={[
                styles.subscribeButton,
                { backgroundColor: theme.secondary },
                Shadows.lg,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.textInverse} />
              ) : (
                <Text style={[styles.subscribeButtonText, { color: theme.textInverse }]}>
                  Start Your Free Trial
                </Text>
              )}
            </Pressable>

            <Text style={[styles.trialText, { color: theme.textMuted }]}>
              7-day free trial, then {selectedPackage === 'annual' ? annualPackage.product.priceString : monthlyPackage.product.priceString}
            </Text>
          </Animated.View>

          {/* Restore Purchases */}
          <Pressable onPress={handleRestore} disabled={isRestoring} style={styles.restoreButton}>
            {isRestoring ? (
              <ActivityIndicator size="small" color={theme.textSecondary} />
            ) : (
              <Text style={[styles.restoreButtonText, { color: theme.textSecondary }]}>
                Restore Purchases
              </Text>
            )}
          </Pressable>

          {/* Footer */}
          <Text style={[styles.footerText, { color: theme.textMuted }]}>
            Cancel anytime. Subscription automatically renews unless canceled.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing['3xl'],
  },
  header: {
    paddingHorizontal: Spacing.lg,
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  proIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.sm,
  },
  headerSubtitle: {
    fontSize: Typography.size.md,
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing['4xl'],
  },
  featuresSection: {
    gap: Spacing.md,
    marginBottom: Spacing['3xl'],
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: Typography.size.sm,
  },
  pricingSection: {
    marginBottom: Spacing['2xl'],
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.lg,
  },
  planCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    position: 'relative',
  },
  savingsBadge: {
    position: 'absolute',
    top: -8,
    right: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  savingsBadgeText: {
    color: '#FFFFFF',
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.xs,
  },
  planPrice: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
  },
  planPeriod: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.normal,
  },
  planMonthly: {
    fontSize: Typography.size.sm,
    marginTop: 2,
  },
  radioButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscribeButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  subscribeButtonText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
  },
  trialText: {
    textAlign: 'center',
    fontSize: Typography.size.sm,
    marginBottom: Spacing.xl,
  },
  restoreButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  restoreButtonText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  footerText: {
    textAlign: 'center',
    fontSize: Typography.size.xs,
    lineHeight: 16,
  },
});
