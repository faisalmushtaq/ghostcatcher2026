/*
 * Ghost Catcher 2026 - Swipe Gesture Hook
 * =========================================
 * Detects swipe gestures on touch devices for directional control.
 * Also supports tap-to-direct (handled in GameCanvas).
 */

import { useCallback, useRef } from 'react';
import { DIRECTIONS, Direction } from '@/lib/gameConstants';

interface SwipeOptions {
  onSwipe: (direction: Direction) => void;
  minDistance?: number;
}

export function useSwipeGesture({ onSwipe, minDistance = 30 }: SwipeOptions) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent | TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent | TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;

    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < minDistance) {
      // Too short - it's a tap, not a swipe
      touchStartRef.current = null;
      return;
    }

    let direction: Direction;
    if (absDx > absDy) {
      direction = dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
    } else {
      direction = dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
    }

    onSwipe(direction);
    touchStartRef.current = null;
  }, [onSwipe, minDistance]);

  return { handleTouchStart, handleTouchEnd };
}
