// Phase 6: The First Anchor - Immersive Onboarding Experience
// Guided meditation-style onboarding with AI personality selection
import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeEngine } from '@/contexts/ThemeEngineContext';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/theme';

export type AIPersonality = 'minimalist' | 'warm' | 'professional';

interface OnboardingFlowProps {
  visible: boolean;
  onComplete: (personality: AIPersonality, anchorName: string) => void;
  onSkip: () => void;
}

interface OnboardingStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to Anchor',
    subtitle: 'Your Premium Digital Journal',
    description:
      'Anchor helps you stay focused on what matters by connecting your tasks to the physical spaces and moments of your day.',
    icon: 'flower-outline',
  },
  {
    id: 2,
    title: 'Physical Anchors',
    subtitle: 'Context-Aware Reminders',
    description:
      'Set up anchor points using Wi-Fi, Bluetooth, or NFC. Your tasks appear exactly when and where you need them.',
    icon: 'radio-outline',
  },
  {
    id: 3,
    title: 'AI-Powered Briefings',
    subtitle: 'Intelligent Daily Guidance',
    description:
      'Start each day with a personalized briefing that adapts to your schedule, location, and priorities.',
    icon: 'sparkles-outline',
  },
];

const AI_PERSONALITIES: {
  id: AIPersonality;
  name: string;
  description: string;
  example: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}[] = [
  {
    id: 'minimalist',
    name: 'Minimalist & Direct',
    description: 'Concise, focused, no fluff',
    example: '"You have 3 tasks. Start with the report."',
    icon: 'remove-outline',
  },
  {
    id: 'warm',
    name: 'Warm & Encouraging',
    description: 'Supportive, friendly, motivating',
    example: '"Good morning! Ready to tackle your day? Let\'s start with that report."',
    icon: 'heart-outline',
  },
  {
    id: 'professional',
    name: 'Professional & Precise',
    description: 'Formal, detailed, structured',
    example:
      '"Good morning. Today\'s priorities include: 1) Complete quarterly report (due 3 PM)..."',
    icon: 'briefcase-outline',
  },
];

