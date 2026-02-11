// Phase 5: Victory Animation
// Full-screen celebration with paper-confetti effects for shared achievements
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Modal } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useThemeEngine } from '@/contexts/ThemeEngineContext';
import { Spacing, Typography } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VictoryAnimationProps {
  visible: boolean;
  title?: string;
  message?: string;
  onComplete?: () => void;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
}

const CONFETTI_COLORS = ['#FFD700', '#FF6B9D', '#4AD4CA', '#B8935F', '#FFC947'];

function generateConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * SCREEN_WIDTH,
    y: -50 - Math.random() * 200,
    rotation: Math.random() * 360,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 8 + Math.random() * 12,
    delay: Math.random() * 400,
  }));
}

function ConfettiPiece({ piece }: { piece: ConfettiPiece }) {
  const translateY = useSharedValue(piece.y);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(piece.rotation);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      piece.delay,
      withTiming(1, { duration: 200 })
    );

    translateY.value = withDelay(
      piece.delay,
      withTiming(SCREEN_HEIGHT + 100, {
        duration: 3000 + Math.random() * 2000,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    // Subtle side-to-side drift
    translateX.value = withDelay(
      piece.delay,
      withSequence(
        withTiming(20 - Math.random() * 40, { duration: 1000 }),
        withTiming(-20 + Math.random() * 40, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      )
    );

    rotate.value = withDelay(
      piece.delay,
      withTiming(piece.rotation + 360 + Math.random() * 720, {
        duration: 3000,
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: piece.x + translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          width: piece.size,
          height: piece.size,
          backgroundColor: piece.color,
        },
        animatedStyle,
      ]}
    />
  );
}

export function VictoryAnimation({
  visible,
  title = 'Victory!',
  message = 'Goal achieved!',
  onComplete,
}: VictoryAnimationProps) {
  const { theme } = useThemeEngine();
  const scale = useSharedValue(0);
  const badgeRotate = useSharedValue(-180);
  const [confetti] = useState(() => generateConfetti(60));

  useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });

      badgeRotate.value = withSequence(
        withTiming(0, {
          duration: 800,
          easing: Easing.bezier(0.34, 1.56, 0.64, 1),
        }),
        withSpring(0, {
          damping: 8,
          stiffness: 100,
        })
      );

      // Auto-dismiss after animation
      const timeout = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 4000);

      return () => clearTimeout(timeout);
    } else {
      scale.value = withTiming(0, { duration: 300 });
      badgeRotate.value = -180;
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: scale.value,
    };
  });

  const badgeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${badgeRotate.value}deg` }],
    };
  });

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <BlurView intensity={60} tint="dark" style={styles.overlay}>
        {/* Confetti */}
        {confetti.map((piece) => (
          <ConfettiPiece key={piece.id} piece={piece} />
        ))}

        {/* Victory Badge */}
        <Animated.View style={[styles.container, containerStyle]}>
          <Animated.View style={[styles.badge, badgeStyle]}>
            <LinearGradient
              colors={[theme.accent, theme.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badgeGradient}
            >
              <Ionicons name="trophy" size={80} color="#FFFFFF" />
            </LinearGradient>
          </Animated.View>

          <View style={styles.content}>
            <Text style={[styles.title, { color: '#FFFFFF' }]}>{title}</Text>
            <Text style={[styles.message, { color: 'rgba(255, 255, 255, 0.8)' }]}>
              {message}
            </Text>
          </View>

          {/* Paper-torn edge decoration */}
          <View style={styles.paperEdge}>
            <View style={[styles.tear, { backgroundColor: theme.accent }]} />
            <View style={[styles.tear, { backgroundColor: theme.secondary }]} />
            <View style={[styles.tear, { backgroundColor: theme.accent }]} />
            <View style={[styles.tear, { backgroundColor: theme.secondary }]} />
            <View style={[styles.tear, { backgroundColor: theme.accent }]} />
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: Spacing['4xl'],
  },
  badge: {
    width: 180,
    height: 180,
    borderRadius: 90,
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  badgeGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 6,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    fontSize: Typography.size['4xl'],
    fontWeight: Typography.weight.extrabold,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.medium,
    textAlign: 'center',
  },
  paperEdge: {
    flexDirection: 'row',
    marginTop: Spacing['4xl'],
    gap: Spacing.xs,
  },
  tear: {
    width: 8,
    height: 24,
    borderRadius: 4,
  },
  confettiPiece: {
    position: 'absolute',
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});
