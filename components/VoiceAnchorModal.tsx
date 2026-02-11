// Voice Anchor Modal - Full-screen voice interface with sound-wave animations
// Phase 2: AI-powered natural language parsing
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VoiceAnchorModalProps {
  visible: boolean;
  onClose: () => void;
  onVoiceCommand: (command: string) => void;
  isProcessing?: boolean;
}

// Sound wave bar component
function SoundWaveBar({ index, isListening }: { index: number; isListening: boolean }) {
  const height = useSharedValue(20);

  useEffect(() => {
    if (isListening) {
      // Animated pulsing effect with staggered delays
      height.value = withRepeat(
        withSequence(
          withTiming(Math.random() * 60 + 40, {
            duration: 300 + index * 50,
          }),
          withTiming(20 + Math.random() * 30, {
            duration: 300 + index * 50,
          })
        ),
        -1,
        true
      );
    } else {
      height.value = withSpring(20);
    }
  }, [isListening, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return <Animated.View style={[styles.waveBar, animatedStyle]} />;
}

export function VoiceAnchorModal({
  visible,
  onClose,
  onVoiceCommand,
  isProcessing = false,
}: VoiceAnchorModalProps) {
  const theme = useTheme();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [suggestion, setSuggestion] = useState('Try saying: "Remind me to buy coffee when I\'m near a grocery store"');

  const pulseScale = useSharedValue(1);
  const micIconRotation = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Start pulse animation when modal opens
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [visible]);

  const handleMicPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (isListening) {
      // Stop listening
      setIsListening(false);
      micIconRotation.value = withSpring(0);

      // TODO: Stop audio recording
      // For now, use mock transcript
      if (transcript) {
        onVoiceCommand(transcript);
      }
    } else {
      // Start listening
      setIsListening(true);
      micIconRotation.value = withSpring(360);

      // TODO: Start audio recording
      // For now, simulate transcript
      setTimeout(() => {
        setTranscript('Remind me to buy coffee when I\'m near a grocery store and add it to the Home Circle');
      }, 2000);
    }
  };

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsListening(false);
    setTranscript('');
    pulseScale.value = 1;
    micIconRotation.value = 0;
    onClose();
  };

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const micIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${micIconRotation.value}deg` }],
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill}>
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
          style={styles.container}
        >
          {/* Close button */}
          <Pressable
            style={[styles.closeButton, { top: Platform.OS === 'ios' ? 60 : 40 }]}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </Pressable>

          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={[theme.secondary, theme.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerBadge}
            >
              <Ionicons name="sparkles" size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.headerTitle, { fontFamily: Typography.family.serif }]}>
              Voice Anchor
            </Text>
            <Text style={styles.headerSubtitle}>
              Speak naturally. I'll understand.
            </Text>
          </View>

          {/* Sound wave visualization */}
          <View style={styles.waveContainer}>
            {Array.from({ length: 24 }).map((_, index) => (
              <SoundWaveBar key={index} index={index} isListening={isListening} />
            ))}
          </View>

          {/* Microphone button */}
          <Animated.View style={pulseStyle}>
            <Pressable
              style={[styles.micButton, Shadows.xl]}
              onPress={handleMicPress}
              disabled={isProcessing}
            >
              <LinearGradient
                colors={isListening ? [theme.error, '#FF6B6B'] : [theme.secondary, theme.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.micGradient}
              >
                {isProcessing ? (
                  <ActivityIndicator size="large" color="#FFFFFF" />
                ) : (
                  <Animated.View style={micIconStyle}>
                    <Ionicons
                      name={isListening ? 'stop-circle' : 'mic'}
                      size={48}
                      color="#FFFFFF"
                    />
                  </Animated.View>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Status text */}
          <Text style={styles.statusText}>
            {isProcessing
              ? 'Processing...'
              : isListening
              ? 'Listening...'
              : 'Tap to speak'}
          </Text>

          {/* Transcript */}
          {transcript && (
            <Animated.View
              entering={FadeIn.delay(200)}
              style={[styles.transcriptCard, { backgroundColor: 'rgba(255, 255, 255, 0.12)' }]}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFFFFF" />
              <Text style={styles.transcriptText}>{transcript}</Text>
            </Animated.View>
          )}

          {/* AI Processing indicator */}
          {isProcessing && (
            <Animated.View entering={FadeIn.delay(100)} style={styles.processingCard}>
              <View style={styles.processingHeader}>
                <LinearGradient
                  colors={[theme.secondary, theme.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.processingBadge}
                >
                  <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.processingTitle}>Understanding your request...</Text>
              </View>
              <Text style={styles.processingSubtitle}>
                Parsing task details, location, and Circle assignment
              </Text>
            </Animated.View>
          )}

          {/* Suggestion */}
          {!transcript && !isListening && !isProcessing && (
            <Animated.View entering={FadeIn.delay(300)} style={styles.suggestionCard}>
              <Ionicons name="bulb-outline" size={18} color={theme.accent} />
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </Animated.View>
          )}

          {/* Capabilities */}
          <View style={styles.capabilitiesContainer}>
            <View style={styles.capabilityItem}>
              <Ionicons name="location-outline" size={16} color="rgba(255, 255, 255, 0.7)" />
              <Text style={styles.capabilityText}>Location triggers</Text>
            </View>
            <View style={styles.capabilityItem}>
              <Ionicons name="people-outline" size={16} color="rgba(255, 255, 255, 0.7)" />
              <Text style={styles.capabilityText}>Circle assignment</Text>
            </View>
            <View style={styles.capabilityItem}>
              <Ionicons name="time-outline" size={16} color="rgba(255, 255, 255, 0.7)" />
              <Text style={styles.capabilityText}>Smart scheduling</Text>
            </View>
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  closeButton: {
    position: 'absolute',
    right: Spacing.xl,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['4xl'],
  },
  headerBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.size['3xl'],
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.size.base,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: Typography.family.sans,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    gap: 6,
    marginBottom: Spacing['4xl'],
  },
  waveBar: {
    width: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 2,
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  micGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: Typography.size.lg,
    color: '#FFFFFF',
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.xl,
  },
  transcriptCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    maxWidth: SCREEN_WIDTH - Spacing.xl * 2,
    marginBottom: Spacing.lg,
  },
  transcriptText: {
    flex: 1,
    fontSize: Typography.size.base,
    color: '#FFFFFF',
    lineHeight: Typography.size.base * 1.5,
  },
  processingCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    maxWidth: SCREEN_WIDTH - Spacing.xl * 2,
    marginBottom: Spacing.lg,
  },
  processingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  processingBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingTitle: {
    fontSize: Typography.size.base,
    color: '#FFFFFF',
    fontWeight: Typography.weight.semibold,
  },
  processingSubtitle: {
    fontSize: Typography.size.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 32,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    maxWidth: SCREEN_WIDTH - Spacing.xl * 2,
    marginBottom: Spacing.xl,
  },
  suggestionText: {
    flex: 1,
    fontSize: Typography.size.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    fontStyle: 'italic',
  },
  capabilitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  capabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  capabilityText: {
    fontSize: Typography.size.xs,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: Typography.weight.medium,
  },
});
