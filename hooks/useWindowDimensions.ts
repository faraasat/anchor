// Custom hook for responsive window dimensions
import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';

interface WindowDimensions {
  width: number;
  height: number;
  scale: number;
  fontScale: number;
}

/**
 * Hook that updates when window dimensions change (orientation, resize, etc.)
 * More reliable than Dimensions.get('window') which only gets initial dimensions
 */
export function useWindowDimensions(): WindowDimensions {
  const [dimensions, setDimensions] = useState<WindowDimensions>(() => {
    const window = Dimensions.get('window');
    return {
      width: window.width,
      height: window.height,
      scale: window.scale,
      fontScale: window.fontScale,
    };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({
        width: window.width,
        height: window.height,
        scale: window.scale,
        fontScale: window.fontScale,
      });
    });

    return () => subscription?.remove();
  }, []);

  return dimensions;
}

/**
 * Hook for responsive breakpoints
 */
export function useBreakpoint() {
  const { width } = useWindowDimensions();

  return {
    isSmall: width < 375,
    isMedium: width >= 375 && width < 768,
    isLarge: width >= 768 && width < 1024,
    isXLarge: width >= 1024,
    width,
  };
}

/**
 * Scale size based on screen width
 * Useful for making layouts responsive across different screen sizes
 */
export function useScaledSize(baseSize: number, baseWidth: number = 375): number {
  const { width } = useWindowDimensions();
  return (baseSize * width) / baseWidth;
}
