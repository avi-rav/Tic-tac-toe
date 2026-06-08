# Product Requirements Document — Tic-Tac-Toe

## 1. Overview

A browser-based, client-side **Tic-Tac-Toe (X/O)** game for **two human players on the same browser** (hot-seat). Players enter their names, then take turns placing marks on a 3×3 grid until one wins or the board is full (draw). Built with **React + TypeScript**, emphasizing UI best practices, clean code, and SOLID principles.

## 2. Goals & Non-Goals

### Goals
- Two players play against each other in the same browser session.
- The game correctly identifies **win** and **draw** states.
- Players identify themselves via a validated name-entry form before playing.
- Clean, SOLID, testable architecture; accessible, responsive UI.

### Non-Goals
- No AI/computer opponent.
- No backend, persistence across reloads, or online/multi-device play.
- No authentication beyond entering display names (the "login" is name entry only).

## 3. Users & Use Cases

- **Two people sharing one device** who want a quick game. They enter names, alternate turns, see who won, and can play again while a running scoreboard tracks wins and draws for the session.

## 4. Functional Requirements

### 4.1 Player Setup ("login")
- FR-1: Before the board appears, show a form collecting **Player X** and **Player O** names.
- FR-2: Each name is **required**, **trimmed**, and **at least 2 characters**.
- FR-3: The two names must be **different** (case-insensitive).
- FR-4: Validation errors display inline per field; the **Start** button is disabled until the form is valid.
- FR-5: On valid submit, the game board is shown with the entered names.

### 4.2 Gameplay
- FR-6: Player **X always moves first**; turns then alternate.
- FR-7: Clicking an empty cell places the current player's mark and passes the turn.
- FR-8: Clicking an **occupied** cell, or any cell after the game has ended, is a **no-op**.
- FR-9: A **status indicator** shows whose turn it is (by name and marker).

### 4.3 End States
- FR-10: When a player completes any row, column, or diagonal, the game ends and declares that player (by name) the **winner**.
- FR-11: The **winning line is visually highlighted**.
- FR-12: When the board fills with no winner, the game ends in a **draw**.
- FR-13: After an end state, the board is **disabled** to further moves.

### 4.4 Scores & Controls
- FR-14: A **scoreboard** tracks wins per player and total draws for the session.
- FR-15: **New Game** clears the board (keeps scores).
- FR-16: **Reset Scores** zeroes the tally.
- FR-17: **Change Players** returns to the setup form.

### 4.5 Game History
- FR-18: Each finished game (win or draw) is **recorded exactly once**.
- FR-19: A **History** view lists past games **newest-first**, each showing a reconstructed **mini-board of the final state** (the "screenshot"), the **result** (winner name or Draw), and **both player names**.
- FR-20: History **persists across page reloads** via `localStorage` (still fully client-side).
- FR-21: **Clear** removes all saved games; **Back** returns to the game.
- FR-22: An empty history shows a friendly empty-state message.

## 5. Non-Functional Requirements

- **NFR-1 (Accessibility):** semantic HTML; keyboard operable; per-cell `aria-label`; `aria-live` status announcements; form inputs use `<label>`, `aria-invalid`, and `aria-describedby` for errors.
- **NFR-2 (Responsiveness):** usable on mobile and desktop; centered, fluid layout.
- **NFR-3 (Code quality):** SOLID; pure game rules separated from state and presentation; no business logic in JSX; no magic strings.
- **NFR-4 (Testability):** pure logic unit-tested; key UI flows covered by React Testing Library; core flows covered by real-browser e2e (Playwright).
- **NFR-5 (Resilience):** history persistence degrades gracefully — corrupt, unavailable, or full `localStorage` must not crash the app (falls back to an empty list).

## 6. Architecture Summary

