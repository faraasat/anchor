# Anchor - Quick Start Guide (Phases 13-16)

## 🚀 New Features Overview

Your Anchor app now has powerful new capabilities:

### 1. 🤝 Collaborative Stacks
Share routines with friends and edit together in real-time.

**How to use:**
```tsx
import CollaborativeStackModal from '@/components/CollaborativeStackModal';

// In your component
<CollaborativeStackModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  userId={userId}
/>
```

### 2. 🌐 Community Gallery
Discover, follow creators, and share routines.

**How to use:**
```tsx
import EnhancedCommunityGallery from '@/components/EnhancedCommunityGallery';

<EnhancedCommunityGallery
  userId={userId}
  onStackSelect={(stackId) => console.log('Selected:', stackId)}
/>
```

### 3. 🌿 Garden Visiting
View friends' productivity gardens with privacy controls.

**How to use:**
```tsx
import GardenVisitingModal from '@/components/GardenVisitingModal';

<GardenVisitingModal
  visible={showGarden}
  onClose={() => setShowGarden(false)}
  userId={userId}
  ownerId={friendId}
  ownerName="Friend Name"
/>
```

### 4. 🧠 AI Neural Coach
Get weekly energy reports and burnout detection.

**How to use:**
```tsx
import NeuralCoachModal from '@/components/NeuralCoachModal';

<NeuralCoachModal
  visible={showCoach}
  onClose={() => setShowCoach(false)}
  userId={userId}
  onThemeShift={(theme) => {
    // Handle theme shift (recovery mode)
  }}
/>
```

### 5. 📅 Calendar Integration
Sync with Apple Calendar and Google Calendar.

**How to use:**
```typescript
import { getCalendarSyncService } from '@/lib/calendarSync';

const calendarService = getCalendarSyncService(userId);

// Sync calendar
await calendarService.syncToSupabase();

// Get upcoming events
const events = await calendarService.getUpcomingEvents(24);
```

### 6. 💪 Health Integration
Connect Apple Health or Google Fit.

**How to use:**
```typescript
import { getHealthSyncService } from '@/lib/healthSync';

const healthService = getHealthSyncService(userId);

// Sync health data
await healthService.syncHealthData();

// Get today's summary
const summary = await healthService.getTodayHealthSummary();
```

### 7. 📡 Offline Support
Work offline with automatic sync.

**How to use:**
```typescript
import { getOfflineSyncManager } from '@/lib/offlineSync';

const syncManager = getOfflineSyncManager(userId);

// Operations automatically queue when offline
// Manual sync
await syncManager.forceSyncNow();
```

### 8. 🌍 Timezone Support
Reminders adapt to your timezone automatically.

**How to use:**
```typescript
import { initializeTimezoneMonitoring } from '@/lib/timezoneReminders';

// Initialize on app start
await initializeTimezoneMonitoring(userId);
// Everything else is automatic!
```

---

## 🎯 Quick Integration

### All-in-One Hook
Use the advanced integrations hook for easy access:

```typescript
import { useAdvancedIntegrations } from '@/hooks/useAdvancedIntegrations';

function MyComponent() {
  const {
    isInitialized,
    status,
    syncCalendar,
    syncHealth,
    forceOfflineSync,
  } = useAdvancedIntegrations();

  return (
    <View>
      {/* Status display */}
      <Text>Calendar events: {status.calendar.upcomingEvents}</Text>
      <Text>Health score: {status.health.todayScore}</Text>
      <Text>Offline queue: {status.offline.queueCount}</Text>

      {/* Actions */}
      <Button title="Sync Calendar" onPress={syncCalendar} />
      <Button title="Sync Health" onPress={syncHealth} />
      <Button title="Force Sync" onPress={forceOfflineSync} />
    </View>
  );
}
```

### Offline Indicator
Show sync status to users:

```tsx
import OfflineIndicator from '@/components/OfflineIndicator';

<OfflineIndicator
  isOnline={status.offline.isOnline}
  queueCount={status.offline.queueCount}
  isSyncing={status.offline.isSyncing}
  onPress={forceOfflineSync}
/>
```

---

## 🔧 Configuration

### 1. Database Setup
Already done! Tables created:
- shared_stacks
- stack_collaborators
- user_followers
- garden_visits
- energy_reports
- health_data
- calendar_events
- offline_sync_queue

