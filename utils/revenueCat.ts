// RevenueCat Integration for Anchor Pro
import Purchases, { PurchasesOffering, PurchasesPackage, CustomerInfo } from 'react-native-purchases';
import { Platform } from 'react-native';

const API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || '';

export interface ProFeatures {
  crossPlatformSync: boolean;
  advancedAI: boolean;
  unlimitedReminders: boolean;
  customThemes: boolean;
  prioritySupport: boolean;
}

export const initRevenueCat = async (): Promise<void> => {
  if (!API_KEY) {
    console.warn('RevenueCat API key not configured');
    return;
  }

  try {
    await Purchases.configure({ apiKey: API_KEY });
    console.log('RevenueCat initialized');
  } catch (error) {
    console.error('RevenueCat initialization error:', error);
  }
};

export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('Error fetching offerings:', error);
    return null;
  }
};

export const purchasePackage = async (pkg: PurchasesPackage): Promise<CustomerInfo | null> => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (error: any) {
    if (!error.userCancelled) {
      console.error('Purchase error:', error);
    }
    return null;
  }
};

export const restorePurchases = async (): Promise<CustomerInfo | null> => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return customerInfo;
  } catch (error) {
    console.error('Restore error:', error);
    return null;
  }
};

export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('Error fetching customer info:', error);
    return null;
  }
};

export const isProUser = async (): Promise<boolean> => {
  try {
    const customerInfo = await getCustomerInfo();
    if (!customerInfo) return false;

    return Boolean(customerInfo.entitlements.active['pro']);
  } catch (error) {
    console.error('Error checking pro status:', error);
    return false;
  }
};

export const loginUser = async (userId: string): Promise<void> => {
  try {
    await Purchases.logIn(userId);
  } catch (error) {
    console.error('Error logging in user:', error);
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await Purchases.logOut();
  } catch (error) {
    console.error('Error logging out user:', error);
  }
};

// Mock offerings for demo when API key is not configured
export const getMockOfferings = () => ({
  identifier: 'default',
  serverDescription: 'Default Offering',
  availablePackages: [
    {
      identifier: '$rc_monthly',
      packageType: 'MONTHLY',
      product: {
        identifier: 'anchor_pro_monthly',
        description: 'Anchor Pro Monthly Subscription',
        title: 'Anchor Pro Monthly',
        price: 6.99,
        priceString: '$6.99',
        currencyCode: 'USD',
      },
    },
    {
      identifier: '$rc_annual',
      packageType: 'ANNUAL',
      product: {
        identifier: 'anchor_pro_annual',
        description: 'Anchor Pro Annual Subscription',
        title: 'Anchor Pro Annual',
        price: 59.99,
        priceString: '$59.99',
        currencyCode: 'USD',
      },
    },
    {
      identifier: '$rc_annual_family',
      packageType: 'ANNUAL',
      product: {
        identifier: 'anchor_family_annual',
        description: 'Anchor Family Annual Subscription - Up to 5 members',
        title: 'Anchor Family Annual',
        price: 99.99,
        priceString: '$99.99',
        currencyCode: 'USD',
      },
    },
  ],
});

export const getProFeatures = (): ProFeatures => ({
  crossPlatformSync: true,
  advancedAI: true,
  unlimitedReminders: true,
  customThemes: true,
  prioritySupport: true,
});
