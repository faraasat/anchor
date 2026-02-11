# Phase 8: The Ecosystem & Collective Intelligence - Implementation Guide

## Overview

Phase 8 transforms Anchor into a collaborative and insight-driven platform with advanced AI analytics, gamification, and social features. This implementation provides a professional, high-end experience with "Editorial Perfection" design principles.

## ✅ Implemented Features

### 1. **Shared Circles & Family Mode** ✓

#### Role-Based Permissions
- **Service**: `CirclePermissionsService.ts`
- **Roles**:
  - **Owner**: Full control (edit, complete, assign, invite, delete, view sensitive)
  - **Editor**: Can add/edit/complete tasks
  - **Viewer**: Read-only access
- **UI**: Enhanced Circle Detail screen (`circle/[id]-enhanced.tsx`)

#### Chore Rotation System
- **Service**: `ChoreRotationService.ts`
- **Features**:
  - Automatic task assignment cycling
  - Rotation types: `completion`, `weekly`, `daily`, `custom`
  - Configurable rotation schedules
  - Auto-rotation triggers on task completion
- **Database**: `chore_rotations` table

#### Activity Halos & Overlapping Avatars
- **Components**:
  - `ActivityHaloAvatar.tsx` - Individual avatar with glowing halo
  - `OverlappingAvatars.tsx` - Multiple members with overlapping avatars
- **Features**:
  - Pulsing glow animation for active members
  - Color-coded based on user ID
  - Intensity based on recent completion count
  - Activity badge showing completion count

#### Gentle Nudges
- **Database**: `gentle_nudges` table
- **Service**: Database function `generate_gentle_nudge()`
- **Features**:
  - Owner notifications for missed critical tasks
  - Priority levels: `critical`, `high`, `medium`
  - Status tracking: `pending`, `notified`, `acknowledged`, `resolved`

### 2. **AI Insights Lab (Pro Features)** ✓

#### Procrastination Profiler
- **Service**: `ProcrastinationProfilerService.ts`
- **Features**:
  - Analyzes snooze patterns by category
  - Calculates procrastination score (0-100)
  - Identifies peak procrastination time
  - AI-powered suggestions using Newell AI
  - Category-specific delay metrics
- **Component**: Integrated in `insights-pro.tsx`

#### Backlog Risk Score & Health Meter
- **Service**: `BacklogRiskService.ts`
- **Component**: `BacklogHealthMeter.tsx`
- **Features**:
  - Risk levels: `healthy`, `moderate`, `concerning`, `critical`
  - Metrics: pending count, overdue count, average age, completion rate
  - Visual health meter with color coding
  - AI-powered recommendations (defer, delete, reschedule, delegate)
  - "Purge Session" for critical overload

#### Productivity Peaks Chart
- **Component**: `ProductivityPeaksChart.tsx`
- **Features**:
  - Thin-line SVG chart showing hourly completion rates
  - Peak time identification
  - Gradient area under curve
  - Interactive time labels
  - Summary stats: peak time, peak rate, avg tasks

### 3. **Pattern Detection & Habit Suggestions** ✓

- **Service**: `PatternDetectionService.ts`
- **Pattern Types**:
  - **Time-based**: "You usually complete X on Thursdays"
  - **Sequence-based**: "You often do X after Y"
  - **Frequency-based**: "You X every 3 days"
- **Features**:
  - Confidence scoring (0-1)
  - Historical data tracking
  - AI-enhanced suggestions using Newell AI
  - Auto-filter by confidence threshold (≥70%)
  - One-tap reminder creation from patterns

### 4. **Anchor Streaks & Rewards** ✓

#### Streak System
- **Service**: `AnchorStreakService.ts`
- **Database**: `anchor_streaks` table
- **Features**:
  - Current streak tracking
  - Longest streak record
  - Total completions count
  - Streak start date tracking
  - Automatic streak breaks on missed days

#### Reward System
- **Milestones**:
  - 7 days: Bronze Badge 🥉
  - 14 days: Silver Icon Pack
  - 30 days: Gold Badge 🥇 + Cream Paper Tint
  - 60 days: Platinum Icon Pack (Pro) + Sage Tint (Pro)
  - 90 days: Diamond Badge 💎 (Pro)
  - 180 days: Master Theme Pack (Pro)
  - 365 days: Legendary Badge 👑 (Pro)
