import React, { useMemo, useId } from 'react';
import type { DatePickerProps } from './types';
import { useDatePicker } from './useDatePicker';
import { Calendar } from './Calendar';
import { getFormatHint } from './utils/intlUtils';
import styles from './DatePicker.module.css';

/**
 * DatePicker — WAI-ARIA APG "Date Picker Dialog" pattern.
 *
 * Usage:
 *   <DatePicker value={date} onChange={setDate} locale="en-US" />
 *
 * Accessibility highlights:
 *  - <input> linked to format hint via aria-describedby
 *  - Trigger button: aria-haspopup="dialog", aria-expanded, dynamic aria-label
 *  - Dialog: role="dialog" aria-modal="true" aria-labelledby → <h2 aria-live>
 *  - Grid: role="grid" with roving tabindex on <td role="gridcell"> (no nested buttons)
 *  - Full keyboard navigation per APG spec
 *  - Focus trap and focus-return on close
 *  - WCAG 2.1/2.2 Level AA colour contrast throughout
 */
export function DatePicker(props: DatePickerProps): React.ReactElement {
  const { locale = 'en-US' } = props;

  const uid = useId();
  const inputId = `${uid}-input`;
  const hintId = `${uid}-hint`;

  const {
    selectedDate,
    isOpen,
    openDialog,
    closeDialog,
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
    isPrevMonthDisabled,
    isNextMonthDisabled,
    triggerAriaLabel,
  } = useDatePicker({ ...props, locale });

  const formatHint = useMemo(() => getFormatHint(locale), [locale]);

  return (
    <div className={styles.wrapper}>
      {/* ── Input row ── */}
      <div className={styles.inputRow}>
        <label htmlFor={inputId} className={styles.label}>
          Date
        </label>

        <input
          id={inputId}
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          aria-describedby={hintId}
          autoComplete="off"
          className={styles.input}
        />

        <button
          ref={triggerRef}
          type="button"
          aria-label={triggerAriaLabel}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={openDialog}
          className={styles.triggerButton}
        >
          {/* Calendar icon — aria-hidden so the label on the button is read instead */}
          <svg
            aria-hidden="true"
            focusable="false"
            width="18"
            height="18"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM2 2a1 1 0 0 0-1 1v1h14V3a1 1 0 0 0-1-1H2zm13 3H1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V5z" />
          </svg>
        </button>
      </div>

      {/* Format hint — referenced by aria-describedby on the input */}
      <span id={hintId} className={styles.hint}>
        {formatHint}
      </span>

      {/* ── Calendar dialog (conditionally mounted) ── */}
      {isOpen && (
        <Calendar
          viewYear={viewYear}
          viewMonth={viewMonth}
          selectedDate={selectedDate}
          focusedDate={focusedDate}
          locale={locale}
          minDate={props.minDate}
          maxDate={props.maxDate}
          disabledDates={props.disabledDates}
          isPrevMonthDisabled={isPrevMonthDisabled}
          isNextMonthDisabled={isNextMonthDisabled}
          onPrevMonth={navigatePrevMonth}
          onNextMonth={navigateNextMonth}
          onFocusedDateChange={updateFocusedDate}
          onConfirm={confirmDate}
          onClose={closeDialog}
        />
      )}
    </div>
  );
}
