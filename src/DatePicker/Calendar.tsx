import React, {
  KeyboardEvent,
  useEffect,
  useId,
  useRef,
} from 'react';
import { useCalendarGrid } from './useCalendarGrid';
import { useFocusTrap } from './useFocusTrap';
import {
  addDays,
  addMonths,
  addYears,
  clampDate,
  endOfWeek,
  startOfWeek,
} from './utils/dateUtils';
import { getFirstDayOfWeek } from './utils/intlUtils';
import type { CalendarCell } from './types';
import styles from './Calendar.module.css';

interface CalendarProps {
  viewYear: number;
  viewMonth: number;
  selectedDate: Date | undefined;
  focusedDate: Date;
  locale: string;
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: Date[];
  isPrevMonthDisabled: boolean;
  isNextMonthDisabled: boolean;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onFocusedDateChange: (date: Date) => void;
  onConfirm: (date: Date) => void;
  onClose: (commit: boolean) => void;
}

export function Calendar(props: CalendarProps): React.ReactElement {
  const {
    viewYear,
    viewMonth,
    selectedDate,
    focusedDate,
    locale,
    minDate,
    maxDate,
    disabledDates,
    isPrevMonthDisabled,
    isNextMonthDisabled,
    onPrevMonth,
    onNextMonth,
    onFocusedDateChange,
    onConfirm,
    onClose,
  } = props;

  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const tbodyRef = useRef<HTMLTableSectionElement | null>(null);

  // Activate focus trap for the entire dialog lifetime.
  useFocusTrap(dialogRef, true);

  // Focus the roving-tabindex button whenever focusedDate changes or on mount.
  useEffect(() => {
    const btn = tbodyRef.current?.querySelector<HTMLElement>(
      'button[tabindex="0"]',
    );
    btn?.focus();
  }, [focusedDate]);

  const gridData = useCalendarGrid({
    viewYear,
    viewMonth,
    selectedDate,
    focusedDate,
    locale,
    minDate,
    maxDate,
    disabledDates,
  });

  const firstDayOfWeek = getFirstDayOfWeek(locale);

  // ─── Keyboard handler for grid buttons ────────────────────────────────────
  // Attached to each <button> inside <td>. Arrow keys, Home/End, PageUp/Down,
  // Enter/Space, and Escape are all handled here per APG spec.

  function handleGridKeyDown(
    e: KeyboardEvent<HTMLButtonElement>,
    cell: CalendarCell,
  ): void {
    const { key, shiftKey } = e;

    switch (key) {
      case 'ArrowLeft':
        e.preventDefault();
        onFocusedDateChange(clampDate(addDays(focusedDate, -1), minDate, maxDate));
        break;
      case 'ArrowRight':
        e.preventDefault();
        onFocusedDateChange(clampDate(addDays(focusedDate, 1), minDate, maxDate));
        break;
      case 'ArrowUp':
        e.preventDefault();
        onFocusedDateChange(clampDate(addDays(focusedDate, -7), minDate, maxDate));
        break;
      case 'ArrowDown':
        e.preventDefault();
        onFocusedDateChange(clampDate(addDays(focusedDate, 7), minDate, maxDate));
        break;
      case 'Home':
        e.preventDefault();
        onFocusedDateChange(
          clampDate(startOfWeek(focusedDate, firstDayOfWeek), minDate, maxDate),
        );
        break;
      case 'End':
        e.preventDefault();
        onFocusedDateChange(
          clampDate(endOfWeek(focusedDate, firstDayOfWeek), minDate, maxDate),
        );
        break;
      case 'PageUp':
        e.preventDefault();
        onFocusedDateChange(
          clampDate(
            shiftKey ? addYears(focusedDate, -1) : addMonths(focusedDate, -1),
            minDate,
            maxDate,
          ),
        );
        break;
      case 'PageDown':
        e.preventDefault();
        onFocusedDateChange(
          clampDate(
            shiftKey ? addYears(focusedDate, 1) : addMonths(focusedDate, 1),
            minDate,
            maxDate,
          ),
        );
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!cell.isDisabled) onConfirm(cell.date);
        break;
      case 'Escape':
        e.preventDefault();
        onClose(false);
        break;
      default:
        break;
    }
  }

  // ─── OK button ────────────────────────────────────────────────────────────
  const focusedCellDisabled =
    gridData.rows.flat().find((c) => c.isFocused)?.isDisabled ?? false;

  function handleOk(): void {
    if (!focusedCellDisabled) onConfirm(focusedDate);
  }

  // ─── CSS class helpers ────────────────────────────────────────────────────
  function tdClass(cell: CalendarCell): string {
    return [
      styles.td,
      !cell.isCurrentMonth && styles.tdOutside,
    ]
      .filter(Boolean)
      .join(' ');
  }

  function btnClass(cell: CalendarCell): string {
    return [
      styles.dayButton,
      cell.isToday && styles.dayButtonToday,
      cell.isSelected && styles.dayButtonSelected,
      cell.isDisabled && styles.dayButtonDisabled,
    ]
      .filter(Boolean)
      .join(' ');
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={styles.dialog}
    >
      {/* ── Header ── */}
      <div className={styles.header}>
        <button
          type="button"
          aria-label="Previous month"
          disabled={isPrevMonthDisabled}
          onClick={onPrevMonth}
          className={styles.navButton}
        >
          <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M10.354 3.646a.5.5 0 0 1 0 .708L6.707 8l3.647 3.646a.5.5 0 0 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 0 1 .708 0z" />
          </svg>
        </button>

        <h2
          id={titleId}
          aria-live="polite"
          aria-atomic="true"
          className={styles.monthYearHeading}
        >
          {gridData.monthYearLabel}
        </h2>

        <button
          type="button"
          aria-label="Next month"
          disabled={isNextMonthDisabled}
          onClick={onNextMonth}
          className={styles.navButton}
        >
          <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M5.646 3.646a.5.5 0 0 0 0 .708L9.293 8 5.646 11.646a.5.5 0 0 0 .708.708l4-4a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708 0z" />
          </svg>
        </button>
      </div>

      {/* ── Grid ── */}
      <table role="grid" aria-labelledby={titleId} className={styles.table}>
        <thead>
          <tr>
            {gridData.weekdayHeaders.map((h) => (
              <th key={h.dayIndex} scope="col" abbr={h.long} className={styles.th}>
                {h.narrow}
              </th>
            ))}
          </tr>
        </thead>
        <tbody ref={tbodyRef}>
          {gridData.rows.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {row.map((cell) => (
                /*
                 * APG pattern: <td role="gridcell"> carries selection/state aria
                 * attributes; the <button> inside is the interactive element and
                 * holds the roving tabindex + aria-label for screen readers.
                 */
                <td
                  key={cell.date.toISOString()}
                  role="gridcell"
                  aria-selected={cell.isSelected}
                  aria-disabled={cell.isDisabled ? true : undefined}
                  aria-current={cell.isToday ? 'date' : undefined}
                  className={tdClass(cell)}
                >
                  <button
                    type="button"
                    tabIndex={cell.isFocused ? 0 : -1}
                    aria-label={cell.ariaLabel}
                    data-date={cell.date.toISOString()}
                    onKeyDown={(e) => handleGridKeyDown(e, cell)}
                    onClick={() => !cell.isDisabled && onConfirm(cell.date)}
                    className={btnClass(cell)}
                  >
                    {cell.date.getDate()}
                  </button>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Footer ── */}
      <div className={styles.footer}>
        <button
          type="button"
          onClick={handleOk}
          disabled={focusedCellDisabled}
          className={styles.okButton}
        >
          OK
        </button>
        <button
          type="button"
          onClick={() => onClose(false)}
          className={styles.cancelButton}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
