# High-Level Design — Tic-Tac-Toe

> Companion to `docs/PRD.md`. The PRD says *what* and *why*; this document says *how*.
> Scope: a client-side, two-player (hot-seat) Tic-Tac-Toe game in React + TypeScript,
> with no backend, no persistence, and no network calls.

## 1. Design Goals

- **Separation of concerns** — rules, state, and presentation are independent layers.
- **Testability** — all game rules are pure functions; UI flows covered by RTL.
- **Data-driven rules** — adding markers or lines is a data edit, not a logic change.
- **Accessibility-first** — semantic HTML, keyboard operable, `aria-live` updates.
- **No premature infrastructure** — no router, no global store, no server; state lives in React.

## 2. System Context

```
┌──────────────────────────── Browser (single tab) ────────────────────────────┐
│                                                                               │
│   User A ─┐                                                                   │
│           ├──▶  React SPA  ──▶  DOM / screen reader                           │
│   User B ─┘     (Vite build, static assets only)                             │
│                                                                               │
│   No backend · No network · No storage · State is in-memory, lost on reload   │
└───────────────────────────────────────────────────────────────────────────────┘
```

Two humans share one device. The entire application is static files served to the
browser; there are no external systems, APIs, or databases.

## 3. Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Presentation Layer  (src/components/, src/App.tsx)          │
│  React components — render state, emit user intents.         │
│  Knows nothing about how rules are computed.                 │
└───────────────▲───────────────────────────────┬─────────────┘
                │ reads state / props            │ calls actions
                │                                ▼
┌─────────────────────────────────────────────────────────────┐
│  State Layer  (src/hooks/useGame.ts)                         │
│  Single owner of mutable state (board, currentPlayer,        │
│  scores). Guards illegal moves. Exposes UseGameResult.       │
└───────────────▲───────────────────────────────┬─────────────┘
                │ derives outcomes               │ calls
                │                                ▼
┌─────────────────────────────────────────────────────────────┐
│  Domain / Rules Layer  (src/game/)                           │
│  Pure functions + data: calculateWinner, isDraw,             │
│  getNextPlayer, createEmptyBoard; WINNING_LINES, PLAYERS;     │
│  types; playerSchema (zod) for setup validation.             │
│  No React, no mutable state.                                 │
└─────────────────────────────────────────────────────────────┘
```

Dependencies point **downward only**. Presentation depends on the State layer's
`UseGameResult` interface (DIP); the State layer depends on the pure Rules layer.
The Rules layer depends on nothing in the app.

## 4. Module Inventory

| Module | Path | Layer | Responsibility |
|---|---|---|---|
| `constants` | `src/game/constants.ts` | Domain | `BOARD_SIZE`, `PLAYERS`, `WINNING_LINES` — the data that drives the rules |
| `types` | `src/game/types.ts` | Domain | `Player`, `CellValue`, `BoardState`, `GameStatus`, `Players`, `Scores`, `WinResult` |
| `gameLogic` | `src/game/gameLogic.ts` | Domain | Pure rules: `createEmptyBoard`, `calculateWinner`, `isDraw`, `getNextPlayer` |
| `playerSchema` | `src/game/playerSchema.ts` | Domain | Zod schema + inferred `PlayerFormValues`; single validation source |
| `useGame` | `src/hooks/useGame.ts` | State | Owns board/turn/scores; `makeMove`, `newGame`, `resetScores` |
| `App` | `src/App.tsx` | Presentation | Setup ↔ play seam; holds session `players` |
| `PlayerSetup` | `src/components/PlayerSetup/` | Presentation | Validated name entry (react-hook-form + zod) |
| `Game` | `src/components/Game/` | Presentation | Composition root; wires `useGame` to children |
| `Board` / `Square` | `src/components/Board,Square/` | Presentation | Grid + memoized cell buttons |
| `StatusBar` | `src/components/StatusBar/` | Presentation | `aria-live` turn/win/draw message |
| `ScoreBoard` | `src/components/ScoreBoard/` | Presentation | Session tally + active-player highlight |
| `GameControls` | `src/components/GameControls/` | Presentation | New Game / Reset Scores / Change Players buttons |

## 5. Core Data Model

```ts
type Player     = 'X' | 'O';            // derived from PLAYERS
type CellValue  = Player | null;        // a cell is a mark or empty
type BoardState = CellValue[];          // flat array, index 0..8
type GameStatus = 'playing' | 'won' | 'draw';
type Players    = Record<Player, string>;          // marker → entered name
type Scores     = Record<Player, number> & { draws: number };
interface WinResult { winner: Player; line: number[]; }  // line = winning indices
```

Board indices map to the 3×3 grid as:

```
 0 | 1 | 2
