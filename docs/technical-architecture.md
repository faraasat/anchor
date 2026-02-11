# Technical Architecture & Implementation

## Architecture Overview

Anchor is built with a **modern, mobile-first architecture** emphasizing offline-first functionality, real-time sync, and delightful user experience through high-performance animations and thoughtful micro-interactions.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Mobile Clients                       │
│              (iOS, Android, Web via Expo)                │
│  ┌───────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │  React    │  │ Reanimated│  │  Local Storage     │  │
│  │  Native   │←→│     4     │  │  (AsyncStorage)    │  │
│  │  0.81.5   │  │  (60fps)  │  │  Offline Queue     │  │
│  └───────────┘  └──────────┘  └────────────────────┘  │
│         ↓              ↓                   ↓             │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Optimistic UI Layer                       │  │
│  │    (Instant feedback, background sync)            │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────┘
                      ↓
         ┌────────────────────────────┐
         │   Network Layer (HTTPS)    │
         └────────────┬───────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│                    Backend Services                      │
│  ┌───────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │ Supabase  │  │  Groq AI │  │    RevenueCat      │  │
│  │ PostgreSQL│  │  LLM API │  │  Subscriptions     │  │
│  │ Real-time │  │          │  │                    │  │
│  │   Auth    │  │          │  │                    │  │
│  └───────────┘  └──────────┘  └────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Edge Functions (Serverless)               │  │
│  │  - AI prompt orchestration                        │  │
│  │  - Webhook handlers (RevenueCat → Supabase)      │  │
│  │  - Background jobs (overdue reminders)           │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack Deep Dive

### Frontend Layer

#### Core Framework
- **React Native 0.81.5**: Cross-platform foundation
- **Expo 54**: Development tooling, OTA updates, managed workflow
- **TypeScript 5.9.2**: Type safety, improved DX, better refactoring

#### UI & Animations
- **React Native Reanimated 4**: 60fps animations on native thread
- **React Native Gesture Handler**: Native touch handling
- **Lottie React Native**: Vector animations for success moments
- **Expo Linear Gradient**: Smooth gradient backgrounds
- **Expo Blur**: Native blur effects for glassmorphism

#### Navigation & Routing
- **Expo Router 6**: File-based routing (like Next.js)
- **React Navigation 7**: Under the hood, tab navigation

#### State Management
- **React Context API**: Global state (auth, theme, household)
- **Custom Hooks**: Encapsulated state logic
- **Optimistic UI Pattern**: Instant feedback, background sync

### Backend Layer

#### Database & Authentication
- **Supabase PostgreSQL**: Relational database with Row Level Security (RLS)
- **Supabase Auth**: Email/password, OAuth, magic links
- **Supabase Realtime**: WebSocket subscriptions for live updates
- **Supabase Storage**: Avatar uploads, attachments (future)

**Schema Overview:**
```sql
-- Core tables
users (id, email, created_at, metadata)
reminders (id, user_id, title, due_date, status, priority, recurrence, context_triggers)
households (id, name, created_at)
household_members (household_id, user_id, role)
anchor_points (id, user_id, name, location, radius, type)
stacks (id, user_id, name, description, tasks, is_public, imports_count)

-- Premium features
subscriptions (id, user_id, status, platform, product_id)
ai_requests_log (id, user_id, request_type, tokens_used, created_at)
insights_cache (id, user_id, metric_type, value, calculated_at)
```

**RLS Policies:**
- Users can only read/write their own data
- Household members can read/write shared household reminders
- Public stacks readable by all, writable only by owner

#### AI & Intelligence Layer
- **Groq AI**: Ultra-fast LLM inference (llama-3.3-70b-versatile)
  - Voice command parsing
  - Smart scheduling suggestions
  - Burnout detection analysis
  - Evening reflection summaries
- **Custom Prompt Engineering**: Optimized prompts for < 1s response time
- **Fallback Strategies**: Cached responses if rate limited

#### Subscription Management
- **RevenueCat**: Cross-platform subscription management
  - iOS StoreKit 2 integration
  - Android Google Play Billing 5
  - Web Stripe integration
  - Webhook → Supabase sync for entitlements
- **Entitlement Checks**: Client-side caching, server-side validation

### Mobile-Specific APIs

