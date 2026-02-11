// Nudge Composer - AI-powered gentle reminders
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/lib/auth';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing, Typography } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { generateText } from '@/lib/groq';
import type { Reminder } from '@/types/reminder';

interface NudgeComposerProps {
  visible: boolean;
  onClose: () => void;
  task: Reminder;
  recipientId: string;
  recipientName: string;
}

const NUDGE_TONES = [
  { id: 'caring', label: '💙 Caring & Supportive', prompt: 'caring and supportive' },
  { id: 'motivational', label: '💪 Motivational', prompt: 'motivational and energetic' },
  { id: 'playful', label: '😊 Playful & Light', prompt: 'playful and lighthearted' },
  { id: 'gentle', label: '🌸 Gentle & Understanding', prompt: 'gentle and understanding' },
];

export function NudgeComposer({ visible, onClose, task, recipientId, recipientName }: NudgeComposerProps) {
  const theme = useTheme();
  const { user } = useAuth();

  const [selectedTone, setSelectedTone] = useState(NUDGE_TONES[0]);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      generateNudgeMessage();
    }
  }, [visible, selectedTone]);

  const generateNudgeMessage = async () => {
    try {
      setIsGenerating(true);

      // Calculate task urgency
      const dueDate = new Date(`${task.dueDate}T${task.dueTime}`);
      const now = new Date();
      const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      const isOverdue = hoursUntilDue < 0;
      const isUrgent = hoursUntilDue < 2 && hoursUntilDue > 0;

      const context = `
Task: "${task.title}"
${task.description ? `Description: ${task.description}` : ''}
Due: ${task.dueDate} at ${task.dueTime}
${isOverdue ? 'Status: OVERDUE' : isUrgent ? 'Status: Due soon' : 'Status: Upcoming'}
Recipient: ${recipientName}
Relationship: Circle member

Generate a ${selectedTone.prompt} nudge message (2-3 sentences max) to gently remind ${recipientName} about this task. The message should:
- Feel personal and caring, not nagging
- Acknowledge their busy schedule
- Offer encouragement
- Be concise and friendly
${isOverdue ? '- Gently mention it\'s overdue without being harsh' : ''}
${task.chainCount && task.chainCount > 0 ? `- Mention their ${task.chainCount}-day streak is at risk to motivate them` : ''}

Do not include greetings or sign-offs. Just the core message.
      `.trim();

      const systemPrompt = 'You are a thoughtful, empathetic assistant that crafts gentle reminder messages for family and team members. Your messages are supportive, never nagging, and always considerate of people\'s time and efforts.';

      const response = await generateText({
        prompt: `${systemPrompt}\n\n${context}`,
      });

      const message = response.trim().replace(/^["']|["']$/g, '');
      setGeneratedMessage(message);

      // Generate 2 alternative suggestions
      const alt1 = await generateText({
        prompt: `Generate a brief, friendly nudge message (1-2 sentences).\n\n${context}\n\nMake this one shorter and more casual.`,
      });

      const alt2 = await generateText({
        prompt: `Generate a brief, friendly nudge message (1-2 sentences).\n\n${context}\n\nMake this one more encouraging and upbeat.`,
      });

      setSuggestions([
        alt1.trim().replace(/^["']|["']$/g, ''),
        alt2.trim().replace(/^["']|["']$/g, ''),
      ]);
    } catch (error) {
      console.error('Error generating nudge:', error);
      setGeneratedMessage(
        `Hey ${recipientName}! Just a gentle reminder about "${task.title}" - know you've got a lot going on, but this one's coming up soon. You've got this! 💪`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!user || !generatedMessage.trim()) return;

    try {
      setIsSending(true);

      const { error } = await supabase.from('nudges').insert({
        sender_id: user.id,
        recipient_id: recipientId,
        reminder_id: task.id,
        message: generatedMessage.trim(),
      });

      if (error) throw error;

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert('Nudge Sent! 💙', `Your gentle reminder has been sent to ${recipientName}.`);
      onClose();
    } catch (error: any) {
      console.error('Error sending nudge:', error);
      Alert.alert('Error', error.message || 'Failed to send nudge');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          entering={FadeInDown.springify()}
          style={[styles.modalContent, { backgroundColor: theme.surface }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <LinearGradient
                colors={['#f093fb', '#f5576c']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconGradient}
              >
                <Ionicons name="notifications" size={24} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.text} />
            </Pressable>
          </View>

          <Text style={[styles.title, { color: theme.text }]}>Send a Gentle Nudge</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            to {recipientName} about "{task.title}"
          </Text>

          {/* Tone Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.toneSelector}
          >
            {NUDGE_TONES.map((tone) => (
              <Pressable
                key={tone.id}
                style={[
                  styles.toneButton,
                  {
                    backgroundColor: selectedTone.id === tone.id ? theme.secondary + '20' : theme.background,
                    borderColor: selectedTone.id === tone.id ? theme.secondary : theme.border,
                  },
                ]}
                onPress={() => setSelectedTone(tone)}
              >
                <Text
                  style={[
                    styles.toneButtonText,
                    {
                      color: selectedTone.id === tone.id ? theme.secondary : theme.text,
                      fontWeight:
                        selectedTone.id === tone.id
                          ? Typography.weight.semibold
                          : Typography.weight.normal,
                    },
                  ]}
                >
                  {tone.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView style={styles.messagesContainer} showsVerticalScrollIndicator={false}>
            {/* Generated Message */}
            {isGenerating ? (
              <View style={[styles.messageCard, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="small" color={theme.secondary} />
                <Text style={[styles.generatingText, { color: theme.textSecondary }]}>
                  Crafting a thoughtful message...
                </Text>
              </View>
            ) : (
              <>
                <Pressable
                  style={[
                    styles.messageCard,
                    styles.selectedMessage,
                    { backgroundColor: theme.secondary + '10', borderColor: theme.secondary },
                  ]}
                  onPress={() => {}}
                >
                  <View style={styles.messageHeader}>
                    <Ionicons name="checkmark-circle" size={20} color={theme.secondary} />
                    <Text style={[styles.messageLabel, { color: theme.secondary }]}>
                      Your Message
                    </Text>
                  </View>
                  <Text style={[styles.messageText, { color: theme.text }]}>{generatedMessage}</Text>
                </Pressable>

                {/* Alternative Suggestions */}
                {suggestions.length > 0 && (
                  <>
                    <Text style={[styles.suggestionsTitle, { color: theme.textSecondary }]}>
                      Or try these:
                    </Text>
                    {suggestions.map((suggestion, index) => (
                      <Pressable
                        key={index}
                        style={[styles.messageCard, { backgroundColor: theme.background }]}
                        onPress={() => setGeneratedMessage(suggestion)}
                      >
                        <Text style={[styles.messageText, { color: theme.text }]}>{suggestion}</Text>
                      </Pressable>
                    ))}
                  </>
                )}
              </>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.button, styles.buttonSecondary, { borderColor: theme.border }]}
              onPress={onClose}
              disabled={isSending}
            >
              <Text style={[styles.buttonText, { color: theme.textSecondary }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.button,
                styles.buttonPrimary,
                { backgroundColor: theme.secondary, opacity: isSending || isGenerating ? 0.6 : 1 },
              ]}
              onPress={handleSend}
              disabled={isSending || isGenerating || !generatedMessage}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="send" size={18} color="#FFFFFF" />
                  <Text style={styles.buttonTextPrimary}>Send Nudge</Text>
                </>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 24,
    padding: Spacing.xl,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerIcon: {
    width: 56,
    height: 56,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.size.sm,
    marginBottom: Spacing.lg,
  },
  toneSelector: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  toneButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
  },
  toneButtonText: {
    fontSize: Typography.size.sm,
  },
  messagesContainer: {
    maxHeight: 300,
    marginVertical: Spacing.md,
  },
  messageCard: {
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedMessage: {
    borderWidth: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  messageLabel: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    textTransform: 'uppercase',
  },
  messageText: {
    fontSize: Typography.size.base,
    lineHeight: 22,
  },
  generatingText: {
    fontSize: Typography.size.sm,
    marginLeft: Spacing.sm,
  },
  suggestionsTitle: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
    textTransform: 'uppercase',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  button: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    borderWidth: 1,
  },
  buttonPrimary: {
    flexDirection: 'row',
    gap: Spacing.xs,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
});
