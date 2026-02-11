## Product concept: Anchor (cross-platform “power reminders” + life dashboard)

A beautiful reminders system, with true sync, custom snoozes from notifications, and powerful recurring rules. Around that core, Anchor adds an emotionally engaging “day companion” layer: AI planning, insights, wellness micro-tools, and contextual “near you” signals (weather/traffic/events) that improve reminder timing—without making the reminders feature harder to use.

---

## Target audience (Sam’s community fit)

- Productivity enthusiasts who already use reminders heavily and want:
  - Faster capture
  - More reliable recurring rules
  - Better notifications + snoozing
  - A system that doesn’t break when switching platforms

---

## Emotional hook (why people keep it)

Anchor makes users feel:

- In control (everything is organized, consistent, and predictable)
- Cared for (gentle, contextual nudges like weather-aware and traffic-aware prompts)
- Rewarded (streaks, progress rings, satisfying completion animations)
- Calm (minimal UI, “Today” focus, soft micro-interactions)

---

## Non-negotiable core

### 1) Cross-platform parity

- “Switch phone, lose nothing.”

### 2) True sync semantics

- If a reminder is dismissed/completed on one device, it clears everywhere.
- If snoozed on one device, it updates everywhere with the new due time.
- If edited on one device, changes propagate quickly and predictably.

### 3) Custom snoozes from notifications

- User-defined snooze buttons right in the notification:
  - “5m”, “15m”, “1h”, “Tonight”, “Tomorrow AM”, “Next business day”

- Optional “Smart snooze” (AI suggests best next time based on calendar + habits).

### 4) Powerful recurring rules (friendly UI, pro depth)

Support:

- Every X days/weeks/months
- Weekdays only / weekends only
- “Nth weekday of month” (e.g., 2nd Tuesday)
- “Last day of month”
- “Every 3 days, but skip if completed late”
- Exceptions/skip dates
- Time windows (morning/afternoon/evening) with smart scheduling

---

## IA / Navigation (feature rich, still simple)

Bottom tabs (max 4) to keep it fast:

1. Today
   - Timeline of due reminders + “Next up”
   - Quick add
   - Context chips: Weather, traffic, next calendar block (optional)

2. Reminders
   - Lists + tags + search
   - Filter: Work/Personal/Urgent/Location/Shared

3. Insights
   - Completion trends, streaks, best times, backlog health

4. Me
   - Micro-tools (pedometer, water, pomodoro), settings, integrations

Key rule: everything beyond reminders is _optional_ and can be hidden.

---

## UX principles (beautiful + fast + accessible)

- One-tap completion everywhere; big hit targets.
- Large typography and clear hierarchy; dark mode; high contrast mode.
- Motion restraint: 150–250ms transitions, subtle haptics, Lottie used sparingly (e.g., “task completed” delight).
- Offline-first behavior: everything works without network; sync catches up later.
- Accessibility: VoiceOver/TalkBack labels, dynamic type, reduced motion setting, color-blind safe status indicators.

---

## AI layer (useful, not gimmicky)

### A) Voice-first creation + natural language

Input: “Remind me to water plants every 3 days at 6pm”
Output:

- Parsed schedule + confirmation
- Suggested tag (“Home”) and priority
- Optional: “Do you want a ‘Plant Care’ template?”

### B) Auto-categorization (NLP tagging)

- Tags: Work, Personal, Health, Finance, Errands
- Confidence indicator (small, non-intrusive)
- User can correct; model learns preferences.

### C) Predictive reminders (opt-in)

Examples:

- “You usually buy groceries Friday evenings—add a recurring reminder?”
- “Bills cluster at month-end—want a ‘Bills’ pack?”

### D) Smart time suggestions

When user creates “Pick up dry cleaning”

- AI suggests time based on:
  - Calendar free slots
  - Historical completion times
  - Location/traffic (if enabled)

- UI shows 3 “best” times + manual picker.

### E) AI-based guidelines, charts, metrics (in Insights)

- “Your completion rate improves when reminders are due 30–90 minutes before meetings.”
- “You postpone ‘Errands’ most on weekdays—try weekend batching.”
- “Backlog risk score” (based on overdue volume + streak breaks)

### F) AI activity tracking → automated reminders (privacy-first)

