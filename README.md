# Ghost Catcher 2026

A browser-based game inspired by classic Pac-Man, but with reversed mechanics: **you chase the ghosts and they run away from you!**

Built as a fun father-and-son project. Works on desktop (keyboard/mouse), iPad, and phone (touch/swipe).

## How to Play

- **Arrow keys / WASD** to move on desktop
- **Tap the maze** to move towards where you tap
- **Swipe** in any direction on touch devices
- **D-pad** appears automatically on mobile/tablet

Chase and catch all the ghosts to complete each level. There are 4 levels with increasing ghost speed.

## Running Locally

1. Install [Node.js](https://nodejs.org/) (LTS version) and [pnpm](https://pnpm.io/):
   ```bash
   npm install -g pnpm
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the dev server:
   ```bash
   pnpm run dev
   ```

4. Open `http://localhost:3000` in your browser.

## Tweaking the Game

Edit `client/src/lib/gameConstants.ts` to change:

- **Ghost speed per level** (how fast they run away)
- **Number of ghosts to catch** per level
- **Ghost spawn rate** (how often new ghosts appear)
- **Overall game speed**
- **Maze layout** (design your own maze!)

The file is heavily commented with suggested values.

## Building for Deployment

```bash
pnpm run build
```

The built files will be in `dist/public/`. Upload these to GitHub Pages or any static hosting service.

## Tech Stack

- React 19 + TypeScript
- HTML5 Canvas for game rendering
- Web Audio API for sound effects
- Tailwind CSS 4
- Vite

## Licence

MIT
