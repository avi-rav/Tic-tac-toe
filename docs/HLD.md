# High-Level Design — Tic-Tac-Toe

> Companion to `docs/PRD.md`. The PRD says *what* and *why*; this document says *how*.
> Scope: a client-side, two-player (hot-seat) Tic-Tac-Toe game in React + TypeScript,
> with no backend and no network calls. The only persistence is local game history
> in the browser's `localStorage`.

## 1. Design Goals

- **Separation of concerns** — rules, state, and presentation are independent layers.
- **Testability** — all game rules are pure functions; UI flows covered by RTL.
- **Data-driven rules** — adding markers or lines is a data edit, not a logic change.
- **Accessibility-first** — semantic HTML, keyboard operable, `aria-live` updates.
- **No premature infrastructure** — no router, no global store, no server; state lives in React, with game history persisted to `localStorage` behind a single isolated module.

## 2. System Context

```
┌──────────────────────────── Browser (single tab) ────────────────────────────┐
│                                                                               │
│   User A ─┐                                                                   │
│           ├──▶  React SPA  ──▶  DOM / screen reader                           │
│   User B ─┘     (Vite build, static assets only)                             │
│                                          │                                    │
│                                          ▼                                    │
│   No backend · No network        localStorage  ('ttt:history')                │
│   Game state in-memory · Finished-game history persisted locally              │
└───────────────────────────────────────────────────────────────────────────────┘
```

Two humans share one device. The entire application is static files served to the
browser; there are no external systems, APIs, or databases. The browser's
`localStorage` is the one persistence mechanism, used only to retain finished-game
history across reloads.

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
│  State Layer  (src/hooks/useGame.ts, src/hooks/useHistory.ts)│
│  useGame: single owner of mutable game state (board,         │
│  currentPlayer, scores); guards illegal moves.               │
│  useHistory: owns the in-memory history list; delegates       │
│  persistence to the historyStorage module.                   │
└───────────────▲───────────────────────────────┬─────────────┘
                │ derives outcomes               │ calls
                │                                ▼
┌─────────────────────────────────────────────────────────────┐
│  Domain / Rules + Data Layer  (src/game/, src/history/)      │
│  Pure functions + data: calculateWinner, isDraw,             │
│  getNextPlayer, createEmptyBoard; WINNING_LINES, PLAYERS;     │
│  types; playerSchema (zod). history: GameRecord type +        │
│  historyStorage (the only localStorage access, fail-safe).    │
│  No React, no mutable component state.                       │
└─────────────────────────────────────────────────────────────┘
```

Dependencies point **downward only**. Presentation depends on the State layer's
`UseGameResult` / `UseHistoryResult` interfaces (DIP); the State layer depends on the
pure Rules + Data layer. `historyStorage` is the sole boundary to the `localStorage`
side effect — the rest of the app never touches `window.localStorage`.

## 4. Module Inventory

| Module | Path | Layer | Responsibility |
|---|---|---|---|
| `constants` | `src/game/constants.ts` | Domain | `BOARD_SIZE`, `PLAYERS`, `WINNING_LINES` — the data that drives the rules |
| `types` | `src/game/types.ts` | Domain | `Player`, `CellValue`, `BoardState`, `GameStatus`, `Players`, `Scores`, `WinResult` |
| `gameLogic` | `src/game/gameLogic.ts` | Domain | Pure rules: `createEmptyBoard`, `calculateWinner`, `isDraw`, `getNextPlayer` |
| `playerSchema` | `src/game/playerSchema.ts` | Domain | Zod schema + inferred `PlayerFormValues`; single validation source |
| `history/types` | `src/history/types.ts` | Domain | `GameRecord`, `GameResult`; `createRecordId()` |
| `historyStorage` | `src/history/historyStorage.ts` | Domain | The only `localStorage` access: `loadHistory`, `saveRecord`, `clearHistory` (fail-safe, capped at `MAX_HISTORY`) |
| `useGame` | `src/hooks/useGame.ts` | State | Owns board/turn/scores; `makeMove`, `newGame`, `resetScores` |
| `useHistory` | `src/hooks/useHistory.ts` | State | Owns the in-memory history list; `addRecord`, `clear`; seeds from storage |
| `App` | `src/App.tsx` | Presentation | Setup ↔ play ↔ history seam; holds session `players` + `view`; owns history |
| `HistoryPage` / `HistoryEntry` | `src/components/HistoryPage,HistoryEntry/` | Presentation | History list + per-record mini-board (reuses `Board`) |
| `PlayerSetup` | `src/components/PlayerSetup/` | Presentation | Validated name entry (react-hook-form + zod) |
| `Game` | `src/components/Game/` | Presentation | Composition root; wires `useGame` to children |
| `Board` / `Square` | `src/components/Board,Square/` | Presentation | Grid + memoized cell buttons |
| `StatusBar` | `src/components/StatusBar/` | Presentation | `aria-live` turn/win/draw message |
| `ScoreBoard` | `src/components/ScoreBoard/` | Presentation | Session tally + active-player highlight |
| `GameControls` | `src/components/GameControls/` | Presentation | New Game / Reset Scores / Change Players / History buttons |

## 5. Core Data Model

```ts
type Player     = 'X' | 'O';            // derived from PLAYERS
type CellValue  = Player | null;        // a cell is a mark or empty
type BoardState = CellValue[];          // flat array, index 0..8
type GameStatus = 'playing' | 'won' | 'draw';
type Players    = Record<Player, string>;          // marker → entered name
type Scores     = Record<Player, number> & { draws: number };
interface WinResult { winner: Player; line: number[]; }  // line = winning indices