- Detect patterns like “gym check-ins” (via optional location history) → suggest “Gym bag” reminders.
- Detect “commute start” (car BT) → “Call mom” suggestion.

All AI features should be opt-in, with clear toggles and local processing where possible.

---

## Context triggers (the “power” features)

### 1) Dynamic location triggers

- “Near any supermarket” (POI category), not just one pin
- “When I arrive” / “When I leave”
- Adjustable accuracy and time window
- Battery-friendly geofencing strategy

### 2) Bluetooth/NFC triggers

- Car Bluetooth connect → “Drive-mode reminder stack”
- NFC tags (home/desk) → “Evening routine” or “Work startup” pack

### 3) Weather-aware reminders

- If rain forecast near reminder time → add “Umbrella” nudge
- If extreme heat → “Water” reminder suggestion
- Weather shown as a tiny chip in Today (can hide)

### 4) Conditional reminders

- “If Task A done → remind Task B after 10 minutes”
- Simple UI: “Depends on…” (advanced toggle)

### 5) Priority-based stacking

- If too many reminders are due at once:
  - keep critical ones
  - auto-snooze low-priority with user rules (“defer by 30m”)

### 6) “Do Not Disturb” sync behavior

- Respect system DND / Focus modes
- Quiet delivery windows
- Summary notifications option

---

## Companion micro-tools (secondary, integrated lightly)

These live in Me and can pin into Today as small widgets:

1. Pomodoro

- Can generate focus reminders (“Break in 5 minutes”)
- Session history in Insights

2. Water

- Simple glass counter
- Optional smart reminders based on time + weather (if enabled)

3. Pedometer

- Daily steps + weekly trend
- Optional “walk break” reminders

Key rule: these never clutter the main reminders workflow.

---

## “What’s going on near you” (optional context panel)

A small, dismissible Today panel:

- Current weather + next-hour rain chance
- Commute/traffic time to next calendar location (if user has location events)
- Nearby events/places (only if user opts in; keep it minimal)

This should _inform reminders_, not become a content feed.

---

## Sharing & community (high retention features)

### Shared reminders with roles

- Owner / Editor / Viewer
- Completion log
- “Assigned to” field

### Family/household mode

- Shared lists: groceries, chores, bills
- “Chore rotation” templates

### Gentle nudges

- If a critical reminder is missed, notify a chosen contact (explicit consent + safety UX)
- Use carefully; default off

### Template library + community sharing

- Built-in templates: medication, bills, meeting prep, packing list
- “Import template” flow is 1 tap
- Community templates moderated (report + filters)

---

## Monetization (RevenueCat-first, clear value)

### Paywall philosophy

Reminders must be usable for free; power + sync + AI are paid.

Free

- Basic reminders + basic recurring
- Limited tags
- Local-only storage
- Basic notifications

Pro (subscription)

- Cross-device sync (true sync)
- Custom snooze buttons
- Advanced recurring rules
- Location/Bluetooth/NFC triggers
- Shared lists
- Insights dashboard
- Calendar integration
- Weather/traffic context
- AI suggestions (tiered allowance)

Add-ons (optional)

- AI pack: higher quota for smart parsing/suggestions
- Family pack: more members + admin features
- Themes/icons (cosmetic)

RevenueCat setup:

- Monthly/Annual + trial
- Entitlements: `pro`, `ai_plus`, `family`
- Remote config for paywall experiments (A/B of trial length, pricing display, feature gating)

---

## MVP scope

### Must ship

1. Cross-platform reminders core (create/edit/complete)
2. True sync (complete/dismiss/snooze propagates)
3. Notifications with custom snooze actions
4. Recurring rules (at least: daily/weekly/monthly + weekdays + interval)
5. RevenueCat paywall + subscription gating
6. Basic insights (completion rate, overdue count)

### Also add

- Calendar read integration
- AI natural language parsing (create reminders from text)
- Location triggers (one mode)
- Template library (local)

## Technical architecture (high-level, cross-platform friendly)

## Technologies

React Native + Expo + Revenue Cat Payment SDK

### Data model & sync

- Local database + sync layer
- Event-sourcing approach for reliability:
  - actions: create, edit, complete, dismiss, snooze
  - conflict resolution: last-write-wins per field + special rules for completion/snooze

