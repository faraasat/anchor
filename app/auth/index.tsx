// Authentication Screen - Premium Email/Password with Real Auth
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@fastshot/auth';
import { useTheme } from '@/hooks/useColorScheme';
import { Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';

export default function AuthScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { signInWithEmail, signUpWithEmail, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isSignUp && !fullName) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      if (isSignUp) {
        const result = await signUpWithEmail(email, password, {
          data: { full_name: fullName },
        });
        if (result.emailConfirmationRequired) {
          Alert.alert(
            'Verify Email',
            `A verification link has been sent to ${result.email}. Please check your inbox.`,
            [{ text: 'OK', onPress: () => setIsSignUp(false) }]
          );
        }
      } else {
        await signInWithEmail(email, password);
        // Navigation handled automatically by AuthProvider
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Authentication Failed', err.message || 'Please try again');
    }
  };

  const toggleMode = () => {
    clearError();
    setIsSignUp(!isSignUp);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <LinearGradient
      colors={[theme.secondary, theme.accent]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={[styles.content, { paddingTop: insets.top + Spacing['4xl'] }]}>
          {/* Logo */}
          <Animated.View entering={FadeIn.duration(600)} style={styles.logoContainer}>
            <View style={[styles.logoCircle, { backgroundColor: 'rgba(255, 255, 255, 0.98)' }, Shadows.xl]}>
              <Ionicons name="location" size={64} color={theme.secondary} />
            </View>
            <Text style={[styles.appName, { color: '#FFFFFF' }]}>Anchor</Text>
            <Text style={[styles.tagline, { color: 'rgba(255, 255, 255, 0.9)' }]}>
              Your Premium Productivity Companion
            </Text>
          </Animated.View>

          {/* Auth Card */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(400)}
            style={[styles.authCard, { backgroundColor: theme.surface }, Shadows.xl]}
          >
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              {isSignUp ? 'Create Your Account' : 'Welcome Back'}
            </Text>

            {error ? (
              <View style={[styles.errorContainer, { backgroundColor: theme.error + '20' }]}>
                <Ionicons name="alert-circle" size={16} color={theme.error} />
                <Text style={[styles.errorText, { color: theme.error }]}>{error.message}</Text>
              </View>
            ) : null}

            {/* Name Input (Sign Up Only) */}
            {isSignUp && (
              <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <Ionicons name="person-outline" size={20} color={theme.textMuted} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="Full Name"
                  placeholderTextColor={theme.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>
            )}

            {/* Email Input */}
            <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Ionicons name="mail-outline" size={20} color={theme.textMuted} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Email"
                placeholderTextColor={theme.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={!isLoading}
              />
            </View>

            {/* Password Input */}
            <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.textMuted} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Password"
                placeholderTextColor={theme.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
                editable={!isLoading}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={10}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={theme.textMuted}
                />
              </Pressable>
            </View>

            {/* Auth Button */}
            <Pressable
              style={[
                styles.authButton,
                { backgroundColor: theme.secondary },
                isLoading && { opacity: 0.6 },
              ]}
              onPress={handleAuth}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.authButtonText}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </Pressable>

            {/* Toggle Sign Up/Sign In */}
            <Pressable
              onPress={toggleMode}
              style={styles.toggleButton}
              disabled={isLoading}
            >
              <Text style={[styles.toggleText, { color: theme.textSecondary }]}>
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <Text style={[styles.toggleLink, { color: theme.secondary }]}>
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </Text>
              </Text>
            </Pressable>
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.footer}>
            <Text style={[styles.footerText, { color: 'rgba(255, 255, 255, 0.7)' }]}>
              Secure authentication powered by Supabase
            </Text>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['4xl'],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing['4xl'],
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  appName: {
    fontSize: Typography.size['4xl'],
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: Typography.size.base,
    textAlign: 'center',
  },
  authCard: {
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.xl,
  },
  cardTitle: {
    fontSize: Typography.size['2xl'],
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: Typography.size.sm,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.size.base,
  },
  authButton: {
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  toggleButton: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: Typography.size.sm,
  },
  toggleLink: {
    fontWeight: Typography.weight.semibold,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },
  footerText: {
    fontSize: Typography.size.xs,
    textAlign: 'center',
  },
});
