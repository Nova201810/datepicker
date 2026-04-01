/**
 * Pure date utility functions.
 * All functions operate on plain Date objects and normalise to local midnight
 * to avoid time-of-day comparison bugs.
 * Zero external dependencies.
 */

/** Return a new Date set to midnight (local time) on the same calendar day. */
export function toMidnight(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** True when two dates fall on the same calendar day (ignores time). */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** True when date is today (local time). */
export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

/** Add (or subtract) a number of calendar days. */
export function addDays(date: Date, delta: number): Date {
  const d = toMidnight(date);
  d.setDate(d.getDate() + delta);
  return d;
}

/**
 * Add (or subtract) calendar months, clamping the day to the last valid day
 * of the target month (e.g. Jan 31 + 1 month → Feb 28/29).
 */
export function addMonths(date: Date, delta: number): Date {
  const d = toMidnight(date);
  const originalDay = d.getDate();
  // Set to the 1st to avoid month-skipping when the current day is > 28.
  d.setDate(1);
  d.setMonth(d.getMonth() + delta);
  // Clamp to the last day of the new month.
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(originalDay, lastDay));
  return d;
}

/**
 * Add (or subtract) calendar years, clamping the day for Feb 29 → Feb 28
 * in non-leap target years.
 */
export function addYears(date: Date, delta: number): Date {
  return addMonths(date, delta * 12);
}

/**
 * Returns the first day of the week containing `date`.
 * @param firstDayOfWeek 0 = Sunday, 1 = Monday
 */
export function startOfWeek(date: Date, firstDayOfWeek: 0 | 1): Date {
  const d = toMidnight(date);
  const dow = d.getDay(); // 0=Sun…6=Sat
  const diff = (dow - firstDayOfWeek + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

/**
 * Returns the last day of the week containing `date`.
 * @param firstDayOfWeek 0 = Sunday, 1 = Monday
 */
export function endOfWeek(date: Date, firstDayOfWeek: 0 | 1): Date {
  const start = startOfWeek(date, firstDayOfWeek);
  return addDays(start, 6);
}

/**
 * Build a 2-D grid (4–6 rows × 7 columns) for the given year/month.
 * Cells outside the current month are included (isCurrentMonth = false).
 * The first column always corresponds to `firstDayOfWeek`.
 */
export function buildCalendarGrid(
  year: number,
  month: number, // 0-indexed
  firstDayOfWeek: 0 | 1,
): Array<Array<{ date: Date; isCurrentMonth: boolean }>> {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  // Leading overflow days (from the previous month).
  const startDow = firstOfMonth.getDay();
  const leadingCount = (startDow - firstDayOfWeek + 7) % 7;

  // All days we need to display.
  const totalCells =
    Math.ceil((leadingCount + lastOfMonth.getDate()) / 7) * 7;

  const cells: Array<{ date: Date; isCurrentMonth: boolean }> = [];

  for (let i = 0; i < totalCells; i++) {
    const dayOffset = i - leadingCount;
    const date = new Date(year, month, 1 + dayOffset);
    cells.push({
      date: toMidnight(date),
      isCurrentMonth: date.getMonth() === month,
    });
  }

  // Split into rows of 7.
  const rows: Array<Array<{ date: Date; isCurrentMonth: boolean }>> = [];
  for (let r = 0; r < cells.length / 7; r++) {
    rows.push(cells.slice(r * 7, r * 7 + 7));
  }
  return rows;
}

/**
 * Returns true when `date` should not be selectable:
 * - before minDate, after maxDate, or explicitly listed in disabledDates.
 */
export function isDateDisabled(
  date: Date,
  minDate?: Date,
  maxDate?: Date,
  disabledDates?: Date[],
): boolean {
  const d = toMidnight(date);
  if (minDate && d < toMidnight(minDate)) return true;
  if (maxDate && d > toMidnight(maxDate)) return true;
  if (disabledDates?.some((dd) => isSameDay(dd, date))) return true;
  return false;
}

/**
 * True when the previous-month nav button should be disabled:
 * the view is at or before minDate's month.
 */
export function isPrevMonthDisabled(
  viewYear: number,
  viewMonth: number,
  minDate?: Date,
): boolean {
  if (!minDate) return false;
  const min = toMidnight(minDate);
  return (
    viewYear < min.getFullYear() ||
    (viewYear === min.getFullYear() && viewMonth <= min.getMonth())
  );
}

/**
 * True when the next-month nav button should be disabled:
 * the view is at or after maxDate's month.
 */
export function isNextMonthDisabled(
  viewYear: number,
  viewMonth: number,
  maxDate?: Date,
): boolean {
  if (!maxDate) return false;
  const max = toMidnight(maxDate);
  return (
    viewYear > max.getFullYear() ||
    (viewYear === max.getFullYear() && viewMonth >= max.getMonth())
  );
}

/** Clamp `date` so it stays within [minDate, maxDate]. */
export function clampDate(date: Date, minDate?: Date, maxDate?: Date): Date {
  let d = toMidnight(date);
  if (minDate && d < toMidnight(minDate)) d = toMidnight(minDate);
  if (maxDate && d > toMidnight(maxDate)) d = toMidnight(maxDate);
  return d;
}
