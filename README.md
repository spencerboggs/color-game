# Color Game

A fast-paced React game where you find the one tile with a different color before time runs out.

[Play now :D](https://spencerboggs.github.io/color-game/)

## Features

- Five-second timer for each level
- Increasing grid size and color similarity
- Moving and sliding tiles at higher levels
- One-second penalty for incorrect selections
- High score saved in the browser's local storage

## Getting started

Requirements:

- Node.js
- npm

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open the local URL shown by Vite in your browser.


## How to play

1. Select **Play** from the main menu.
2. Click the tile that is a slightly different color.
3. Correct selections advance to the next level.
4. Incorrect selections reduce the remaining time.
5. If the timer reaches zero, the game ends and the odd tile is revealed.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and create a production build |
| `npm run preview` | Preview the production build locally |

## Tech stack

- React
- TypeScript
- Vite