- **Types**: Icons, Paper Tints, Themes
- **Gating**: Premium rewards require Anchor Pro

### 5. **Enhanced UI Screens** ✓

#### AI Insights Lab Pro (`insights-pro.tsx`)
- Comprehensive analytics dashboard
- Procrastination Profile card
- Backlog Health Meter
- Productivity Peaks chart
- Pattern Suggestions
- Anchor Streak widget
- Pro badge indicator
- Upgrade prompt for free users

#### Enhanced Circle Detail (`circle/[id]-enhanced.tsx`)
- Members list with Activity Halos
- Overlapping avatars preview
- Role management (Owner only)
- Chore Rotations list
- Permissions display
- Real-time activity indicators

### 6. **Database Schema** ✓

All database migrations are in `supabase/migrations/phase8_ecosystem.sql`:
- `chore_rotations` - Chore rotation configurations
- `gentle_nudges` - Missed task notifications
- `anchor_streaks` - User streak data
- `community_templates` - Template library
- `procrastination_profiles` - Cached analysis
- `pattern_detections` - Habit patterns
- `privacy_settings` - User privacy preferences
- `user_subscriptions` - Pro tier tracking

## 📋 Remaining Implementation

### 1. **Template Library Enhancements**
**Status**: Partial (basic templates exist in `templates.tsx`)

**TODO**:
- [ ] Add AI-powered scheduling when importing templates
- [ ] Integrate `newell.chat.ask()` to analyze user's calendar
- [ ] Suggest optimal times/days for imported tasks
- [ ] Create community submission system
- [ ] Add template rating and favorites
- [ ] Implement template search and filtering

**Files to Update**:
- `app/templates.tsx` - Add AI scheduling logic
- Create `services/TemplateSchedulingService.ts`

### 2. **Privacy & Auto-Expire Features**
**Status**: Database ready, service needed

**TODO**:
- [ ] Create `PrivacyModeService.ts`
- [ ] Implement auto-expire for sensitive reminders
- [ ] Add Privacy Mode toggle in settings
- [ ] Mask specified tags/circles in UI
- [ ] Biometric lock integration

**Implementation**:
```typescript
// services/PrivacyModeService.ts
export class PrivacyModeService {
  static async enablePrivacyMode(userId: string, settings: AutoExpireSettings): Promise<void>
  static async checkAndExpire(reminderId: string): Promise<void>
  static async maskSensitiveData(reminder: Reminder, settings: PrivacySettings): Reminder
}
```

### 3. **RevenueCat Integration**
**Status**: Database schema ready, SDK integration needed

**TODO**:
- [ ] Initialize RevenueCat SDK in `app/_layout.tsx`
- [ ] Create `services/SubscriptionService.ts`
- [ ] Configure products and entitlements via RevenueCat MCP tools
- [ ] Implement paywall UI
- [ ] Add subscription status checks
- [ ] Gate Pro features behind entitlements
- [ ] Test purchases with test store

**RevenueCat Setup**:
```typescript
// Use revenuecat skill for setup
// Project ID: projdc109aac
// App ID: appdc08d90381

// Example product configuration:
// - Product ID: anchor_pro_monthly
// - Entitlement ID: pro
// - Price: $4.99/month
```

**Implementation**:
```typescript
// services/SubscriptionService.ts
import Purchases from 'react-native-purchases';

export class SubscriptionService {
  static async initialize(): Promise<void>
  static async isPro(): Promise<boolean>
  static async presentPaywall(): Promise<void>
  static async restorePurchases(): Promise<void>
  static async getActiveEntitlements(): Promise<string[]>
}
```

### 4. **Gentle Nudges UI**
**Status**: Database and service ready, UI needed

**TODO**:
- [ ] Create `components/GentleNudgeCard.tsx`
- [ ] Add nudges section to Circle Owner's dashboard
- [ ] Implement notification UI
- [ ] Add acknowledge/dismiss actions
- [ ] Show unread nudge count badge

