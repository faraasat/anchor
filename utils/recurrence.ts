// Recurring schedule engine for Anchor reminders
import { RecurrenceRule, RecurrenceType, Reminder } from '@/types/reminder';

// Days of week names
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Get the next occurrence based on recurrence rule
export function getNextOccurrence(
  baseDate: Date,
  rule: RecurrenceRule,
  fromDate: Date = new Date()
): Date | null {
  if (rule.type === 'none') {
    return null;
  }

  // Check if we've reached the end
  if (rule.endDate && new Date(rule.endDate) < fromDate) {
    return null;
  }

  let next = new Date(baseDate);

  switch (rule.type) {
    case 'daily':
      return getNextDaily(next, fromDate, rule.interval || 1);

    case 'weekly':
      return getNextWeekly(next, fromDate, rule.daysOfWeek || [next.getDay()], rule.interval || 1);

    case 'monthly':
      return getNextMonthly(next, fromDate, rule.dayOfMonth || next.getDate());

    case 'yearly':
      return getNextYearly(next, fromDate);

    case 'custom_days':
      return getNextCustomDays(next, fromDate, rule.interval || 1);

    case 'nth_weekday':
      if (rule.nthWeekday) {
        return getNextNthWeekday(next, fromDate, rule.nthWeekday.n, rule.nthWeekday.weekday);
      }
      return null;

    case 'specific_days':
      return getNextSpecificDays(next, fromDate, rule.daysOfWeek || []);

    default:
      return null;
  }
}

// Get next daily occurrence
function getNextDaily(baseDate: Date, fromDate: Date, interval: number): Date {
  const next = new Date(fromDate);
  next.setHours(baseDate.getHours(), baseDate.getMinutes(), 0, 0);

  if (next <= fromDate) {
    next.setDate(next.getDate() + interval);
  }

  return next;
}

// Get next weekly occurrence
function getNextWeekly(baseDate: Date, fromDate: Date, daysOfWeek: number[], _interval: number): Date {
  const next = new Date(fromDate);
  next.setHours(baseDate.getHours(), baseDate.getMinutes(), 0, 0);

  // Find the next valid day of the week
  for (let i = 0; i < 14; i++) { // Check next 2 weeks
    const checkDate = new Date(next);
    checkDate.setDate(checkDate.getDate() + i);

    if (daysOfWeek.includes(checkDate.getDay())) {
      if (checkDate > fromDate) {
        return checkDate;
      }
    }
  }

  return next;
}

// Get next monthly occurrence
function getNextMonthly(baseDate: Date, fromDate: Date, dayOfMonth: number): Date {
  const next = new Date(fromDate);
  next.setDate(dayOfMonth);
  next.setHours(baseDate.getHours(), baseDate.getMinutes(), 0, 0);

  if (next <= fromDate) {
    next.setMonth(next.getMonth() + 1);
    next.setDate(dayOfMonth);
  }

  // Handle months with fewer days
  while (next.getDate() !== dayOfMonth) {
    next.setDate(0); // Go to last day of previous month
    next.setMonth(next.getMonth() + 1);
    next.setDate(Math.min(dayOfMonth, getDaysInMonth(next.getFullYear(), next.getMonth())));
  }

  return next;
}

// Get next yearly occurrence
function getNextYearly(baseDate: Date, fromDate: Date): Date {
  const next = new Date(baseDate);

  if (next <= fromDate) {
    next.setFullYear(fromDate.getFullYear() + 1);
  }

  return next;
}

// Get next occurrence for custom interval (every X days)
function getNextCustomDays(baseDate: Date, fromDate: Date, intervalDays: number): Date {
  const next = new Date(baseDate);
  next.setHours(baseDate.getHours(), baseDate.getMinutes(), 0, 0);

  while (next <= fromDate) {
    next.setDate(next.getDate() + intervalDays);
  }

  return next;
}

