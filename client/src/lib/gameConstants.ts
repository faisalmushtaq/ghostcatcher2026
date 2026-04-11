/*
 * ============================================================
 *  Ghost Catcher 2026 - GAME SETTINGS
 * ============================================================
 *
 *  This is the ONLY file you need to edit to change how the
 *  game plays. Everything is clearly labelled below.
 *
 *  HOW TO TWEAK:
 *  1. Open this file in any text editor (VS Code, TextEdit, etc.)
 *  2. Change the numbers you want (see comments next to each one)
 *  3. Save the file
 *  4. The game will reload automatically if the dev server is running,
 *     or rebuild with: pnpm run build
 *
 * ============================================================
 */


// ============================================================
//  LEVEL SETTINGS  (this is the main thing to tweak!)
// ============================================================
//
//  ghostCount:         How many ghosts you must catch to finish the level
//  ghostSpeed:         How fast the ghosts move (0.1 = very slow, 1.0 = same speed as you)
//                        - Try 0.2 for a very easy game
//                        - Try 0.4 for a gentle challenge
//                        - Try 0.7 for quite hard
//                        - Try 1.0 for maximum difficulty
//  ghostSpawnInterval: How many game ticks between new ghosts appearing
//                        - Lower number = ghosts appear more often
//                        - Higher number = more time between spawns
//  bgColor:            Background colour of the maze (use hex colour codes)
//  wallColor:          Colour of the maze walls
//  wallStroke:         Highlight colour on the walls
//  label:              The name shown on screen for this level
//

export interface LevelDef {
  level: number;
  ghostCount: number;
  ghostSpeed: number;
  ghostSpawnInterval: number;
  bgColor: string;
  wallColor: string;
  wallStroke: string;
  label: string;
}

export const LEVELS: LevelDef[] = [
  // ---- LEVEL 1: Nice and easy ----
  {
    level: 1,
    ghostCount: 1,            // catch 1 ghost to just get used to the game
    ghostSpeed: 0.2,          // ghosts move at 20% of your speed (very catchable)
    ghostSpawnInterval: 80,   // new ghost every 80 ticks (relaxed)
    bgColor: '#000000',       // black background
    wallColor: '#2121DE',     // blue walls
    wallStroke: '#3333FF',    // light blue highlights
    label: 'Level 1',
  },

  // ---- LEVEL 2: A bit faster ----
  {
    level: 2,
    ghostCount: 3,           // catch 3 ghosts
    ghostSpeed: 0.42,         // ghosts move at 42% of your speed
    ghostSpawnInterval: 65,   // new ghost every 65 ticks
    bgColor: '#0A0A1A',      // very dark blue background
    wallColor: '#21DE21',     // green walls
    wallStroke: '#33FF33',    // light green highlights
    label: 'Level 2',
  },

  // ---- LEVEL 3: Getting tricky ----
  {
    level: 3,
    ghostCount: 5,           // catch 5 ghosts
    ghostSpeed: 0.55,         // ghosts move at 55% of your speed
    ghostSpawnInterval: 50,   // new ghost every 50 ticks
    bgColor: '#1A0A0A',      // very dark red background
    wallColor: '#DE2121',     // red walls
    wallStroke: '#FF3333',    // light red highlights
    label: 'Level 3',
  },

  // ---- LEVEL 4 (FINAL): Fast ghosts! ----
  {
    level: 4,
    ghostCount: 10,            // catch 10 ghosts
    ghostSpeed: 0.7,          // ghosts move at 70% of your speed (challenging!)
    ghostSpawnInterval: 40,   // new ghost every 40 ticks
    bgColor: '#1A0A1A',      // very dark purple background
    wallColor: '#DE21DE',     // magenta walls
    wallStroke: '#FF33FF',    // light magenta highlights
    label: 'Final Level',
  },
];


// ============================================================
//  GAME SPEED  (how fast everything runs)
// ============================================================
//  This controls the overall game speed in milliseconds.
//  Lower = faster game, Higher = slower game.
//  Default is 150. Try 200 for a slower, easier game.
//  Try 120 for a faster, harder game.

export const GAME_TICK_MS = 150;


// ============================================================
//  POINTS
// ============================================================
//  How many points you get for catching each ghost.

export const POINTS_PER_GHOST = 200;


// ============================================================
//  MAZE LAYOUT  (advanced - edit if you want a different maze!)
// ============================================================
//  0 = wall (solid block, cannot walk through)
//  1 = path (walkable corridor)
//  2 = empty (walkable, used for the ghost spawn area in the centre)
//
//  The maze is 21 columns wide and 22 rows tall.
//  Row 10 has tunnels on the left and right edges (the 1s at positions 0 and 20).
//  The centre area (rows 9-11, cols 8-12) is the ghost spawn zone.