### 5. **Near You Panel Enhancement**
**Status**: Basic version exists, needs Phase 8 features

**TODO**:
- [ ] Integrate with Pattern Detection
- [ ] Show habit-based suggestions in Near You panel
- [ ] Add "Suggested based on location history" feature
- [ ] Connect with local events API

### 6. **Community Hub**
**Status**: Database schema ready, UI needed

**TODO**:
- [ ] Create `app/community-hub.tsx`
- [ ] Implement template browsing gallery
- [ ] Add template submission form
- [ ] Create template rating system
- [ ] Add download tracking
- [ ] Implement search and filters

## 🎨 Design System Compliance

All Phase 8 features follow the "Editorial Perfection" design principles:

### Visual Elements
- ✅ Soft paper textures via `SoftPaperSkeleton`
- ✅ Tactile haptic feedback on all interactions
- ✅ Smooth spring animations (`.springify()`)
- ✅ Professional gradient accents
- ✅ Consistent typography and spacing
- ✅ Shadow depth system

### Animations
- ✅ Activity Halo pulsing (1s intervals)
- ✅ Fade-in transitions (`FadeInDown`)
- ✅ Spring-based item reveals
- ✅ Completion celebration animations
- ✅ Ink bleed theme transitions

### Accessibility
- ✅ Proper touch targets (44x44 minimum)
- ✅ Color contrast ratios
- ✅ Screen reader support
- ✅ Haptic feedback alternatives

## 🚀 Usage Examples

### 1. Create a Circle with Roles
```typescript
import { CirclePermissionsService } from '@/services/CirclePermissionsService';

// Check if user can invite
const canInvite = CirclePermissionsService.canPerformAction('owner', 'canInvite');

// Get role description
const description = CirclePermissionsService.getRoleDescription('editor');
```

### 2. Set Up Chore Rotation
```typescript
import { ChoreRotationService } from '@/services/ChoreRotationService';

await ChoreRotationService.createRotation(
  circleId,
  'Kitchen Cleanup',
  ['chore-1', 'chore-2'],
  ['user-a', 'user-b', 'user-c'],
  'weekly',
  1 // Monday
);
```

### 3. Generate AI Insights
```typescript
import { ProcrastinationProfilerService } from '@/services/ProcrastinationProfilerService';
import { BacklogRiskService } from '@/services/BacklogRiskService';

const profile = await ProcrastinationProfilerService.generateProfile(userId, reminders);
const riskScore = await BacklogRiskService.calculateRiskScore(userId, reminders);
```

### 4. Detect Patterns
```typescript
import { PatternDetectionService } from '@/services/PatternDetectionService';

const patterns = await PatternDetectionService.detectPatterns(userId, completedReminders);
const shouldShow = PatternDetectionService.shouldShowSuggestion(patterns[0]);
```

### 5. Track Streaks
```typescript
import { AnchorStreakService } from '@/services/AnchorStreakService';

// On task completion
const streak = await AnchorStreakService.updateStreak(userId, completedDate);
const message = AnchorStreakService.getMotivationMessage(streak.currentStreak);

// Get available rewards
const rewards = await AnchorStreakService.getPremiumRewards(isPro);
```

## 🔧 Configuration

### Environment Variables
```env
# Already configured
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_AUTH_BROKER_URL=your-auth-broker

# Need to add for RevenueCat
EXPO_PUBLIC_REVENUECAT_API_KEY=your-rc-api-key
EXPO_PUBLIC_REVENUECAT_APPLE_KEY=your-apple-key
EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY=your-google-key
```

### Database Setup
1. Run the migration in Supabase SQL editor:
   ```sql
   -- Copy contents of supabase/migrations/phase8_ecosystem.sql
   ```

2. Verify tables created:
   - chore_rotations
   - gentle_nudges
   - anchor_streaks
   - community_templates
   - procrastination_profiles
   - pattern_detections
   - privacy_settings
   - user_subscriptions

### Newell AI Integration
All AI features use `@fastshot/ai` package:
```typescript
import { newell } from '@fastshot/ai';

const response = await newell.chat.ask({
  prompt: 'Your prompt here',
  systemMessage: 'You are a helpful assistant',
});
```

