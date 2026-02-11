// Routine Detection Service - AI-powered pattern recognition
// Phase 2: Detect task sequences and suggest Routine Stacks
import { generateText } from '@/lib/groq';
import type { Reminder, TagType } from '@/types/reminder';

export interface RoutinePattern {
  id: string;
  name: string;
  tasks: Array<{
    title: string;
    tag: TagType;
    typicalTime: string;  // HH:mm
    order: number;
  }>;
  frequency: 'daily' | 'weekly' | 'monthly';
  confidence: number;  // 0-1
  detectedCount: number;  // How many times this pattern was observed
  lastOccurrence: string;  // ISO date
  suggestedDays?: number[];  // For weekly routines (0-6)
}

export interface RoutineSuggestion {
  pattern: RoutinePattern;
  reason: string;
  impact: string;  // How it will help the user
  shouldSuggest: boolean;
}

export class RoutineDetectionService {
  private static readonly MIN_PATTERN_OCCURRENCES = 3;
  private static readonly MIN_CONFIDENCE = 0.7;
  private static readonly DETECTION_WINDOW_DAYS = 30;

  /**
   * Analyze completed tasks to detect routine patterns
   */
  static async detectRoutines(
    userId: string,
    reminders: Reminder[]
  ): Promise<RoutineSuggestion[]> {
    // Filter to completed tasks in detection window
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.DETECTION_WINDOW_DAYS);
    const cutoffISO = cutoffDate.toISOString().split('T')[0];

    const completedTasks = reminders.filter(
      r => r.status === 'completed' &&
           r.completedAt &&
           r.completedAt >= cutoffISO
    );

    if (completedTasks.length < 5) {
      return [];  // Not enough data
    }

    // Detect patterns using AI
    const patterns = await this.analyzeTaskPatterns(completedTasks);

    // Filter patterns that meet threshold
    const validPatterns = patterns.filter(
      p => p.detectedCount >= this.MIN_PATTERN_OCCURRENCES &&
           p.confidence >= this.MIN_CONFIDENCE
    );

    // Generate suggestions
    const suggestions: RoutineSuggestion[] = [];
    for (const pattern of validPatterns) {
      const suggestion = await this.generateSuggestion(pattern);
      if (suggestion.shouldSuggest) {
        suggestions.push(suggestion);
      }
    }