export const CELL = {
  WALL: 0,
  PATH: 1,
  EMPTY: 2,
} as const;

export const MAZE_LAYOUT: number[][] = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,1,0,0,0,0,1,0,1,0,0,0,0,1,0,0,1,0],
  [0,1,0,0,1,0,0,0,0,1,0,1,0,0,0,0,1,0,0,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,1,0,1,0,0,0,0,0,0,0,1,0,1,0,0,1,0],
  [0,1,1,1,1,0,1,1,1,0,0,0,1,1,1,0,1,1,1,1,0],
  [0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0],
  [0,0,0,0,1,0,1,1,1,1,1,1,1,1,1,0,1,0,0,0,0],
  [0,0,0,0,1,0,1,0,0,2,2,2,0,0,1,0,1,0,0,0,0],
  [1,1,1,1,1,1,1,0,2,2,2,2,2,0,1,1,1,1,1,1,1],
  [0,0,0,0,1,0,1,0,0,0,0,0,0,0,1,0,1,0,0,0,0],
  [0,0,0,0,1,0,1,1,1,1,1,1,1,1,1,0,1,0,0,0,0],
  [0,0,0,0,1,0,1,0,0,0,0,0,0,0,1,0,1,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,0,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,0,1,0,0,0,0,1,0,1,0,0,0,0,1,0,0,1,0],
  [0,1,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,1,0],
  [0,0,1,0,1,0,1,0,0,0,0,0,0,0,1,0,1,0,1,0,0],
  [0,1,1,1,1,0,1,1,1,0,0,0,1,1,1,0,1,1,1,1,0],
  [0,1,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

export const MAZE_ROWS = MAZE_LAYOUT.length;
export const MAZE_COLS = MAZE_LAYOUT[0].length;


// ============================================================
//  PAC-MAN START POSITION
// ============================================================
//  Where Pac-Man begins each level (row, column).
//  Default is row 16, column 10 (bottom centre of the maze).

export const PACMAN_START = { row: 16, col: 10 };


// ============================================================
//  DIRECTIONS  (do not change these)
// ============================================================

export const DIRECTIONS = {
  UP:    { row: -1, col: 0 },
  DOWN:  { row: 1,  col: 0 },
  LEFT:  { row: 0,  col: -1 },
  RIGHT: { row: 0,  col: 1 },
  NONE:  { row: 0,  col: 0 },
} as const;

export type Direction = { row: number; col: number };


// ============================================================
//  GHOST SETTINGS
// ============================================================

// Ghost colours (classic Pac-Man: red, pink, cyan, orange)
export const GHOST_COLORS = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852'];
export const GHOST_NAMES = ['Blinky', 'Pinky', 'Inky', 'Clyde'];

// Where ghosts appear (centre of the maze)
export const GHOST_SPAWN_POSITIONS = [
  { row: 9, col: 9 },
  { row: 9, col: 10 },
  { row: 9, col: 11 },
  { row: 10, col: 10 },
  { row: 10, col: 9 },
  { row: 10, col: 11 },
];


// ============================================================
//  VISUAL SETTINGS  (colours, fonts, images)
// ============================================================

export const PIXEL_FONT = "'Press Start 2P', monospace";

export const COLORS = {
  pacman: '#FFFF00',
  pacmanStroke: '#E6B800',
  pacmanEye: '#000000',
  dotColor: '#FFB8AE',
  text: '#FFFFFF',
  textHighlight: '#FFFF00',
  ghostScared: '#2121DE',
  ghostScaredFlash: '#FFFFFF',
  ghostEyes: '#FFFFFF',
  ghostPupil: '#0000FF',
};

// Game artwork (hosted on CDN - these will work from any device)
export const ASSETS = {
  logo: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663399341951/ez4QLEjQZVxTi27M9HHhtc/gc-logo-Jv8KErrvVSJwhHXx5KS3fn.webp',
  splash: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663399341951/ez4QLEjQZVxTi27M9HHhtc/gc-splash-v2-dU2oSBiKbmTf7uSksPALDv.webp',
  rocket: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663399341951/ez4QLEjQZVxTi27M9HHhtc/gc-rocket-9hPnFtU6dHwy69LMKThUCg.webp',
  victory: 'https://d2xsxph8kpxj0f.cloudfront.net/310519663399341951/ez4QLEjQZVxTi27M9HHhtc/gc-victory-FbEAa3kZ7rnsw4aTiK48uq.webp',
};
