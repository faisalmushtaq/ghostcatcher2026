/*
 * Ghost Catcher 2026 - Home Page
 * ===============================
 * Classic pixel arcade style. Menu, gameplay, level transitions,
 * rocket animation, and victory screen with confetti + fanfare.
 */

import { useEffect, useCallback, useState } from 'react';
import { useGameEngine } from '@/hooks/useGameEngine';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import GameCanvas from '@/components/GameCanvas';
import DirectionPad from '@/components/DirectionPad';
import { Pause, Play } from 'lucide-react';
import { Direction, LEVELS, ASSETS, PIXEL_FONT } from '@/lib/gameConstants';

export default function Home() {
  const {
    gameState,
    setGameState,
    score,
    currentLevel,
    ghostsCaught,
    ghostsNeeded,
    rocketProgress,
    mazeRef,
    pacmanRef,
    pacmanDirRef,
    ghostsRef,
    mouthOpenRef,
    particlesRef,
    scorePopupsRef,
    confettiRef,
    startGame,
    startRocketTransition,
    setDirectionFromTap,
    setDirectionFromKey,
    togglePause,
  } = useGameEngine();

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [showDpad, setShowDpad] = useState(false);

  useEffect(() => {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(isTouch);
    setShowDpad(isTouch);
  }, []);

  // Prevent iOS bounce/zoom
  useEffect(() => {
    const prevent = (e: TouchEvent) => {
      if (gameState === 'playing' || gameState === 'paused') e.preventDefault();
    };
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    document.addEventListener('touchmove', prevent, { passive: false });
    document.addEventListener('gesturestart', preventZoom as any, { passive: false });
    return () => {
      document.removeEventListener('touchmove', prevent);
      document.removeEventListener('gesturestart', preventZoom as any);
    };
  }, [gameState]);

  // Swipe
  const handleSwipe = useCallback((dir: Direction) => {
    if (gameState === 'playing') {
      if (dir.row === -1) setDirectionFromKey('ArrowUp');
      else if (dir.row === 1) setDirectionFromKey('ArrowDown');
      else if (dir.col === -1) setDirectionFromKey('ArrowLeft');
      else if (dir.col === 1) setDirectionFromKey('ArrowRight');
    }
  }, [gameState, setDirectionFromKey]);

  const { handleTouchStart: swipeTouchStart, handleTouchEnd: swipeTouchEnd } = useSwipeGesture({
    onSwipe: handleSwipe,
    minDistance: 20,
  });

  // D-pad
  const handleDpadDirection = useCallback((dir: Direction) => {
    if (dir.row === -1) setDirectionFromKey('ArrowUp');
    else if (dir.row === 1) setDirectionFromKey('ArrowDown');
    else if (dir.col === -1) setDirectionFromKey('ArrowLeft');
    else if (dir.col === 1) setDirectionFromKey('ArrowRight');
  }, [setDirectionFromKey]);

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'playing') {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
          e.preventDefault();
          setDirectionFromKey(e.key);
        }
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') togglePause();
      } else if (gameState === 'paused') {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') togglePause();
      } else if (gameState === 'menu' || gameState === 'victory') {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startGame(); }
      } else if (gameState === 'levelComplete') {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); startRocketTransition(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, setDirectionFromKey, togglePause, startGame, startRocketTransition]);

  const handleTap = useCallback((row: number, col: number) => {
    setDirectionFromTap(row, col);
  }, [setDirectionFromTap]);

  const levelDef = LEVELS[currentLevel] || LEVELS[0];

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden relative select-none"
      style={{
        backgroundColor: '#000000',
        touchAction: 'none',
        fontFamily: PIXEL_FONT,
      }}
      onTouchStart={(e) => { if (gameState === 'playing') swipeTouchStart(e); }}
      onTouchEnd={(e) => { if (gameState === 'playing') swipeTouchEnd(e); }}
    >
      {/* ===== MENU SCREEN ===== */}
      {gameState === 'menu' && (
        <div className="flex flex-col items-center gap-4 sm:gap-6 p-4 max-w-lg mx-auto">
          <img
            src={ASSETS.logo}
            alt="Ghost Catcher 2026"
            className="w-full max-w-[400px]"
            style={{ imageRendering: 'auto' }}
          />
          <img
            src={ASSETS.splash}
            alt="Game Preview"
            className="w-full max-w-[280px] rounded-lg"
            style={{ border: '3px solid #2121DE' }}
          />
          <button
            onClick={startGame}
            className="px-8 py-3 sm:px-10 sm:py-4 text-sm sm:text-base tracking-wider transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              fontFamily: PIXEL_FONT,
              color: '#FFFF00',
              backgroundColor: '#000000',
              border: '3px solid #FFFF00',
              textShadow: '0 0 10px rgba(255,255,0,0.5)',
            }}
          >
            START GAME
          </button>
          <p
            className="text-[10px] sm:text-xs text-center max-w-[280px] leading-relaxed"
            style={{ fontFamily: PIXEL_FONT, color: '#6666FF' }}
          >
            {isTouchDevice
              ? 'TAP THE MAZE OR USE D-PAD TO CATCH GHOSTS!'
              : 'ARROW KEYS OR WASD TO CATCH GHOSTS!'}
          </p>
        </div>
      )}

      {/* ===== GAME SCREEN ===== */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <div className="w-full h-[100dvh] flex flex-col">
          {/* HUD */}
          <div
            className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 shrink-0"
            style={{
              backgroundColor: 'rgba(0,0,0,0.95)',
              borderBottom: `2px solid ${levelDef.wallColor}`,
            }}
          >
            {/* Level + Ghosts caught */}
            <div className="flex flex-col">
              <span
                className="text-[9px] sm:text-[10px]"
                style={{ fontFamily: PIXEL_FONT, color: levelDef.wallStroke }}
              >
                {levelDef.label.toUpperCase()}
              </span>
              <span
                className="text-[9px] sm:text-[10px]"
                style={{ fontFamily: PIXEL_FONT, color: '#FFFFFF' }}
              >
                GHOSTS: {ghostsCaught}/{ghostsNeeded}
              </span>
            </div>

            {/* Score */}
            <div className="text-center">
              <span
                className="text-sm sm:text-base"
                style={{ fontFamily: PIXEL_FONT, color: '#FFFF00' }}
              >
                {score.toString().padStart(6, '0')}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              {isTouchDevice && (
                <button
                  onClick={() => setShowDpad(prev => !prev)}
                  className="p-1.5 rounded transition-colors"
                  style={{
                    background: showDpad ? 'rgba(255,255,255,0.15)' : 'transparent',
                  }}
                  aria-label="Toggle D-pad"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
                    <rect x="8" y="2" width="8" height="8" rx="1" />
                    <rect x="2" y="8" width="8" height="8" rx="1" />
                    <rect x="14" y="8" width="8" height="8" rx="1" />
                    <rect x="8" y="14" width="8" height="8" rx="1" />
                  </svg>
                </button>
              )}
              <button
                onClick={togglePause}
                className="p-1.5 rounded hover:bg-white/10 transition-colors"
                aria-label={gameState === 'paused' ? 'Resume' : 'Pause'}
              >
                {gameState === 'paused' ? (
                  <Play className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#FFFFFF' }} />
                ) : (
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#FFFFFF' }} />
                )}
              </button>
            </div>
          </div>

          {/* Ghost progress bar */}
          <div className="shrink-0 px-3 py-1" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}>
            <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (ghostsCaught / ghostsNeeded) * 100)}%`,
                  backgroundColor: levelDef.wallStroke,
                  boxShadow: `0 0 8px ${levelDef.wallStroke}`,
                }}
              />
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 relative overflow-hidden" style={{ paddingBottom: showDpad ? '200px' : '0' }}>
            <GameCanvas
              mazeRef={mazeRef}
              pacmanRef={pacmanRef}
              pacmanDirRef={pacmanDirRef}
              ghostsRef={ghostsRef}
              mouthOpenRef={mouthOpenRef}
              particlesRef={particlesRef}
              scorePopupsRef={scorePopupsRef}
              confettiRef={confettiRef}
              onTap={handleTap}
              isPlaying={gameState === 'playing'}
              levelIndex={currentLevel}
            />

            {/* Pause overlay */}
            {gameState === 'paused' && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-40"
                style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
              >
                <h2
                  className="text-xl sm:text-2xl"
                  style={{ fontFamily: PIXEL_FONT, color: '#FFFF00' }}
                >
                  PAUSED
                </h2>
                <button
                  onClick={togglePause}
                  className="px-6 py-2 text-xs sm:text-sm transition-all hover:scale-105 active:scale-95"
                  style={{
                    fontFamily: PIXEL_FONT,
                    color: '#00FF00',
                    border: '2px solid #00FF00',
                    backgroundColor: 'transparent',
                  }}
                >
                  RESUME
                </button>
              </div>
            )}
          </div>

          {/* D-pad */}
          <DirectionPad
            onDirection={handleDpadDirection}
            visible={showDpad && gameState === 'playing'}
          />
        </div>
      )}

      {/* ===== LEVEL COMPLETE ===== */}
      {gameState === 'levelComplete' && (
        <div className="flex flex-col items-center gap-4 sm:gap-6 p-4 max-w-md mx-auto">
          <h2
            className="text-lg sm:text-2xl text-center"
            style={{ fontFamily: PIXEL_FONT, color: levelDef.wallStroke, textShadow: `0 0 15px ${levelDef.wallStroke}` }}
          >
            {levelDef.label.toUpperCase()} COMPLETE!
          </h2>
          <div
            className="text-2xl sm:text-3xl"
            style={{ fontFamily: PIXEL_FONT, color: '#FFFF00' }}
          >
            {score.toString().padStart(6, '0')}
          </div>
          <p
            className="text-[10px] sm:text-xs text-center"
            style={{ fontFamily: PIXEL_FONT, color: '#FFFFFF' }}
          >
            {ghostsCaught} GHOSTS CAUGHT!
          </p>
          <button
            onClick={startRocketTransition}
            className="px-8 py-3 text-xs sm:text-sm tracking-wider transition-all hover:scale-105 active:scale-95"
            style={{
              fontFamily: PIXEL_FONT,
              color: '#00FFFF',
              border: '3px solid #00FFFF',
              backgroundColor: 'transparent',
              textShadow: '0 0 10px rgba(0,255,255,0.5)',
            }}
          >
            BLAST OFF! 🚀
          </button>
        </div>
      )}

      {/* ===== ROCKET TRANSITION ===== */}
      {gameState === 'rocketTransition' && (
        <div
          className="w-full h-[100dvh] flex flex-col items-center justify-center relative overflow-hidden"
          style={{
            background: `linear-gradient(to bottom, #000022, ${LEVELS[Math.min(currentLevel + 1, LEVELS.length - 1)].bgColor})`,
          }}
        >
          {/* Stars */}
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${2 + Math.random() * 3}px`,
                height: `${2 + Math.random() * 3}px`,
                backgroundColor: '#FFFFFF',
                left: `${Math.random() * 100}%`,
                top: `${(Math.random() * 120 + rocketProgress * 200) % 120 - 20}%`,
                opacity: 0.5 + Math.random() * 0.5,
              }}
            />
          ))}

          {/* Rocket */}
          <div
            className="transition-none"
            style={{
              transform: `translateY(${(1 - rocketProgress) * 60 - rocketProgress * 120}vh) rotate(-15deg)`,
            }}
          >
            <img
              src={ASSETS.rocket}
              alt="Rocket"
              className="w-32 h-32 sm:w-48 sm:h-48"
              style={{ imageRendering: 'auto' }}
            />
          </div>

          {/* Level text */}
          <div
            className="absolute bottom-8 text-center"
            style={{ fontFamily: PIXEL_FONT }}
          >
            <p className="text-[10px] sm:text-xs" style={{ color: '#FFFFFF' }}>
              HEADING TO
            </p>
            <p
              className="text-sm sm:text-lg mt-1"
              style={{
                color: LEVELS[Math.min(currentLevel + 1, LEVELS.length - 1)].wallStroke,
                textShadow: `0 0 15px ${LEVELS[Math.min(currentLevel + 1, LEVELS.length - 1)].wallStroke}`,
              }}
            >
              {LEVELS[Math.min(currentLevel + 1, LEVELS.length - 1)].label.toUpperCase()}
            </p>
          </div>
        </div>
      )}

      {/* ===== VICTORY SCREEN ===== */}
      {gameState === 'victory' && (
        <div className="flex flex-col items-center gap-3 sm:gap-5 p-4 max-w-md mx-auto relative">
          {/* Confetti canvas overlay */}
          <div className="fixed inset-0 pointer-events-none z-50">
            <GameCanvas
              mazeRef={mazeRef}
              pacmanRef={pacmanRef}
              pacmanDirRef={pacmanDirRef}
              ghostsRef={ghostsRef}
              mouthOpenRef={mouthOpenRef}
              particlesRef={particlesRef}
              scorePopupsRef={scorePopupsRef}
              confettiRef={confettiRef}
              onTap={() => {}}
              isPlaying={false}
              levelIndex={currentLevel}
            />
          </div>

          <img
            src={ASSETS.victory}
            alt="Champion!"
            className="w-full max-w-[260px] rounded-lg z-10"
            style={{ border: '3px solid #FFD700' }}
          />
          <h2
            className="text-xl sm:text-3xl text-center z-10"
            style={{
              fontFamily: PIXEL_FONT,
              color: '#FFD700',
              textShadow: '0 0 20px rgba(255,215,0,0.6)',
            }}
          >
            CHAMPION!
          </h2>
          <div className="text-center z-10">
            <p
              className="text-lg sm:text-2xl"
              style={{ fontFamily: PIXEL_FONT, color: '#FFFF00' }}
            >
              {score.toString().padStart(6, '0')}
            </p>
            <p
              className="text-[9px] sm:text-[10px] mt-2"
              style={{ fontFamily: PIXEL_FONT, color: '#FFFFFF' }}
            >
              ALL GHOSTS CAUGHT!
            </p>
          </div>
          <button
            onClick={startGame}
            className="px-8 py-3 text-xs sm:text-sm tracking-wider transition-all hover:scale-105 active:scale-95 z-10"
            style={{
              fontFamily: PIXEL_FONT,
              color: '#00FF00',
              border: '3px solid #00FF00',
              backgroundColor: 'rgba(0,0,0,0.8)',
              textShadow: '0 0 10px rgba(0,255,0,0.5)',
            }}
          >
            PLAY AGAIN
          </button>
          <button
            onClick={() => setGameState('menu')}
            className="text-[9px] sm:text-[10px] z-10 transition-colors"
            style={{ fontFamily: PIXEL_FONT, color: '#6666FF', textDecoration: 'underline' }}
          >
            BACK TO MENU
          </button>
        </div>
      )}
    </div>
  );
}
