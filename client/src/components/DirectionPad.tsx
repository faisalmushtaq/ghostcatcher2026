/*
 * Ghost Catcher 2026 - Direction Pad
 * ====================================
 * Classic arcade-style on-screen directional buttons.
 * Large touch targets for small fingers.
 */

import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { DIRECTIONS, Direction } from '@/lib/gameConstants';
import { useCallback } from 'react';

interface DirectionPadProps {
  onDirection: (dir: Direction) => void;
  visible: boolean;
}

export default function DirectionPad({ onDirection, visible }: DirectionPadProps) {
  if (!visible) return null;

  const handlePress = useCallback((dir: Direction) => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDirection(dir);
  }, [onDirection]);

  const btnClass = "flex items-center justify-center rounded active:scale-90 transition-transform duration-100 select-none";
  const btnStyle = {
    width: '54px',
    height: '54px',
    background: 'rgba(255,255,255,0.08)',
    border: '2px solid rgba(255,255,255,0.25)',
    color: '#FFFFFF',
    touchAction: 'none' as const,
  };

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-50 grid gap-1"
      style={{
        bottom: 'max(12px, env(safe-area-inset-bottom, 8px))',
        gridTemplateColumns: '54px 54px 54px',
        gridTemplateRows: '54px 54px 54px',
        touchAction: 'none',
      }}
    >
      <div className="col-start-2 row-start-1">
        <button className={btnClass} style={btnStyle} onTouchStart={handlePress(DIRECTIONS.UP)} onMouseDown={handlePress(DIRECTIONS.UP)} aria-label="Up">
          <ChevronUp className="w-7 h-7" />
        </button>
      </div>
      <div className="col-start-1 row-start-2">
        <button className={btnClass} style={btnStyle} onTouchStart={handlePress(DIRECTIONS.LEFT)} onMouseDown={handlePress(DIRECTIONS.LEFT)} aria-label="Left">
          <ChevronLeft className="w-7 h-7" />
        </button>
      </div>
      <div className="col-start-3 row-start-2">
        <button className={btnClass} style={btnStyle} onTouchStart={handlePress(DIRECTIONS.RIGHT)} onMouseDown={handlePress(DIRECTIONS.RIGHT)} aria-label="Right">
          <ChevronRight className="w-7 h-7" />
        </button>
      </div>
      <div className="col-start-2 row-start-3">
        <button className={btnClass} style={btnStyle} onTouchStart={handlePress(DIRECTIONS.DOWN)} onMouseDown={handlePress(DIRECTIONS.DOWN)} aria-label="Down">
          <ChevronDown className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
}
