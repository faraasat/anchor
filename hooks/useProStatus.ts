// Hook for tracking Pro subscription status
import { useState, useEffect } from 'react';
import { isProUser, getCustomerInfo, initRevenueCat } from '@/utils/revenueCat';

export function useProStatus() {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkProStatus();
    initRevenueCat();
  }, []);

  const checkProStatus = async () => {
    setIsLoading(true);
    const proStatus = await isProUser();
    setIsPro(proStatus);
    setIsLoading(false);
  };

  const refreshProStatus = () => {
    checkProStatus();
  };

  return { isPro, isLoading, refreshProStatus };
}
