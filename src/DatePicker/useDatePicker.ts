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
  formatShortDate,
  formatTriggerAriaLabel,
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
  /** Update the roving-tabindex target.  Auto-syncs the view month. */
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

  /** firstDayOfWeek needed by Calendar for keyboard Home/End calculation */
  firstDayOfWeek: 0 | 1;
}

export function useDatePicker(props: DatePickerProps): UseDatePickerReturn {
  const {
    value,
    onChange,
    minDate,
    maxDate,
    disabledDates,
    locale = 'en-US',
  } = props;

  const today = useMemo(() => toMidnight(new Date()), []);

  // ─── Stable refs ────────────────────────────────────────────────────────────
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // ─── Core state ─────────────────────────────────────────────────────────────
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

  // Track the "pending" date while the dialog is open (separate from the
  // committed `value` prop so Escape can discard changes).
  const [pendingDate, setPendingDate] = useState<Date | undefined>(
    () => (value ? toMidnight(value) : undefined),
  );

  // ─── Sync when controlled `value` changes ──────────────────────────────────
  useEffect(() => {
    if (value !== undefined) {
      const v = toMidnight(value);
      setInputValue(formatShortDate(v, locale));
      _setFocusedDate(v);
      setViewYear(v.getFullYear());
      setViewMonth(v.getMonth());
      setPendingDate(v);
    }
  }, [value, locale]);

  // ─── Return focus to trigger after dialog closes ────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      // Use a microtask so that the Calendar has unmounted first.
      Promise.resolve().then(() => triggerRef.current?.focus());
    }
  }, [isOpen]);

  // ─── Navigation helpers ──────────────────────────────────────────────────────

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

  // ─── Roving tabindex target ──────────────────────────────────────────────────

  const updateFocusedDate = useCallback(
    (date: Date) => {
      const clamped = clampDate(date, minDate, maxDate);
      _setFocusedDate(clamped);
      // Sync the view when the focused date crosses a month boundary.
      if (
        clamped.getMonth() !== viewMonth ||
        clamped.getFullYear() !== viewYear
      ) {
        setView(clamped.getFullYear(), clamped.getMonth());
      }
    },
    [minDate, maxDate, viewMonth, viewYear, setView],
  );

  // ─── Open / close ────────────────────────────────────────────────────────────

  const openDialog = useCallback(() => {
    const base = toMidnight(value ?? today);
    _setFocusedDate(base);
    setView(base.getFullYear(), base.getMonth());
    setPendingDate(value ? toMidnight(value) : undefined);
    setIsOpen(true);
  }, [value, today, setView]);

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

  // ─── Text input ──────────────────────────────────────────────────────────────

  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
    },
    [],
  );

  const handleInputBlur = useCallback(() => {
    const parsed = parseShortDate(inputValue, locale);
    if (parsed) {
      const clamped = clampDate(parsed, minDate, maxDate);
      onChange(clamped);
      setInputValue(formatShortDate(clamped, locale));
      _setFocusedDate(clamped);
      setView(clamped.getFullYear(), clamped.getMonth());
    } else {
      // Revert to last known good value
      setInputValue(value ? formatShortDate(value, locale) : '');
    }
  }, [inputValue, locale, minDate, maxDate, onChange, value, setView]);

  // ─── Derived values ──────────────────────────────────────────────────────────

  const prevDisabled = calcPrevDisabled(viewYear, viewMonth, minDate);
  const nextDisabled = calcNextDisabled(viewYear, viewMonth, maxDate);

  const triggerAriaLabel = useMemo(
    () => formatTriggerAriaLabel(value, locale),
    [value, locale],
  );

  const firstDayOfWeek = useMemo(() => getFirstDayOfWeek(locale), [locale]);

  return {
    selectedDate: value,
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
