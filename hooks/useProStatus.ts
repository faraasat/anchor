// Hook for tracking Pro subscription status
import { useState, useEffect } from 'react';
import { isProUser, getCustomerInfo, initRevenueCat } from '@/utils/revenueCat';

export function useProStatus() {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAndCheck();
  }, []);

  const initializeAndCheck = async () => {
    try {
      await initRevenueCat();
      // Small delay to ensure initialization completes
      await new Promise(resolve => setTimeout(resolve, 100));
      await checkProStatus();
    } catch (error) {
      console.warn('RevenueCat initialization failed:', error);
      setIsLoading(false);
      setIsPro(false);
    }
  };

  const checkProStatus = async () => {
    setIsLoading(true);
    try {
      const proStatus = await isProUser();
      setIsPro(proStatus);
    } catch (error) {
      console.warn('Error checking pro status:', error);
      setIsPro(false);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProStatus = () => {
    checkProStatus();
  };

  return { isPro, isLoading, refreshProStatus };
}
