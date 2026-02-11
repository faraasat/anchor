# Migration Guide

## Changes Made

### 1. Authentication System
- **Removed**: `@fastshot/auth` package
- **Added**: Custom Supabase auth implementation in `/lib/auth.tsx`
- **Features**:
  - Email/password authentication
  - Session management
  - Auto-redirect based on auth state
  - Error handling with proper types

### 2. AI Integration
- **Removed**: `@fastshot/ai` package
- **Added**: Groq AI integration in `/lib/groq.ts`
- **Features**:
  - Uses Groq's LLM API (default model: llama-3.3-70b-versatile)
  - Compatible with existing AI service calls
  - Legacy compatibility exports for smooth migration
  - Streaming support (for future use)

### 3. Mobile Scrolling Fix
- **Issue**: ScrollView wasn't scrollable on mobile devices
- **Fix**: Added `flexGrow: 1` to `scrollContent` styles in all tab screens
- **Affected Files**:
  - `app/(tabs)/index.tsx`
  - `app/(tabs)/insights.tsx`
  - `app/(tabs)/reminders.tsx`
  - `app/(tabs)/insights-pro.tsx`
  - `app/(tabs)/profile.tsx`
  - `app/(tabs)/anchors.tsx`
  - `app/(tabs)/me.tsx`
  - `app/(tabs)/circles.tsx`

## Setup Instructions

### 1. Install Dependencies
```bash
yarn install
# or
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `EXPO_PUBLIC_GROQ_API_KEY`: Your Groq API key (get one at https://console.groq.com)

### 3. Supabase Setup
Ensure your Supabase project has:
- Email authentication enabled
- Required database tables and RLS policies

### 4. Test the Application
```bash
yarn start
# or
npm start
```

## Breaking Changes

### Authentication
- All `useAuth()` calls now use the new implementation from `@/lib/auth`
- Auth provider component remains the same API
- Session handling is now automatic via Supabase

### AI Services
- All AI calls now use Groq instead of the previous provider
- API remains the same: `generateText({ prompt, systemPrompt })`
- Legacy exports maintained for compatibility

## Troubleshooting

### Auth Issues
- Check that environment variables are set correctly
- Verify Supabase project settings
- Check browser console for auth errors

### AI Issues
- Verify Groq API key is valid
- Check API rate limits
- AI features will gracefully fail if API key is missing (console warnings only)

### Scrolling Issues
- Clear app cache and rebuild if scrolling still doesn't work
- Check that all ScrollView components have proper flex styles

## Support
For issues, check:
- Supabase docs: https://supabase.com/docs
- Groq docs: https://console.groq.com/docs
- React Native docs: https://reactnative.dev
