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
  const [menuMode, setMenuMode] = useState<'home' | 'levelSelect'>('home');

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
        <div className="flex flex-col items-center justify-center w-full min-h-[100dvh] p-4 sm:p-6">

          {/* Title */}
          <h1
            className="text-center mb-3 leading-tight"
            style={{
              fontFamily: PIXEL_FONT,
              color: '#FFFF00',
              fontSize: 'clamp(16px, 4.5vw, 32px)',
              textShadow: '0 0 20px rgba(255,255,0,0.7), 3px 3px 0px #B8860B',
              letterSpacing: '0.05em',
            }}
          >
            GHOST CATCHER<br />
            <span style={{ color: '#00FFFF', textShadow: '0 0 20px rgba(0,255,255,0.7), 3px 3px 0px #006666' }}>2026</span>
          </h1>

          {/* Splash image */}
          <img
            src={ASSETS.splash}
            alt="Ghost Catcher 2026"
            className="w-full mb-4"
            style={{
              maxWidth: 'min(400px, 88vw)',
              imageRendering: 'pixelated',
              border: '4px solid #2121DE',
              boxShadow: '0 0 30px rgba(33,33,222,0.6)',
            }}
          />

          {/* ---- HOME: two mode buttons ---- */}
          {menuMode === 'home' && (
            <div className="flex flex-col items-center gap-3 w-full" style={{ maxWidth: 'min(360px, 88vw)' }}>
              {/* ARCADE */}
              <button
                onClick={() => { setMenuMode('home'); startGame(0); }}
                className="w-full py-3 sm:py-4 tracking-wider transition-all duration-150 hover:scale-105 active:scale-95"
                style={{
                  fontFamily: PIXEL_FONT,
                  fontSize: 'clamp(11px, 3vw, 15px)',
                  color: '#000000',
                  backgroundColor: '#FFFF00',
                  border: '3px solid #FFFF00',
                  cursor: 'pointer',
                }}
              >
                ARCADE
              </button>
              <p
                className="text-center"
                style={{ fontFamily: PIXEL_FONT, color: '#888888', fontSize: 'clamp(6px, 1.5vw, 8px)', marginTop: '-4px' }}
              >
                ALL 4 LEVELS IN ORDER
              </p>

              {/* LEVEL SELECT */}
              <button
                onClick={() => setMenuMode('levelSelect')}
                className="w-full py-3 sm:py-4 tracking-wider transition-all duration-150 hover:scale-105 active:scale-95"
                style={{
                  fontFamily: PIXEL_FONT,
                  fontSize: 'clamp(11px, 3vw, 15px)',
                  color: '#00FFFF',
                  backgroundColor: 'transparent',
                  border: '3px solid #00FFFF',
                  cursor: 'pointer',
                }}
              >
                LEVEL SELECT
              </button>
              <p
                className="text-center"
                style={{ fontFamily: PIXEL_FONT, color: '#888888', fontSize: 'clamp(6px, 1.5vw, 8px)', marginTop: '-4px' }}
              >
                JUMP TO ANY LEVEL
              </p>

              {/* Controls hint */}
              <p
                className="mt-2 text-center"
                style={{
                  fontFamily: PIXEL_FONT,
                  color: '#6666FF',
                  fontSize: 'clamp(6px, 1.6vw, 9px)',
                  maxWidth: '300px',
                  lineHeight: '1.8',
                }}
              >
                {isTouchDevice ? 'TAP MAZE OR D-PAD TO MOVE' : 'ARROW KEYS OR WASD TO MOVE'}
              </p>
            </div>
          )}

          {/* ---- LEVEL SELECT: 4 level buttons ---- */}
          {menuMode === 'levelSelect' && (
            <div className="flex flex-col items-center gap-3 w-full" style={{ maxWidth: 'min(360px, 88vw)' }}>
              {LEVELS.map((lvl, idx) => (
                <button
                  key={idx}
                  onClick={() => { setMenuMode('home'); startGame(idx); }}
                  className="w-full py-3 tracking-wider transition-all duration-150 hover:scale-105 active:scale-95"
                  style={{
                    fontFamily: PIXEL_FONT,
                    fontSize: 'clamp(10px, 2.5vw, 13px)',
                    color: lvl.wallStroke,
                    backgroundColor: 'transparent',
                    border: `3px solid ${lvl.wallColor}`,
                    textShadow: `0 0 8px ${lvl.wallStroke}`,
                    cursor: 'pointer',
                  }}
                >
                  LV{lvl.level}: {lvl.label.toUpperCase()}
                </button>
              ))}
              <button
                onClick={() => setMenuMode('home')}
                style={{
                  fontFamily: PIXEL_FONT,
                  color: '#666666',
                  background: 'none',
                  border: 'none',
                  fontSize: 'clamp(7px, 1.8vw, 9px)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  marginTop: '4px',
                }}
              >
                BACK
              </button>
            </div>
          )}
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
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}>
          {/* Confetti canvas - full screen behind popup */}
          <div className="fixed inset-0 pointer-events-none z-40">
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

          {/* Popup box */}
          <div
            className="relative z-50 flex flex-col items-center gap-4 sm:gap-6 p-6 sm:p-10 mx-4"
            style={{
              backgroundColor: '#000000',
              border: '4px solid #FFD700',
              boxShadow: '0 0 60px rgba(255,215,0,0.5), inset 0 0 30px rgba(255,215,0,0.05)',
              maxWidth: '420px',
              width: '100%',
            }}
          >
            {/* Trophy emoji row */}
            <div style={{ fontSize: 'clamp(32px, 10vw, 56px)' }}>🏆</div>

            {/* Main message */}
            <h2
              className="text-center leading-snug animate-pulse"
              style={{
                fontFamily: PIXEL_FONT,
                color: '#FFD700',
                fontSize: 'clamp(14px, 4vw, 24px)',
                textShadow: '0 0 20px rgba(255,215,0,0.8), 3px 3px 0px #8B6914',
              }}
            >
              YOU CAUGHT<br />ALL THE GHOSTS!
            </h2>

            {/* Score */}
            <div className="text-center">
              <p
                style={{
                  fontFamily: PIXEL_FONT,
                  color: '#FFFFFF',
                  fontSize: 'clamp(8px, 2vw, 11px)',
                  marginBottom: '6px',
                }}
              >
                FINAL SCORE
              </p>
              <p
                style={{
                  fontFamily: PIXEL_FONT,
                  color: '#FFFF00',
                  fontSize: 'clamp(20px, 6vw, 36px)',
                  textShadow: '0 0 15px rgba(255,255,0,0.6)',
                }}
              >
                {score.toString().padStart(6, '0')}
              </p>
            </div>

            {/* Divider */}
            <div style={{ width: '100%', height: '2px', backgroundColor: '#FFD700', opacity: 0.4 }} />

            {/* Play Again button */}
            <button
              onClick={() => startGame(0)}
              className="w-full py-3 sm:py-4 tracking-wider transition-all duration-200 hover:scale-105 active:scale-95"
              style={{
                fontFamily: PIXEL_FONT,
                color: '#000000',
                backgroundColor: '#FFD700',
                border: 'none',
                fontSize: 'clamp(10px, 3vw, 14px)',
                textShadow: 'none',
                cursor: 'pointer',
              }}
            >
              PLAY AGAIN
            </button>

            {/* Back to menu */}
            <button
              onClick={() => setGameState('menu')}
              style={{
                fontFamily: PIXEL_FONT,
                color: '#6666FF',
                background: 'none',
                border: 'none',
                fontSize: 'clamp(7px, 2vw, 10px)',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              BACK TO MENU
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
