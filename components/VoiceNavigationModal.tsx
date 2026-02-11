// Voice Navigation Modal - Voice-first navigation with Newell AI
import React, { useState, useEffect, useRef } from 'react';
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
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { useTheme, useColorScheme } from '@/hooks/useColorScheme';
import { Spacing, BorderRadius, Typography } from '@/constants/theme';
import { HapticPatternsService, HapticPattern } from '@/services/HapticPatternsService';
import { NewellAI } from '@/lib/groq';

const { width, height } = Dimensions.get('window');

interface VoiceNavigationModalProps {
  visible: boolean;
  onClose: () => void;
}

type NavigationCommand =
  | 'today'
  | 'reminders'
  | 'circles'
  | 'anchors'
  | 'insights'
  | 'me'
  | 'settings'
  | 'create_task'
  | 'check_schedule'
  | 'unknown';

export function VoiceNavigationModal({ visible, onClose }: VoiceNavigationModalProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const router = useRouter();

  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState('');

  const pulseScale = useSharedValue(1);
  const recording = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    if (visible) {
      HapticPatternsService.playPattern(HapticPattern.MAGIC_MOMENT);
      speak('How can I help you?');
    } else {
      stopListening();
    }
  }, [visible]);

  useEffect(() => {
    if (isListening) {
      // Animate pulse when listening
      pulseScale.value = withRepeat(
        withSequence(
          withSpring(1.2, { damping: 10 }),
          withSpring(1, { damping: 10 })
        ),
        -1,
        false
      );
    } else {
      pulseScale.value = withSpring(1, { damping: 10 });
    }
  }, [isListening]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const speak = (text: string) => {
    if (Platform.OS === 'web') {
      console.log('Speech:', text);
      return;
    }

    Speech.speak(text, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.9,
    });
  };

  const startListening = async () => {
    try {
      setError('');
      setTranscript('');
      setResponse('');

      // Request permissions
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setError('Microphone permission denied');
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recording.current = newRecording;
      setIsListening(true);

      HapticPatternsService.playPattern(HapticPattern.SUBTLE_TICK);
      speak('Listening...');

      // Auto-stop after 5 seconds
      setTimeout(() => {
        stopListening();
      }, 5000);
    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError('Failed to start listening');
    }
  };

  const stopListening = async () => {
    if (!recording.current) return;

    try {
      setIsListening(false);
      setIsProcessing(true);

      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();
      recording.current = null;

      if (uri) {
        await processVoiceCommand(uri);
      }
    } catch (err: any) {
      console.error('Error stopping recording:', err);
      setError('Failed to process voice');
      setIsProcessing(false);
    }
  };

  const processVoiceCommand = async (audioUri: string) => {
    try {
      // Transcribe audio using Newell AI
      const transcription = await NewellAI.transcribe(audioUri);
      setTranscript(transcription);

      // Parse command using Newell AI
      const command = await parseVoiceCommand(transcription);

      // Execute command
      await executeCommand(command, transcription);

      HapticPatternsService.playPattern(HapticPattern.SUCCESS);
    } catch (err: any) {
      console.error('Error processing voice command:', err);
      setError('Sorry, I didn\'t understand that');
      speak('Sorry, I didn\'t understand that');
      HapticPatternsService.playPattern(HapticPattern.ERROR);
    } finally {
      setIsProcessing(false);
    }
  };

  const parseVoiceCommand = async (text: string): Promise<NavigationCommand> => {
    const lowerText = text.toLowerCase();

    // Simple keyword matching (can be enhanced with Newell AI NLU)
    if (lowerText.includes('today') || lowerText.includes('home')) {
      return 'today';
    } else if (lowerText.includes('reminder') || lowerText.includes('task')) {
      if (lowerText.includes('create') || lowerText.includes('add') || lowerText.includes('new')) {
        return 'create_task';
      }
      return 'reminders';
    } else if (lowerText.includes('circle') || lowerText.includes('household')) {
      return 'circles';
    } else if (lowerText.includes('anchor') || lowerText.includes('location')) {
      return 'anchors';
    } else if (lowerText.includes('insight') || lowerText.includes('analytics')) {
      return 'insights';
    } else if (lowerText.includes('me') || lowerText.includes('profile') || lowerText.includes('settings')) {
      if (lowerText.includes('settings') || lowerText.includes('setting')) {
        return 'settings';
      }
      return 'me';
    } else if (lowerText.includes('schedule') || lowerText.includes('what') || lowerText.includes('next')) {
      return 'check_schedule';
    }

    // Use Newell AI for more complex parsing
    try {
      const aiResponse = await NewellAI.chat({
        messages: [
          {
            role: 'system',
            content: 'You are a navigation assistant. Classify the user intent into one of these categories: today, reminders, circles, anchors, insights, me, settings, create_task, check_schedule, unknown. Respond with only the category name.',
          },
          {
            role: 'user',
            content: text,
          },
        ],
        model: 'gpt-4o-mini',
      });

      return aiResponse.toLowerCase() as NavigationCommand;
    } catch (err) {
      return 'unknown';
    }
  };

  const executeCommand = async (command: NavigationCommand, originalText: string) => {
    switch (command) {
      case 'today':
        setResponse('Opening Today view');
        speak('Opening Today view');
        setTimeout(() => {
          router.push('/(tabs)');
          onClose();
        }, 1000);
        break;

      case 'reminders':
        setResponse('Opening Reminders');
        speak('Opening Reminders');
        setTimeout(() => {
          router.push('/(tabs)/reminders');
          onClose();
        }, 1000);
        break;

      case 'circles':
        setResponse('Opening Circles');
        speak('Opening Circles');
        setTimeout(() => {
          router.push('/(tabs)/circles');
          onClose();
        }, 1000);
        break;

      case 'anchors':
        setResponse('Opening Anchors');
        speak('Opening Anchors');
        setTimeout(() => {
          router.push('/(tabs)/anchors');
          onClose();
        }, 1000);
        break;

      case 'insights':
        setResponse('Opening Insights');
        speak('Opening Insights');
        setTimeout(() => {
          router.push('/(tabs)/insights');
          onClose();
        }, 1000);
        break;

      case 'me':
      case 'settings':
        setResponse('Opening your profile');
        speak('Opening your profile');
        setTimeout(() => {
          router.push('/(tabs)/me');
          onClose();
        }, 1000);
        break;

      case 'create_task':
        setResponse('What task would you like to create?');
        speak('What task would you like to create?');
        // This would trigger the task creation flow
        break;

      case 'check_schedule':
        setResponse('Checking your schedule');
        speak('You have 3 tasks today. Your next task is at 2 PM.');
        break;

      default:
        setResponse('I\'m not sure what you mean. Try "Open Today" or "Create task"');
        speak('I\'m not sure what you mean. Try saying Open Today or Create task');
    }
  };

  const handleClose = () => {
    stopListening();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={80}
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.6)' }]} />
        )}

        <View style={styles.content}>
          {/* Close Button */}
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={theme.textSecondary} />
          </Pressable>

          {/* Mic Button */}
          <Animated.View style={pulseStyle}>
            <Pressable
              onPress={isListening ? stopListening : startListening}
              style={styles.micButton}
              disabled={isProcessing}
            >
              <LinearGradient
                colors={isListening ? ['#10B981', '#059669'] : ['#3B82F6', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.micGradient}
              >
                {isProcessing ? (
                  <ActivityIndicator size="large" color="#FFFFFF" />
                ) : (
                  <Ionicons
                    name={isListening ? 'mic' : 'mic-outline'}
                    size={48}
                    color="#FFFFFF"
                  />
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Status Text */}
          <Text style={[styles.statusText, { color: theme.text }]}>
            {isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Tap to speak'}
          </Text>

          {/* Transcript */}
          {transcript && (
            <View style={[styles.transcriptBox, { backgroundColor: theme.cardBackground }]}>
              <Text style={[styles.transcriptLabel, { color: theme.textSecondary }]}>
                You said:
              </Text>
              <Text style={[styles.transcriptText, { color: theme.text }]}>{transcript}</Text>
            </View>
          )}

          {/* Response */}
          {response && (
            <View style={[styles.responseBox, { backgroundColor: theme.secondary }]}>
              <Text style={styles.responseText}>{response}</Text>
            </View>
          )}

          {/* Error */}
          {error && (
            <View style={[styles.errorBox, { backgroundColor: theme.error }]}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Suggestions */}
          {!isListening && !isProcessing && !transcript && (
            <View style={styles.suggestions}>
              <Text style={[styles.suggestionsTitle, { color: theme.textSecondary }]}>
                Try saying:
              </Text>
              {['Open Today', 'Create a task', 'Check my schedule', 'Open Insights'].map(
                (suggestion, index) => (
                  <Pressable
                    key={index}
                    style={[styles.suggestionChip, { backgroundColor: theme.cardBackground }]}
                    onPress={() => {
                      setTranscript(suggestion);
                      parseVoiceCommand(suggestion).then((command) =>
                        executeCommand(command, suggestion)
                      );
                    }}
                  >
                    <Text style={[styles.suggestionText, { color: theme.text }]}>
                      {suggestion}
                    </Text>
                  </Pressable>
                )
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: width * 0.9,
    maxWidth: 400,
  },
  closeButton: {
    position: 'absolute',
    top: -50,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  micGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    marginTop: Spacing.xl,
  },
  transcriptBox: {
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    width: '100%',
  },
  transcriptLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    marginBottom: Spacing.xs,
  },
  transcriptText: {
    fontSize: Typography.size.base,
  },
  responseBox: {
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    width: '100%',
  },
  responseText: {
    color: '#FFFFFF',
    fontSize: Typography.size.base,
    textAlign: 'center',
  },
  errorBox: {
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    width: '100%',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: Typography.size.base,
    textAlign: 'center',
  },
  suggestions: {
    marginTop: Spacing.xl,
    width: '100%',
  },
  suggestionsTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  suggestionChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  suggestionText: {
    fontSize: Typography.size.sm,
    textAlign: 'center',
  },
});