Three layers keep responsibilities separate (see `docs/HLD.md` for the full design):
1. **Pure rules & data** (`src/game/`, `src/history/`) — `calculateWinner`, `isDraw`, `getNextPlayer` (data-driven by `WINNING_LINES`, Open/Closed); the `GameRecord` type and the `historyStorage` module that isolates all `localStorage` access.
2. **State** (`src/hooks/`) — `useGame` (the single owner of mutable game state; guards illegal moves) and `useHistory` (owns the in-memory history list, delegating persistence to `historyStorage`).
3. **Presentation** (`src/components/`) — dumb, focused components that depend on the hook abstractions, not on the rules directly (Dependency Inversion).

## 6a. Component Architecture

### 6a.1 Component tree

```
App                              owns: players | null, view; calls useHistory()
│                                (setup ↔ play ↔ history seam)
├── PlayerSetup                  shown when players === null
│     └── (react-hook-form + zodResolver → playerSchema)
│
├── Game                         shown when players !== null; calls useGame();
│     │                          records each finished game once via onGameEnd
│     ├── ScoreBoard             wins per player + draws; highlights active player
│     ├── StatusBar              aria-live turn / win / draw message
│     ├── Board                  3×3 grid (role="grid")
│     │     └── Square × 9       one memoized button per cell
│     └── GameControls           New Game · Reset Scores · Change Players · History
│
└── HistoryPage                  shown when view === 'history'
      └── HistoryEntry × N        reuses Board (read-only) as the final-state mini-board
```

### 6a.2 Responsibilities & contracts

| Component | Type | Responsibility | Key props | Emits |
|---|---|---|---|---|
| `App` | Stateful (seam) | Hold session players + view; own history (`useHistory`); swap setup ↔ game ↔ history | — | — |
| `PlayerSetup` | Form (RHF) | Collect & validate two distinct names | `onStart(players)` | `onStart` on valid submit |
| `Game` | Composition root | Pull state from `useGame`, wire to children; record each finished game once | `players`, `onChangePlayers`, `onShowHistory`, `onGameEnd` | hook actions; `onGameEnd(record)` |
| `ScoreBoard` | Presentational | Render tally; mark active player | `players`, `scores`, `activePlayer` | — |
| `StatusBar` | Presentational | Announce turn / win / draw (`aria-live`) | `status`, `currentPlayer`, `winner`, `players` | — |
| `Board` | Presentational | Map board array → 9 Squares; flag winning line | `board`, `winningLine`, `disabled`, `onCellClick`, `className?`, `label?` | `onCellClick(index)` |
| `Square` | Presentational (memo) | Render one cell button; disable when filled/over | `value`, `position`, `isWinning`, `disabled`, `onClick` | `onClick` |
| `GameControls` | Presentational | Emit New Game / Reset Scores / Change Players / History intents | `onNewGame`, `onResetScores`, `onChangePlayers`, `onShowHistory` | the four callbacks |
| `HistoryPage` | Presentational | List past games newest-first; empty state | `history`, `onBack`, `onClear` | `onBack`, `onClear` |
| `HistoryEntry` | Presentational | One record: reuse `Board` (read-only) as a mini-board + result line | `record` | — |

### 6a.3 SOLID mapping

- **SRP:** rules (`gameLogic`), state (`useGame`/`useHistory`), persistence (`historyStorage`), and presentation (components) never mix; validation lives only in `playerSchema`; all `localStorage` access lives only in `historyStorage`.
- **OCP:** win detection and turn order are driven by `WINNING_LINES` / `PLAYERS` data — extendable without editing logic. `Board` gained an optional `className`/`label` so it could be reused as a history mini-board without modifying its behavior.
- **LSP:** every `Square` is substitutable; it carries no game knowledge. The same `Board` renders identically whether live or read-only in history.
- **ISP:** each component receives only the props it renders (e.g. `HistoryEntry` takes a single `record`, not the whole list).
- **DIP:** presentation depends on the `useGame` / `useHistory` abstractions and callbacks; the hooks depend on the `historyStorage` functions, not on `window.localStorage` directly.

## 7. Acceptance Criteria

All functional requirements above are demonstrable in the running app, and the documented **UI test cases** ([`./TEST_CASES.md`](./TEST_CASES.md)) pass — both the written scenarios and the implemented automated subset (`npm run test`).
