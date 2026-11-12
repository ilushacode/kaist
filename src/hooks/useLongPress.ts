import { useEffect, useRef } from 'react';
import type { PointerEvent, MouseEvent } from 'react';

export function useLongPress(onHold: () => void, onClick: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef<{ x: number; y: number; id: number } | null>(null);
  const suppressClick = useRef(false);
  const cancel = () => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    origin.current = null;
  };
  useEffect(() => cancel, []);

  return {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      cancel();
      suppressClick.current = false;
      if (!event.isPrimary || event.button !== 0) return;
      origin.current = { x: event.clientX, y: event.clientY, id: event.pointerId };
      timer.current = setTimeout(() => {
        timer.current = null;
        suppressClick.current = true;
        onHold();
      }, 550);
    },
    onPointerMove: (event: PointerEvent<HTMLElement>) => {
      const start = origin.current;
      if (start && start.id === event.pointerId &&
          Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) {
        suppressClick.current = true;
        cancel();
      }
    },
    onPointerUp: cancel,
    onPointerCancel: () => { suppressClick.current = true; cancel(); },
    onPointerLeave: cancel,
    onContextMenu: (event: MouseEvent<HTMLElement>) => event.preventDefault(),
    onClick: (event: MouseEvent<HTMLElement>) => {
      if (suppressClick.current) {
        event.preventDefault();
        event.stopPropagation();
        suppressClick.current = false;
        return;
      }
      onClick();
    },
  };
}
