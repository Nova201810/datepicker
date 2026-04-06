export function toMidnight(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function addDays(date: Date, delta: number): Date {
  const d = toMidnight(date);
  d.setDate(d.getDate() + delta);
  return d;
}

export function addMonths(date: Date, delta: number): Date {
  const d = toMidnight(date);
  const originalDay = d.getDate();
  // Сначала устанавливаем 1-е число: иначе setMonth на 31 января перейдёт в март.
  d.setDate(1);
  d.setMonth(d.getMonth() + delta);
  // Зажимаем день до последнего дня нового месяца (напр. 31 янв → 28 фев).
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(originalDay, lastDay));
  return d;
}

export function addYears(date: Date, delta: number): Date {
  return addMonths(date, delta * 12);
}

export function startOfWeek(date: Date, firstDayOfWeek: 0 | 1): Date {
  const d = toMidnight(date);
  const dow = d.getDay(); // 0=Sun…6=Sat
  const diff = (dow - firstDayOfWeek + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

export function endOfWeek(date: Date, firstDayOfWeek: 0 | 1): Date {
  const start = startOfWeek(date, firstDayOfWeek);
  return addDays(start, 6);
}

export function buildCalendarGrid(
  year: number,
  month: number, // 0-indexed
  firstDayOfWeek: 0 | 1,
): Array<Array<{ date: Date; isCurrentMonth: boolean }>> {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  // Дни-заглушки из предыдущего месяца, чтобы первая колонка совпала с firstDayOfWeek.
  const startDow = firstOfMonth.getDay();
  const leadingCount = (startDow - firstDayOfWeek + 7) % 7;

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

  const rows: Array<Array<{ date: Date; isCurrentMonth: boolean }>> = [];
  for (let r = 0; r < cells.length / 7; r++) {
    rows.push(cells.slice(r * 7, r * 7 + 7));
  }
  return rows;
}

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

export function clampDate(date: Date, minDate?: Date, maxDate?: Date): Date {
  let d = toMidnight(date);
  if (minDate && d < toMidnight(minDate)) d = toMidnight(minDate);
  if (maxDate && d > toMidnight(maxDate)) d = toMidnight(maxDate);
  return d;
}
