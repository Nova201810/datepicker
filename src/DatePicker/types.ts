export interface DatePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  /** Массив следует мемоизировать — иначе каждый рендер родителя вызовет пересчёт грида */
  disabledDates?: Date[];
  locale?: string;
}

export interface CalendarCell {
  date: Date;
  /** false = день из предыдущего / следующего месяца */
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  /** true на единственной ячейке с tabIndex=0 (roving tabindex) */
  isFocused: boolean;
  /** Локализованная метка для скринридера: дата + состояние (выбрано / недоступно) */
  ariaLabel: string;
}

export type CalendarRow = CalendarCell[];

export interface WeekdayHeader {
  /** 0 = Sun, 1 = Mon … 6 = Sat (абсолютный индекс, не зависит от локали) */
  dayIndex: number;
  short: string;
  narrow: string;
  long: string;
}

export interface CalendarGridData {
  rows: CalendarRow[];
  weekdayHeaders: WeekdayHeader[];
  monthYearLabel: string;
}
