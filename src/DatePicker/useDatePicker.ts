import {
  ChangeEvent,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { DatePickerProps } from './types';
import {
  addMonths,
  clampDate,
  isPrevMonthDisabled as calcPrevDisabled,
  isNextMonthDisabled as calcNextDisabled,
  toMidnight,
} from './utils/dateUtils';
import {
  applyDateMask,
  formatShortDate,
  formatTriggerAriaLabel,
  getDateSeparator,
  getFirstDayOfWeek,
  parseShortDate,
} from './utils/intlUtils';

export interface UseDatePickerReturn {
  selectedDate: Date | undefined;
  isOpen: boolean;
  openDialog: () => void;
  closeDialog: (commit: boolean) => void;

  viewYear: number;
  viewMonth: number;
  navigatePrevMonth: () => void;
  navigateNextMonth: () => void;
  navigatePrevYear: () => void;
  navigateNextYear: () => void;

  focusedDate: Date;
  updateFocusedDate: (date: Date) => void;

  confirmDate: (date: Date) => void;

  triggerRef: RefObject<HTMLButtonElement>;
  inputRef: RefObject<HTMLInputElement>;

  inputValue: string;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleInputBlur: () => void;

  isPrevMonthDisabled: boolean;
  isNextMonthDisabled: boolean;

  triggerAriaLabel: string;

  firstDayOfWeek: 0 | 1;
}

export function useDatePicker(props: DatePickerProps): UseDatePickerReturn {
  const {
    value,
    onChange,
    minDate,
    maxDate,
    locale = 'en-US',
  } = props;

  const today = useMemo(() => toMidnight(new Date()), []);

  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  // Ref вместо state: handleInputBlur должен читать актуальное значение в момент blur,
  // а не то, что было закрыто в колбэке до последнего рендера.
  const inputValueRef = useRef('');

  const [isOpen, setIsOpen] = useState(false);

  const [viewYear, setViewYear] = useState(
    () => (value ?? today).getFullYear(),
  );
  const [viewMonth, setViewMonth] = useState(
    () => (value ?? today).getMonth(),
  );
  const [focusedDate, _setFocusedDate] = useState<Date>(
    () => toMidnight(value ?? today),
  );
  const [inputValue, setInputValue] = useState(
    () => (value ? formatShortDate(value, locale) : ''),
  );
  inputValueRef.current = inputValue;

  // pendingDate — дата внутри открытого диалога. Escape её отбрасывает;
  // подтверждение (Enter / клик) записывает в value через onChange.
  const [pendingDate, setPendingDate] = useState<Date | undefined>(
    () => (value ? toMidnight(value) : undefined),
  );

  // Числовой timestamp вместо Date-объекта: родитель может передавать new Date(same)
  // на каждом рендере, и эффект не будет перезаписывать то, что набрал пользователь.
  const valueTime = value ? toMidnight(value).getTime() : null;
  useEffect(() => {
    if (valueTime !== null) {
      const v = new Date(valueTime);
      setInputValue(formatShortDate(v, locale));
      _setFocusedDate(v);
      setViewYear(v.getFullYear());
      setViewMonth(v.getMonth());
      setPendingDate(v);
    } else {
      setInputValue('');
      setPendingDate(undefined);
    }
  }, [valueTime, locale]);

  useEffect(() => {
    if (!isOpen) {
      // Возврат фокуса на триггер — обязательное требование WCAG 2.4.3.
      // Микротаск гарантирует, что фокус-ловушка диалога уже деактивирована.
      Promise.resolve().then(() => triggerRef.current?.focus());
    }
  }, [isOpen]);

  const setView = useCallback((year: number, month: number) => {
    setViewYear(year);
    setViewMonth(month);
  }, []);

  const navigatePrevMonth = useCallback(() => {
    const prev = addMonths(new Date(viewYear, viewMonth, 1), -1);
    setView(prev.getFullYear(), prev.getMonth());
  }, [viewYear, viewMonth, setView]);

  const navigateNextMonth = useCallback(() => {
    const next = addMonths(new Date(viewYear, viewMonth, 1), 1);
    setView(next.getFullYear(), next.getMonth());
  }, [viewYear, viewMonth, setView]);

  const navigatePrevYear = useCallback(() => {
    setView(viewYear - 1, viewMonth);
  }, [viewYear, viewMonth, setView]);

  const navigateNextYear = useCallback(() => {
    setView(viewYear + 1, viewMonth);
  }, [viewYear, viewMonth, setView]);

  const updateFocusedDate = useCallback(
    (date: Date) => {
      const clamped = clampDate(date, minDate, maxDate);
      _setFocusedDate(clamped);
      // При переходе через границу месяца синхронизируем видимый месяц.
      if (
        clamped.getMonth() !== viewMonth ||
        clamped.getFullYear() !== viewYear
      ) {
        setView(clamped.getFullYear(), clamped.getMonth());
      }
    },
    [minDate, maxDate, viewMonth, viewYear, setView],
  );

  const openDialog = useCallback(() => {
    // Открываем месяц выбранной даты без clamping: если value вне диапазона,
    // показываем тот месяц с заблокированными ячейками, а не ближайший допустимый.
    const base = value ? toMidnight(value) : toMidnight(today);
    _setFocusedDate(base);
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth());
    setPendingDate(value ? base : undefined);
    setIsOpen(true);
  }, [value, today, setViewYear, setViewMonth]);

  const closeDialogStable = useCallback(
    (commit: boolean) => {
      setIsOpen(false);
      if (commit && pendingDate) {
        onChange(pendingDate);
        setInputValue(formatShortDate(pendingDate, locale));
      }
    },
    [pendingDate, onChange, locale],
  );

  const confirmDate = useCallback(
    (date: Date) => {
      const d = toMidnight(date);
      setPendingDate(d);
      setIsOpen(false);
      onChange(d);
      setInputValue(formatShortDate(d, locale));
    },
    [onChange, locale],
  );

  const sep = useMemo(() => getDateSeparator(locale), [locale]);

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // При удалении (raw короче текущего значения) пропускаем маску,
      // чтобы backspace не конфликтовал с автоподстановкой разделителей.
      const prev = inputValueRef.current;
      const masked =
        raw.length < prev.length ? raw : applyDateMask(raw, sep);
      setInputValue(masked);
    },
    [sep],
  );

  const handleInputBlur = useCallback(() => {
    const trimmed = inputValueRef.current.trim();

    if (trimmed === '') {
      onChange(null);
      setInputValue('');
      return;
    }

    const parsed = parseShortDate(trimmed, locale);
    if (parsed) {
      const clamped = clampDate(parsed, minDate, maxDate);
      onChange(clamped);
      setInputValue(formatShortDate(clamped, locale));
      _setFocusedDate(clamped);
      setViewYear(clamped.getFullYear());
      setViewMonth(clamped.getMonth());
    } else {
      // Невалидный ввод — откатываемся к последнему известному значению.
      setInputValue(value ? formatShortDate(value, locale) : '');
    }
  }, [locale, minDate, maxDate, onChange, value, setViewYear, setViewMonth]);

  const prevDisabled = calcPrevDisabled(viewYear, viewMonth, minDate);
  const nextDisabled = calcNextDisabled(viewYear, viewMonth, maxDate);

  const triggerAriaLabel = useMemo(
    () => formatTriggerAriaLabel(value, locale),
    [value, locale],
  );

  const firstDayOfWeek = useMemo(() => getFirstDayOfWeek(locale), [locale]);

  return {
    selectedDate: value ?? undefined,
    isOpen,
    openDialog,
    closeDialog: closeDialogStable,

    viewYear,
    viewMonth,
    navigatePrevMonth,
    navigateNextMonth,
    navigatePrevYear,
    navigateNextYear,

    focusedDate,
    updateFocusedDate,

    confirmDate,

    triggerRef,
    inputRef,

    inputValue,
    handleInputChange,
    handleInputBlur,

    isPrevMonthDisabled: prevDisabled,
    isNextMonthDisabled: nextDisabled,

    triggerAriaLabel,
    firstDayOfWeek,
  };
}