type GameResult = Player | 'draw';
interface GameRecord {                  // an immutable snapshot of a finished game
  id: string;                           // stable list key (crypto.randomUUID)
  players: Players;                     // names at play time
  board: BoardState;                    // final board → reconstructs the "screenshot"
  winningLine: number[] | null;         // highlighted line, or null for a draw
  result: GameResult;
}
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
- `App` owns the state outside `useGame`: `players | null`, the current `view`, and the
  history list (via `useHistory`, seeded once from `localStorage`).

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
| New Game | clear board, X to move (resets the record guard) | kept | kept |
| Reset Scores | zero the tally | reset | kept |
| Change Players | `App` sets `players = null` → back to setup | (new `useGame` on remount) | re-entered |
| History | `App` sets `view = 'history'` → HistoryPage | kept | kept |

> Note: returning to setup remounts `Game`, so `useGame` re-initializes and scores reset
> on a player change. That matches "Change Players starts a fresh pairing."

### 6.4 Recording a finished game

```
status transitions 'playing' → 'won' | 'draw'   (derived in useGame)
   Game's useEffect fires; a recordedRef guards against:
     - StrictMode's double-invoked effects
     - re-renders while the game stays in a terminal state
   → builds a GameRecord (id, players, final board, winningLine, result)
   → onGameEnd(record)  ──▶  App: useHistory.addRecord
                              ──▶  historyStorage.saveRecord (newest-first, capped)
   newGame() clears the board → status back to 'playing' → ref resets → next game records again
```

This mirrors the turn-alternation fix: side effects that must run *once* per transition
are guarded explicitly, because StrictMode intentionally double-invokes effects in dev.

### 6.5 Viewing history

```
History button ─▶ App view='history' ─▶ HistoryPage(history, onBack, onClear)
   each GameRecord ─▶ HistoryEntry ─▶ reuses <Board disabled winningLine=…>
                                      as a small read-only final-state "screenshot"
Back ─▶ view='game'   ·   Clear ─▶ useHistory.clear() → historyStorage.clearHistory()
```

## 7. Technology Choices

| Concern | Choice | Rationale |
|---|---|---|
| Framework | React 19 + TypeScript | Component model + type safety |
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
- **Persistence:** only finished-game **history** is persisted, via `localStorage` behind the
  `historyStorage` module. All access is wrapped in `try/catch`, so corrupt JSON, a disabled
  store, or an exceeded quota degrades to an empty list rather than crashing. Active game
  state (board/turn/scores) is still in-memory and resets on reload.

## 10. Extensibility (Open/Closed in practice)

- **Bigger board / more lines:** edit `BOARD_SIZE` + `WINNING_LINES`; logic is unchanged.
- **More players:** extend `PLAYERS`; `getNextPlayer` wraps the array automatically.
- **AI opponent (future):** introduce a strategy module that produces a move index and feed
  it through the same `makeMove` — the rules and presentation layers stay untouched.
- **Persistence:** game history is already persisted behind the `historyStorage` adapter;
  the same seam could persist active game state with no component changes.
- **History "screenshot":** stored as the 9-cell `board`, not a pixel image, and rendered by
  reusing `Board`. Swapping to a real image capture would be isolated to `HistoryEntry`.

## 11. Out of Scope

AI opponent, backend, cross-device/online play, accounts/auth beyond name entry.
(Local history persistence *is* in scope; cross-device sync is not.) See PRD §2 Non-Goals.
