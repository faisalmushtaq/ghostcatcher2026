/*
 * Ghost Catcher 2026 - Game Canvas
 * ==================================
 * Classic pixel-art Pac-Man renderer.
 * Draws maze, pacman, fleeing ghosts, particles, popups, confetti.
 */

import { useCallback, useEffect, useRef } from 'react';
import {
  MAZE_ROWS,
  MAZE_COLS,
  CELL,
  COLORS,
  LEVELS,
  PIXEL_FONT,
  DIRECTIONS,
  Direction,
} from '@/lib/gameConstants';
import type { GhostState, Particle, ScorePopup, ConfettiPiece } from '@/hooks/useGameEngine';

interface GameCanvasProps {
  mazeRef: React.MutableRefObject<number[][]>;
  pacmanRef: React.MutableRefObject<{ row: number; col: number }>;
  pacmanDirRef: React.MutableRefObject<Direction>;
  ghostsRef: React.MutableRefObject<GhostState[]>;
  mouthOpenRef: React.MutableRefObject<boolean>;
  particlesRef: React.MutableRefObject<Particle[]>;
  scorePopupsRef: React.MutableRefObject<ScorePopup[]>;
  confettiRef: React.MutableRefObject<ConfettiPiece[]>;
  onTap: (row: number, col: number) => void;
  isPlaying: boolean;
  levelIndex: number;
}

