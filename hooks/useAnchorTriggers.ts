// useAnchorTriggers Hook - Monitor and respond to physical anchor triggers
// Phase 1: Seamless environmental awareness with premium haptics
import { useEffect, useRef, useState } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AnchorPointsService, AnchorPoint } from '@/services/AnchorPointsService';

export interface TriggerEvent {
  point: AnchorPoint;
  timestamp: Date;
}

export function useAnchorTriggers(userId: string | null, enabled: boolean = true) {
  const [lastTrigger, setLastTrigger] = useState<TriggerEvent | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const listenerRef = useRef<(() => void) | null>(null);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!userId || !enabled || Platform.OS === 'web') {
      return;
    }

    // Initialize monitoring
    setIsMonitoring(true);

    // Add listener for anchor point triggers
    const removeListener = AnchorPointsService.addListener((point) => {
      handleTrigger(point);
    });

    listenerRef.current = removeListener;

    // Monitor app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      removeListener();
      subscription.remove();
      setIsMonitoring(false);
    };
  }, [userId, enabled]);

  const handleTrigger = async (point: AnchorPoint) => {
    // Create trigger event
    const event: TriggerEvent = {
      point,
      timestamp: new Date(),
    };

    setLastTrigger(event);

    // Premium haptic sequence for trigger detection
    await playTriggerHaptics(point.type);

    // Log trigger (for analytics)
    console.log('Anchor point triggered:', {
      name: point.name,
      type: point.type,
      action: point.actionType,
    });
  };

  const playTriggerHaptics = async (type: 'nfc' | 'bluetooth') => {
    if (Platform.OS === 'web') return;

    try {
      if (type === 'nfc') {
        // NFC: Sharp, precise haptic
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setTimeout(async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }, 100);
      } else {
        // Bluetooth: Smooth connection haptic
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error playing haptics:', error);
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    // Detect when app comes to foreground
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground - check for pending triggers
      console.log('App activated - checking for triggers');
    }

    appState.current = nextAppState;
  };

  const clearLastTrigger = () => {
    setLastTrigger(null);
  };

  return {
    lastTrigger,
    isMonitoring,
    clearLastTrigger,
  };
}
