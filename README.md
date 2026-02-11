# Anchor ⚓

<center>
   <img src"https://github.com/faraasat/anchor/blob/main/assets/images/icon.png" />
</center>

> **A beautiful, AI-powered life companion** — Smart reminders that adapt to your life, with contextual awareness, household collaboration, and delightful micro-interactions.

[![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-54.0.21-000020.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## ✨ What is Anchor?

Anchor is a **cross-platform life dashboard** that combines powerful reminders with AI intelligence, contextual awareness, and emotional design. It helps you stay organized while feeling calm, supported, and in control.

### 🎯 Key Philosophy

- **Fast & Beautiful**: Silky smooth 60fps animations, thoughtful micro-interactions
- **AI-Enhanced, Not AI-Dependent**: Intelligence that helps without getting in the way
- **Privacy-First**: Local storage option, no tracking, your data stays yours
- **Cross-Platform**: iOS, Android, Web — your tasks sync seamlessly everywhere

---

## 🚀 Features

### 📱 Core Experience

| Feature                 | Description                                                                  |
| ----------------------- | ---------------------------------------------------------------------------- |
| **Smart Reminders**     | Location-aware, time-based, and context-triggered tasks                      |
| **Voice Input**         | Natural language processing with Groq AI — just speak naturally              |
| **Today View**          | Beautiful timeline with weather, calendar integration, and smart suggestions |
| **Circles**             | Household task management with real-time collaboration                       |
| **Wellbeing Dashboard** | Water tracking, meditation timer, visual progress garden                     |

### 🤖 AI-Powered

- **Natural Language Parser**: "Remind me to buy coffee when I'm near a grocery store"
- **Smart Scheduling**: AI suggests optimal times based on your calendar and habits
- **Neural Coach**: Burnout detection, workload re-prioritization, energy insights
- **Evening Reflections**: Daily accomplishment summaries with AI-generated insights

### 🎨 Design Highlights

- **Ambient Context Panel**: Weather-aware, traffic-aware, time-of-day adaptive UI
- **Living Backgrounds**: Dynamic gradients that shift with time and mood
- **Paper-Grain Aesthetics**: Soft textures, ink-bleed transitions, tactile feel
- **Haptic Excellence**: Carefully choreographed vibrations for every interaction
- **Lottie Animations**: Delightful success moments without overwhelming

### 🌟 Premium Features

- **Community Hub**: Browse and import curated task stacks from other users
- **Stack Sharing**: Share your productivity workflows with the community
- **Advanced Insights**: Productivity peaks chart, completion trends, burnout analysis
- **Unlimited AI Requests**: No limits on voice commands and neural coach access
- **Theme Customization**: Light, dark, auto, and adaptive "recovery mode"

---

## 🏗️ Tech Stack

### Frontend

- **React Native 0.81.5** — Cross-platform mobile framework
- **Expo 54** — Development platform and tooling
- **TypeScript** — Type safety and better DX
- **React Navigation** — File-based routing with expo-router
- **Reanimated 4** — High-performance 60fps animations
- **React Native Gesture Handler** — Native touch handling

### Backend & Services

- **Supabase** — Authentication, real-time database, storage
- **Groq AI** — Fast LLM inference (llama-3.3-70b-versatile)
- **RevenueCat** — Cross-platform subscription management
- **Expo Notifications** — Push notifications and local reminders

### State & Data

- **AsyncStorage** — Local persistence
- **React Context** — Global state management
- **Real-time Subscriptions** — Live updates across devices
- **Optimistic UI** — Instant feedback, background sync

---

## 📦 Installation

### Prerequisites

- **Node.js** 18+ [(Download)](https://nodejs.org/)
- **Yarn** 4.12+ (or npm 9+)
- **Expo CLI** (installed automatically)
- **iOS Simulator** (Mac only) or **Android Studio** for emulators
- **Expo Go** app for testing on physical devices

### Quick Start

```bash

# Clone the repository

git clone https://github.com/yourusername/anchor.git
cd anchor

# Install dependencies

yarn install

# Copy environment template

cp .env.example .env

# Configure your .env file (see Configuration section)

# Then start the development server

yarn start
```

### Platform-Specific Commands

```bash

# iOS (Mac only)

yarn ios

# Android

yarn android

# Web

yarn web
```

---

## ⚙️ Configuration

### Environment Variables

Create a \`.env\` file in the root directory:

```env

# Supabase (Required for auth & data sync)

EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Groq AI (Required for voice commands & AI features)

EXPO_PUBLIC_GROQ_API_KEY=your-groq-api-key-here

# RevenueCat (Required for premium features)

EXPO_PUBLIC_REVENUECAT_API_KEY=your-revenuecat-key-here

# Optional: Project ID for analytics

EXPO_PUBLIC_PROJECT_ID=anchor-prod
```

### Getting API Keys

| Service        | Purpose         | How to Get                                                    |
| -------------- | --------------- | ------------------------------------------------------------- |
| **Supabase**   | Database & Auth | [Create free project](https://supabase.com) → Settings → API  |
| **Groq**       | AI Features     | [Get free API key](https://console.groq.com) (no credit card) |
| **RevenueCat** | Subscriptions   | [Sign up](https://www.revenuecat.com/) → Create project       |

### Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Enable **Email authentication** in Authentication settings
3. Run the schema migration (see \`supabase/migrations/\`)
4. Copy your project URL and anon key to \`.env\`

```bash

# Optional: Link to Supabase CLI for migrations

npx supabase link
npx supabase db push
```

---

## 📂 Project Structure

```
anchor/
├── app/ # 📱 Screens & navigation
│ ├── (tabs)/ # Bottom tab screens
│ │ ├── index.tsx # Today view (main screen)
│ │ ├── reminders.tsx # All reminders list
│ │ ├── circles.tsx # Household collaboration
│ │ ├── anchors.tsx # Location & context triggers
│ │ ├── insights.tsx # Analytics & trends
│ │ └── me.tsx # Profile & wellness
│ ├── auth/ # Authentication flow
│ └── \_layout.tsx # Root layout & providers
│
├── components/ # 🎨 Reusable UI components
│ ├── ActionAnchorButton.tsx
│ ├── CommandPalette.tsx
│ ├── VoiceAnchorModal.tsx
│ ├── NeuralCoachModal.tsx
│ └── ... (50+ components)
│
├── lib/ # 🔧 Core libraries
│ ├── auth.tsx # Supabase auth wrapper
│ ├── groq.ts # Groq AI client
│ └── supabase.ts # Database client
│
├── services/ # 🛠️ Business logic
│ ├── ReminderService.ts # CRUD & sync
│ ├── AIParserService.ts # NLP voice parsing
│ ├── AnchorPointsService.ts
│ ├── StackService.ts # Community sharing
│ └── ... (20+ services)
│
├── contexts/ # 🌐 Global state
│ ├── ThemeEngineContext.tsx
│ ├── HouseholdContext.tsx
│ ├── PrivacyContext.tsx
│ └── OnboardingContext.tsx
│
├── hooks/ # 🪝 Custom React hooks
│ ├── useWindowDimensions.ts
│ ├── useProStatus.ts
│ └── useAnchorTriggers.ts
│
├── constants/ # 🎨 Design tokens
│ └── theme.ts # Spacing, colors, typography
│
├── types/ # 📝 TypeScript definitions
│ └── reminder.ts
│
└── utils/ # 🔨 Helper functions
└── hapticScrolling.ts
```

---

## 🎯 Key Features Breakdown

### 1. Voice-First Reminders

```typescript
// Natural language processing with context awareness
"Remind me to buy coffee when I'm near a grocery store"
→ Location: Grocery Store
→ Action: Buy coffee
→ Trigger: Proximity (100m radius)

"Call mom every Sunday at 2pm"
→ Recurrence: Weekly (Sunday)
→ Time: 14:00
→ Tag: Personal
```

### 2. Context Intelligence

- **Location Triggers**: Near home, office, grocery, gym, etc.
- **Time Windows**: Morning (6-9am), Afternoon (12-6pm), Evening (6-10pm)
- **Weather Aware**: Delay outdoor tasks during rain
- **Calendar Sync**: Avoid scheduling during meetings
- **Energy Detection**: Suggest breaks when burnout detected

### 3. Household Circles

- **Real-time Collaboration**: Shared task lists sync instantly
- **Nudge System**: Gentle reminders to household members
- **Task Assignment**: Delegate with due dates
- **Activity Feed**: See what everyone accomplished

### 4. Wellbeing Integration

- **Visual Garden**: Plant grows based on weekly task completion
- **Water Tracker**: 8-glass daily goal with smart reminders
- **Meditation Timer**: Pomodoro-style focus sessions
- **Productivity Insights**: Best times, streaks, backlog health

---

## 🛠️ Development

### Code Style

This project uses ESLint and TypeScript for code quality:

```bash

# Lint code

yarn lint

# Type check

yarn tsc --noEmit
```

### Adding New Features

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow File Structure**
   - Screens → \`app/\`
   - Components → \`components/\`
   - Services → \`services/\`
   - Types → \`types/\`

3. **Use Design Tokens**

   ```typescript
   import { Spacing, Typography, Shadows } from "@/constants/theme";
   ```

4. **Add Haptic Feedback**
   ```typescript
   import \* as Haptics from 'expo-haptics';
   Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
   ```

### Responsive Design

All components use the custom \`useWindowDimensions\` hook for dynamic sizing:

```typescript
import { useWindowDimensions } from '@/hooks/useWindowDimensions';

function MyComponent() {
const { width, height, breakpoint } = useWindowDimensions();

return (
<View style={{ width: width * 0.9 }}>
{breakpoint === 'large' && <TabletView />}
</View>
);
}
```

---

## 🧪 Testing

### Manual Testing

```bash

# Run on iOS Simulator

yarn ios

# Run on Android Emulator

yarn android

# Test on physical device

yarn start

# Then scan QR code with Expo Go app

```

### Test Accounts

For development, use test accounts:

- Email: \`test@anchor.dev\`
- Password: \`test123456\`

---

## 🚀 Deployment

### Building for Production

```bash

# iOS (requires Mac + Apple Developer account)

eas build --platform ios

# Android

eas build --platform android

# Both platforms

eas build --platform all
```

### Environment Setup

Create production environment variables in EAS:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your-prod-url"
eas secret:create --scope project --name EXPO_PUBLIC_GROQ_API_KEY --value "your-prod-key"
```

### App Store Submission

Refer to the [Expo documentation](https://docs.expo.dev/distribution/app-stores/) for platform-specific submission guides.

---

## 🐛 Troubleshooting

### Common Issues

| Issue                   | Solution                                                    |
| ----------------------- | ----------------------------------------------------------- |
| **App won't start**     | Clear cache: \`yarn start -c\`                              |
| **Auth not working**    | Check \`.env\` file and Supabase settings                   |
| **AI features failing** | Verify Groq API key is valid                                |
| **Animations laggy**    | Enable Hermes: Already enabled by default                   |
| **Build errors**        | Clear node_modules: \`rm -rf node_modules && yarn install\` |

### Debug Mode

Enable debug logging:

```typescript
// In app/\_layout.tsx
if (**DEV**) {
console.log('Debug mode enabled');
}
```

---

## 📚 Learn More

### Documentation

- **[Expo Documentation](https://docs.expo.dev/)** — Platform fundamentals
- **[React Native](https://reactnative.dev/)** — Core framework
- **[Supabase Docs](https://supabase.com/docs)** — Backend & auth
- **[Groq AI](https://console.groq.com/docs)** — LLM integration
- **[RevenueCat](https://www.revenuecat.com/docs)** — Subscription management

### Project Docs

- **[Product Strategy & Monetization](./docs/product-strategy.md)** — Problem statement, target audience, and revenue model
- **[Technical Architecture](./docs/technical-architecture.md)** — Tech stack, architecture, and RevenueCat implementation
- **[Team & Background](./docs/team.md)** — About the founder, experience, and vision
- **[MIGRATION.md](./MIGRATION.md)** — Recent changes and breaking updates
- **[PROJECT_STATUS.md](./PROJECT_STATUS.md)** — Current development state
- **[docs/idea.md](./docs/idea.md)** — Original product concept

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**: \`git checkout -b feature/amazing-feature\`
3. **Commit your changes**: \`git commit -m 'Add amazing feature'\`
4. **Push to the branch**: \`git push origin feature/amazing-feature\`
5. **Open a Pull Request**

### Code Guidelines

- Write TypeScript for type safety
- Follow existing code style
- Add comments for complex logic
- Test on both iOS and Android
- Update documentation for new features

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Design Inspiration**: Things 3, Fantastical, Calm
- **AI Partner**: Groq for blazing-fast LLM inference
- **Backend**: Supabase for real-time sync magic
- **Community**: All the productivity nerds who believed in this vision

---

## 📧 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/anchor/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/anchor/discussions)
- **Email**: support@anchor.app

---

<div align="center">
  <strong>Built with ❤️ for people who care about staying organized without losing their calm.</strong>
  
  ⭐ Star this repo if you find it useful!
</div>
