/*
 * Ghost Catcher 2026 - Game Engine
 * =================================
 * Reversed Pac-Man: YOU chase the ghosts. They always flee from you.
 * 4 levels with increasing ghost speed and count targets.
 * Ghosts spawn periodically from the centre and scatter into the maze.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CELL,
  MAZE_LAYOUT,
  MAZE_ROWS,
  MAZE_COLS,
  PACMAN_START,
  GAME_TICK_MS,
  LEVELS,
  GHOST_COLORS,
  GHOST_SPAWN_POSITIONS,
  POINTS_PER_GHOST,
  DIRECTIONS,
  Direction,
  LevelDef,
} from '@/lib/gameConstants';

// ---- Types ----
export type GameState = 'menu' | 'playing' | 'paused' | 'levelComplete' | 'rocketTransition' | 'victory' | 'gameover';

export interface GhostState {
  id: number;
  row: number;
  col: number;
  color: string;
  direction: Direction;
  alive: boolean;
  spawnTick: number;
  moveAccumulator: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export interface ScorePopup {
  x: number;
  y: number;
  value: number;
  life: number;
}

export interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  color: string;
  size: number;
  life: number;
}

let ghostIdCounter = 0;

export function useGameEngine() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [ghostsCaught, setGhostsCaught] = useState(0);
  const [ghostsNeeded, setGhostsNeeded] = useState(0);
  const [rocketProgress, setRocketProgress] = useState(0);
  // Timer
  const [levelElapsed, setLevelElapsed] = useState(0);      // seconds elapsed this level
  const [levelTimes, setLevelTimes] = useState<number[]>([]); // time per completed level
  const levelStartTimeRef = useRef<number>(0);
  const levelElapsedRef = useRef<number>(0);

  // Mutable refs for game loop
  const mazeRef = useRef<number[][]>([]);
  const pacmanRef = useRef({ row: PACMAN_START.row, col: PACMAN_START.col });
  const pacmanDirRef = useRef<Direction>(DIRECTIONS.NONE);
  const nextDirRef = useRef<Direction>(DIRECTIONS.NONE);
  const ghostsRef = useRef<GhostState[]>([]);
  const scoreRef = useRef(0);
  const ghostsCaughtRef = useRef(0);
  const levelRef = useRef(0);
  const tickCountRef = useRef(0);
  const ghostTickAccRef = useRef(0);
  const gameLoopRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);
  const mouthOpenRef = useRef(true);
  const particlesRef = useRef<Particle[]>([]);
  const scorePopupsRef = useRef<ScorePopup[]>([]);
  const confettiRef = useRef<ConfettiPiece[]>([]);
  const gameStateRef = useRef<GameState>('menu');
  const rocketProgressRef = useRef(0);
  const nextGhostSpawnRef = useRef(0);
  const levelTimesRef = useRef<number[]>([]);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);

  // ---- Maze init ----
  const initMaze = useCallback(() => {
    mazeRef.current = MAZE_LAYOUT.map(row => [...row]);
  }, []);

  // ---- Spawn a ghost ----
  const spawnGhost = useCallback(() => {
    const spawnPos = GHOST_SPAWN_POSITIONS[Math.floor(Math.random() * GHOST_SPAWN_POSITIONS.length)];
    const color = GHOST_COLORS[ghostIdCounter % GHOST_COLORS.length];
    const ghost: GhostState = {
      id: ghostIdCounter++,
      row: spawnPos.row,
      col: spawnPos.col,
      color,
      direction: DIRECTIONS.UP,
      alive: true,
      spawnTick: tickCountRef.current,
      moveAccumulator: 0,
    };
    ghostsRef.current.push(ghost);
  }, []);

  // ---- Start game / level ----
  const startLevel = useCallback((levelIndex: number) => {
    initMaze();
    pacmanRef.current = { row: PACMAN_START.row, col: PACMAN_START.col };
    pacmanDirRef.current = DIRECTIONS.NONE;
    nextDirRef.current = DIRECTIONS.NONE;
    ghostsRef.current = [];
    ghostsCaughtRef.current = 0;
    tickCountRef.current = 0;
    ghostTickAccRef.current = 0;
    particlesRef.current = [];
    scorePopupsRef.current = [];
    nextGhostSpawnRef.current = 20; // first ghost spawns quickly
    levelRef.current = levelIndex;
    // Reset timer for this level
    levelStartTimeRef.current = performance.now();
    levelElapsedRef.current = 0;
    setLevelElapsed(0);

    const levelDef = LEVELS[levelIndex];
    setCurrentLevel(levelIndex);
    setGhostsCaught(0);
    setGhostsNeeded(levelDef.ghostCount);

    // Spawn initial ghosts (2-3 to start)
    const initialGhosts = Math.min(3, levelDef.ghostCount);
    for (let i = 0; i < initialGhosts; i++) {
      spawnGhost();
    }

    setGameState('playing');
  }, [initMaze, spawnGhost]);

  const startGame = useCallback((startLevelIndex: number = 0) => {
    scoreRef.current = 0;
    setScore(0);
    ghostIdCounter = 0;
    // Clear confetti and level times on restart
    confettiRef.current = [];
    levelTimesRef.current = [];
    setLevelTimes([]);
    startLevel(startLevelIndex);
  }, [startLevel]);

  // ---- Movement helpers ----
  const isWalkable = useCallback((row: number, col: number) => {
    if (col < 0 || col >= MAZE_COLS) {
      if (row === 10) return true; // tunnel
      return false;
    }
    if (row < 0 || row >= MAZE_ROWS) return false;
    return mazeRef.current[row]?.[col] !== CELL.WALL;
  }, []);

  const wrapPosition = useCallback((row: number, col: number) => {
    let c = col;
    if (c < 0) c = MAZE_COLS - 1;
    if (c >= MAZE_COLS) c = 0;
    return { row, col: c };
  }, []);

  // ---- VFX ----
  const spawnParticles = useCallback((row: number, col: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x: col,
        y: row,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        life: 15 + Math.random() * 10,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }, []);

  const addScorePopup = useCallback((row: number, col: number, value: number) => {
    scorePopupsRef.current.push({ x: col, y: row, value, life: 30 });
  }, []);

  const spawnConfetti = useCallback((count: number) => {
    const colors = ['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#FF00FF', '#FFB852', '#FF69B4', '#FFFFFF'];
    for (let i = 0; i < count; i++) {
      confettiRef.current.push({
        x: Math.random() * MAZE_COLS,
        y: -2 - Math.random() * 5,
        vx: (Math.random() - 0.5) * 0.3,
        vy: 0.1 + Math.random() * 0.2,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
        life: 200 + Math.random() * 100,
      });
    }
  }, []);

  // ---- Input ----
  const setDirectionFromTap = useCallback((tapRow: number, tapCol: number) => {
    const pac = pacmanRef.current;
    const dRow = tapRow - pac.row;
    const dCol = tapCol - pac.col;
    if (Math.abs(dCol) > Math.abs(dRow)) {
      nextDirRef.current = dCol > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
    } else {
      nextDirRef.current = dRow > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
    }
  }, []);

  const setDirectionFromKey = useCallback((key: string) => {
    switch (key) {
      case 'ArrowUp': case 'w': case 'W':
        nextDirRef.current = DIRECTIONS.UP; break;
      case 'ArrowDown': case 's': case 'S':
        nextDirRef.current = DIRECTIONS.DOWN; break;
      case 'ArrowLeft': case 'a': case 'A':
        nextDirRef.current = DIRECTIONS.LEFT; break;
      case 'ArrowRight': case 'd': case 'D':
        nextDirRef.current = DIRECTIONS.RIGHT; break;
    }
  }, []);

  // ---- Ghost AI: FLEE from Pac-Man ----
  const getFleeDirection = useCallback((ghost: GhostState): Direction => {
    const pac = pacmanRef.current;
    const possibleDirs = [DIRECTIONS.UP, DIRECTIONS.DOWN, DIRECTIONS.LEFT, DIRECTIONS.RIGHT];
    const reverse: Direction = { row: -ghost.direction.row, col: -ghost.direction.col };

    const validDirs = possibleDirs.filter(d => {
      const nr = ghost.row + d.row;
      const nc = ghost.col + d.col;
      if (!isWalkable(nr, nc)) return false;
      // Avoid reversing unless no other option
      if (d.row === reverse.row && d.col === reverse.col) return false;
      return true;
    });

    if (validDirs.length === 0) {
      // Must reverse
      const nr = ghost.row + reverse.row;
      const nc = ghost.col + reverse.col;
      if (isWalkable(nr, nc)) return reverse;
      for (const d of possibleDirs) {
        if (isWalkable(ghost.row + d.row, ghost.col + d.col)) return d;
      }
      return DIRECTIONS.NONE;
    }

    // 80% flee (pick direction that maximises distance from pacman), 20% random
    if (Math.random() < 0.2) {
      return validDirs[Math.floor(Math.random() * validDirs.length)];
    }

    let bestDir = validDirs[0];
    let bestDist = -1;
    for (const d of validDirs) {
      const nr = ghost.row + d.row;
      const nc = ghost.col + d.col;
      const dist = Math.abs(nr - pac.row) + Math.abs(nc - pac.col);
      if (dist > bestDist) {
        bestDist = dist;
        bestDir = d;
      }
    }
    return bestDir;
  }, [isWalkable]);

  // ---- Fanfare sound ----
  const playFanfare = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Triumphant ascending fanfare: C-E-G-C-E-G-C
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.35);
      });
      // Final triumphant chord
      setTimeout(() => {
        const chord = [523.25, 659.25, 783.99, 1046.50];
        chord.forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 1.5);
        });
      }, 900);
      // Second chord burst
      setTimeout(() => {
        const chord2 = [659.25, 783.99, 1046.50, 1318.51];
        chord2.forEach(freq => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.06, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 2.0);
        });
      }, 1400);
    } catch {
      // Audio not available
    }
  }, []);

  // ---- Level complete sound ----
  const playLevelSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [392, 440, 523.25]; // G4, A4, C5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.3);
      });
    } catch {}
  }, []);

  // ---- Ghost eat sound ----
  const playEatSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }, []);

  // ---- Main game tick ----
  const tick = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;
    if (!mazeRef.current.length) return;

    const levelDef = LEVELS[levelRef.current];
    tickCountRef.current++;
    mouthOpenRef.current = tickCountRef.current % 3 !== 0;

    // Update particles
    particlesRef.current = particlesRef.current
      .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 1 }))
      .filter(p => p.life > 0);

    // Update score popups
    scorePopupsRef.current = scorePopupsRef.current
      .map(p => ({ ...p, y: p.y - 0.05, life: p.life - 1 }))
      .filter(p => p.life > 0);

    // Spawn new ghosts periodically (keep 3-5 alive on screen)
    const aliveGhosts = ghostsRef.current.filter(g => g.alive).length;
    const totalCaught = ghostsCaughtRef.current;
    const totalNeeded = levelDef.ghostCount;
    const totalSpawned = ghostsRef.current.length;
    const remainingToSpawn = totalNeeded - totalCaught - aliveGhosts;

    if (remainingToSpawn > 0 && aliveGhosts < 4) {
      nextGhostSpawnRef.current--;
      if (nextGhostSpawnRef.current <= 0) {
        spawnGhost();
        nextGhostSpawnRef.current = levelDef.ghostSpawnInterval;
      }
    }

    // Move Pac-Man
    const pac = pacmanRef.current;
    const nextDir = nextDirRef.current;
    if (nextDir.row !== 0 || nextDir.col !== 0) {
      const tryRow = pac.row + nextDir.row;
      const tryCol = pac.col + nextDir.col;
      if (isWalkable(tryRow, tryCol)) {
        pacmanDirRef.current = nextDir;
      }
    }

    const dir = pacmanDirRef.current;
    if (dir.row !== 0 || dir.col !== 0) {
      const newRow = pac.row + dir.row;
      const newCol = pac.col + dir.col;
      if (isWalkable(newRow, newCol)) {
        const wrapped = wrapPosition(newRow, newCol);
        pac.row = wrapped.row;
        pac.col = wrapped.col;
      }
    }

    // Move ghosts (speed controlled per level)
    for (const ghost of ghostsRef.current) {
      if (!ghost.alive) continue;

      ghost.moveAccumulator += levelDef.ghostSpeed;
      while (ghost.moveAccumulator >= 1) {
        ghost.moveAccumulator -= 1;
        const newDir = getFleeDirection(ghost);
        ghost.direction = newDir;
        const nr = ghost.row + newDir.row;
        const nc = ghost.col + newDir.col;
        if (isWalkable(nr, nc)) {
          const wrapped = wrapPosition(nr, nc);
          ghost.row = wrapped.row;
          ghost.col = wrapped.col;
        }
      }
    }

    // Update timer display every tick
    const nowMs = performance.now();
    const elapsedSec = Math.floor((nowMs - levelStartTimeRef.current) / 1000);
    if (elapsedSec !== levelElapsedRef.current) {
      levelElapsedRef.current = elapsedSec;
      setLevelElapsed(elapsedSec);
    }

    // Check collisions (Pac-Man catches ghost)
    for (const ghost of ghostsRef.current) {
      if (!ghost.alive) continue;
      if (ghost.row === pac.row && ghost.col === pac.col) {
        ghost.alive = false;
        ghostsCaughtRef.current++;
        scoreRef.current += POINTS_PER_GHOST;
        setScore(scoreRef.current);
        setGhostsCaught(ghostsCaughtRef.current);
        spawnParticles(ghost.row, ghost.col, ghost.color, 12);
        addScorePopup(ghost.row, ghost.col, POINTS_PER_GHOST);
        playEatSound();

        // Check level complete
        if (ghostsCaughtRef.current >= levelDef.ghostCount) {
          // Record level time
          const finishTime = Math.max(1, Math.floor((performance.now() - levelStartTimeRef.current) / 1000));
          levelTimesRef.current = [...levelTimesRef.current, finishTime];
          setLevelTimes([...levelTimesRef.current]);

          // Time bonus: 3000 pts for finishing in ≤10s, scaling down to 0 at 60s
          const timeBonus = Math.max(0, Math.round(3000 * Math.max(0, (60 - finishTime) / 50)));
          if (timeBonus > 0) {
            scoreRef.current += timeBonus;
            setScore(scoreRef.current);
          }

          if (levelRef.current >= LEVELS.length - 1) {
            // Game complete!
            playFanfare();
            spawnConfetti(150);
            setGameState('victory');
          } else {
            // Level complete - start rocket transition
            playLevelSound();
            setGameState('levelComplete');
          }
          return;
        }
      }
    }

    // Remove dead ghosts from rendering after a delay
    ghostsRef.current = ghostsRef.current.filter(g => g.alive || (tickCountRef.current - g.spawnTick < 200));
  }, [isWalkable, wrapPosition, spawnGhost, spawnParticles, addScorePopup, getFleeDirection, playEatSound, playLevelSound, playFanfare, spawnConfetti]);

  // ---- Game loop ----
  useEffect(() => {
    if (gameState !== 'playing') {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    const loop = (timestamp: number) => {
      if (timestamp - lastTickRef.current >= GAME_TICK_MS) {
        lastTickRef.current = timestamp;
        tick();
      }
      gameLoopRef.current = requestAnimationFrame(loop);
    };

    lastTickRef.current = performance.now();
    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, tick]);

  // ---- Rocket transition ----
  const startRocketTransition = useCallback(() => {
    rocketProgressRef.current = 0;
    setRocketProgress(0);
    setGameState('rocketTransition');

    const duration = 2500; // ms
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      rocketProgressRef.current = progress;
      setRocketProgress(progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Start next level
        startLevel(levelRef.current + 1);
      }
    };
    requestAnimationFrame(animate);
  }, [startLevel]);

  // ---- Victory confetti loop ----
  useEffect(() => {
    if (gameState !== 'victory') return;
    let frame: number;
    const loop = () => {
      confettiRef.current = confettiRef.current
        .map(c => ({
          ...c,
          x: c.x + c.vx,
          y: c.y + c.vy,
          rotation: c.rotation + c.rotSpeed,
          life: c.life - 1,
        }))
        .filter(c => c.life > 0);

      // Keep spawning confetti
      if (confettiRef.current.length < 80) {
        spawnConfetti(5);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [gameState, spawnConfetti]);

  const togglePause = useCallback(() => {
    setGameState(prev => prev === 'playing' ? 'paused' : prev === 'paused' ? 'playing' : prev);
  }, []);

  return {
    gameState,
    setGameState,
    score,
    currentLevel,
    ghostsCaught,
    ghostsNeeded,
    rocketProgress,
    levelElapsed,
    levelTimes,
    mazeRef,
    pacmanRef,
    pacmanDirRef,
    ghostsRef,
    mouthOpenRef,
    particlesRef,
    scorePopupsRef,
    confettiRef,
    startGame,
    startLevel,
    startRocketTransition,
    setDirectionFromTap,
    setDirectionFromKey,
    togglePause,
  };
}