- Background sync + push-based hints for near-real-time updates

- Snooze executes locally immediately, then syncs

### Integrations

- Calendar: read-only initially (availability + context)
- Location: geofences, battery-optimized
- Weather/traffic: via chosen APIs (opt-in, cached, minimal calls)

### AI services

- Start with:
  - On-device heuristics + lightweight parsing where possible
  - Cloud LLM only for “smart” actions (opt-in)
  - For now free models like Gemini and Groq

- Strict data minimization (send only what’s needed for the request)

---

## Privacy, trust, and safety (differentiator)

- Clear toggles for:
  - Location features
  - Calendar features
  - AI features

- Local-first option for users who want it
- Auto-expire sensitive reminders (user-defined)
- For shared lists:
  - Optional end-to-end encryption (roadmap if too heavy for MVP)

- Transparent “Why am I seeing this suggestion?” explanations

---

## Visual design direction (Sam-style: modern, minimal, premium)

- Calm background, bold typography, crisp icons
- “Today” feels like a cockpit:
  - time blocks + tasks
  - subtle context chips

- Completion delight:
  - micro confetti or ripple (optional)
  - haptic tick

- Lottie used only for:
  - onboarding illustrations
  - subscription success
  - streak milestone

---

Raw idea is:

- make it in a way that it has very beautiful UX, easy to use, ease of access and accessibility
- it must emotionally attract users
- AI features, dashboard and other useful things like pedometer, glass of waters, pomodoro timer
- it should be feature rich but the main feature describe in above hackathon must be very accessible
- Ai based customized guildelines, charts, analysis, metrics
- AI based activity tracking, setting automated reminders
- connection with calendars, etc
- whats going on near you
- mini weather, traffic, and other updates near you
- very beautiful UI with slight transitions and animations, lotti, etc. but very fast and slight
- Other features like:
  - Smart Time Suggestions: Instead of users picking a time, AI suggests optimal times based on their calendar, habits, and even local traffic (for location-based reminders).
  - Auto-Categorization: Automatically tags reminders (e.g., "Work," "Personal," "Urgent") using NLP.
  - Predictive Reminders: "You usually buy groceries on Friday evenings. Want to set a recurring reminder?"
  - Dynamic Location Triggers: Reminders that adapt based on location accuracy (e.g., "When near any supermarket" vs. "At specific supermarket").
  - Bluetooth/NFC Triggers: Reminders triggered when connecting to car Bluetooth (e.g., "Call mom") or tapping an NFC tag at home.
  - Weather-Aware Reminders: "Don’t forget an umbrella" if rain is forecasted at the reminder time/location.
  - Voice-First Creation: Voice-to-text with natural language processing ("Remind me to water plants every 3 days").
  - Quick-Template Library: Templates for common tasks (e.g., "Medication," "Bill Payment," "Meeting Prep").
  - Shared Templates Community: Users can share and import templates (e.g., "Packing list for vacation").
  - Shared Reminders with Roles: Assign tasks with permissions (view/edit) and track completion status.
  - Family/Household Mode: Sync reminders for family chores, shared bills, events.
  - Gentle Nudges: Option to notify a friend/family if a crucial reminder (e.g., "Take medication") is missed.
  - Habit Streaks & Rewards: Visual streaks for completing recurring reminders; unlock themes/icons.
  - Productivity Insights: Weekly reports on completion rates, peak productivity times, procrastination patterns.
  - Challenges: Compete with friends on completing tasks.
  - Breaks & Stretch Reminders: Customizable wellness breaks with quick exercises.
  - Reflection Prompts: Evening reminder to journal or reflect on completed tasks.
  - "Do Not Disturb" Sync: Integrates with system DND to avoid interruptions.
  - Conditional Reminders: "If [Task A] is done, remind me to do [Task B]."
  - Priority-based Stacking: Lower priority reminders are postponed if too many are due.
  - Custom Audio/Visual Alerts: Upload personal voice notes or images as alerts.
  - End-to-End Encryption: For shared or sensitive reminders.
  - Local-First Option: Store data locally with optional cloud sync.
  - Auto-Expire Sensitive Reminders: Reminders with personal data auto-delete after completion.
