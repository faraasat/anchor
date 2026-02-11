// AI Parser Service - Complex natural language parsing using Newell AI
// Phase 2: Parse multi-faceted commands (task + location + circle + schedule)
import { generateText } from '@fastshot/ai';
import type { Reminder, TagType, LocationCategory, RecurrenceRule } from '@/types/reminder';

export interface ParsedCommand {
  title: string;
  description?: string;
  tag: TagType;
  tagConfidence: number;
  priority: 'low' | 'medium' | 'high';

  // Schedule parsing
  schedule: {
    dueDate?: string;      // ISO date
    dueTime?: string;      // HH:mm
    recurrence?: RecurrenceRule;
    smartSchedule?: {
      reason: string;
      suggestedTime: string;
    };
  };

  // Location parsing
  location?: {
    category?: LocationCategory;
    specificLocation?: {
      name: string;
      address?: string;
    };
    radius?: number;
  };

  // Circle/Household assignment
  circleAssignment?: {
    circleName: string;
    confidence: number;
  };

  // Context triggers
  contextTriggers?: Array<{
    type: 'location_category' | 'time_of_day' | 'bluetooth' | 'wifi';
    value: string;
  }>;

  // Confidence and metadata
  overallConfidence: number;
  interpretation: string;
  rawCommand: string;
}

export class AIParserService {
  /**
   * Parse complex natural language command
   * Example: "Remind me to buy coffee when I'm near a grocery store and add it to the Home Circle"
   */
  static async parseVoiceCommand(command: string): Promise<ParsedCommand> {
    const prompt = this.buildParsingPrompt(command);

    try {
      const response = await generateText({
        prompt,
        maxTokens: 500,
      });

      return this.parseAIResponse(response, command);
    } catch (error) {
      console.error('Error parsing voice command:', error);
      // Fallback to basic parsing
      return this.fallbackParser(command);
    }
  }

  /**
   * Parse natural language for quick add (simpler than voice)
   */
  static async parseQuickAdd(text: string): Promise<Partial<ParsedCommand>> {
    const prompt = `Parse this task: "${text}"

Extract:
1. Task title (cleaned up)
2. Category (Work/Personal/Errands/Health/Finance/Home/Social)
3. Due date/time if mentioned
4. Priority (low/medium/high)

Respond in JSON format:
{
  "title": "string",
  "tag": "Work|Personal|etc",
  "tagConfidence": 0.0-1.0,
  "priority": "low|medium|high",
  "dueDate": "YYYY-MM-DD or null",
  "dueTime": "HH:mm or null"
}`;

    try {
      const response = await generateText({ prompt, maxTokens: 200 });
      const parsed = this.extractJSON(response);

      return {
        title: parsed.title || text,
        tag: parsed.tag || 'Personal',
        tagConfidence: parsed.tagConfidence || 0.7,
        priority: parsed.priority || 'medium',
        schedule: {
          dueDate: parsed.dueDate,
          dueTime: parsed.dueTime,
        },
        overallConfidence: parsed.tagConfidence || 0.7,
        rawCommand: text,
      };
    } catch (error) {
      console.error('Error parsing quick add:', error);
      return {
        title: text,
        tag: 'Personal',
        priority: 'medium',
        rawCommand: text,
      };
    }
  }

  // === PRIVATE HELPER METHODS ===

