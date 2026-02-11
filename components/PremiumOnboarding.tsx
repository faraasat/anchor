// Premium Onboarding - Grand Tour with Lottie animations and AI lifestyle questions
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Dimensions,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useColorScheme';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { HapticPatternsService, HapticPattern } from '@/services/HapticPatternsService';
import { NewellAI } from '@/lib/groq';

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  animation: any; // Lottie animation source
  gradient: string[];
}

interface LifestyleQuestion {
  id: string;
  question: string;
  options: string[];
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

interface PremiumOnboardingProps {
  visible: boolean;
  onComplete: (answers: Record<string, string>) => void;
  onSkip: () => void;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Anchor',
    subtitle: 'Your intelligent companion for mindful productivity',
    animation: require('@/assets/lottie/flower-bloom.json'),
    gradient: ['#3B82F6', '#8B5CF6'],
  },
  {
    id: 'tasks',
    title: 'Anchor Your Tasks',
    subtitle: 'Link tasks to places, times, and routines that matter',
    animation: require('@/assets/lottie/checkmark.json'),
    gradient: ['#10B981', '#059669'],
  },
  {
    id: 'ai',
    title: 'AI-Powered Intelligence',
    subtitle: 'Smart suggestions that learn from your habits',
    animation: require('@/assets/lottie/sparkle.json'),
    gradient: ['#F59E0B', '#EF4444'],
  },
  {
    id: 'growth',
    title: 'Watch Your Garden Grow',
    subtitle: 'Visual progress that celebrates your achievements',
    animation: require('@/assets/lottie/star.json'),
    gradient: ['#EC4899', '#8B5CF6'],
  },
];

const LIFESTYLE_QUESTIONS: LifestyleQuestion[] = [
  {
    id: 'work_style',
    question: 'How do you primarily work?',
    options: ['Remote from home', 'Office-based', 'Hybrid', 'Student', 'Freelancer'],
    icon: 'briefcase',
  },
  {
    id: 'routine',
    question: 'What\'s your ideal daily rhythm?',
    options: ['Early bird (5-9 AM)', 'Morning person (9 AM-12 PM)', 'Afternoon flow (12-5 PM)', 'Night owl (5 PM+)'],
    icon: 'sunny',
  },
  {
    id: 'priorities',
    question: 'What matters most to you?',
    options: ['Career growth', 'Work-life balance', 'Health & wellness', 'Learning & skills', 'Personal projects'],
    icon: 'heart',
  },
];

