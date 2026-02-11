// Living Background with Animated Mesh Gradients and Parallax
import React, { useEffect, useState } from 'react';
import { StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useWindowDimensions } from '@/hooks/useWindowDimensions';
import {
  Gyroscope,
  GyroscopeData,
} from 'expo-sensors';

interface LivingBackgroundProps {
  mode?: 'auto' | 'morning' | 'afternoon' | 'evening' | 'night' | 'focus';
}

// Time-based color palettes
const COLOR_PALETTES = {
  morning: ['#FFE5B4', '#FFD700', '#FFA07A', '#FF8C69'], // Peach, Gold, Coral
  afternoon: ['#87CEEB', '#4682B4', '#6495ED', '#B0E0E6'], // Sky Blue, Steel Blue
  evening: ['#191970', '#483D8B', '#6A5ACD', '#8B7BB8'], // Navy, Dark Slate Blue, Purple
  night: ['#000428', '#004e92', '#1a1a2e', '#0f3460'], // Deep Navy, Dark Blue
  focus: ['#2C3E50', '#34495E', '#2C3E50', '#34495E'], // Steady monochromatic
};

export function LivingBackground({ mode = 'auto' }: LivingBackgroundProps) {
  const { width, height } = useWindowDimensions();
  const [currentPalette, setCurrentPalette] = useState<string[]>(COLOR_PALETTES.morning);

  // Animation values for mesh gradient movement
  const rotation = useSharedValue(0);
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Parallax values from gyroscope
  const parallaxX = useSharedValue(0);
  const parallaxY = useSharedValue(0);

  // Determine current time palette
  useEffect(() => {
    if (mode !== 'auto') {
      setCurrentPalette(COLOR_PALETTES[mode]);
      return;
    }

    const updatePalette = () => {
      const hour = new Date().getHours();

      if (hour >= 5 && hour < 12) {
        setCurrentPalette(COLOR_PALETTES.morning);
      } else if (hour >= 12 && hour < 17) {
        setCurrentPalette(COLOR_PALETTES.afternoon);
      } else if (hour >= 17 && hour < 21) {
        setCurrentPalette(COLOR_PALETTES.evening);
      } else {
        setCurrentPalette(COLOR_PALETTES.night);
      }
    };

    updatePalette();
    const interval = setInterval(updatePalette, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [mode]);

  // Animate the mesh gradient
  useEffect(() => {
    if (mode === 'focus') {
      // Steady pulse for focus mode
      scale1.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      // Slow continuous rotation and scaling
      rotation.value = withRepeat(
        withTiming(360, { duration: 120000, easing: Easing.linear }),
        -1,
        false
      );

      scale1.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 20000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 20000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      scale2.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 15000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.3, { duration: 15000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      translateX.value = withRepeat(
        withSequence(
          withTiming(30, { duration: 25000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-30, { duration: 25000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );

      translateY.value = withRepeat(
        withSequence(
          withTiming(-20, { duration: 22000, easing: Easing.inOut(Easing.ease) }),
          withTiming(20, { duration: 22000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    }
  }, [mode]);

  // Setup gyroscope for parallax effect
  useEffect(() => {
    if (Platform.OS === 'web') return;

    let subscription: { remove: () => void } | null = null;

    const setupGyroscope = async () => {
      try {
        const available = await Gyroscope.isAvailableAsync();
        if (!available) return;

        Gyroscope.setUpdateInterval(100);

        subscription = Gyroscope.addListener((data: GyroscopeData) => {
          // Map rotation to subtle parallax movement (-10 to 10)
          parallaxX.value = withTiming(
            interpolate(data.y, [-1, 1], [-10, 10]),
            { duration: 100 }
          );
          parallaxY.value = withTiming(
            interpolate(data.x, [-1, 1], [-10, 10]),
            { duration: 100 }
          );
        });
      } catch (error) {
        console.log('Gyroscope not available:', error);
      }
    };

    setupGyroscope();

    return () => {
      subscription?.remove();
    };
  }, []);

  // Animated styles for gradient layers
  const layer1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value + parallaxX.value * 0.3 },
      { translateY: translateY.value + parallaxY.value * 0.3 },
      { scale: scale1.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const layer2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: -translateX.value * 0.7 + parallaxX.value * 0.5 },
      { translateY: -translateY.value * 0.7 + parallaxY.value * 0.5 },
      { scale: scale2.value },
      { rotate: `${-rotation.value * 0.5}deg` },
    ],
  }));

  const layer3Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: parallaxX.value },
      { translateY: parallaxY.value },
    ],
  }));

  return (
    <Animated.View style={styles.container}>
      {/* Base layer */}
      <Animated.View style={[styles.gradientLayer, layer1Style]}>
        <LinearGradient
          colors={[currentPalette[0], currentPalette[1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
      </Animated.View>

      {/* Middle layer */}
      <Animated.View style={[styles.gradientLayer, layer2Style]}>
        <LinearGradient
          colors={[currentPalette[2], currentPalette[3]]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.gradient, { opacity: 0.7 }]}
        />
      </Animated.View>

      {/* Top layer with parallax */}
      <Animated.View style={[styles.gradientLayer, layer3Style]}>
        <LinearGradient
          colors={[currentPalette[1], currentPalette[2]]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.gradient, { opacity: 0.5 }]}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  gradientLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    width: width * 1.5,
    height: height * 1.5,
    marginLeft: -width * 0.25,
    marginTop: -height * 0.25,
  },
});