// Get next nth weekday of month (e.g., 2nd Monday)
function getNextNthWeekday(baseDate: Date, fromDate: Date, n: number, weekday: number): Date {
  let next = getNthWeekdayOfMonth(fromDate.getFullYear(), fromDate.getMonth(), n, weekday);
  next.setHours(baseDate.getHours(), baseDate.getMinutes(), 0, 0);

  if (next <= fromDate) {
    const nextMonth = fromDate.getMonth() + 1;
    const nextYear = nextMonth > 11 ? fromDate.getFullYear() + 1 : fromDate.getFullYear();
    next = getNthWeekdayOfMonth(nextYear, nextMonth % 12, n, weekday);
    next.setHours(baseDate.getHours(), baseDate.getMinutes(), 0, 0);
  }

  return next;
}

// Get the nth weekday of a specific month
function getNthWeekdayOfMonth(year: number, month: number, n: number, weekday: number): Date {
  const date = new Date(year, month, 1);

  if (n === -1) {
    // Last weekday of month
    date.setMonth(month + 1, 0); // Last day of month
    while (date.getDay() !== weekday) {
      date.setDate(date.getDate() - 1);
    }
  } else {
    // Find first occurrence
    while (date.getDay() !== weekday) {
      date.setDate(date.getDate() + 1);
    }
    // Add weeks to get nth occurrence
    date.setDate(date.getDate() + (n - 1) * 7);
  }

  return date;
}

// Get next occurrence for specific days of week
function getNextSpecificDays(baseDate: Date, fromDate: Date, daysOfWeek: number[]): Date {
  if (daysOfWeek.length === 0) {
    return new Date(baseDate);
  }

  const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
  const next = new Date(fromDate);
  next.setHours(baseDate.getHours(), baseDate.getMinutes(), 0, 0);

  for (let i = 0; i < 8; i++) {
    const checkDate = new Date(next);
    checkDate.setDate(checkDate.getDate() + i);

    if (sortedDays.includes(checkDate.getDay())) {
      if (checkDate > fromDate) {
        return checkDate;
      }
    }
  }

  return next;
}

// Helper: Get days in a month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Format recurrence rule as human-readable string
export function formatRecurrence(rule: RecurrenceRule): string {
  if (rule.type === 'none') {
    return 'Does not repeat';
  }

  switch (rule.type) {
    case 'daily':
      return rule.interval && rule.interval > 1
        ? `Every ${rule.interval} days`
        : 'Every day';

    case 'weekly':
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        if (rule.daysOfWeek.length === 7) {
          return 'Every day';
        }
        if (rule.daysOfWeek.length === 5 &&
            !rule.daysOfWeek.includes(0) &&
            !rule.daysOfWeek.includes(6)) {
          return 'Every weekday';
        }
        const dayNames = rule.daysOfWeek.map(d => SHORT_DAYS[d]).join(', ');
        return `Weekly on ${dayNames}`;
      }
      return 'Every week';

    case 'monthly':
      if (rule.dayOfMonth) {
        return `Monthly on the ${getOrdinal(rule.dayOfMonth)}`;
      }
      return 'Every month';

    case 'yearly':
      return 'Every year';

    case 'custom_days':
      return `Every ${rule.interval} days`;

    case 'nth_weekday':
      if (rule.nthWeekday) {
        const ordinal = rule.nthWeekday.n === -1 ? 'last' : getOrdinal(rule.nthWeekday.n);
        const day = DAYS_OF_WEEK[rule.nthWeekday.weekday];
        return `Monthly on the ${ordinal} ${day}`;
      }
      return 'Monthly';

    case 'specific_days':
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        const dayNames = rule.daysOfWeek.map(d => SHORT_DAYS[d]).join(', ');
        return `Every ${dayNames}`;
      }
      return 'Selected days';

    default:
      return 'Custom';
  }
}