  private static buildParsingPrompt(command: string): string {
    return `You are Anchor's AI parser. Parse this natural language command into structured task data.

Command: "${command}"

Extract ALL of the following (be thorough):
1. **Task title** - Clean, actionable version
2. **Description** - Additional context if provided
3. **Category** - Work, Personal, Errands, Health, Finance, Home, or Social (with confidence 0-1)
4. **Priority** - low, medium, or high based on urgency cues
5. **Schedule** - Parse any time/date mentions:
   - Explicit dates ("tomorrow", "next Monday", "Jan 15")
   - Explicit times ("at 3pm", "in the morning")
   - Recurrence ("every day", "weekly", "every Friday")
   - Relative times ("in 2 hours", "this evening")
6. **Location triggers** - Parse location mentions:
   - Categories: supermarket, gas_station, pharmacy, bank, gym, restaurant, coffee_shop
   - Specific locations: "at Whole Foods", "near my office"
   - Proximity: radius in meters (default 200m)
7. **Circle/Household assignment** - Mentions of "Home Circle", "Work Circle", etc.
8. **Context triggers** - Implicit triggers:
   - "when I get home" → location trigger
   - "when I wake up" → time_of_day trigger
   - "when I connect to car bluetooth" → bluetooth trigger

Respond in this JSON format:
{
  "title": "Clean task title",
  "description": "Additional context or null",
  "tag": "Personal",
  "tagConfidence": 0.9,
  "priority": "medium",
  "schedule": {
    "dueDate": "YYYY-MM-DD or null",
    "dueTime": "HH:mm or null",
    "recurrence": {
      "type": "none|daily|weekly|monthly",
      "daysOfWeek": [0,1,2] or null,
      "interval": 1
    },
    "smartSchedule": {
      "reason": "Why this time was chosen",
      "suggestedTime": "HH:mm"
    } or null
  },
  "location": {
    "category": "supermarket|gas_station|etc or null",
    "specificLocation": {
      "name": "Store name or null",
      "address": "Address or null"
    },
    "radius": 200
  } or null,
  "circleAssignment": {
    "circleName": "Home|Work|etc",
    "confidence": 0.8
  } or null,
  "contextTriggers": [
    {"type": "location_category", "value": "supermarket"}
  ] or [],
  "overallConfidence": 0.85,
  "interpretation": "Natural explanation of what was parsed"
}

Parse the command thoroughly:`;
  }

  private static parseAIResponse(response: string, originalCommand: string): ParsedCommand {
    try {
      const parsed = this.extractJSON(response);

      return {
        title: parsed.title || originalCommand,
        description: parsed.description,
        tag: parsed.tag || 'Personal',
        tagConfidence: parsed.tagConfidence || 0.7,
        priority: parsed.priority || 'medium',
        schedule: parsed.schedule || {},
        location: parsed.location,
        circleAssignment: parsed.circleAssignment,
        contextTriggers: parsed.contextTriggers || [],
        overallConfidence: parsed.overallConfidence || 0.7,
        interpretation: parsed.interpretation || 'Parsed as task',
        rawCommand: originalCommand,
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this.fallbackParser(originalCommand);
    }
  }

  private static fallbackParser(command: string): ParsedCommand {
    // Simple keyword-based parsing as fallback
    const lowerCommand = command.toLowerCase();

    // Detect category
    let tag: TagType = 'Personal';
    if (lowerCommand.includes('work') || lowerCommand.includes('meeting') || lowerCommand.includes('email')) {
      tag = 'Work';
    } else if (lowerCommand.includes('buy') || lowerCommand.includes('grocery') || lowerCommand.includes('store')) {
      tag = 'Errands';
    } else if (lowerCommand.includes('exercise') || lowerCommand.includes('workout') || lowerCommand.includes('health')) {
      tag = 'Health';
    }

    // Detect location category
    let locationCategory: LocationCategory | undefined;
    if (lowerCommand.includes('grocery') || lowerCommand.includes('supermarket')) {
      locationCategory = 'supermarket';
    } else if (lowerCommand.includes('gas') || lowerCommand.includes('fuel')) {
      locationCategory = 'gas_station';
    } else if (lowerCommand.includes('pharmacy') || lowerCommand.includes('drug store')) {
      locationCategory = 'pharmacy';
    } else if (lowerCommand.includes('bank') || lowerCommand.includes('atm')) {
      locationCategory = 'bank';
    } else if (lowerCommand.includes('gym') || lowerCommand.includes('fitness')) {
      locationCategory = 'gym';
    }

    // Detect priority
    let priority: 'low' | 'medium' | 'high' = 'medium';
    if (lowerCommand.includes('urgent') || lowerCommand.includes('asap') || lowerCommand.includes('important')) {
      priority = 'high';
    }

    // Clean title
    const title = command
      .replace(/remind me to/gi, '')
      .replace(/when i('m| am) near/gi, '')
      .replace(/and add it to the .* circle/gi, '')
      .trim();

    return {
      title: title || command,
      tag,
      tagConfidence: 0.6,
      priority,
      schedule: {},
      location: locationCategory ? { category: locationCategory, radius: 200 } : undefined,
      overallConfidence: 0.6,
      interpretation: 'Parsed with basic keyword matching',
      rawCommand: command,
    };
  }

  private static extractJSON(text: string): any {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }

      // Try to find JSON object in text
      const objectMatch = text.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        return JSON.parse(objectMatch[0]);
      }

      // If no JSON found, try parsing the whole text
      return JSON.parse(text);
    } catch (error) {
      throw new Error('Failed to extract JSON from AI response');
    }
  }
}
