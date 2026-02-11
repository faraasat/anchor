// Advanced Recurrence Engine Service - Handles complex recurring rules
import { RecurrenceRule, RecurrenceType, Reminder } from '@/types/reminder';

export class RecurrenceEngineService {
  /**
   * Calculate the next occurrence for a reminder based on its recurrence rule
   */
  static calculateNextOccurrence(reminder: Reminder): Date | null {
    if (!reminder.isRecurring || reminder.recurrence.type === 'none') {
      return null;
    }

    const lastDate = reminder.nextOccurrence
      ? new Date(reminder.nextOccurrence)
      : new Date(`${reminder.dueDate}T${reminder.dueTime}`);

    return this.getNextOccurrenceFromDate(lastDate, reminder.recurrence);
  }

  /**
   * Get next occurrence from a given date based on recurrence rule
   */
  static getNextOccurrenceFromDate(
    fromDate: Date,
    rule: RecurrenceRule
  ): Date | null {
    const nextDate = new Date(fromDate);

    switch (rule.type) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + 1);
        break;

      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7);
        break;

      case 'monthly':
        if (rule.dayOfMonth) {
          // Specific day of month
          nextDate.setMonth(nextDate.getMonth() + 1);
          nextDate.setDate(rule.dayOfMonth);
        } else {
          // Same day next month
          nextDate.setMonth(nextDate.getMonth() + 1);
        }
        break;

      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;

      case 'custom_days':
        // Every X days
        const interval = rule.interval || 1;
        nextDate.setDate(nextDate.getDate() + interval);
        break;

      case 'nth_weekday':
        // Nth weekday of month (e.g., 2nd Tuesday, last Friday)
        if (rule.nthWeekday) {
          return this.calculateNthWeekdayOccurrence(nextDate, rule.nthWeekday);
        }
        break;

      case 'specific_days':
        // Specific days of week
        if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
          return this.calculateNextSpecificDay(nextDate, rule.daysOfWeek);
        }
        break;

      default:
        return null;
    }

    // Check if we've exceeded the end date or count
    if (rule.endDate && nextDate > new Date(rule.endDate)) {
      return null;
    }

    return nextDate;
  }

  /**
   * Calculate Nth weekday of month (e.g., 2nd Tuesday, last Friday)
   */
  private static calculateNthWeekdayOccurrence(
    fromDate: Date,
    nthWeekday: { n: number; weekday: number }
  ): Date | null {
    const { n, weekday } = nthWeekday;

    // Move to next month
    const nextDate = new Date(fromDate);
    nextDate.setMonth(nextDate.getMonth() + 1);
    nextDate.setDate(1);

    // Handle "last" occurrence (-1)
    if (n === -1) {
      return this.getLastWeekdayOfMonth(nextDate, weekday);
    }

    // Find the Nth occurrence of the weekday
    let count = 0;
    const daysInMonth = new Date(
      nextDate.getFullYear(),
      nextDate.getMonth() + 1,
      0
    ).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const testDate = new Date(nextDate);
      testDate.setDate(day);

      if (testDate.getDay() === weekday) {
        count++;
        if (count === n) {
          return testDate;
        }
      }
    }

    return null;
  }

  /**
   * Get last occurrence of a weekday in a month
   */
  private static getLastWeekdayOfMonth(date: Date, weekday: number): Date {
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    // Walk backwards from last day of month to find the weekday
    for (let day = lastDay.getDate(); day >= 1; day--) {
      const testDate = new Date(lastDay);
      testDate.setDate(day);
      if (testDate.getDay() === weekday) {
        return testDate;
      }
    }

    return lastDay;
  }

  /**
   * Calculate next occurrence for specific days of week
   */
  private static calculateNextSpecificDay(
    fromDate: Date,
    daysOfWeek: number[]
  ): Date {
    const nextDate = new Date(fromDate);
    nextDate.setDate(nextDate.getDate() + 1); // Start from tomorrow

    // Find next matching day of week
    for (let i = 0; i < 7; i++) {
      if (daysOfWeek.includes(nextDate.getDay())) {
        return nextDate;
      }
      nextDate.setDate(nextDate.getDate() + 1);
    }

    return nextDate;
  }

  /**
   * Generate human-readable recurrence description
   */
  static getRecurrenceDescription(rule: RecurrenceRule): string {
    switch (rule.type) {
      case 'none':
        return 'Does not repeat';

      case 'daily':
        return 'Every day';

      case 'weekly':
        if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
          const dayNames = rule.daysOfWeek.map(this.getDayName).join(', ');
          return `Every week on ${dayNames}`;
        }
        return 'Every week';

      case 'monthly':
        if (rule.dayOfMonth) {
          return `Monthly on day ${rule.dayOfMonth}`;
        }
        if (rule.nthWeekday) {
          const { n, weekday } = rule.nthWeekday;
          const nthText = n === -1 ? 'last' : this.getOrdinal(n);
          const dayName = this.getDayName(weekday);
          return `Every ${nthText} ${dayName} of the month`;
        }
        return 'Every month';

      case 'yearly':
        return 'Every year';

      case 'custom_days':
        const days = rule.interval || 1;
        return `Every ${days} day${days > 1 ? 's' : ''}`;

      case 'nth_weekday':
        if (rule.nthWeekday) {
          const { n, weekday } = rule.nthWeekday;
          const nthText = n === -1 ? 'last' : this.getOrdinal(n);
          const dayName = this.getDayName(weekday);
          return `Every ${nthText} ${dayName}`;
        }
        return 'Custom schedule';

      case 'specific_days':
        if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
          const dayNames = rule.daysOfWeek.map(this.getDayName).join(', ');
          return `Every ${dayNames}`;
        }
        return 'Specific days';

      default:
        return 'Custom schedule';
    }
  }

  /**
   * Check if a reminder should recur today
   */
  static shouldRecurToday(reminder: Reminder, today: Date = new Date()): boolean {
    if (!reminder.isRecurring || reminder.recurrence.type === 'none') {
      return false;
    }

    const todayStr = today.toISOString().split('T')[0];
    const reminderDateStr = reminder.dueDate;

    // If it's the same day, it should recur
    if (todayStr === reminderDateStr) {
      return true;
    }

    // Check if next occurrence is today
    const nextOccurrence = this.calculateNextOccurrence(reminder);
    if (nextOccurrence) {
      const nextOccurrenceStr = nextOccurrence.toISOString().split('T')[0];
      return nextOccurrenceStr === todayStr;
    }

    return false;
  }

  // Helper methods
  private static getDayName(dayIndex: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex] || 'Unknown';
  }

  private static getOrdinal(n: number): string {
    if (n === -1) return 'last';
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  }

  /**
   * Validate recurrence rule
   */
  static validateRecurrenceRule(rule: RecurrenceRule): { valid: boolean; error?: string } {
    switch (rule.type) {
      case 'custom_days':
        if (!rule.interval || rule.interval < 1) {
          return { valid: false, error: 'Interval must be at least 1 day' };
        }
        break;

      case 'nth_weekday':
        if (!rule.nthWeekday) {
          return { valid: false, error: 'Nth weekday configuration is required' };
        }
        if (rule.nthWeekday.n < -1 || rule.nthWeekday.n === 0 || rule.nthWeekday.n > 5) {
          return { valid: false, error: 'N must be -1 (last) or 1-5' };
        }
        if (rule.nthWeekday.weekday < 0 || rule.nthWeekday.weekday > 6) {
          return { valid: false, error: 'Weekday must be 0-6' };
        }
        break;

      case 'specific_days':
        if (!rule.daysOfWeek || rule.daysOfWeek.length === 0) {
          return { valid: false, error: 'At least one day of week must be specified' };
        }
        break;

      case 'monthly':
        if (rule.dayOfMonth && (rule.dayOfMonth < 1 || rule.dayOfMonth > 31)) {
          return { valid: false, error: 'Day of month must be 1-31' };
        }
        break;
    }

    return { valid: true };
  }
}
