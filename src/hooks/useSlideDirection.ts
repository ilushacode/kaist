import { useEffect, useRef, useState } from 'react';
import type { Direction } from '../types';

interface UseSlideDirectionResult {
  renderedDate: Date;
  direction: Direction;
}

export const useSlideDirection = (selectedDate: Date): UseSlideDirectionResult => {
  const [direction, setDirection] = useState<Direction>(0);
  const [renderedDate, setRenderedDate] = useState<Date>(selectedDate);
  const prevDateRef = useRef(selectedDate);

  useEffect(() => {
    const prev = new Date(prevDateRef.current);
    prev.setHours(0, 0, 0, 0);
    const next = new Date(selectedDate);
    next.setHours(0, 0, 0, 0);

    if (next.getTime() !== prev.getTime()) {
      setDirection(next > prev ? 1 : -1);
      setRenderedDate(selectedDate);
      prevDateRef.current = selectedDate;
    }
  }, [selectedDate]);

  return { renderedDate, direction };
};