/**
 * Shared Date Utilities
 *
 * IMPORTANT: All functions use UTC to ensure consistency across timezones.
 * Posts are stored in UTC, so all date calculations should use UTC.
 *
 * Week Definitions:
 * - UGC Creators: Monday-Sunday (for weekly post targets)
 * - Weekly Recap: Friday-Thursday (for end-of-week summaries)
 */

// ============================================
// WEEK TYPES
// ============================================

export type WeekType = 'mon-sun' | 'fri-thu';

// ============================================
// CORE UTC HELPERS
// ============================================

/**
 * Get the UTC day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 */
export function getUTCDayOfWeek(date: Date): number {
  return date.getUTCDay();
}

/**
 * Create a Date at midnight UTC for a given date
 */
export function toUTCMidnight(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Create a Date at end of day UTC (23:59:59.999)
 */
export function toUTCEndOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/**
 * Add days to a date (UTC-safe)
 */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

// ============================================
// WEEK BOUNDARY FUNCTIONS
// ============================================

/**
 * Get the start and end of the week containing a given date.
 *
 * @param date - The date to find the week for
 * @param weekType - 'mon-sun' for Monday-Sunday, 'fri-thu' for Friday-Thursday
 * @returns [weekStart (00:00:00 UTC), weekEnd (23:59:59 UTC)]
 */
export function getWeekBoundaries(
  date: Date,
  weekType: WeekType = 'mon-sun'
): [Date, Date] {
  const d = toUTCMidnight(date);
  const dayOfWeek = getUTCDayOfWeek(d);

  let weekStart: Date;

  if (weekType === 'mon-sun') {
    // Monday-Sunday week
    // Monday = 1, so days since Monday = (dayOfWeek + 6) % 7
    // Sunday (0) -> 6 days since Monday
    // Monday (1) -> 0 days since Monday
    // Tuesday (2) -> 1 day since Monday
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    weekStart = addDays(d, -daysSinceMonday);
  } else {
    // Friday-Thursday week
    // Friday = 5, so days since Friday = (dayOfWeek + 2) % 7
    // Friday (5) -> 0 days since Friday
    // Saturday (6) -> 1 day since Friday
    // Sunday (0) -> 2 days since Friday
    // Monday (1) -> 3 days since Friday
    // Thursday (4) -> 6 days since Friday
    let daysSinceFriday: number;
    if (dayOfWeek >= 5) {
      daysSinceFriday = dayOfWeek - 5;
    } else {
      daysSinceFriday = dayOfWeek + 2;
    }
    weekStart = addDays(d, -daysSinceFriday);
  }

  // Week is always 7 days, so end is start + 6 days at 23:59:59
  const weekEnd = toUTCEndOfDay(addDays(weekStart, 6));

  return [weekStart, weekEnd];
}

/**
 * Get the current week boundaries based on week type.
 * Convenience function for getting "this week".
 */
export function getCurrentWeekBoundaries(weekType: WeekType = 'mon-sun'): [Date, Date] {
  return getWeekBoundaries(new Date(), weekType);
}

/**
 * Get week boundaries for N weeks ago.
 *
 * @param weeksAgo - Number of weeks in the past (1 = last week, 2 = two weeks ago)
 * @param weekType - Week type
 */
export function getWeekBoundariesAgo(
  weeksAgo: number,
  weekType: WeekType = 'mon-sun'
): [Date, Date] {
  const now = new Date();
  const targetDate = addDays(now, -weeksAgo * 7);
  return getWeekBoundaries(targetDate, weekType);
}

// ============================================
// MONTH BOUNDARY FUNCTIONS
// ============================================

/**
 * Get the start and end of the month containing a given date.
 *
 * @param date - The date to find the month for
 * @returns [monthStart (00:00:00 UTC), monthEnd (23:59:59 UTC)]
 */
export function getMonthBoundaries(date: Date): [Date, Date] {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();

  // First day of month at midnight UTC
  const monthStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  // Last day of month at 23:59:59 UTC
  // Day 0 of next month = last day of current month
  const monthEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

  return [monthStart, monthEnd];
}

/**
 * Get the current month boundaries.
 */
export function getCurrentMonthBoundaries(): [Date, Date] {
  return getMonthBoundaries(new Date());
}

// ============================================
// WEEKS IN MONTH
// ============================================

export interface WeekInMonth {
  weekNumber: number; // 1-indexed week number within the month
  start: Date;
  end: Date;
  isComplete: boolean; // Has the week fully passed?
  isCurrent: boolean; // Is this the current week?
}

/**
 * Get all complete weeks (Monday-Sunday) that fall within a given month.
 * A week is "in the month" if its Monday falls within the month.
 *
 * @param year - The year
 * @param month - The month (0-indexed, 0 = January)
 * @param includePartialCurrentWeek - If true, includes current week even if incomplete
 */
export function getWeeksInMonth(
  year: number,
  month: number,
  includePartialCurrentWeek: boolean = true
): WeekInMonth[] {
  const [monthStart, monthEnd] = getMonthBoundaries(new Date(Date.UTC(year, month, 1)));
  const now = new Date();
  const [currentWeekStart] = getCurrentWeekBoundaries('mon-sun');

  const weeks: WeekInMonth[] = [];

  // Find the first Monday in or after the month start
  let firstMonday = new Date(monthStart);
  const monthStartDay = getUTCDayOfWeek(monthStart);

  if (monthStartDay !== 1) {
    // If month doesn't start on Monday, find the first Monday
    if (monthStartDay === 0) {
      // Sunday - next day is Monday
      firstMonday = addDays(monthStart, 1);
    } else {
      // Tuesday-Saturday - find next Monday
      firstMonday = addDays(monthStart, 8 - monthStartDay);
    }
  }

  // If first Monday is in next month, no complete weeks
  if (firstMonday > monthEnd) {
    return weeks;
  }

  // Iterate through weeks
  let weekNumber = 1;
  let weekStart = new Date(firstMonday);

  while (weekStart <= monthEnd) {
    const weekEnd = toUTCEndOfDay(addDays(weekStart, 6));
    const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime();
    const isComplete = weekEnd < now;

    // Include week if:
    // 1. Week is complete (Sunday has passed), OR
    // 2. It's the current week and we want to include partial weeks
    if (isComplete || (isCurrentWeek && includePartialCurrentWeek)) {
      weeks.push({
        weekNumber,
        start: new Date(weekStart),
        end: weekEnd,
        isComplete,
        isCurrent: isCurrentWeek,
      });
    }

    // Move to next Monday
    weekStart = addDays(weekStart, 7);
    weekNumber++;
  }

  return weeks;
}

// ============================================
// DATE RANGE HELPERS
// ============================================

/**
 * Check if a date falls within a range (inclusive).
 */
export function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const d = date.getTime();
  return d >= start.getTime() && d <= end.getTime();
}

