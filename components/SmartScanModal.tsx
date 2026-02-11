// Phase 5: AI Vision Smart Scanning
// Physical-to-digital bridge using Newell AI vision
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useThemeEngine } from '@/contexts/ThemeEngineContext';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { Reminder, TagType, ReminderStatus, RecurrenceType } from '@/types/reminder';
import { NewellVisionService } from '@/services/NewellVisionService';

interface SmartScanModalProps {
  visible: boolean;
  onClose: () => void;
  onTasksCreated: (tasks: Reminder[]) => void;
}

interface ScannedTask {
  title: string;
  description?: string;
  dueDate?: string;
  dueTime?: string;
  tag?: string;
  priority?: 'low' | 'medium' | 'high';
  confidence: number;
}

export function SmartScanModal({ visible, onClose, onTasksCreated }: SmartScanModalProps) {
  const { theme } = useThemeEngine();
  const insets = useSafeAreaInsets();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedTasks, setScannedTasks] = useState<ScannedTask[]>([]);

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Camera access is needed to scan tasks.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleSelectPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Photo library access is needed to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert('Error', 'Failed to select photo');
    }
  };

  const processImage = async (uri: string) => {
    setIsProcessing(true);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      // Use Newell AI Vision Service to analyze the image
      const result = await NewellVisionService.analyzeTaskImage(uri);

      // Parse the AI response into tasks
      const tasks: ScannedTask[] = result.tasks || [];
      setScannedTasks(tasks);

      if (tasks.length === 0) {
        Alert.alert(
          'No Tasks Found',
          'Could not detect any tasks in this image. Try a clearer photo with better lighting.'
        );
      }
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to analyze image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmTasks = () => {
    const now = new Date();
    const reminders: Reminder[] = scannedTasks.map((task, index) => ({
      id: `scanned-${Date.now()}-${index}`,
      title: task.title,
      description: task.description || '',
      dueDate: task.dueDate || now.toISOString().split('T')[0],
      dueTime: task.dueTime || '12:00',
      tag: (task.tag || 'Personal') as TagType,
      status: 'pending' as ReminderStatus,
      priority: task.priority || 'medium',
      recurrence: { type: 'none' as RecurrenceType },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      isRecurring: false,
      aiPredicted: true,
      aiConfidence: task.confidence,
      visualReminder: imageUri || undefined,
    } as Reminder));

    onTasksCreated(reminders);
    handleClose();
  };

  const handleClose = () => {
    setImageUri(null);
    setScannedTasks([]);
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <BlurView intensity={40} tint="dark" style={styles.overlay}>
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          {/* Header */}
          <LinearGradient
            colors={[theme.secondary, theme.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Pressable onPress={handleClose} hitSlop={10}>
              <Ionicons name="close" size={28} color={theme.textInverse} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: theme.textInverse }]}>Smart Scan</Text>
            <View style={{ width: 28 }} />
          </LinearGradient>

          <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
            {!imageUri ? (
              // Initial state - scan options
              <View style={styles.scanOptions}>
                <View style={styles.iconContainer}>
                  <Ionicons name="scan" size={64} color={theme.secondary} />
                </View>

                <Text style={[styles.title, { color: theme.text }]}>
                  Scan Physical Tasks
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Photograph handwritten lists, whiteboards, or flyers.
                  AI will extract tasks automatically.
                </Text>

                <View style={styles.buttonContainer}>
                  <Pressable
                    style={[styles.button, { backgroundColor: theme.secondary }]}
                    onPress={handleTakePhoto}
                  >
                    <Ionicons name="camera" size={24} color={theme.textInverse} />
                    <Text style={[styles.buttonText, { color: theme.textInverse }]}>
                      Take Photo
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.button, styles.buttonSecondary, { borderColor: theme.border }]}
                    onPress={handleSelectPhoto}
                  >
                    <Ionicons name="images" size={24} color={theme.text} />
                    <Text style={[styles.buttonText, { color: theme.text }]}>
                      Choose from Library
                    </Text>
                  </Pressable>
                </View>

                {/* Examples */}
                <View style={styles.examples}>
                  <Text style={[styles.examplesTitle, { color: theme.textMuted }]}>
                    Works great with:
                  </Text>
                  <View style={styles.exampleRow}>
                    <View style={styles.exampleItem}>
                      <Ionicons name="pencil" size={20} color={theme.accent} />
                      <Text style={[styles.exampleText, { color: theme.textSecondary }]}>
                        Handwritten lists
                      </Text>
                    </View>
                    <View style={styles.exampleItem}>
                      <Ionicons name="easel" size={20} color={theme.accent} />
                      <Text style={[styles.exampleText, { color: theme.textSecondary }]}>
                        Whiteboards
                      </Text>
                    </View>
                    <View style={styles.exampleItem}>
                      <Ionicons name="document-text" size={20} color={theme.accent} />
                      <Text style={[styles.exampleText, { color: theme.textSecondary }]}>
                        Printed lists
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              // Image captured - show preview and results
              <View style={styles.resultsContainer}>
                <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />

                {isProcessing ? (
                  <View style={styles.processingContainer}>
                    <ActivityIndicator size="large" color={theme.secondary} />
                    <Text style={[styles.processingText, { color: theme.text }]}>
                      Analyzing image with AI...
                    </Text>
                  </View>
                ) : scannedTasks.length > 0 ? (
                  <View style={styles.tasksContainer}>
                    <Text style={[styles.tasksTitle, { color: theme.text }]}>
                      Found {scannedTasks.length} {scannedTasks.length === 1 ? 'task' : 'tasks'}
                    </Text>

                    {scannedTasks.map((task, index) => (
                      <View
                        key={index}
                        style={[styles.taskCard, { backgroundColor: theme.surface }]}
                      >
                        <View style={styles.taskHeader}>
                          <Text style={[styles.taskTitle, { color: theme.text }]}>
                            {task.title}
                          </Text>
                          {task.confidence >= 0.8 && (
                            <View style={[styles.confidenceBadge, { backgroundColor: theme.success }]}>
                              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                              <Text style={styles.confidenceText}>
                                {Math.round(task.confidence * 100)}%
                              </Text>
                            </View>
                          )}
                        </View>

                        {task.description && (
                          <Text style={[styles.taskDescription, { color: theme.textSecondary }]}>
                            {task.description}
                          </Text>
                        )}

                        {(task.dueDate || task.dueTime) && (
                          <View style={styles.taskMeta}>
                            {task.dueDate && (
                              <View style={styles.metaItem}>
                                <Ionicons name="calendar-outline" size={14} color={theme.textMuted} />
                                <Text style={[styles.metaText, { color: theme.textMuted }]}>
                                  {task.dueDate}
                                </Text>
                              </View>
                            )}
                            {task.dueTime && (
                              <View style={styles.metaItem}>
                                <Ionicons name="time-outline" size={14} color={theme.textMuted} />
                                <Text style={[styles.metaText, { color: theme.textMuted }]}>
                                  {task.dueTime}
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    ))}

                    <View style={styles.actionButtons}>
                      <Pressable
                        style={[styles.button, { backgroundColor: theme.secondary }]}
                        onPress={handleConfirmTasks}
                      >
                        <Ionicons name="checkmark" size={24} color={theme.textInverse} />
                        <Text style={[styles.buttonText, { color: theme.textInverse }]}>
                          Add All Tasks
                        </Text>
                      </Pressable>

                      <Pressable
                        style={[styles.button, styles.buttonSecondary, { borderColor: theme.border }]}
                        onPress={() => setImageUri(null)}
                      >
                        <Ionicons name="camera" size={24} color={theme.text} />
                        <Text style={[styles.buttonText, { color: theme.text }]}>
                          Scan Again
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>
            )}
          </ScrollView>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  headerTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  scanOptions: {
    alignItems: 'center',
    paddingTop: Spacing['4xl'],
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(42, 107, 95, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.size.base,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.lg,
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  buttonText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
  examples: {
    marginTop: Spacing['4xl'],
    width: '100%',
  },
  examplesTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  exampleRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  exampleItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  exampleText: {
    fontSize: Typography.size.xs,
    textAlign: 'center',
  },
  resultsContainer: {
    gap: Spacing.lg,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.lg,
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing['4xl'],
    gap: Spacing.md,
  },
  processingText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.medium,
  },
  tasksContainer: {
    gap: Spacing.md,
  },
  tasksTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  taskCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    flex: 1,
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.semibold,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  confidenceText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: '#FFFFFF',
  },
  taskDescription: {
    fontSize: Typography.size.sm,
    lineHeight: 20,
  },
  taskMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: Typography.size.xs,
  },
  actionButtons: {
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
});
