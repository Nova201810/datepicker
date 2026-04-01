import React, { useState } from 'react';
import { DatePicker } from './DatePicker';

export function App(): React.ReactElement {
  const [value, setValue] = useState(new Date());

  return (
    <DatePicker
      locale="ru-RU"
      value={value}
      onChange={(date) => setValue(date)}
      minDate={new Date(2020, 0, 1)} // Jan 1, 2020
      maxDate={new Date(2025, 11, 31)} // Dec 31, 2025
    />
  );
};