---+---+---
 3 | 4 | 5
---+---+---
 6 | 7 | 8
```

### State ownership

- `useGame` stores exactly three pieces of state: `board`, `currentPlayer`, `scores`.
- `status`, `winner`, and `winningLine` are **derived** (`useMemo`) from the board, never
  stored separately — so they can never fall out of sync with the source of truth.
- `App` owns the only state outside the hook: `players | null`.

## 6. Key Flows

### 6.1 Player setup → start

```
User fills names ─▶ react-hook-form validates against playerSchema (onTouched)
   - each name trimmed, ≥ 2 chars
   - names must differ (case-insensitive)
Start enabled only when isValid ─▶ onStart(players) ─▶ App sets players ─▶ Game mounts
```

### 6.2 Making a move

```
Square.onClick ─▶ Board.onCellClick(index) ─▶ useGame.makeMove(index)
   guard: index in range? cell empty? game not already won?  → else no-op
   place mark on board copy
   recompute outcome on the new board:
     winner?  → scores[winner]++          status derives to 'won'
     draw?    → scores.draws++            status derives to 'draw'
     else     → currentPlayer = next      status stays 'playing'
DOM re-renders: StatusBar announces, Board highlights winning line, cells disable on over
```

`makeMove` updates state functionally inside `setBoard`, so the guard always reads the
latest board (no stale-closure double-move).

### 6.3 Controls

| Action | Effect | Scores | Players |
|---|---|---|---|
| New Game | clear board, X to move | kept | kept |
| Reset Scores | zero the tally | reset | kept |
| Change Players | `App` sets `players = null` → back to setup | (new `useGame` on remount) | re-entered |

> Note: returning to setup remounts `Game`, so `useGame` re-initializes and scores reset
> on a player change. That matches "Change Players starts a fresh pairing."

## 7. Technology Choices

| Concern | Choice | Rationale |
|---|---|---|
| Framework | React 18 + TypeScript | Component model + type safety |
| Build | Vite | Fast dev server, static output |
| Forms | react-hook-form + `@hookform/resolvers/zod` | Declarative validation, minimal re-renders |
| Validation | Zod | One schema is both runtime check and inferred type |
| Styling | CSS Modules | Scoped styles per component, no global leakage |
| Testing | Vitest + React Testing Library | Pure-logic unit tests + user-centric UI tests |

## 8. Accessibility Design

- Board is `role="grid"`; each cell is a `<button>` with `aria-label` ("Cell 5, X" / "empty").
- `StatusBar` uses `role="status"` + `aria-live="polite"` so turn/result changes are announced.
- Setup inputs use `<label htmlFor>`, `aria-invalid`, and `aria-describedby` linking to inline
  `role="alert"` errors.
- Cells disable when filled or when the game is over, preventing illegal interaction.

## 9. Non-Functional Design Notes

- **Performance:** `Square` is `memo`-ized; only changed cells re-render. State is tiny;
  no virtualization or memo of the board needed.
- **Responsiveness:** fluid, centered layout via CSS Modules; usable on mobile and desktop.
- **Reliability:** all illegal moves are guarded in one place (`makeMove`); derived state
  removes a whole class of sync bugs.
- **Persistence:** explicitly none — state is in-memory and resets on reload (per PRD non-goals).

## 10. Extensibility (Open/Closed in practice)

- **Bigger board / more lines:** edit `BOARD_SIZE` + `WINNING_LINES`; logic is unchanged.
- **More players:** extend `PLAYERS`; `getNextPlayer` wraps the array automatically.
- **AI opponent (future):** introduce a strategy module that produces a move index and feed
  it through the same `makeMove` — the rules and presentation layers stay untouched.
- **Persistence (future):** wrap `useGame` state in a storage adapter; no component changes.

## 11. Out of Scope

AI opponent, backend, cross-device/online play, accounts/auth beyond name entry,
persistence across reloads. See PRD §2 Non-Goals.
