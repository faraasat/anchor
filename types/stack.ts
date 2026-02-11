// Stack Types - Community-shared task collections
import { Reminder } from './reminder';

export interface Stack {
  id: string;
  title: string;
  description: string;
  category: string;
  tasks: StackTask[];
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  downloads: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: string; // e.g., "2 hours", "1 day"
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  isFeatured?: boolean;
}

export interface StackTask {
  id: string;
  title: string;
  description?: string;
  estimatedDuration?: number; // minutes
  order: number;
  tag?: string;
  priority?: 'low' | 'medium' | 'high';
  dependencies?: string[]; // IDs of tasks that must be completed first
}

export interface StackImportResult {
  stackId: string;
  scheduledTasks: Reminder[];
  aiSuggestions: {
    optimalStartDate: string;
    suggestedSchedule: ScheduleSuggestion[];
    reasoning: string;
    conflictWarnings?: string[];
  };
}

export interface ScheduleSuggestion {
  taskId: string;
  taskTitle: string;
  suggestedDate: string;
  suggestedTime: string;
  reasoning: string;
  confidence: number;
}

export interface StackCategory {
  id: string;
  name: string;
  icon: string;
  stackCount: number;
}