export default function GameCanvas({
  mazeRef,
  pacmanRef,
  pacmanDirRef,
  ghostsRef,
  mouthOpenRef,
  particlesRef,
  scorePopupsRef,
  confettiRef,
  onTap,
  isPlaying,
  levelIndex,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const cellSizeRef = useRef(20);

  // Resize canvas
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const pad = 4;
    const cellW = Math.floor((cw - pad * 2) / MAZE_COLS);
    const cellH = Math.floor((ch - pad * 2) / MAZE_ROWS);
    const cellSize = Math.max(8, Math.min(cellW, cellH));
    cellSizeRef.current = cellSize;

    const w = cellSize * MAZE_COLS;
    const h = cellSize * MAZE_ROWS;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', () => setTimeout(resizeCanvas, 100));
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // Handle tap/click
  const handleInteraction = useCallback((clientX: number, clientY: number) => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const cs = cellSizeRef.current;
    onTap(y / cs, x / cs);
  }, [onTap, isPlaying]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    handleInteraction(e.clientX, e.clientY);
  }, [handleInteraction]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length > 0) handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
  }, [handleInteraction]);

  // ---- Render ----
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cs = cellSizeRef.current;
    const w = cs * MAZE_COLS;
    const h = cs * MAZE_ROWS;
    const maze = mazeRef.current;
    const pac = pacmanRef.current;
    const ghosts = ghostsRef.current;
    const particles = particlesRef.current;
    const popups = scorePopupsRef.current;
    const confetti = confettiRef.current;
    const levelDef = LEVELS[levelIndex] || LEVELS[0];

    // Background
    ctx.fillStyle = levelDef.bgColor;
    ctx.fillRect(0, 0, w, h);

    if (!maze.length) {
      animFrameRef.current = requestAnimationFrame(render);
      return;
    }

    // Draw maze walls
    for (let r = 0; r < MAZE_ROWS; r++) {
      for (let c = 0; c < MAZE_COLS; c++) {
        const x = c * cs;
        const y = r * cs;
        const cell = maze[r][c];

        if (cell === CELL.WALL) {
          ctx.fillStyle = levelDef.wallColor;
          ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
          // Inner highlight for pixel 3D effect
          ctx.fillStyle = levelDef.wallStroke;
          ctx.fillRect(x + 2, y + 2, cs - 6, 2);
          ctx.fillRect(x + 2, y + 2, 2, cs - 6);
        }
      }
    }

    // Draw particles
    for (const p of particles) {
      const alpha = Math.max(0, p.life / 25);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x * cs + cs / 2 - p.size / 2, p.y * cs + cs / 2 - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;

    // Draw score popups
    for (const popup of popups) {
      const alpha = Math.max(0, popup.life / 30);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = COLORS.textHighlight;
      ctx.font = `${Math.round(cs * 0.45)}px ${PIXEL_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`+${popup.value}`, popup.x * cs + cs / 2, popup.y * cs + cs / 2);
    }
    ctx.globalAlpha = 1;

    // Draw ghosts (alive only)
    for (const ghost of ghosts) {
      if (!ghost.alive) continue;
      const gx = ghost.col * cs + cs / 2;
      const gy = ghost.row * cs + cs / 2;
      const gs = cs * 0.42;

      // Ghost body
      ctx.fillStyle = ghost.color;
      ctx.beginPath();
      ctx.arc(gx, gy - gs * 0.1, gs, Math.PI, 0, false);
      // Wavy bottom
      const wobble = Math.sin(Date.now() / 120 + ghost.id) * 1.5;
      const bottom = gy + gs * 0.6 + wobble;
      ctx.lineTo(gx + gs, bottom);
      const waves = 3;
      const ww = (gs * 2) / waves;
      for (let i = 0; i < waves; i++) {
        const wx = gx + gs - ww * i;
        ctx.lineTo(wx - ww / 2, i % 2 === 0 ? bottom + gs * 0.2 : bottom);
        ctx.lineTo(wx - ww, bottom);
      }
      ctx.closePath();
      ctx.fill();

      // Scared expression (they are always running!)
      // Eyes - wide and looking away from pacman
      const eyeSize = gs * 0.2;
      const pupilSize = gs * 0.1;
      const eyeY = gy - gs * 0.15;

      // Pupil offset: look AWAY from pacman
      const dx = ghost.col - pac.col;
      const dy = ghost.row - pac.row;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      const pdx = (dx / dist) * 2.5;
      const pdy = (dy / dist) * 2.5;

      // Left eye
      ctx.fillStyle = COLORS.ghostEyes;
      ctx.beginPath();
      ctx.ellipse(gx - gs * 0.22, eyeY, eyeSize, eyeSize * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.ghostPupil;
      ctx.beginPath();
      ctx.arc(gx - gs * 0.22 + pdx, eyeY + pdy, pupilSize, 0, Math.PI * 2);
      ctx.fill();

      // Right eye
      ctx.fillStyle = COLORS.ghostEyes;
      ctx.beginPath();
      ctx.ellipse(gx + gs * 0.22, eyeY, eyeSize, eyeSize * 1.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.ghostPupil;
      ctx.beginPath();
      ctx.arc(gx + gs * 0.22 + pdx, eyeY + pdy, pupilSize, 0, Math.PI * 2);
      ctx.fill();

      // Scared mouth (wavy line)
      ctx.strokeStyle = COLORS.ghostEyes;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(gx - gs * 0.25, gy + gs * 0.15);
      for (let i = 0; i < 5; i++) {
        const mx = gx - gs * 0.25 + (gs * 0.5 / 5) * (i + 0.5);
        const my = gy + gs * 0.15 + (i % 2 === 0 ? -2 : 2);
        ctx.lineTo(mx, my);
      }
      ctx.stroke();
    }

    // Draw Pac-Man (classic yellow circle with mouth)
    const px = pac.col * cs + cs / 2;
    const py = pac.row * cs + cs / 2;
    const pacSize = cs * 0.44;
    const dir = pacmanDirRef.current;
    const mouthOpen = mouthOpenRef.current;

    let angle = 0;
    if (dir.col === 1) angle = 0;
    else if (dir.col === -1) angle = Math.PI;
    else if (dir.row === -1) angle = -Math.PI / 2;
    else if (dir.row === 1) angle = Math.PI / 2;

    const mouthAngle = mouthOpen ? 0.3 : 0.05;

    ctx.beginPath();
    ctx.arc(px, py, pacSize, angle + mouthAngle * Math.PI, angle - mouthAngle * Math.PI + 2 * Math.PI, false);
    ctx.lineTo(px, py);
    ctx.closePath();
    ctx.fillStyle = COLORS.pacman;
    ctx.fill();

    // Eye
    const eyeOx = Math.cos(angle - 0.6) * pacSize * 0.4;
    const eyeOy = Math.sin(angle - 0.6) * pacSize * 0.4;
    ctx.fillStyle = COLORS.pacmanEye;
    ctx.beginPath();
    ctx.arc(px + eyeOx, py + eyeOy, pacSize * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Draw confetti
    for (const c of confetti) {
      ctx.save();
      ctx.translate(c.x * cs, c.y * cs);
      ctx.rotate((c.rotation * Math.PI) / 180);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.4);
      ctx.restore();
    }

    animFrameRef.current = requestAnimationFrame(render);
  }, [mazeRef, pacmanRef, pacmanDirRef, ghostsRef, mouthOpenRef, particlesRef, scorePopupsRef, confettiRef, levelIndex]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [render]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center"
      style={{ touchAction: 'none' }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{ touchAction: 'none', imageRendering: 'pixelated', outline: 'none' }}
      />
    </div>
  );
}
