// Reminder Types for Anchor App

export type TagType = 'Work' | 'Personal' | 'Errands' | 'Health' | 'Finance' | 'Home' | 'Social';

export type RecurrenceType =
  | 'none'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'custom_days'      // Every X days
  | 'nth_weekday'      // Nth weekday of month (e.g., 2nd Monday)
  | 'specific_days';   // Specific days of week

export type ReminderStatus = 'pending' | 'completed' | 'snoozed' | 'overdue';

export interface RecurrenceRule {
  type: RecurrenceType;
  interval?: number;           // For 'custom_days': every X days
  daysOfWeek?: number[];       // 0-6 (Sun-Sat) for 'weekly' or 'specific_days'
  dayOfMonth?: number;         // 1-31 for 'monthly'
  nthWeekday?: {
    n: number;                 // 1-5 (1st, 2nd, etc.) or -1 for last
    weekday: number;           // 0-6 (Sun-Sat)
  };
  endDate?: string;            // ISO date string
  count?: number;              // Number of occurrences
}

export type ContextTriggerType = 'bluetooth' | 'nfc' | 'location' | 'location_category' | 'wifi' | 'time_of_day';
export type LocationCategory = 'supermarket' | 'gas_station' | 'pharmacy' | 'bank' | 'gym' | 'restaurant' | 'coffee_shop' | 'any';

export interface ConditionalRule {
  type: 'on_complete' | 'on_fail' | 'on_snooze';
  triggerReminderId: string;
  targetReminderId: string;
  delay?: number; // Minutes to wait after trigger
}

export interface ContextTrigger {
  type: ContextTriggerType;
  enabled: boolean;
  // Bluetooth/NFC
  deviceId?: string;
  deviceName?: string;
  // Location
  latitude?: number;
  longitude?: number;
  radius?: number; // meters
  locationCategory?: LocationCategory;
  // WiFi
  ssid?: string;
  // Time of Day
  timeRange?: {
    start: string; // HH:mm
    end: string; // HH:mm
  };
}

export interface LocationTrigger {
  latitude: number;
  longitude: number;
  radius: number;
  name?: string;
}

export interface BluetoothTrigger {
  deviceId: string;
  deviceName: string;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  dueDate: string;             // ISO date-time string
  dueTime: string;             // HH:mm format
  tag: TagType;
  status: ReminderStatus;
  priority: 'low' | 'medium' | 'high';
  recurrence: RecurrenceRule;
  completedAt?: string;        // ISO date-time when completed
  snoozedUntil?: string;       // ISO date-time when snoozed until
  createdAt: string;
  updatedAt: string;
  originalText?: string;       // AI-parsed original input
  nextOccurrence?: string;     // Next occurrence for recurring reminders
  isRecurring: boolean;
  // Household features
  assignedTo?: string;         // User ID
  // Hardware triggers
  locationTrigger?: LocationTrigger;
  bluetoothTrigger?: BluetoothTrigger;
  nfcTrigger?: string;
  // Advanced Features
  conditionalRules?: ConditionalRule[];
  contextTriggers?: ContextTrigger[];
  aiPredicted?: boolean;       // AI suggested this reminder
  aiConfidence?: number;       // 0-1 confidence score
  visualReminder?: string;     // Phase 5: Image URI from smart scan
  weatherDependent?: boolean;  // Show weather warnings
  trafficAware?: boolean;      // Adjust time based on traffic
  // Privacy & Gamification
  isSensitive?: boolean;       // Auto-delete after completion
  sensitiveDeleteAt?: string;  // When to delete sensitive data
  chainCount?: number;         // Current completion chain
  longestChain?: number;       // Longest chain ever
  lastCompletedDate?: string;  // Last completion date for chain tracking
}

export interface ContextData {
  weather?: {
    temperature: number;
    condition: string;
    icon: string;
  };
  traffic?: {
    duration: string;
    destination: string;
  };
}

export interface AIParseResult {
  title: string;
  suggestedTag: TagType;
  tagConfidence: number;
  schedule: {
    date?: string;
    time?: string;
    recurrence?: RecurrenceRule;
    smartTime?: string;
    smartTimeReason?: string;
  };
  rawInterpretation: string;
}

export interface SnoozeOption {
  label: string;
  value: string;          // Duration or specific time
  type: 'duration' | 'time';
}

export const DEFAULT_SNOOZE_OPTIONS: SnoozeOption[] = [
  { label: '5m', value: '5', type: 'duration' },
  { label: '15m', value: '15', type: 'duration' },
  { label: '1h', value: '60', type: 'duration' },
  { label: 'Tonight', value: '21:00', type: 'time' },
  { label: 'Tomorrow AM', value: 'tomorrow_9am', type: 'time' },
  { label: 'Next Business Day', value: 'next_business_day', type: 'time' },
];

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location?: string;
  notes?: string;
  calendarId: string;
  allDay: boolean;
}

export interface DeferAnalysis {
  canDefer: boolean;
  reason: string;
  suggestedDelay: number; // minutes
  confidence: number; // 0-1
}

export interface SmartDeferResult {
  deferredCount: number;
  reminders: Reminder[];
  analysis: DeferAnalysis[];
}

export const TAG_COLORS: Record<TagType, { bg: string; text: string; dark: { bg: string; text: string } }> = {
  Work: {
    bg: '#1E3A5F',
    text: '#FFFFFF',
    dark: { bg: '#2D4A6F', text: '#FFFFFF' }
  },
  Personal: {
    bg: '#3D8B7A',
    text: '#FFFFFF',
    dark: { bg: '#4D9B8A', text: '#FFFFFF' }
  },
  Errands: {
    bg: '#D4A84B',
    text: '#1A1A2E',
    dark: { bg: '#E4B85B', text: '#1A1A2E' }
  },
  Health: {
    bg: '#E85D75',
    text: '#FFFFFF',
    dark: { bg: '#F86D85', text: '#FFFFFF' }
  },
  Finance: {
    bg: '#6B4E9B',
    text: '#FFFFFF',
    dark: { bg: '#7B5EAB', text: '#FFFFFF' }
  },
  Home: {
    bg: '#8B6914',
    text: '#FFFFFF',
    dark: { bg: '#9B7924', text: '#FFFFFF' }
  },
  Social: {
    bg: '#4A90A4',
    text: '#FFFFFF',
    dark: { bg: '#5AA0B4', text: '#FFFFFF' }
  },
};
