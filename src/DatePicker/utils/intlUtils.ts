import type { WeekdayHeader } from '../types';

export function getFirstDayOfWeek(locale: string): 0 | 1 {
  try {
    const loc = new Intl.Locale(locale);
    type LocaleWithWeekInfo = typeof loc & {
      getWeekInfo?: () => { firstDay: number };
      weekInfo?: { firstDay: number };
    };
    const extended = loc as LocaleWithWeekInfo;
    const firstDay =
      extended.getWeekInfo?.().firstDay ?? extended.weekInfo?.firstDay;
    if (firstDay !== undefined) {
      // В ISO-кодировке воскресенье = 7, а не 0 — поэтому явное сравнение.
      return firstDay === 7 ? 0 : 1;
    }
  } catch {
    // ignore
  }
  return 1;
}

export function getWeekdayHeaders(locale: string): WeekdayHeader[] {
  const firstDow = getFirstDayOfWeek(locale);

  const formatters = {
    short: new Intl.DateTimeFormat(locale, { weekday: 'short' }),
    narrow: new Intl.DateTimeFormat(locale, { weekday: 'narrow' }),
    long: new Intl.DateTimeFormat(locale, { weekday: 'long' }),
  };

  const all: WeekdayHeader[] = [];
  for (let i = 0; i < 7; i++) {
    // 2025-01-05 — известное воскресенье; прибавляем i для получения Пн–Сб.
    const refDate = new Date(2025, 0, 5 + i);
    all.push({
      dayIndex: refDate.getDay(),
      short: formatters.short.format(refDate),
      narrow: formatters.narrow.format(refDate),
      long: formatters.long.format(refDate),
    });
  }

  return [...all.slice(firstDow), ...all.slice(0, firstDow)];
}

export function formatMonthYear(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatFullDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatShortDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function getFormatHint(locale: string): string {
  const knownDate = new Date(2001, 2, 4);
  const parts = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(knownDate);
  type DateFormatPart = 'year' | 'month' | 'day';
  const partsNames: Record<DateFormatPart, string> = locale === 'ru-RU' ? {
    year: 'ГГГГ',
    month: 'ММ',
    day: 'ДД',
  } : {
    year: 'YYYY',
    month: 'MM',
    day: 'DD',
  };
  const isDatePart = (type: string): type is DateFormatPart => [
    'year',
    'month',
    'day',
  ].includes(type);

  return parts
    .map((p) => isDatePart(p.type) ? partsNames[p.type] : p.value)
    .join('');
}

export function parseShortDate(str: string, locale: string): Date | null {
  const trimmed = str.trim();
  if (!trimmed) return null;

  const knownDate = new Date(2001, 2, 4);
  const parts = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(knownDate);

  const fields: Array<'year' | 'month' | 'day'> = [];
  const separators: string[] = [];

  for (const p of parts) {
    if (p.type === 'year' || p.type === 'month' || p.type === 'day') {
      fields.push(p.type);
    } else if (p.type === 'literal') {
      separators.push(p.value.replace(/\s+/g, '\\s*'));
    }
  }

  if (fields.length !== 3) return null;

  const sep0 = separators[0] ?? '[./-]';
  const sep1 = separators[1] ?? '[./-]';
  const pattern = new RegExp(
    `^(\\d{1,4})${sep0}(\\d{1,2})${sep1}(\\d{1,4})$`,
  );
  const match = trimmed.match(pattern);
  if (!match) return null;

  const g1 = parseInt(match[1]!, 10);
  const g2 = parseInt(match[2]!, 10);
  const g3 = parseInt(match[3]!, 10);

  const vals: Record<'year' | 'month' | 'day', number> = {
    year: 0,
    month: 0,
    day: 0,
  };
  vals[fields[0]!] = g1;
  vals[fields[1]!] = g2;
  vals[fields[2]!] = g3;

  const { year, month, day } = vals;
  if (year < 1000 || year > 9999) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
}

export function getDateSeparator(locale: string): string {
  const knownDate = new Date(2001, 2, 4);
  const parts = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(knownDate);
  return parts.find((p) => p.type === 'literal')?.value ?? '.';
}

export function applyDateMask(raw: string, sep: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}${sep}${digits.slice(2)}`;
  return `${digits.slice(0, 2)}${sep}${digits.slice(2, 4)}${sep}${digits.slice(4)}`;
}

export function formatTriggerAriaLabel(
  date: Date | null | undefined,
  locale: string,
): string {
  if (!date) return getUiString(locale, 'chooseDate');
  const formatted = formatFullDate(date, locale);
  return `${getUiString(locale, 'chooseDate')}, ${getUiString(locale, 'currentDate')} ${formatted}`;
}

type UiStringKey =
  | 'dateLabel'
  | 'chooseDate'
  | 'currentDate'
  | 'prevMonth'
  | 'nextMonth'
  | 'ok'
  | 'cancel'
  | 'selected'
  | 'unavailable';

export function getUiString(locale: string, key: UiStringKey): string {
  const lang = locale.split('-')[0]?.toLowerCase() ?? 'en';
  const strings: Record<string, Record<UiStringKey, string>> = {
    en: {
      dateLabel: 'Date',
      chooseDate: 'Choose date',
      currentDate: 'current date is',
      prevMonth: 'Previous month',
      nextMonth: 'Next month',
      ok: 'OK',
      cancel: 'Cancel',
      selected: 'selected',
      unavailable: 'unavailable',
    },
    ru: {
      dateLabel: 'Дата',
      chooseDate: 'Выбрать дату',
      currentDate: 'текущая дата',
      prevMonth: 'Предыдущий месяц',
      nextMonth: 'Следующий месяц',
      ok: 'ОК',
      cancel: 'Отмена',
      selected: 'выбрано',
      unavailable: 'недоступно',
    },
    de: {
      dateLabel: 'Datum',
      chooseDate: 'Datum auswählen',
      currentDate: 'aktuelles Datum',
      prevMonth: 'Vorheriger Monat',
      nextMonth: 'Nächster Monat',
      ok: 'OK',
      cancel: 'Abbrechen',
      selected: 'ausgewählt',
      unavailable: 'nicht verfügbar',
    },
    fr: {
      dateLabel: 'Date',
      chooseDate: 'Choisir une date',
      currentDate: 'date actuelle',
      prevMonth: 'Mois précédent',
      nextMonth: 'Mois suivant',
      ok: 'OK',
      cancel: 'Annuler',
      selected: 'sélectionnée',
      unavailable: 'indisponible',
    },
  };
  return (strings[lang] ?? strings['en']!)[key];
}