### 2. Permissions (if needed)
For calendar and health features, update app.json:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCalendarsUsageDescription": "Sync events with Anchor",
        "NSHealthShareUsageDescription": "Enhance productivity insights"
      }
    },
    "android": {
      "permissions": [
        "READ_CALENDAR",
        "WRITE_CALENDAR",
        "ACTIVITY_RECOGNITION"
      ]
    }
  }
}
```

### 3. Dependencies
Already installed:
- @react-native-community/netinfo (for offline detection)
- All other dependencies were already present

---

## 📱 User Features

### For End Users:

1. **Share Routines**: Create collaborative stacks and invite friends
2. **Follow Creators**: Discover and follow top routine creators
3. **Visit Gardens**: See friends' productivity visualized as gardens
4. **AI Coaching**: Get weekly reports and burnout warnings
5. **Smart Schedule**: AI re-prioritizes tasks based on context
6. **Calendar Sync**: Events automatically sync with your calendar
7. **Health Boost**: Physical activity boosts your digital garden
8. **Work Offline**: Changes sync automatically when back online
9. **Travel Safe**: Reminders adjust to your timezone

### Privacy Controls:
- ✅ Only followers can visit your garden
- ✅ Household members have automatic access
- ✅ Public/private stack visibility
- ✅ All data encrypted in transit

---

## 🎨 UI Components Reference

### Modals
- `CollaborativeStackModal` - Create/edit shared stacks
- `EnhancedCommunityGallery` - Browse community content
- `GardenVisitingModal` - View friend's garden
- `NeuralCoachModal` - AI coaching interface

### Indicators
- `OfflineIndicator` - Sync status display

### Utilities
- `calendarSync.ts` - Calendar operations
- `healthSync.ts` - Health data operations
- `offlineSync.ts` - Offline queue management
- `timezoneReminders.ts` - Timezone handling
- `performanceOptimizations.ts` - Performance helpers

---

## 🐛 Troubleshooting

### Calendar Not Syncing
```typescript
// Check permissions
const hasPermission = await calendarService.requestPermissions();
if (!hasPermission) {
  // Guide user to enable calendar permissions
}
```

### Health Data Not Appearing
```typescript
// Verify health service initialization
const healthService = getHealthSyncService(userId);
const summary = await healthService.getTodayHealthSummary();
console.log('Health data:', summary);
```

### Offline Queue Growing
```typescript
// Check network status
const syncManager = getOfflineSyncManager(userId);
const status = syncManager.getQueueStatus();
console.log('Online:', status.isOnline);
console.log('Queue:', status.count);

// Force sync
if (status.isOnline) {
  await syncManager.forceSyncNow();
}
```

### Timezone Issues
```typescript
// Check current timezone
const tzManager = getTimezoneReminderManager(userId);
const currentTz = tzManager.getCurrentTimezone();
console.log('Current timezone:', currentTz);

// Manually trigger reschedule
await tzManager.rescheduleAllReminders();
```

---

## 📊 Performance Tips

### 1. Animations
```typescript
import { ANIMATION_CONFIGS } from '@/lib/performanceOptimizations';

// Use standard config for most animations
const animatedStyle = useAnimatedStyle(() => ({
  opacity: withTiming(visible ? 1 : 0, ANIMATION_CONFIGS.standard),
}));
```

### 2. Lists
```typescript
import { FLATLIST_OPTIMIZATION } from '@/lib/performanceOptimizations';

<FlatList
  {...FLATLIST_OPTIMIZATION}
  data={items}
  renderItem={renderItem}
/>
```

### 3. Lottie
```typescript
import { LOTTIE_OPTIMIZATION } from '@/lib/performanceOptimizations';

<LottieView
  {...LOTTIE_OPTIMIZATION}
  source={require('./animation.json')}
/>
```

### 4. Images
```typescript
import { IMAGE_OPTIMIZATION } from '@/lib/performanceOptimizations';

<Image
  {...IMAGE_OPTIMIZATION}
  source={{ uri: imageUrl }}
/>
```

---

## 🔒 Security Best Practices

1. **Always use RLS**: All tables have Row Level Security
2. **Never expose keys**: Use environment variables
3. **Validate inputs**: Check user input before saving
4. **Privacy first**: Respect user privacy settings
5. **Secure connections**: All API calls use HTTPS

---

## 🎓 Learning Resources

### Documentation
- See `PHASE_13_16_FEATURES.md` for detailed feature docs
- See `IMPLEMENTATION_SUMMARY.md` for technical details
- Check inline code comments for usage examples

### External Docs
- Newell AI: https://newell.fastshot.ai/docs
- Supabase: https://supabase.com/docs
- Expo: https://docs.expo.dev

---

## ✅ Quick Test Checklist

- [ ] Create a shared stack
- [ ] Invite a collaborator
- [ ] View in community gallery
- [ ] Follow another user
- [ ] Visit a friend's garden
- [ ] Open Neural Coach
- [ ] Sync calendar
- [ ] Sync health data
- [ ] Turn off WiFi and create reminder (offline test)
- [ ] Turn on WiFi and verify sync
- [ ] Change timezone and check reminders

---

## 🎉 You're Ready!

All features are implemented and ready to use. The app now has:
- ✅ Real-time collaboration
- ✅ AI-powered coaching
- ✅ Calendar & health integration
- ✅ Offline support
- ✅ Timezone resilience
- ✅ Optimized performance

**Start building amazing productivity experiences!** 🚀

---

*For questions or issues, refer to the comprehensive documentation in:*
- `PHASE_13_16_FEATURES.md`
- `IMPLEMENTATION_SUMMARY.md`