#### Location & Context
- **Expo Location**: Geofencing, background location
- **Expo Task Manager**: Background location tracking
- **Weather Service**: OpenWeatherMap API for context

#### Notifications
- **Expo Notifications**: Local & push notifications
- **Custom Snooze Logic**: Timezone-aware scheduling
- **Notification Actions**: Complete, snooze from notification

#### Device Integration
- **Expo Calendar**: Read calendar events for conflict detection
- **Expo Sensors**: Gyroscope for parallax backgrounds
- **Expo Haptics**: Carefully choreographed vibrations

#### Wellness Features
- **Expo AV** (deprecated): Audio for meditation timer (migrating to expo-audio)
- **Expo Image Picker**: Profile avatars, photo tasks
- **AsyncStorage**: Water tracking, meditation sessions

---

## RevenueCat Implementation

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Mobile App                           │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │          React Native Purchases                     │ │
│  │  - Configure on app launch                          │ │
│  │  - Identify user (Supabase user ID)                │ │
│  │  - Fetch offerings & products                       │ │
│  │  - Handle purchase flow                             │ │
│  │  - Check entitlements                               │ │
│  └────────────────────────────────────────────────────┘ │
│                         ↓ ↑                              │
│  ┌────────────────────────────────────────────────────┐ │
│  │          EntitlementCache (Local)                   │ │
│  │  - 5-minute TTL                                     │ │
│  │  - Optimistic unlock for premium features          │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────┘
                          ↓
                ┌─────────────────────┐
                │    RevenueCat API   │
                │  - Verify purchases  │
                │  - Sync entitlements │
                │  - Handle refunds    │
                └──────────┬──────────┘
                          ↓
                ┌─────────────────────┐
                │  RevenueCat Webhook │
                │  → Supabase Edge Fn │
                └──────────┬──────────┘
                          ↓
                ┌─────────────────────┐
                │  Supabase Database  │
                │  subscriptions table│
                │  - status           │
                │  - expires_at       │
                │  - platform         │
                └─────────────────────┘
```

### Configuration

**Products Configuration:**

```typescript
// RevenueCat Dashboard Setup
{
  products: [
    {
      id: "anchor_pro_monthly",
      price: "$6.99",
      period: "1 month",
      entitlement: "pro"
    },
    {
      id: "anchor_pro_annual",
      price: "$59.99",
      period: "1 year",
      entitlement: "pro",
      introductory: "7-day free trial"
    },
    {
      id: "anchor_family_annual",
      price: "$99.99",
      period: "1 year",
      entitlement: "family"
    }
  ],
  entitlements: {
    "pro": ["unlimited_ai", "advanced_insights", "community_hub"],
    "family": ["unlimited_ai", "advanced_insights", "community_hub", "family_sharing"]
  }
}
```

### Implementation Code

**Initialization (app/_layout.tsx):**

```typescript
import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