/**
 * Convert a Date to ISO string for database queries.
 * Uses the full ISO string which includes timezone info.
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Convert a Date to YYYY-MM-DD format for date-only comparisons.
 */
export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============================================
// FORMATTING HELPERS
// ============================================

/**
 * Format a date range as "Mon DD - Mon DD, YYYY"
 */
export function formatDateRange(start: Date, end: Date): string {
  const startStr = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
  const endStr = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });
  return `${startStr} - ${endStr}`;
}

/**
 * Format a week as "Week of Mon DD"
 */
export function formatWeekOf(date: Date): string {
  return `Week of ${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  })}`;
}

// ============================================
// VALIDATION
// ============================================

/**
 * Check if today is a recap day (Friday, Saturday, or Sunday).
 * Used for showing weekly recap modal.
 */
export function isRecapDay(): boolean {
  const day = getUTCDayOfWeek(new Date());
  return day === 5 || day === 6 || day === 0; // Friday, Saturday, Sunday
}

/**
 * Get the number of days remaining in the current week.
 * For Monday-Sunday week, returns days until Sunday.
 */
export function getDaysLeftInWeek(weekType: WeekType = 'mon-sun'): number {
  const now = new Date();
  const [, weekEnd] = getWeekBoundaries(now, weekType);
  const diffMs = weekEnd.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
