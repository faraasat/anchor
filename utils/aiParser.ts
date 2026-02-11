// AI-powered natural language reminder parser using @fastshot/ai
import { generateText } from '@/lib/groq';
import { AIParseResult, TagType, RecurrenceRule, RecurrenceType } from '@/types/reminder';
import { parseRecurrenceFromText } from './recurrence';

const PARSER_PROMPT = `You are a reminder parsing assistant. Parse the user's natural language input and extract reminder details.

User input: "{input}"

Extract and return ONLY a valid JSON object (no markdown, no explanation) with these fields:
{
  "title": "the task/reminder name (concise, actionable phrase)",
  "suggestedTag": "one of: Work, Personal, Errands, Health, Finance, Home, Social",
  "tagConfidence": 0.0 to 1.0 (how confident you are about the tag),
  "date": "YYYY-MM-DD format or null if not specified",
  "time": "HH:mm format (24-hour) or null if not specified",
  "recurrenceType": "none, daily, weekly, monthly, yearly, custom_days, nth_weekday, or specific_days",
  "recurrenceInterval": number or null (e.g., 3 for "every 3 days"),
  "daysOfWeek": array of numbers 0-6 (Sun=0) or null,
  "nthWeekday": {"n": 1-5 or -1 for last, "weekday": 0-6} or null,
  "smartTimeReason": "brief reason for suggested time if inferring",
  "rawInterpretation": "how you interpreted the input"
}

Tag selection guidelines:
- Work: meetings, reports, projects, deadlines, professional tasks
- Personal: self-care, hobbies, personal goals, family
- Errands: shopping, appointments, bills, chores outside home
- Health: exercise, medication, doctor appointments, wellness
- Finance: payments, budgeting, investments, financial tasks
- Home: household chores, maintenance, gardening, cleaning
- Social: events, calls, messages to friends/family, gatherings

Time inference:
- Morning activities: 8-9 AM
- Work tasks: 9-10 AM
- Lunch-related: 12 PM
- Evening/dinner: 6-7 PM
- Night tasks: 9 PM

Recurrence parsing:
- "every day" or "daily" → daily
- "every X days" → custom_days with interval X
- "every Monday" or specific day → weekly with that day
- "weekdays" → specific_days with [1,2,3,4,5]
- "first Monday of the month" → nth_weekday
- "monthly" → monthly
- "yearly" or "annually" → yearly`;

export async function parseReminderWithAI(input: string): Promise<AIParseResult> {
  try {
    const prompt = PARSER_PROMPT.replace('{input}', input);

    const response = await generateText({
      prompt,
      temperature: 0.3, // Lower temperature for more consistent parsing
    });

    if (!response) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    const cleanedResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(cleanedResponse);

    // Build recurrence rule
    const recurrence = buildRecurrenceRule(parsed);

    // Infer default time if not specified
    const inferredTime = parsed.time || inferTimeFromContext(input, parsed.title);

    return {
      title: parsed.title || extractFallbackTitle(input),
      suggestedTag: validateTag(parsed.suggestedTag),
      tagConfidence: Math.min(1, Math.max(0, parsed.tagConfidence || 0.7)),
      schedule: {
        date: parsed.date || getDefaultDate(),
        time: inferredTime,
        recurrence,
        smartTime: inferredTime,
        smartTimeReason: parsed.smartTimeReason || undefined,
      },
      rawInterpretation: parsed.rawInterpretation || `Parsed: ${parsed.title}`,
    };
  } catch (error) {
    console.error('AI parsing error:', error);
    // Fallback to basic parsing
    return fallbackParse(input);
  }
}

function buildRecurrenceRule(parsed: any): RecurrenceRule {
  const type = (parsed.recurrenceType || 'none') as RecurrenceType;

  if (type === 'none') {
    return { type: 'none' };
  }

  const rule: RecurrenceRule = { type };

  if (parsed.recurrenceInterval) {
    rule.interval = parsed.recurrenceInterval;
  }

  if (parsed.daysOfWeek && Array.isArray(parsed.daysOfWeek)) {
    rule.daysOfWeek = parsed.daysOfWeek;
  }

  if (parsed.nthWeekday && parsed.nthWeekday.n !== undefined) {
    rule.nthWeekday = {
      n: parsed.nthWeekday.n,
      weekday: parsed.nthWeekday.weekday || 0,
    };
  }

  return rule;
}

function validateTag(tag: string): TagType {
  const validTags: TagType[] = ['Work', 'Personal', 'Errands', 'Health', 'Finance', 'Home', 'Social'];
  const normalized = tag?.charAt(0).toUpperCase() + tag?.slice(1).toLowerCase();
  return validTags.includes(normalized as TagType) ? (normalized as TagType) : 'Personal';
}

function getDefaultDate(): string {
  return new Date().toISOString().split('T')[0];
}

function inferTimeFromContext(input: string, title: string): string {
  const text = (input + ' ' + title).toLowerCase();

  if (text.includes('morning') || text.includes('breakfast')) return '08:00';
  if (text.includes('lunch') || text.includes('noon')) return '12:00';
  if (text.includes('afternoon')) return '14:00';
  if (text.includes('evening') || text.includes('dinner')) return '18:00';
  if (text.includes('night') || text.includes('bedtime')) return '21:00';

  // Extract explicit time
  const timeMatch = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    const meridiem = timeMatch[3]?.toLowerCase();

    if (meridiem === 'pm' && hours < 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // Default to 9 AM
  return '09:00';
}

function extractFallbackTitle(input: string): string {
  // Remove common prefixes
  let title = input
    .replace(/^(remind me to|reminder:?|don't forget to|remember to)\s*/i, '')
    .replace(/\s+(every|at|on|by|before)\s+.*/i, '')
    .trim();

  // Capitalize first letter
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function fallbackParse(input: string): AIParseResult {
  const title = extractFallbackTitle(input);
  const recurrence = parseRecurrenceFromText(input) || { type: 'none' as const };
  const time = inferTimeFromContext(input, title);

  // Basic tag inference
  let tag: TagType = 'Personal';
  const lowerInput = input.toLowerCase();

  if (lowerInput.match(/meeting|report|deadline|project|work|office|client/)) {
    tag = 'Work';
  } else if (lowerInput.match(/buy|shop|grocery|pick up|store/)) {
    tag = 'Errands';
  } else if (lowerInput.match(/exercise|workout|gym|doctor|medicine|health|walk|run/)) {
    tag = 'Health';
  } else if (lowerInput.match(/pay|bill|budget|bank|invest|money/)) {
    tag = 'Finance';
  } else if (lowerInput.match(/clean|laundry|water|plant|repair|home|house/)) {
    tag = 'Home';
  } else if (lowerInput.match(/call|message|party|dinner with|lunch with|meet/)) {
    tag = 'Social';
  }

  return {
    title,
    suggestedTag: tag,
    tagConfidence: 0.6,
    schedule: {
      date: getDefaultDate(),
      time,
      recurrence,
      smartTime: time,
      smartTimeReason: 'Based on task type',
    },
    rawInterpretation: `Basic parsing: ${title}`,
  };
}

// Hook for using AI parser in components
export function useAIReminderParser() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<AIParseResult | null>(null);

  const parse = async (input: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const parsed = await parseReminderWithAI(input);
      setResult(parsed);
      return parsed;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Parsing failed');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { parse, result, isLoading, error, reset };
}

// Need to import useState for the hook
import { useState } from 'react';
