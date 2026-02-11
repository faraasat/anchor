// Performance Optimizations - Battery efficiency and smooth animations
import { InteractionManager, Platform } from 'react-native';
import { useEffect, useRef, useCallback } from 'react';

/**
 * Animation Performance Best Practices
 *
 * 1. Use React Native Reanimated for all animations (already installed)
 * 2. Avoid animating layout properties (width, height, padding, margin)
 * 3. Prefer transform and opacity animations
 * 4. Use useNativeDriver: true whenever possible
 * 5. Batch state updates
 * 6. Memoize expensive calculations
 */

// Defer heavy operations until after interactions complete
export const runAfterInteractions = <T>(callback: () => T): Promise<T> => {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      resolve(callback());
    });
  });
};

// Debounce function for search/input handlers
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}

// Throttle function for scroll handlers
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  limit: number
): T {
  const inThrottle = useRef(false);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (!inThrottle.current) {
        callback(...args);
        inThrottle.current = true;
        setTimeout(() => {
          inThrottle.current = false;
        }, limit);
      }
    }) as T,
    [callback, limit]
  );
}

// Memoize expensive calculations
export const memoize = <T extends (...args: any[]) => any>(
  fn: T
): T => {
  const cache = new Map();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// Image optimization settings
export const IMAGE_OPTIMIZATION = {
  // Use these props for expo-image
  contentFit: 'cover' as const,
  transition: 200,
  priority: 'normal' as const,
  cachePolicy: 'memory-disk' as const,

  // Recommended sizes
  thumbnail: { width: 100, height: 100 },
  avatar: { width: 200, height: 200 },
  card: { width: 400, height: 300 },
  fullScreen: { width: 1080, height: 1920 },
};

// Animation presets (for React Native Reanimated)
export const ANIMATION_CONFIGS = {
  // Fast and snappy for UI feedback
  quick: {
    duration: 200,
    easing: 'ease-out' as const,
  },
  // Standard for most transitions
  standard: {
    duration: 300,
    easing: 'ease-in-out' as const,
  },
  // Smooth for large movements
  smooth: {
    duration: 500,
    easing: 'ease-in-out' as const,
  },
  // Spring for natural feel
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
};

// Lottie animation optimization
export const LOTTIE_OPTIMIZATION = {
  // Limit FPS for better battery life
  speed: 1,
  loop: true,
  autoPlay: false, // Start manually when component is visible

  // Use native rendering when possible
  hardwareAccelerationAndroid: true,
  renderMode: Platform.select({
    ios: 'AUTOMATIC' as const,
    android: 'HARDWARE' as const,
  }),

  // Reduce quality for background animations
  resizeMode: 'cover' as const,

  // Cache animations
  cacheComposition: true,
};

// Mesh gradient optimization
export const MESH_GRADIENT_OPTIMIZATION = {
  // Reduce complexity for better performance
  maxColors: 4, // Use max 4 colors instead of 6+
  smoothness: 0.7, // Balance between smoothness and performance

  // Update frequency
  updateInterval: 100, // Update every 100ms instead of every frame

  // Animation duration
  animationDuration: 3000, // Slower animations = less CPU

  // Use CSS/Canvas on web, native views on mobile
  useSVG: Platform.OS === 'web',
};

// FlatList optimization
export const FLATLIST_OPTIMIZATION = {
  // Rendering
  initialNumToRender: 10,
  maxToRenderPerBatch: 10,
  windowSize: 21, // Default is good

  // Updates
  removeClippedSubviews: Platform.OS === 'android',
  updateCellsBatchingPeriod: 50,

  // Keys
  getItemLayout: (data: any, index: number) => ({
    length: 80, // Adjust based on your item height
    offset: 80 * index,
    index,
  }),

  // Callbacks
  keyExtractor: (item: any, index: number) => item.id || `${index}`,
};

// Memory management
export class MemoryManager {
  private static timers: NodeJS.Timeout[] = [];
  private static intervals: NodeJS.Timeout[] = [];

  // Register timer for cleanup
  static registerTimer(timer: NodeJS.Timeout) {
    this.timers.push(timer);
  }

  // Register interval for cleanup
  static registerInterval(interval: NodeJS.Timeout) {
    this.intervals.push(interval);
  }

  // Clear all timers and intervals
  static cleanup() {
    this.timers.forEach(clearTimeout);
    this.intervals.forEach(clearInterval);
    this.timers = [];
    this.intervals = [];
  }
}

// Battery-aware animations
export const shouldReduceAnimations = (): boolean => {
  // In production, check device battery level
  // For now, return false (always show animations)
  // In real app, use expo-battery or similar
  return false;
};

// Lazy load components
export const lazyLoadComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> => {
  return React.lazy(importFunc);
};

// Performance monitoring
export class PerformanceMonitor {
  private static marks: Map<string, number> = new Map();

  static mark(name: string) {
    this.marks.set(name, Date.now());
  }

  static measure(name: string, startMark: string): number {
    const start = this.marks.get(startMark);
    if (!start) {
      console.warn(`Start mark "${startMark}" not found`);
      return 0;
    }

    const duration = Date.now() - start;
    console.log(`[Performance] ${name}: ${duration}ms`);
    return duration;
  }

  static clearMarks() {
    this.marks.clear();
  }
}

// Component rendering optimization
export const useRenderOptimization = () => {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    if (renderCount.current > 10) {
      console.warn('Component re-rendered more than 10 times');
    }
  });

  return {
    renderCount: renderCount.current,
    resetCount: () => {
      renderCount.current = 0;
    },
  };
};

// Network-aware operations
export const shouldUseHighQuality = (isOnline: boolean, isFastConnection: boolean): boolean => {
  return isOnline && isFastConnection;
};

// Image quality based on network
export const getImageQuality = (isOnline: boolean, isFastConnection: boolean): 'low' | 'medium' | 'high' => {
  if (!isOnline) return 'low';
  if (!isFastConnection) return 'medium';
  return 'high';
};

/**
 * Usage Examples:
 *
 * // Defer heavy operations
 * await runAfterInteractions(() => {
 *   // Heavy calculation
 * });
 *
 * // Debounce search input
 * const debouncedSearch = useDebounce(searchFunction, 300);
 *
 * // Throttle scroll handler
 * const throttledScroll = useThrottle(handleScroll, 100);
 *
 * // Memoize calculations
 * const expensiveCalc = memoize((data) => {
 *   // Heavy calculation
 * });
 *
 * // Monitor performance
 * PerformanceMonitor.mark('start');
 * // ... operations
 * PerformanceMonitor.measure('My Operation', 'start');
 */
