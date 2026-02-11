// Advanced AI Features using Newell AI
import { generateText } from '@/lib/groq';
import { Reminder, TagType } from '@/types/reminder';
import { PreferencesStorage } from './storage';

// Smart Time Suggestions - Suggest optimal time based on habits and context
export async function suggestSmartTime(
  taskTitle: string,
  taskTag: TagType,
  existingReminders: Reminder[]
): Promise<{ time: string; reason: string }> {
  try {
    const preferences = await PreferencesStorage.get();
    const todaysReminders = existingReminders.filter(r =>
      r.dueDate === new Date().toISOString().split('T')[0]
    );

    const busyHours = todaysReminders.map(r => parseInt(r.dueTime.split(':')[0]));
    const currentHour = new Date().getHours();

    const prompt = `As a productivity AI, suggest the best time for this task:

Task: "${taskTitle}"
Category: ${taskTag}
Current time: ${currentHour}:00
Work hours: ${preferences.workStartTime} - ${preferences.workEndTime}
Busy hours today: ${busyHours.join(', ')}
Existing tasks: ${todaysReminders.map(r => `${r.dueTime} - ${r.title}`).join(', ')}

Suggest the optimal time (HH:mm format) and provide a brief reason (max 15 words) why this time is good.

Respond ONLY with JSON: {"time": "HH:mm", "reason": "brief explanation"}`;

    const response = await generateText({
      prompt,
      temperature: 0.4,
    });

    if (!response) {
      return getDefaultSmartTime(taskTag, preferences);
    }

    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      time: parsed.time || '09:00',
      reason: parsed.reason || 'Based on your schedule',
    };
  } catch (error) {
    console.error('Smart time suggestion error:', error);
    const preferences = await PreferencesStorage.get();
    return getDefaultSmartTime(taskTag, preferences);
  }
}

function getDefaultSmartTime(tag: TagType, preferences: any): { time: string; reason: string } {
  const now = new Date();
  const currentHour = now.getHours();

  switch (tag) {
    case 'Work':
      if (currentHour < 9) {
        return { time: preferences.workStartTime, reason: 'Start of your workday' };
      } else if (currentHour < 17) {
        return { time: `${currentHour + 1}:00`, reason: 'Next available hour' };
      } else {
        return { time: '09:00', reason: 'Tomorrow morning' };
      }
    case 'Health':
      return { time: '07:00', reason: 'Morning energy boost' };
    case 'Personal':
      return { time: '18:00', reason: 'After work hours' };
    case 'Errands':
      return { time: '14:00', reason: 'Afternoon errands window' };
    case 'Home':
      return { time: '19:00', reason: 'Evening home time' };
    case 'Social':
      return { time: '18:30', reason: 'Social evening hours' };
    case 'Finance':
      return { time: '20:00', reason: 'Quiet time for finances' };
    default:
      return { time: '10:00', reason: 'Mid-morning slot' };
  }
}

// Auto-Categorization - Automatically tag reminders using AI
export async function autoCategorizeReminder(title: string, description?: string): Promise<{ tag: TagType; confidence: number; reason: string }> {
  try {
    const prompt = `Categorize this reminder into ONE of these categories: Work, Personal, Errands, Health, Finance, Home, Social

Title: "${title}"
${description ? `Description: "${description}"` : ''}

Guidelines:
- Work: meetings, reports, projects, deadlines, professional tasks
- Personal: self-care, hobbies, personal goals, family (non-social)
- Errands: shopping, appointments, bills, chores outside
- Health: exercise, medication, doctor, wellness
- Finance: payments, budgeting, investments, financial tasks
- Home: household chores, maintenance, cleaning, repairs
- Social: events, calls, messages, gatherings with others

Respond ONLY with JSON: {"tag": "CategoryName", "confidence": 0.0-1.0, "reason": "brief explanation"}`;

    const response = await generateText({
      prompt,
      temperature: 0.3,
    });

    if (!response) {
      return fallbackCategorization(title, description);
    }

    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      tag: validateTag(parsed.tag),
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.8)),
      reason: parsed.reason || 'Based on task content',
    };
  } catch (error) {
    console.error('Auto-categorization error:', error);
    return fallbackCategorization(title, description);
  }
}

function fallbackCategorization(title: string, description?: string): { tag: TagType; confidence: number; reason: string } {
  const text = `${title} ${description || ''}`.toLowerCase();

  if (text.match(/meeting|report|deadline|project|work|office|client|presentation/)) {
    return { tag: 'Work', confidence: 0.7, reason: 'Contains work-related keywords' };
  }
  if (text.match(/buy|shop|grocery|pick up|store|errand/)) {
    return { tag: 'Errands', confidence: 0.7, reason: 'Shopping or errand task' };
  }
  if (text.match(/exercise|workout|gym|doctor|medicine|health|walk|run|yoga/)) {
    return { tag: 'Health', confidence: 0.7, reason: 'Health and wellness activity' };
  }
  if (text.match(/pay|bill|budget|bank|invest|money|finance/)) {
    return { tag: 'Finance', confidence: 0.7, reason: 'Financial task' };
  }
  if (text.match(/clean|laundry|water|plant|repair|home|house|maintenance/)) {
    return { tag: 'Home', confidence: 0.7, reason: 'Home maintenance task' };
  }
  if (text.match(/call|message|party|dinner with|lunch with|meet|social|friend/)) {
    return { tag: 'Social', confidence: 0.7, reason: 'Social interaction' };
  }

  return { tag: 'Personal', confidence: 0.5, reason: 'General personal task' };
}

function validateTag(tag: string): TagType {
  const validTags: TagType[] = ['Work', 'Personal', 'Errands', 'Health', 'Finance', 'Home', 'Social'];
  const normalized = tag?.charAt(0).toUpperCase() + tag?.slice(1).toLowerCase();
  return validTags.includes(normalized as TagType) ? (normalized as TagType) : 'Personal';
}

// Contextual Triggers - Weather-aware suggestions
export async function getContextualTriggers(reminder: Reminder): Promise<string[]> {
  const triggers: string[] = [];

  try {
    // Check if outdoor activity
    if (reminder.title.toLowerCase().match(/walk|run|jog|bike|outdoor|park|hike/)) {
      triggers.push('☔ Check weather before heading out');
    }

    // Check if errand during rush hour
    if (reminder.tag === 'Errands') {
      const hour = parseInt(reminder.dueTime.split(':')[0]);
      if (hour >= 7 && hour <= 9) {
        triggers.push('🚗 Morning traffic - consider alternative time');
      } else if (hour >= 17 && hour <= 19) {
        triggers.push('🚗 Evening traffic - allow extra time');
      }
    }

    // Check if meeting without prep
    if (reminder.title.toLowerCase().match(/meeting|presentation|interview/)) {
      triggers.push('📋 Review agenda 15 minutes before');
    }

    // Check if health/medication reminder
    if (reminder.tag === 'Health' && reminder.title.toLowerCase().match(/take|medication|pill|vitamin/)) {
      triggers.push('💊 Take with food if needed');
    }

    // Check if financial deadline
    if (reminder.tag === 'Finance' && reminder.title.toLowerCase().match(/pay|bill|due/)) {
      const daysUntil = Math.ceil((new Date(reminder.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 2) {
        triggers.push('⚠️ Deadline approaching - act soon');
      }
    }

    return triggers;
  } catch (error) {
    console.error('Error getting contextual triggers:', error);
    return triggers;
  }
}
