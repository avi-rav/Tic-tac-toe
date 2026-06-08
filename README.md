# Tic-Tac-Toe

A client-side, two-player (hot-seat) Tic-Tac-Toe game built with **React + TypeScript + Vite**.
Two players enter their names, then take turns on the same browser until one wins or the board draws.

## Quick start

```bash
npm install
npm run dev      # start the dev server
npm run test     # run the test suite (Vitest + React Testing Library)
npm run build    # type-check + production build
```

## Features

- Validated player name entry (the "login") before play begins.
- Hot-seat two-player game with X moving first and alternating turns.
- Win detection for all rows, columns, and diagonals, with the winning line highlighted.
- Draw detection.
- Session scoreboard (wins per player + draws), **New Game**, **Reset Scores**, **Change Players**.
- Accessible and responsive.

## Architecture

The app is split into three layers so that responsibilities are clear and the rules
are testable in isolation:

```
src/
  game/        # Layer 1 — PURE rules & types (no React)
    types.ts         constants.ts      gameLogic.ts      playerSchema.ts
  hooks/       # Layer 2 — STATE (the only owner of mutable game state)
    useGame.ts
  components/  # Layer 3 — PRESENTATION (dumb, focused components)
    PlayerSetup/  Board/  Square/  StatusBar/  ScoreBoard/  GameControls/  Game/
  App.tsx      # seam: swaps PlayerSetup <-> Game
```

- **`game/gameLogic.ts`** — `calculateWinner`, `isDraw`, `getNextPlayer`, `createEmptyBoard`. Pure functions; the only place the *rules* live.
- **`hooks/useGame.ts`** — holds board/turn/score state and guards illegal moves. The only place *mutable state* lives. Win/draw status is **derived** from the board, never stored, so it can't fall out of sync.
- **components** — render state and emit intents; they never compute rules themselves.

## SOLID — how each principle shows up here

- **Single Responsibility** — rules (`gameLogic.ts`), state (`useGame.ts`), and rendering (components) are separate. `PlayerSetup` only *collects valid names*; it doesn't decide what happens next. Validation lives in one schema (`playerSchema.ts`).
- **Open/Closed** — win detection is driven by the `WINNING_LINES` data table and players by the `PLAYERS` array (`game/constants.ts`). The board size or win lines can change by editing data, not branching logic.
- **Liskov Substitution** — every `Square` is interchangeable and rendered uniformly from the board array; none has special-case behavior.
- **Interface Segregation** — each component takes only the props it needs. A `Square` receives `value`, `onClick`, `isWinning`, `disabled` — not the whole game state.
- **Dependency Inversion** — components depend on the `useGame` hook's interface, not on `gameLogic` directly. UI talks to an abstraction; the rules can be swapped without touching components.

## UI best practices

- Semantic HTML; cells are real `<button>`s, keyboard-operable, with per-cell `aria-label`.
- Status uses `role="status"` + `aria-live="polite"` so changes are announced.
- Form uses `<label htmlFor>`, `aria-invalid`, and `aria-describedby` linking each field to its error; errors appear on blur and submit is disabled until valid.
- Theme tokens (colors/spacing/shape) as CSS custom properties in `index.css`; styles scoped via CSS Modules.
- Responsive, centered, mobile-friendly layout.

## Testing

Two layers:

**Unit + integration** (Vitest + React Testing Library, jsdom) — `npm run test`:
- `gameLogic.test.ts` — pure rule unit tests.
- `PlayerSetup.test.tsx` — form validation and submit.
- `Game.test.tsx` — integration UI flow: setup → play → win → reset.

**End-to-end** (Playwright, real Chromium) — `npm run e2e`:
- `e2e/game.e2e.ts` — 6 core flows in a real browser, including the winning-line
  highlight (a real-CSS assertion jsdom can't make). Playwright auto-builds the app
  and serves it via `vite preview`, so no manual server start is needed.
  (First run only: `npx playwright install chromium`.)

The complete set of UI test scenarios (unit, e2e, and manual) is documented in
[`TEST_CASES.md`](./TEST_CASES.md). Product requirements are in [`docs/PRD.md`](./docs/PRD.md).

## Tech

React 19, TypeScript, Vite, React Hook Form + Zod (form validation), Vitest + React Testing Library.
