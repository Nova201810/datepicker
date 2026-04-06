// По паттерну APG Date Picker Dialog интерактивным элементом является <button> внутри <td>,
// а не сама ячейка — это обеспечивает корректное объявление метки скринридером.
import React, { KeyboardEvent } from 'react';
import type { CalendarCell } from './types';
import styles from './Calendar.module.css';

interface DayButtonProps {
  cell: CalendarCell;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
  onConfirm: (date: Date) => void;
}

export function DayButton({ cell, onKeyDown, onConfirm }: DayButtonProps): React.ReactElement {
  const className = [
    styles.dayButton,
    cell.isToday && styles.dayButtonToday,
    cell.isSelected && styles.dayButtonSelected,
    cell.isDisabled && styles.dayButtonDisabled,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      tabIndex={cell.isFocused ? 0 : -1}
      aria-disabled={cell.isDisabled ? true : undefined}
      aria-current={cell.isToday ? 'date' : undefined}
      aria-label={cell.ariaLabel}
      data-date={cell.date.toISOString()}
      onKeyDown={onKeyDown}
      onClick={() => {
        if (!cell.isDisabled) onConfirm(cell.date);
      }}
      className={className}
    >
      {cell.date.getDate()}
    </button>
  );
}