export function OnboardingFlow({ visible, onComplete, onSkip }: OnboardingFlowProps) {
  const { theme } = useThemeEngine();
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPersonality, setSelectedPersonality] = useState<AIPersonality | null>(null);
  const [anchorName, setAnchorName] = useState('Home');
  const scrollViewRef = useRef<ScrollView>(null);

  const progress = useSharedValue(0);

  const handleNext = useCallback(() => {
    if (currentStep < ONBOARDING_STEPS.length) {
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
      setCurrentStep(currentStep + 1);
      progress.value = withSpring((currentStep + 1) / ONBOARDING_STEPS.length);
    }
  }, [currentStep, progress]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      if (Platform.OS !== 'web') {
        Haptics.selectionAsync();
      }
      setCurrentStep(currentStep - 1);
      progress.value = withSpring((currentStep - 1) / ONBOARDING_STEPS.length);
    }
  }, [currentStep, progress]);

  const handlePersonalitySelect = useCallback(
    (personality: AIPersonality) => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setSelectedPersonality(personality);
    },
    []
  );

  const handleComplete = useCallback(() => {
    if (selectedPersonality) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onComplete(selectedPersonality, anchorName);
    }
  }, [selectedPersonality, anchorName, onComplete]);

  const progressBarStyle = useAnimatedStyle(() => {
    return {
      width: `${progress.value * 100}%`,
    };
  });

  const isLastStep = currentStep === ONBOARDING_STEPS.length;
  const canProceed = isLastStep ? selectedPersonality !== null : true;

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <LinearGradient
        colors={
          theme.timeOfDay === 'night'
            ? ['#000000', '#0A0A0A', '#000000']
            : ['#FFFEF9', '#FFF5EB', '#FFFEF9']
        }
        style={styles.container}
      >
        {/* Skip Button */}
        <Pressable
          style={[styles.skipButton, { top: insets.top + Spacing.md }]}
          onPress={onSkip}
          hitSlop={10}
        >
          <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip</Text>
        </Pressable>

        {/* Progress Bar */}
        <View style={[styles.progressContainer, { top: insets.top + 60 }]}>
          <View style={[styles.progressTrack, { backgroundColor: theme.borderLight }]}>
            <Animated.View
              style={[
                styles.progressBar,
                { backgroundColor: theme.secondary },
                progressBarStyle,
              ]}
            />
          </View>
        </View>

        {/* Content */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 120, paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {!isLastStep ? (
            <Animated.View
              key={`step-${currentStep}`}
              entering={SlideInRight.springify().damping(18)}
              exiting={SlideOutLeft.duration(200)}
              style={styles.stepContainer}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: theme.secondary + '15' },
                  Shadows.ambient,
                ]}
              >
                <Ionicons
                  name={ONBOARDING_STEPS[currentStep].icon}
                  size={48}
                  color={theme.secondary}
                />
              </View>

              <Text
                style={[
                  styles.stepTitle,
                  {
                    color: theme.text,
                    fontWeight: Typography.weight.bold,
                  },
                ]}
              >
                {ONBOARDING_STEPS[currentStep].title}
              </Text>

              <Text
                style={[
                  styles.stepSubtitle,
                  {
                    color: theme.accent,
                    fontWeight: Typography.weight.semibold,
                  },
                ]}
              >
                {ONBOARDING_STEPS[currentStep].subtitle}
              </Text>

              <Text
                style={[
                  styles.stepDescription,
                  {
                    color: theme.textSecondary,
                    fontWeight: Typography.weight.normal,
                  },
                ]}
              >
                {ONBOARDING_STEPS[currentStep].description}
              </Text>
            </Animated.View>
          ) : (
            <Animated.View
              key="personality-selector"
              entering={FadeIn.duration(400)}
              style={styles.personalityContainer}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: theme.accent + '15' },
                  Shadows.ambient,
                ]}
              >
                <Ionicons name="sparkles" size={48} color={theme.accent} />
              </View>

              <Text
                style={[
                  styles.stepTitle,
                  {
                    color: theme.text,
                    fontWeight: Typography.weight.bold,
                  },
                ]}
              >
                Choose Your AI Voice
              </Text>

              <Text
                style={[
                  styles.stepDescription,
                  {
                    color: theme.textSecondary,
                    fontWeight: Typography.weight.normal,
                    marginBottom: Spacing.xl,
                  },
                ]}
              >
                Select the tone for your Daily Briefings. You can change this anytime in settings.
              </Text>

              {AI_PERSONALITIES.map((personality) => (
                <Pressable
                  key={personality.id}
                  style={[
                    styles.personalityCard,
                    {
                      backgroundColor:
                        selectedPersonality === personality.id
                          ? theme.anchorHighlight
                          : theme.surface,
                      borderColor:
                        selectedPersonality === personality.id ? theme.secondary : theme.border,
                      borderWidth: selectedPersonality === personality.id ? 2 : 1,
                    },
                    Shadows.md,
                  ]}
                  onPress={() => handlePersonalitySelect(personality.id)}
                >
                  <View style={styles.personalityHeader}>
                    <Ionicons
                      name={personality.icon}
                      size={24}
                      color={
                        selectedPersonality === personality.id
                          ? theme.secondary
                          : theme.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.personalityName,
                        {
                          color:
                            selectedPersonality === personality.id ? theme.text : theme.text,
                          fontWeight: Typography.weight.semibold,
                        },
                      ]}
                    >
                      {personality.name}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.personalityDescription,
                      { color: theme.textSecondary },
                    ]}
                  >
                    {personality.description}
                  </Text>
                  <View
                    style={[
                      styles.exampleContainer,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Text
                      style={[
                        styles.exampleText,
                        {
                          color: theme.textSecondary,
                          fontStyle: 'italic',
                        },
                      ]}
                    >
                      {personality.example}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </Animated.View>
          )}
        </ScrollView>

        {/* Navigation Buttons */}
        <View
          style={[
            styles.navigationContainer,
            { paddingBottom: insets.bottom + Spacing.lg },
          ]}
        >
          <BlurView
            intensity={Platform.OS === 'ios' ? 90 : 70}
            tint={theme.timeOfDay === 'night' ? 'dark' : 'light'}
            style={styles.navigationBlur}
          >
            <View style={styles.navigationButtons}>
              {currentStep > 0 && (
                <Pressable
                  style={[
                    styles.navButton,
                    styles.backButton,
                    { borderColor: theme.border },
                  ]}
                  onPress={handleBack}
                >
                  <Ionicons name="arrow-back" size={20} color={theme.text} />
                  <Text style={[styles.navButtonText, { color: theme.text }]}>Back</Text>
                </Pressable>
              )}

              <Pressable
                style={[
                  styles.navButton,
                  styles.nextButton,
                  {
                    backgroundColor: canProceed ? theme.secondary : theme.border,
                    marginLeft: currentStep === 0 ? 'auto' : 0,
                  },
                  Shadows.md,
                ]}
                onPress={isLastStep ? handleComplete : handleNext}
                disabled={!canProceed}
              >
                <Text style={[styles.navButtonText, { color: '#FFFFFF' }]}>
                  {isLastStep ? 'Get Started' : 'Next'}
                </Text>
                {!isLastStep && <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
              </Pressable>
            </View>
          </BlurView>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    right: Spacing.lg,
    zIndex: 10,
  },
  skipText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
  progressContainer: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 5,
  },
  progressTrack: {
    height: 3,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.xl,
  },
  stepContainer: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  stepTitle: {
    fontSize: Typography.size['3xl'],
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: Typography.size.lg,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: Typography.size.base,
    textAlign: 'center',
    lineHeight: Typography.size.base * Typography.lineHeight.relaxed,
    paddingHorizontal: Spacing.md,
  },
  personalityContainer: {
    gap: Spacing.md,
  },
  personalityCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
  },
  personalityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  personalityName: {
    fontSize: Typography.size.lg,
  },
  personalityDescription: {
    fontSize: Typography.size.sm,
    marginBottom: Spacing.md,
  },
  exampleContainer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  exampleText: {
    fontSize: Typography.size.sm,
    lineHeight: Typography.size.sm * Typography.lineHeight.normal,
  },
  navigationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navigationBlur: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
  },
  backButton: {
    flex: 1,
    borderWidth: 1,
  },
  nextButton: {
    flex: 1,
  },
  navButtonText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
});
