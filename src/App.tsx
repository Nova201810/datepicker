import React, { useState } from 'react';
import cn from 'classnames';

import { DatePicker } from './DatePicker';
import styles from './styles.module.css';

export function App(): React.ReactElement {
  const today = new Date();
  const [value, setValue] = useState<Date | null>(today);
  const nextWeek = new Date(
    today.getFullYear(), today.getMonth(), today.getDate() + 7
);
  const prevYearStart = new Date(today.getFullYear() - 1, 0, 1);
  const prevWeek = new Date(
    today.getFullYear(), today.getMonth(), today.getDate() - 7
  );
  const prevThreeDays = new Date(
    today.getFullYear(), today.getMonth(), today.getDate() - 3
  );
  return (
    <div className={cn(styles.ibmPlexMonoRegular, styles.content)}>
        <DatePicker
          locale="ru-RU"
          value={value}
          onChange={(date) => setValue(date)}
          minDate={prevYearStart}
          maxDate={nextWeek}
          disabledDates={[prevWeek, prevThreeDays]}
        />
    </div>
  );
};