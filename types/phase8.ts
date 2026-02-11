// Phase 8: Ecosystem & Collective Intelligence Types

export type CircleRole = 'owner' | 'editor' | 'viewer';

export interface CirclePermissions {
  canEdit: boolean;
  canComplete: boolean;
  canAssign: boolean;
  canInvite: boolean;
  canDelete: boolean;
  canViewSensitive: boolean;
}

export interface CircleMember {
  id: string;
  userId: string;
  circleId: string;
  role: CircleRole;
  joinedAt: string;
  lastActiveAt?: string;
  profile?: {
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
}

export interface GentleNudge {
  id: string;
  circleId: string;
  reminderId: string;
  assignedUserId: string;
  ownerUserId: string;
  priority: 'critical' | 'high' | 'medium';
  missedAt: string;
  notifiedAt?: string;
  acknowledgedAt?: string;
  status: 'pending' | 'notified' | 'acknowledged' | 'resolved';
  reminderTitle: string;
  reminderDueDate: string;
}

export interface ActivityHalo {
  userId: string;
  color: string;
  glowIntensity: number; // 0-1
  lastActivity: string;
  recentCompletionCount: number;
}

export interface ChoreRotation {
  id: string;
  circleId: string;
  name: string;
  description?: string;
  choreIds: string[]; // Reminder IDs
  memberIds: string[]; // User IDs in rotation
  currentIndex: number; // Current assignee index
  rotationType: 'completion' | 'weekly' | 'daily' | 'custom';
  rotationDay?: number; // 0-6 for weekly, day of month for monthly
  createdAt: string;
  updatedAt: string;
}

export interface CommunityTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  authorId?: string;
  authorName?: string;
  downloads: number;
  rating: number;
  taskCount: number;
  icon: string;
  color: string;
  tags: string[];
  tasks: any[]; // Template tasks
  isOfficial: boolean;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProcrastinationProfile {
  userId: string;
  topProcrastinatedCategories: {
    category: string;
    snoozeCount: number;
    averageDelay: number; // minutes
  }[];
  procrastinationScore: number; // 0-100
  peakProcrastinationTime: string; // HH:mm
  suggestedFixes: {
    issue: string;
    suggestion: string;
    confidence: number;
  }[];
  generatedAt: string;
}

export interface ProductivityPeak {
  timeSlot: string; // HH:mm
  completionRate: number; // 0-100
  averageTasksCompleted: number;
  energyLevel: 'low' | 'medium' | 'high';
}

export interface BacklogRiskScore {
  score: number; // 0-100 (0 = healthy, 100 = critical)
  level: 'healthy' | 'moderate' | 'concerning' | 'critical';
  totalPending: number;
  overdueCount: number;
  averageAge: number; // days
  recommendations: {
    action: 'defer' | 'delete' | 'reschedule' | 'delegate';
    reminderIds: string[];
    reason: string;
  }[];
  healthMetrics: {
    completionRate: number;
    avgDailyLoad: number;
    capacityUtilization: number; // 0-100
  };
}

export interface PatternDetection {
  pattern: string;
  type: 'time' | 'location' | 'sequence' | 'frequency';
  confidence: number; // 0-1
  suggestedReminder: {
    title: string;
    description: string;
    dueTime: string;
    tag: string;
  };
  historicalData: {
    occurrenceCount: number;
    lastOccurrence: string;
    avgFrequency: string; // "weekly", "monthly", etc.
  };
}

export interface AnchorStreak {
  userId: string;
  currentStreak: number; // consecutive days
  longestStreak: number;
  streakStartDate: string;
  lastCompletionDate: string;
  totalCompletions: number;
  unlockedRewards: string[]; // reward IDs
  nextMilestone: {
    days: number;
    reward: string;
  };
}

export interface PremiumReward {
  id: string;
  name: string;
  type: 'icon' | 'tint' | 'theme' | 'feature';
  unlockAt: number; // streak days required
  isPremium: boolean; // requires Anchor Pro
  previewUrl?: string;
  metadata?: {
    color?: string;
    icon?: string;
    description?: string;
  };
}

export interface SubscriptionFeature {
  id: string;
  name: string;
  description: string;
  tier: 'free' | 'pro';
  category: 'insights' | 'templates' | 'collaboration' | 'customization';
}

export const PREMIUM_FEATURES: SubscriptionFeature[] = [
  {
    id: 'full-insights-lab',
    name: 'Full AI Insights Lab',
    description: 'Unlock Procrastination Profiler, Productivity Peaks, and advanced analytics',
    tier: 'pro',
    category: 'insights',
  },
  {
    id: 'unlimited-templates',
    name: 'Unlimited Community Stack Imports',
    description: 'Import unlimited templates from the Community Hub',
    tier: 'pro',
    category: 'templates',
  },
  {
    id: 'advanced-circles',
    name: 'Advanced Circle Features',
    description: 'Chore Rotation, Gentle Nudges, and Activity Tracking',
    tier: 'pro',
    category: 'collaboration',
  },
  {
    id: 'premium-themes',
    name: 'Premium Icons & Paper Tints',
    description: 'Unlock exclusive visual customizations and themes',
    tier: 'pro',
    category: 'customization',
  },
];

export interface AutoExpireSettings {
  enabled: boolean;
  deleteAfterMinutes: number; // minutes after completion
  categories: string[]; // which tags to auto-expire
}

export interface PrivacySettings {
  privacyModeEnabled: boolean;
  maskedTags: string[]; // Tags to mask in UI
  maskedCircles: string[]; // Circle IDs to mask
  autoExpire: AutoExpireSettings;
  biometricLock: boolean;
}