// Get ordinal suffix (1st, 2nd, 3rd, etc.)
function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Parse natural language into recurrence rule
export function parseRecurrenceFromText(text: string): RecurrenceRule | null {
  const lowerText = text.toLowerCase();

  // Every X days
  const everyDaysMatch = lowerText.match(/every\s+(\d+)\s+days?/);
  if (everyDaysMatch) {
    return {
      type: 'custom_days',
      interval: parseInt(everyDaysMatch[1], 10),
    };
  }

  // Daily
  if (lowerText.includes('every day') || lowerText.includes('daily')) {
    return { type: 'daily', interval: 1 };
  }

  // Weekdays
  if (lowerText.includes('weekday') || lowerText.includes('week day')) {
    return {
      type: 'specific_days',
      daysOfWeek: [1, 2, 3, 4, 5],
    };
  }

  // Weekend
  if (lowerText.includes('weekend')) {
    return {
      type: 'specific_days',
      daysOfWeek: [0, 6],
    };
  }

  // Specific days of week
  const dayPattern = /every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi;
  const dayMatches = lowerText.match(dayPattern);
  if (dayMatches) {
    const daysOfWeek: number[] = [];
    dayMatches.forEach(match => {
      const dayName = match.replace('every ', '').trim();
      const dayIndex = DAYS_OF_WEEK.findIndex(d => d.toLowerCase() === dayName);
      if (dayIndex !== -1 && !daysOfWeek.includes(dayIndex)) {
        daysOfWeek.push(dayIndex);
      }
    });
    if (daysOfWeek.length > 0) {
      return { type: 'specific_days', daysOfWeek };
    }
  }

  // Weekly (including "every Friday")
  const weeklyMatch = lowerText.match(/every\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
  if (weeklyMatch) {
    const dayName = weeklyMatch[1].toLowerCase();
    const dayIndex = DAYS_OF_WEEK.findIndex(d => d.toLowerCase() === dayName);
    return {
      type: 'weekly',
      interval: 1,
      daysOfWeek: [dayIndex],
    };
  }

  // Weekly general
  if (lowerText.includes('weekly') || lowerText.includes('every week')) {
    return { type: 'weekly', interval: 1 };
  }

  // Nth weekday of month
  const nthWeekdayMatch = lowerText.match(/(first|second|third|fourth|last|1st|2nd|3rd|4th)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
  if (nthWeekdayMatch) {
    const ordinalMap: Record<string, number> = {
      'first': 1, '1st': 1,
      'second': 2, '2nd': 2,
      'third': 3, '3rd': 3,
      'fourth': 4, '4th': 4,
      'last': -1,
    };
    const n = ordinalMap[nthWeekdayMatch[1].toLowerCase()];
    const dayName = nthWeekdayMatch[2].toLowerCase();
    const weekday = DAYS_OF_WEEK.findIndex(d => d.toLowerCase() === dayName);

    return {
      type: 'nth_weekday',
      nthWeekday: { n, weekday },
    };
  }

  // Monthly
  if (lowerText.includes('monthly') || lowerText.includes('every month')) {
    return { type: 'monthly' };
  }

  // Yearly
  if (lowerText.includes('yearly') || lowerText.includes('every year') || lowerText.includes('annually')) {
    return { type: 'yearly' };
  }

  return null;
}

// Generate next N occurrences for preview
export function generateOccurrences(reminder: Reminder, count: number = 5): Date[] {
  const occurrences: Date[] = [];

  if (!reminder.isRecurring || reminder.recurrence.type === 'none') {
    return [new Date(reminder.dueDate)];
  }

  let currentDate = new Date(reminder.dueDate);
  const [hours, minutes] = reminder.dueTime.split(':').map(Number);
  currentDate.setHours(hours, minutes, 0, 0);

  for (let i = 0; i < count; i++) {
    occurrences.push(new Date(currentDate));
    const nextDate = getNextOccurrence(currentDate, reminder.recurrence, currentDate);
    if (!nextDate) break;
    currentDate = nextDate;
  }

  return occurrences;
}
