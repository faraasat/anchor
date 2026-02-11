// Stack Service - Manage community task stacks
import { supabase } from '@/lib/supabase';
import { Stack, StackTask, StackCategory, StackImportResult, ScheduleSuggestion } from '@/types/stack';
import { Reminder } from '@/types/reminder';
import { NewellAI } from '@/lib/groq';

export class StackService {
  /**
   * Get featured stacks
   */
  static async getFeaturedStacks(): Promise<Stack[]> {
    try {
      const { data, error } = await supabase
        .from('stacks')
        .select('*')
        .eq('isPublic', true)
        .eq('isFeatured', true)
        .order('downloads', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching featured stacks:', error);
      return [];
    }
  }

  /**
   * Get stacks by category
   */
  static async getStacksByCategory(category: string): Promise<Stack[]> {
    try {
      const { data, error } = await supabase
        .from('stacks')
        .select('*')
        .eq('isPublic', true)
        .eq('category', category)
        .order('rating', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching stacks by category:', error);
      return [];
    }
  }

  /**
   * Search stacks
   */
  static async searchStacks(query: string): Promise<Stack[]> {
    try {
      const { data, error } = await supabase
        .from('stacks')
        .select('*')
        .eq('isPublic', true)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
        .order('downloads', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching stacks:', error);
      return [];
    }
  }

  /**
   * Get stack categories
   */
  static async getCategories(): Promise<StackCategory[]> {
    try {
      const { data, error } = await supabase
        .from('stack_categories')
        .select('*')
        .order('stackCount', { ascending: false });

      if (error) throw error;
      return data || this.getDefaultCategories();
    } catch (error) {
      console.error('Error fetching categories:', error);
      return this.getDefaultCategories();
    }
  }

  /**
   * Default categories fallback
   */
  private static getDefaultCategories(): StackCategory[] {
    return [
      { id: '1', name: 'Work & Productivity', icon: 'briefcase', stackCount: 0 },
      { id: '2', name: 'Home & Family', icon: 'home', stackCount: 0 },
      { id: '3', name: 'Health & Fitness', icon: 'fitness', stackCount: 0 },
      { id: '4', name: 'Learning & Education', icon: 'school', stackCount: 0 },
      { id: '5', name: 'Finance & Money', icon: 'cash', stackCount: 0 },
      { id: '6', name: 'Travel & Adventure', icon: 'airplane', stackCount: 0 },
    ];
  }

  /**
   * Get stack by ID
   */
  static async getStackById(stackId: string): Promise<Stack | null> {
    try {
      const { data, error } = await supabase
        .from('stacks')
        .select('*')
        .eq('id', stackId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching stack:', error);
      return null;
    }
  }

  /**
   * Import stack with AI scheduling
   * Uses Newell AI to analyze user's calendar and suggest optimal timing
   */
  static async importStackWithAI(
    userId: string,
    stackId: string,
    userReminders: Reminder[]
  ): Promise<StackImportResult> {
    try {
      // Get the stack
      const stack = await this.getStackById(stackId);
      if (!stack) {
        throw new Error('Stack not found');
      }

      // Analyze user's current schedule with Newell AI
      const scheduleAnalysis = await this.analyzeScheduleWithAI(userId, stack, userReminders);

      // Create reminders from stack tasks with AI-suggested times
      const scheduledTasks: Reminder[] = [];
      const now = new Date();

      for (const task of stack.tasks) {
        const suggestion = scheduleAnalysis.suggestedSchedule.find((s) => s.taskId === task.id);

        const reminder: Reminder = {
          id: `stack-${stackId}-${task.id}-${Date.now()}`,
          title: task.title,
          description: task.description,
          dueDate: suggestion?.suggestedDate || now.toISOString().split('T')[0],
          dueTime: suggestion?.suggestedTime || '12:00',
          tag: task.tag || stack.category,
          priority: task.priority || 'medium',
          status: 'pending',
          recurrence: { type: 'none' },
          isRecurring: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          // Add metadata about the stack
          metadata: {
            stackId: stack.id,
            stackTitle: stack.title,
            taskOrder: task.order,
            aiScheduled: true,
            aiReasoning: suggestion?.reasoning,
          },
        };

        scheduledTasks.push(reminder);
      }

      // Increment download count
      await supabase
        .from('stacks')
        .update({ downloads: stack.downloads + 1 })
        .eq('id', stackId);

      return {
        stackId: stack.id,
        scheduledTasks,
        aiSuggestions: scheduleAnalysis,
      };
    } catch (error) {
      console.error('Error importing stack with AI:', error);
      throw error;
    }
  }

  /**
   * Use Newell AI to analyze schedule and suggest optimal timing
   */
  private static async analyzeScheduleWithAI(
    userId: string,
    stack: Stack,
    userReminders: Reminder[]
  ): Promise<{
    optimalStartDate: string;
    suggestedSchedule: ScheduleSuggestion[];
    reasoning: string;
    conflictWarnings?: string[];
  }> {
    try {
      // Build context for AI
      const context = {
        userSchedule: userReminders.map((r) => ({
          title: r.title,
          date: r.dueDate,
          time: r.dueTime,
          priority: r.priority,
          tag: r.tag,
        })),
        stackInfo: {
          title: stack.title,
          tasks: stack.tasks.map((t) => ({
            id: t.id,
            title: t.title,
            duration: t.estimatedDuration,
            order: t.order,
            dependencies: t.dependencies,
          })),
          estimatedTime: stack.estimatedTime,
          difficulty: stack.difficulty,
        },
        currentDate: new Date().toISOString().split('T')[0],
      };

      // Use Newell AI to generate schedule
      const prompt = `You are a task scheduling AI assistant. Analyze the user's current schedule and suggest optimal times for the following task stack.

User's Current Schedule:
${JSON.stringify(context.userSchedule, null, 2)}

Stack to Schedule:
${JSON.stringify(context.stackInfo, null, 2)}

Current Date: ${context.currentDate}

Please provide:
1. Optimal start date for the stack
2. Suggested schedule for each task (date, time, reasoning)
3. Overall reasoning for the schedule
4. Any conflict warnings

Respond in JSON format:
{
  "optimalStartDate": "YYYY-MM-DD",
  "suggestedSchedule": [
    {
      "taskId": "string",
      "taskTitle": "string",
      "suggestedDate": "YYYY-MM-DD",
      "suggestedTime": "HH:MM",
      "reasoning": "string",
      "confidence": 0.0-1.0
    }
  ],
  "reasoning": "string",
  "conflictWarnings": ["string"]
}`;

      const response = await NewellAI.generateText(prompt, {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 1500,
      });

      // Parse AI response
      const cleanedResponse = response.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const aiSuggestions = JSON.parse(cleanedResponse);

      return aiSuggestions;
    } catch (error) {
      console.error('Error analyzing schedule with AI:', error);

      // Fallback: Simple scheduling without AI
      const today = new Date();
      const suggestedSchedule: ScheduleSuggestion[] = stack.tasks.map((task, index) => {
        const taskDate = new Date(today);
        taskDate.setDate(taskDate.getDate() + index);

        return {
          taskId: task.id,
          taskTitle: task.title,
          suggestedDate: taskDate.toISOString().split('T')[0],
          suggestedTime: '09:00',
          reasoning: 'Default sequential scheduling',
          confidence: 0.5,
        };
      });

      return {
        optimalStartDate: today.toISOString().split('T')[0],
        suggestedSchedule,
        reasoning: 'Using default sequential scheduling due to AI unavailability',
      };
    }
  }

  /**
   * Create a new stack (for future feature)
   */
  static async createStack(userId: string, stack: Omit<Stack, 'id' | 'createdAt' | 'updatedAt' | 'downloads' | 'rating' | 'reviewCount'>): Promise<Stack> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('stacks')
        .insert({
          ...stack,
          creatorId: userId,
          downloads: 0,
          rating: 0,
          reviewCount: 0,
          createdAt: now,
          updatedAt: now,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating stack:', error);
      throw error;
    }
  }

  /**
   * Get user's imported stacks
   */
  static async getUserStacks(userId: string): Promise<Stack[]> {
    try {
      const { data, error } = await supabase
        .from('user_stacks')
        .select('stackId, stacks(*)')
        .eq('userId', userId)
        .order('importedAt', { ascending: false });

      if (error) throw error;
      return data?.map((item: any) => item.stacks) || [];
    } catch (error) {
      console.error('Error fetching user stacks:', error);
      return [];
    }
  }

  /**
   * Save user's stack import
   */
  static async saveUserStackImport(userId: string, stackId: string): Promise<void> {
    try {
      await supabase
        .from('user_stacks')
        .insert({
          userId,
          stackId,
          importedAt: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error saving user stack import:', error);
    }
  }
}