useEffect(() => {
  async function setupRevenueCat() {
    if (Platform.OS === 'ios') {
      await Purchases.configure({
        apiKey: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY!
      });
    } else if (Platform.OS === 'android') {
      await Purchases.configure({
        apiKey: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY!
      });
    }
    
    // Set user ID for cross-device entitlement sync
    if (user?.id) {
      await Purchases.logIn(user.id);
    }
  }
  
  setupRevenueCat();
}, [user]);
```

**Purchase Flow (components/PaywallModal.tsx):**

```typescript
const handlePurchase = async (productId: string) => {
  try {
    setIsProcessing(true);
    
    // Fetch offerings
    const offerings = await Purchases.getOfferings();
    const product = offerings.current?.availablePackages.find(
      pkg => pkg.product.identifier === productId
    );
    
    if (!product) throw new Error('Product not found');
    
    // Purchase
    const { customerInfo } = await Purchases.purchasePackage(product);
    
    // Check entitlements (instant)
    const isPro = customerInfo.entitlements.active['pro'] !== undefined;
    
    if (isPro) {
      // Sync to Supabase in background
      await syncSubscriptionToSupabase(customerInfo);
      
      // Update local state
      setProStatus(true);
      
      // Celebrate
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showSuccessAnimation();
    }
    
  } catch (error) {
    if (error.userCancelled) {
      // User tapped "Cancel" - silent fail
      return;
    }
    Alert.alert('Purchase Failed', error.message);
  } finally {
    setIsProcessing(false);
  }
};
```

**Entitlement Checks (hooks/useProStatus.ts):**

```typescript
export function useProStatus() {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  
  useEffect(() => {
    async function checkStatus() {
      try {
        // Check local cache first
        const cached = await AsyncStorage.getItem('pro_status');
        if (cached) {
          const { isPro, expiresAt } = JSON.parse(cached);
          if (new Date(expiresAt) > new Date()) {
            setIsPro(isPro);
            setIsLoading(false);
            // Refresh in background
            refreshFromRevenueCat();
            return;
          }
        }
        
        // Fetch from RevenueCat
        await refreshFromRevenueCat();
        
      } catch (error) {
        console.error('Pro status check failed:', error);
        setIsLoading(false);
      }
    }
    
    async function refreshFromRevenueCat() {
      const customerInfo = await Purchases.getCustomerInfo();
      const hasProEntitlement = customerInfo.entitlements.active['pro'] !== undefined;
      const hasFamilyEntitlement = customerInfo.entitlements.active['family'] !== undefined;
      
      const isPro = hasProEntitlement || hasFamilyEntitlement;
      const expiresAt = hasProEntitlement 
        ? customerInfo.entitlements.active['pro'].expirationDate
        : hasFamilyEntitlement
        ? customerInfo.entitlements.active['family'].expirationDate
        : null;
      
      setIsPro(isPro);
      setExpiresAt(expiresAt ? new Date(expiresAt) : null);
      
      // Cache for 5 minutes
      await AsyncStorage.setItem('pro_status', JSON.stringify({
        isPro,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      }));
      
      setIsLoading(false);
    }
    
    checkStatus();
    
    // Refresh on app foreground
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshFromRevenueCat();
      }
    });
    
    return () => subscription.remove();
  }, []);
  
  return { isPro, isLoading, expiresAt };
}
```

**Webhook Handler (Supabase Edge Function):**

```typescript
// supabase/functions/revenuecat-webhook/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const payload = await req.json();
  const { event } = payload;
  
  // Verify webhook signature
  const signature = req.headers.get('X-RevenueCat-Signature');
  if (!verifySignature(signature, payload)) {
    return new Response('Invalid signature', { status: 401 });
  }
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  const { app_user_id, product_id, purchase_date, expiration_date, is_trial } = event;
  
  // Upsert subscription
  await supabase.from('subscriptions').upsert({
    user_id: app_user_id,
    product_id,
    status: 'active',
    platform: event.store,
    purchased_at: purchase_date,
    expires_at: expiration_date,
    is_trial,
    updated_at: new Date().toISOString()
  });
  
  // Handle specific events
  switch (event.type) {
    case 'INITIAL_PURCHASE':
      await sendWelcomeEmail(app_user_id);
      break;
    case 'RENEWAL':
      // Update streak, send thank you
      break;
    case 'CANCELLATION':
      await sendCancellationSurvey(app_user_id);
      break;
    case 'BILLING_ISSUE':
      await sendPaymentFailureEmail(app_user_id);
      break;
  }
  
  return new Response('OK', { status: 200 });
});
```

### Limited Mode Implementation

**AI Request Limiting (services/LimitedModeService.ts):**

```typescript
export class LimitedModeService {
  static async canUseAIFeature(userId: string): Promise<boolean> {
    const { isPro } = await checkProStatus(userId);
    if (isPro) return true;
    
    // Free users: 5 AI requests per day
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('ai_requests_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', today);
    
    return count < 5;
  }
  
  static async incrementAIRequestCount(userId: string): Promise<void> {
    await supabase.from('ai_requests_log').insert({
      user_id: userId,
      request_type: 'voice_command',
      created_at: new Date().toISOString()
    });
  }
}
```

---

## Data Flow Examples

### 1. Creating a Reminder (Optimistic UI)

```typescript
// User taps "Save" button
1. Update UI immediately (optimistic)
   - Add reminder to local state
   - Show success animation
   - Close modal

2. Background sync
   - Check network connectivity
   - POST to Supabase API
   - If success: no-op (UI already updated)
   - If failure: 
     - Add to offline queue
     - Show subtle "Syncing..." indicator
     - Retry on reconnection