    return suggestions;
  }

  /**
   * Create a Routine Stack from pattern
   */
  static createRoutineStack(pattern: RoutinePattern): Reminder[] {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    return pattern.tasks.map((task, index) => ({
      id: `routine-${pattern.id}-${index}`,
      title: task.title,
      description: `Part of ${pattern.name} routine`,
      dueDate: today,
      dueTime: task.typicalTime,
      tag: task.tag,
      status: 'pending' as const,
      priority: 'medium' as const,
      recurrence: {
        type: pattern.frequency === 'daily' ? 'daily' :
              pattern.frequency === 'weekly' ? 'specific_days' : 'monthly',
        ...(pattern.frequency === 'weekly' && pattern.suggestedDays
          ? { daysOfWeek: pattern.suggestedDays }
          : {}
        ),
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      isRecurring: true,
      aiPredicted: true,
      aiConfidence: pattern.confidence,
    }));
  }

  // === PRIVATE HELPER METHODS ===

  private static async analyzeTaskPatterns(tasks: Reminder[]): Promise<RoutinePattern[]> {
    // Group tasks by day
    const tasksByDay = this.groupTasksByDay(tasks);

    // Build context for AI
    const taskSummary = tasks
      .slice(0, 50)  // Limit to recent 50 for token efficiency
      .map(t => ({
        title: t.title,
        tag: t.tag,
        completedAt: t.completedAt,
        time: t.dueTime,
      }));

    const prompt = `You are Anchor's routine detection AI. Analyze these completed tasks to find recurring patterns.

Tasks (last 30 days):
${JSON.stringify(taskSummary, null, 2)}

Detect routine patterns where:
1. The same tasks (or very similar tasks) are completed repeatedly
2. Tasks occur in a predictable sequence
3. Tasks happen at consistent times
4. Tasks are completed at least 3 times in the period

Respond with detected patterns in JSON format:
[
  {
    "name": "Morning Routine|Evening Routine|Weekly Prep|etc",
    "tasks": [
      {
        "title": "Task name",
        "tag": "Personal|Work|etc",
        "typicalTime": "HH:mm",
        "order": 1
      }
    ],
    "frequency": "daily|weekly|monthly",
    "confidence": 0.0-1.0,
    "detectedCount": 5,
    "suggestedDays": [1,3,5] or null
  }
]

Only return patterns with confidence >= 0.7 and detectedCount >= 3.`;

    try {
      const response = await generateText({
        prompt,
        maxTokens: 800,
      });

      const parsed = this.extractJSON(response);
      const patterns: RoutinePattern[] = Array.isArray(parsed) ? parsed : [parsed];

      return patterns.map((p, i) => ({
        ...p,
        id: `pattern-${Date.now()}-${i}`,
        lastOccurrence: tasks[0]?.completedAt || new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error analyzing task patterns:', error);
      return this.fallbackPatternDetection(tasks);
    }
  }

  private static async generateSuggestion(pattern: RoutinePattern): Promise<RoutineSuggestion> {
    const prompt = `You are Anchor's AI assistant. Generate a suggestion for this detected routine pattern.

Pattern:
- Name: ${pattern.name}
- Tasks: ${pattern.tasks.map(t => t.title).join(', ')}
- Frequency: ${pattern.frequency}
- Detected: ${pattern.detectedCount} times
- Confidence: ${Math.round(pattern.confidence * 100)}%

Generate a suggestion with:
1. **Reason** - Why this pattern was detected (1 sentence)
2. **Impact** - How creating a Routine Stack will help (1 sentence, focus on benefits)
3. **Should Suggest** - true/false (only suggest if genuinely helpful)

Respond in JSON:
{
  "reason": "You complete these tasks together every...",
  "impact": "A Routine Stack will...",
  "shouldSuggest": true
}`;

    try {
      const response = await generateText({ prompt, maxTokens: 200 });
      const parsed = this.extractJSON(response);

      return {
        pattern,
        reason: parsed.reason || `Pattern detected: ${pattern.name}`,
        impact: parsed.impact || 'Creating a Routine Stack will streamline your workflow.',
        shouldSuggest: parsed.shouldSuggest !== false,
      };
    } catch (error) {
      console.error('Error generating suggestion:', error);
      return {
        pattern,
        reason: `You've completed these ${pattern.frequency} ${pattern.detectedCount} times.`,
        impact: 'Save time by automating this sequence.',
        shouldSuggest: pattern.confidence >= 0.8,
      };
    }
  }

  private static fallbackPatternDetection(tasks: Reminder[]): RoutinePattern[] {
    // Simple frequency-based detection
    const taskCounts: Record<string, { count: number; times: string[]; tag: TagType }> = {};

    tasks.forEach(task => {
      const key = task.title.toLowerCase().trim();
      if (!taskCounts[key]) {
        taskCounts[key] = { count: 0, times: [], tag: task.tag };
      }
      taskCounts[key].count++;
      taskCounts[key].times.push(task.dueTime);
    });

    const patterns: RoutinePattern[] = [];
    for (const [title, data] of Object.entries(taskCounts)) {
      if (data.count >= this.MIN_PATTERN_OCCURRENCES) {
        // Calculate average time
        const avgTime = this.calculateAverageTime(data.times);

        patterns.push({
          id: `fallback-${Date.now()}-${Math.random()}`,
          name: `${title} Routine`,
          tasks: [{
            title,
            tag: data.tag,
            typicalTime: avgTime,
            order: 1,
          }],
          frequency: 'weekly',
          confidence: Math.min(data.count / 10, 0.9),
          detectedCount: data.count,
          lastOccurrence: new Date().toISOString(),
        });
      }
    }

    return patterns;
  }

  private static groupTasksByDay(tasks: Reminder[]): Record<string, Reminder[]> {
    return tasks.reduce((acc, task) => {
      const date = task.completedAt?.split('T')[0] || task.dueDate;
      if (!acc[date]) acc[date] = [];
      acc[date].push(task);
      return acc;
    }, {} as Record<string, Reminder[]>);
  }

  private static calculateAverageTime(times: string[]): string {
    const minutes = times.map(t => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    });

    const avgMinutes = Math.round(
      minutes.reduce((sum, m) => sum + m, 0) / minutes.length
    );

    const hours = Math.floor(avgMinutes / 60);
    const mins = avgMinutes % 60;

    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  private static extractJSON(text: string): any {
    try {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      const objectMatch = text.match(/\{[\s\S]*\}/) || text.match(/\[[\s\S]*\]/);
      if (objectMatch) {
        return JSON.parse(objectMatch[0]);
      }

      return JSON.parse(text);
    } catch (error) {
      throw new Error('Failed to extract JSON from AI response');
    }
  }
}
