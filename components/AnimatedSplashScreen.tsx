// Animated Splash Screen with Premium Floating/Pulse Animation
import React, { useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';

interface AnimatedSplashScreenProps {
  onComplete: () => void;
}

export function AnimatedSplashScreen({ onComplete }: AnimatedSplashScreenProps) {
  const theme = useTheme();
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const logoRotate = useSharedValue(0);
  const logoTranslateY = useSharedValue(0);
  const containerOpacity = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(1);

  useEffect(() => {
    // Logo fade in
    logoOpacity.value = withTiming(1, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });

    // Logo scale with bounce
    logoScale.value = withSequence(
      withTiming(1.2, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(1, {
        duration: 300,
        easing: Easing.bezier(0.34, 1.56, 0.64, 1), // Spring bounce
      })
    );

    // Subtle rotation for depth
    logoRotate.value = withSequence(
      withTiming(5, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(0, {
        duration: 300,
        easing: Easing.inOut(Easing.cubic),
      })
    );

    // Floating animation (continuous pulse)
    logoTranslateY.value = withDelay(
      900,
      withRepeat(
        withSequence(
          withTiming(-10, {
            duration: 1200,
            easing: Easing.inOut(Easing.sin),
          }),
          withTiming(0, {
            duration: 1200,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        1, // Repeat once (up and down)
        false
      )
    );

    // Glow pulse effect
    glowOpacity.value = withDelay(
      300,
      withSequence(
        withTiming(0.6, { duration: 600 }),
        withRepeat(
          withSequence(
            withTiming(0.8, { duration: 800 }),
            withTiming(0.4, { duration: 800 })
          ),
          1,
          true
        )
      )
    );

    glowScale.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1200, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) })
        ),
        1,
        true
      )
    );

    // Fade out after showing logo
    containerOpacity.value = withDelay(
      2800,
      withTiming(0, {
        duration: 500,
        easing: Easing.in(Easing.cubic),
      }, (finished) => {
        if (finished) {
          runOnJS(onComplete)();
        }
      })
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotate.value}deg` },
      { translateY: logoTranslateY.value },
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      <LinearGradient
        colors={[theme.secondary, theme.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Glow effect behind logo */}
      <Animated.View style={[styles.glow, glowAnimatedStyle]}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.3)', 'transparent']}
          style={styles.glowGradient}
        />
      </Animated.View>

      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <View style={[styles.logoBackground, { backgroundColor: 'rgba(255, 255, 255, 0.98)' }]}>
          <Image
            source={require('@/assets/images/splash-icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 150,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBackground: {
    width: 200,
    height: 200,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  logo: {
    width: 140,
    height: 140,
  },
});