export function PremiumOnboarding({ visible, onComplete, onSkip }: PremiumOnboardingProps) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();

  const [currentStep, setCurrentStep] = useState(0);
  const [showQuestions, setShowQuestions] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const animationRef = useRef<LottieView>(null);
  const progressValue = useSharedValue(0);

  const handleNext = () => {
    HapticPatternsService.playPattern(HapticPattern.TAP);

    if (currentStep < ONBOARDING_STEPS.length - 1) {
      progressValue.value = withSpring((currentStep + 1) / ONBOARDING_STEPS.length);
      setCurrentStep(currentStep + 1);
      animationRef.current?.play();
    } else {
      // Move to lifestyle questions
      setShowQuestions(true);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    HapticPatternsService.playPattern(HapticPattern.TAP);
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleFinish = async () => {
    setIsGenerating(true);
    HapticPatternsService.playPattern(HapticPattern.MAGIC_MOMENT);

    // Generate personalized task stacks using Newell AI
    try {
      const suggestion = await generateTaskSuggestions(answers);
      onComplete({ ...answers, aiSuggestions: suggestion });
    } catch (error) {
      console.error('Error generating suggestions:', error);
      onComplete(answers);
    }
  };

  const generateTaskSuggestions = async (userAnswers: Record<string, string>): Promise<string> => {
    const prompt = `Based on the following user preferences, suggest 3 initial task stacks they should create:
- Work Style: ${userAnswers.work_style || 'Not specified'}
- Routine: ${userAnswers.routine || 'Not specified'}
- Priorities: ${userAnswers.priorities || 'Not specified'}

Return a brief, friendly list of 3 task stack ideas, each on a new line starting with "•".`;

    try {
      const response = await NewellAI.chat({
        messages: [
          {
            role: 'system',
            content: 'You are a productivity coach helping users set up their Anchor app.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model: 'gpt-4o-mini',
      });

      return response;
    } catch (error) {
      return '• Morning Routine\n• Work Focus Time\n• Evening Wind-Down';
    }
  };

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const allQuestionsAnswered = LIFESTYLE_QUESTIONS.every((q) => answers[q.id]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.container}>
        {!showQuestions ? (
          // Onboarding Steps
          <Animated.View
            key={currentStep}
            entering={SlideInRight}
            exiting={SlideOutLeft}
            style={styles.stepContainer}
          >
            <LinearGradient
              colors={currentStepData.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            >
              {/* Skip button */}
              <Pressable style={styles.skipButton} onPress={onSkip}>
                <Text style={styles.skipText}>Skip</Text>
              </Pressable>

              {/* Progress bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <Animated.View style={[styles.progressBar, progressStyle]} />
                </View>
              </View>

              {/* Animation */}
              <View style={styles.animationContainer}>
                <LottieView
                  ref={animationRef}
                  source={currentStepData.animation}
                  style={styles.lottie}
                  autoPlay
                  loop
                />
              </View>

              {/* Content */}
              <View style={styles.content}>
                <Text style={styles.title}>{currentStepData.title}</Text>
                <Text style={styles.subtitle}>{currentStepData.subtitle}</Text>

                {/* Next button */}
                <Pressable style={styles.nextButton} onPress={handleNext}>
                  <Text style={styles.nextButtonText}>
                    {currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Next'}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </Pressable>
              </View>
            </LinearGradient>
          </Animated.View>
        ) : (
          // Lifestyle Questions
          <View style={[styles.questionsContainer, { backgroundColor: theme.background }]}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Animated.View entering={FadeIn.duration(500)}>
                <Text style={[styles.questionsTitle, { color: theme.text }]}>
                  Let's personalize Anchor for you
                </Text>
                <Text style={[styles.questionsSubtitle, { color: theme.textSecondary }]}>
                  Answer a few questions so we can suggest the perfect task stacks
                </Text>

                {LIFESTYLE_QUESTIONS.map((question, index) => (
                  <Animated.View
                    key={question.id}
                    entering={FadeIn.delay(index * 100).duration(400)}
                    style={styles.questionCard}
                  >
                    <View style={styles.questionHeader}>
                      <View
                        style={[
                          styles.questionIcon,
                          { backgroundColor: theme.secondary + '20' },
                        ]}
                      >
                        <Ionicons name={question.icon} size={24} color={theme.secondary} />
                      </View>
                      <Text style={[styles.questionText, { color: theme.text }]}>
                        {question.question}
                      </Text>
                    </View>

                    <View style={styles.optionsContainer}>
                      {question.options.map((option) => {
                        const isSelected = answers[question.id] === option;
                        return (
                          <Pressable
                            key={option}
                            style={[
                              styles.optionButton,
                              {
                                backgroundColor: isSelected
                                  ? theme.secondary
                                  : theme.cardBackground,
                                borderColor: isSelected ? theme.secondary : theme.border,
                              },
                            ]}
                            onPress={() => handleAnswer(question.id, option)}
                          >
                            <Text
                              style={[
                                styles.optionText,
                                { color: isSelected ? '#FFFFFF' : theme.text },
                              ]}
                            >
                              {option}
                            </Text>
                            {isSelected && (
                              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                            )}
                          </Pressable>
                        );
                      })}
                    </View>
                  </Animated.View>
                ))}

                {/* Finish button */}
                <Pressable
                  style={[
                    styles.finishButton,
                    {
                      backgroundColor: allQuestionsAnswered
                        ? theme.secondary
                        : theme.border,
                    },
                  ]}
                  onPress={handleFinish}
                  disabled={!allQuestionsAnswered || isGenerating}
                >
                  {isGenerating ? (
                    <Text style={styles.finishButtonText}>Generating suggestions...</Text>
                  ) : (
                    <>
                      <Text style={styles.finishButtonText}>
                        {allQuestionsAnswered ? 'Create My Stacks' : 'Answer all questions'}
                      </Text>
                      <Ionicons name="sparkles" size={20} color="#FFFFFF" />
                    </>
                  )}
                </Pressable>

                <Pressable style={styles.skipQuestionsButton} onPress={() => onComplete({})}>
                  <Text style={[styles.skipQuestionsText, { color: theme.textSecondary }]}>
                    Skip for now
                  </Text>
                </Pressable>
              </Animated.View>
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: Spacing['4xl'],
  },
  skipButton: {
    position: 'absolute',
    top: Spacing['3xl'],
    right: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    zIndex: 10,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
  progressContainer: {
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.xl,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  animationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  lottie: {
    width: width * 0.6,
    height: width * 0.6,
  },
  content: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  title: {
    color: '#FFFFFF',
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: Typography.size.lg,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
  },
  questionsContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['3xl'],
  },
  questionsTitle: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.md,
  },
  questionsSubtitle: {
    fontSize: Typography.size.base,
    marginBottom: Spacing['2xl'],
  },
  questionCard: {
    marginBottom: Spacing['2xl'],
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  questionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionText: {
    flex: 1,
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
  },
  optionsContainer: {
    gap: Spacing.sm,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
  },
  optionText: {
    fontSize: Typography.size.base,
    flex: 1,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xl,
  },
  finishButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
  },
  skipQuestionsButton: {
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
  },
  skipQuestionsText: {
    fontSize: Typography.size.base,
    textAlign: 'center',
  },
});