## 📊 Performance Considerations

### Caching Strategies
- **Procrastination Profiles**: Cache for 24 hours
- **Pattern Detections**: Cache for 7 days
- **Activity Halos**: Real-time, no cache
- **Backlog Risk**: Recalculate on data change

### Optimization
- Pattern detection runs async in background
- AI insights generated on-demand with loading states
- Activity halos use lightweight calculations
- Charts use efficient SVG rendering

## 🎯 Testing Checklist

### Unit Tests Needed
- [ ] CirclePermissionsService role checks
- [ ] ChoreRotationService rotation logic
- [ ] PatternDetectionService confidence calculations
- [ ] BacklogRiskService score calculations
- [ ] AnchorStreakService streak tracking

### Integration Tests Needed
- [ ] Create circle with permissions
- [ ] Rotate chores on completion
- [ ] Generate gentle nudges
- [ ] Update streak on task completion
- [ ] Import template with AI scheduling

### UI Tests Needed
- [ ] Activity Halos animation
- [ ] Overlapping avatars rendering
- [ ] Backlog Health Meter display
- [ ] Productivity Peaks chart
- [ ] Role change modal

## 🐛 Known Issues & Limitations

1. **Chore Rotation Trigger**: Requires database trigger setup (provided in migration)
2. **Pattern Detection**: Requires minimum 3 occurrences for reliable patterns
3. **Activity Halos**: Only shows last 24 hours of activity
4. **AI Insights**: Rate limited by Newell AI (handle gracefully)
5. **RevenueCat**: Not yet integrated, subscription checks return mock data

## 📱 Screen Navigation

### New Routes
- `/insights-pro` - Enhanced AI Insights Lab
- `/circle/[id]-enhanced` - Enhanced Circle Detail
- `/community-hub` (TODO) - Template Library

### Existing Routes Enhanced
- `/(tabs)/circles` - Now shows Activity Halos
- `/(tabs)/insights` - Basic version (free tier)
- `/templates` - Needs AI scheduling enhancement

## 🎓 Development Notes

### Code Organization
```
/workspace
├── types/
│   └── phase8.ts              # All Phase 8 type definitions
├── services/
│   ├── CirclePermissionsService.ts
│   ├── ChoreRotationService.ts
│   ├── ProcrastinationProfilerService.ts
│   ├── BacklogRiskService.ts
│   ├── PatternDetectionService.ts
│   └── AnchorStreakService.ts
├── components/
│   ├── ActivityHaloAvatar.tsx
│   ├── OverlappingAvatars.tsx
│   ├── BacklogHealthMeter.tsx
│   └── ProductivityPeaksChart.tsx
└── app/
    ├── (tabs)/insights-pro.tsx
    └── circle/[id]-enhanced.tsx
```

### Best Practices
1. Always use Newell AI skill for AI features
2. Use Supabase skill for database operations
3. Use RevenueCat skill for subscription management
4. Follow the component hierarchy in reference images
5. Implement haptic feedback on all user interactions
6. Use spring animations for all transitions
7. Maintain editorial perfection design principles

## 🚢 Deployment Checklist

Before deploying Phase 8:
- [ ] Run database migration
- [ ] Configure RevenueCat products
- [ ] Set up entitlements
- [ ] Test subscription flow
- [ ] Verify AI API limits
- [ ] Test all permissions scenarios
- [ ] Validate chore rotation logic
- [ ] Test streak calculations
- [ ] Verify pattern detection accuracy
- [ ] Check Activity Halo performance

## 📞 Support & Resources

- **Newell AI Docs**: Use `newell-ai` skill
- **Supabase Docs**: Use `supabase` skill
- **RevenueCat Docs**: Use `revenuecat` skill
- **Design Reference**: See provided screenshots
- **Example Code**: Check `/examples` directory

---

**Phase 8 Status**: 🟢 Core Features Implemented | 🟡 RevenueCat Integration Pending | 🔴 Privacy Mode Pending

**Next Steps**:
1. Integrate RevenueCat for subscriptions
2. Complete Privacy Mode implementation
3. Enhance Template Library with AI scheduling
4. Build Community Hub UI
5. Add Gentle Nudges UI components