3. Real-time broadcast
   - Supabase broadcasts change via WebSocket
   - All connected devices receive update
   - Household members see new shared task
```

### 2. Voice Command Processing

```typescript
// User speaks: "Remind me to buy coffee when I'm near a grocery store"

1. Speech-to-text (device native API)
2. Send text to Groq AI with prompt:
   ```
   Parse this reminder into structured data:
   - title (string)
   - location trigger (if any)
   - due date/time
   - recurrence pattern
   - priority
   
   Input: "{user_text}"
   Output: JSON
   ```
3. Receive parsed data (< 1s with Groq)
4. Pre-fill reminder form with parsed data
5. User confirms or edits
6. Save as normal reminder flow
```

### 3. Location-Based Reminder Trigger

```typescript
// Background geofencing
1. Expo Task Manager monitors location
2. When enters anchor point radius (100m default):
   - Fetch pending reminders for this location
   - Check time window (e.g., morning/afternoon)
   - Check weather (skip if "outdoor" + raining)
   - Check calendar (skip if in meeting)
3. If all conditions met:
   - Fire local notification
   - Log trigger event for insights
   - Update reminder status to "triggered"
```

---

## Performance Optimizations

### Animation Performance
- **Reanimated worklets**: Run animations on native thread (60fps guaranteed)
- **Memoization**: useMemo, useCallback for expensive renders
- **Lazy loading**: Components load on-demand (React.lazy + Suspense)
- **Image optimization**: Expo Image with blurhash placeholders

### Network Optimization
- **Optimistic UI**: Instant feedback, sync in background
- **Request batching**: Batch multiple updates into single API call
- **Caching**: 5-minute TTL for entitlements, 1-hour for insights
- **Offline queue**: Store failed requests, retry on reconnection

### Database Optimization
- **Indexes**: On user_id, due_date, status for fast queries
- **Materialized views**: Pre-computed insights (refreshed daily)
- **Connection pooling**: Supabase Pooler for high concurrency
- **Row Level Security**: Security without performance hit (Postgres)

---

## Security & Privacy

### Authentication
- **Supabase Auth**: Industry-standard OAuth 2.0 + JWT
- **Secure storage**: Tokens stored in iOS Keychain / Android Keystore
- **Biometric unlock**: Face ID / Touch ID optional

### Data Encryption
- **In transit**: TLS 1.3 for all API calls
- **At rest**: Supabase encrypts all data (AES-256)
- **Local storage**: AsyncStorage is sandboxed per app

### Privacy Features
- **Privacy Veil**: Blur sensitive content in app switcher
- **Local mode**: All data stored locally, zero sync (optional)
- **Minimal analytics**: No tracking, only crash reports (opt-in)

---

## Deployment & CI/CD

### Build Pipeline
```bash
# Development
yarn start → Expo Go (instant preview)

# Staging
eas build --profile preview --platform all → TestFlight / Internal Testing

# Production
eas build --profile production --platform all → App Store / Google Play
eas submit --platform all → Automated submission
```

### OTA Updates (Expo Updates)
- **Config changes**: Instant (no app store review)
- **JavaScript/TypeScript**: Instant deployment
- **Native code changes**: Requires new build
- **Rollback**: Instant revert to previous version

### Monitoring
- **Sentry**: Crash reporting, error tracking
- **Expo Analytics**: Usage metrics, screen views
- **RevenueCat Dashboard**: Subscription analytics
- **Supabase Logs**: Database queries, API errors

---

## Conclusion

Anchor's architecture prioritizes **user experience above all else**:

✅ **Offline-first**: Works without network, syncs when available  
✅ **60fps animations**: Reanimated on native thread  
✅ **Instant feedback**: Optimistic UI patterns  
✅ **Secure by default**: RLS, encryption, minimal data collection  
✅ **Scalable**: Serverless architecture, edge functions  
✅ **Cost-effective**: Supabase free tier covers 50k users, Groq AI at $0.05/1M tokens  

The combination of React Native + Expo + Supabase + RevenueCat provides a **battle-tested tech stack** used by companies like Duolingo, Clubhouse, and countless indie success stories. This allows rapid feature development while maintaining production-grade reliability.
