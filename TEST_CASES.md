# UI Test Cases — Tic-Tac-Toe

This document defines the UI test scenarios for the game (the bonus deliverable).
A representative subset is automated with Vitest + React Testing Library — those rows
are marked **✅ Automated** with the file that covers them. The rest are written
manual scenarios.

## Legend
- **✅ Automated** — covered by a component/integration test (Vitest + RTL, jsdom).
- **🎭 E2E** — covered by a real-browser Playwright test (`e2e/game.e2e.ts`).
- **📋 Manual** — defined here for QA; not (yet) automated.

---

## 1. Player Setup Form

| # | Scenario | Steps | Expected Result | Status |
|---|----------|-------|-----------------|--------|
| 1.1 | Submit disabled initially | Open the app | "Start Game" is disabled | ✅ `PlayerSetup.test.tsx` |
| 1.2 | Empty name rejected | Focus & blur Player X leaving it empty | Inline error "Name must be at least 2 characters"; submit stays disabled | 📋 Manual |
| 1.3 | Too-short name rejected | Type "A" in Player X, blur | Inline error shown | ✅ `PlayerSetup.test.tsx` |
| 1.4 | Identical names rejected | Type "Sam" / "sam" | Error "Players must have different names" (case-insensitive) | ✅ `PlayerSetup.test.tsx` |
| 1.5 | Names are trimmed | Enter "  Alice  " / "Bob", submit | Game starts with names "Alice" / "Bob" | ✅ `PlayerSetup.test.tsx` |
| 1.6 | Valid submit starts game | Enter two valid distinct names, submit | Board appears; status shows Player X's turn | ✅ `Game.test.tsx` |
| 1.7 | Enter key submits | With valid input, press Enter | Game starts | 📋 Manual |
| 1.8 | Error a11y | Trigger a field error | `aria-invalid="true"` and `aria-describedby` link input to the error | 📋 Manual |

## 2. Gameplay

| # | Scenario | Steps | Expected Result | Status |
|---|----------|-------|-----------------|--------|
| 2.1 | X moves first | Start a game | Status reads "<X name>'s turn (X)" | ✅ `Game.test.tsx` |
| 2.2 | Turns alternate | X clicks a cell | Status switches to "<O name>'s turn (O)" | ✅ `Game.test.tsx` |
| 2.3 | Empty cell placement | Click an empty cell | Current player's mark appears there | ✅ `Game.test.tsx` |
| 2.4 | Occupied cell is a no-op | Click an already-filled cell | No change; turn does not pass | ✅ `Game.test.tsx` |
| 2.5 | Names in status | Play any move | Status uses the entered names, not just "X"/"O" | ✅ `Game.test.tsx` |
| 2.6 | Marks are color-coded | Place X and O | X and O render in distinct colors | 📋 Manual |

## 3. End States

| # | Scenario | Steps | Expected Result | Status |
|---|----------|-------|-----------------|--------|
| 3.1 | Row win | Complete a row | "<name> (X) wins!"; game ends | ✅ `Game.test.tsx` |
| 3.2 | Column win | Complete a column | Winner declared | 📋 Manual |
| 3.3 | Diagonal win | Complete a diagonal | Winner declared | 📋 Manual (logic ✅ `gameLogic.test.ts`) |
| 3.4 | All 8 win lines | Each of rows/cols/diagonals | Each detected | 📋 Manual (rows/cols/diag ✅ `gameLogic.test.ts`) |
| 3.5 | Winning line highlighted | Win any line | The three winning cells are visually highlighted | 📋 Manual |
| 3.6 | Draw | Fill the board with no winner | "It's a draw!"; game ends | 📋 Manual (logic ✅ `gameLogic.test.ts`) |
| 3.7 | Board disabled after end | After win or draw, click any cell | No move registers | 📋 Manual (occupied-cell guard ✅ `Game.test.tsx`) |

## 4. Scores & Controls

| # | Scenario | Steps | Expected Result | Status |
|---|----------|-------|-----------------|--------|
| 4.1 | Win increments score | Win a round | Winner's tally increases by 1 | ✅ `Game.test.tsx` |
| 4.2 | Draw increments draws | Force a draw | Draws tally increases by 1 | 📋 Manual |
| 4.3 | New Game keeps scores | Win, then click "New Game" | Board clears; scoreboard unchanged | ✅ `Game.test.tsx` |
| 4.4 | Reset Scores | Click "Reset Scores" | All tallies become 0; board unaffected | 📋 Manual |
| 4.5 | Change Players | Click "Change Players" | Returns to the setup form | 📋 Manual |
| 4.6 | Active player highlight | During play | Current player's scoreboard entry is highlighted | 📋 Manual |

## 5. Accessibility & Keyboard

| # | Scenario | Steps | Expected Result | Status |
|---|----------|-------|-----------------|--------|
| 5.1 | Cell labels | Inspect a cell | `aria-label` reads e.g. "Cell 5, empty" / "Cell 5, X" | 📋 Manual |
| 5.2 | Live status | Make a move with a screen reader | Status change announced (`aria-live="polite"`) | 📋 Manual |
| 5.3 | Keyboard play | Tab to a cell, press Enter/Space | The cell is played | 📋 Manual |
| 5.4 | Focus visible | Tab through controls | A clear focus ring is shown | 📋 Manual |

## 6. End-to-End (real browser — Playwright)

These run the production build in a real Chromium browser via Playwright
(`e2e/game.e2e.ts`). They cover the **core happy paths** and verify things jsdom
cannot truly assert (real rendering, real CSS for the winning-line highlight).

| # | Scenario | Steps | Expected Result | Status |
|---|----------|-------|-----------------|--------|
| 6.1 | Setup → play | Enter valid names, start | Board (`role=grid`) visible; status "Alice's turn (X)" | 🎭 E2E |
| 6.2 | Win by name | Play a top-row win | Status "Alice (X) wins!" | 🎭 E2E |
| 6.3 | Winning line highlight | After a win | The 3 winning cells carry the `winning` class; others do not | 🎭 E2E |
| 6.4 | Occupied cell no-op | X plays a cell, O clicks the same | Cell unchanged; turn stays with O | 🎭 E2E |
| 6.5 | Draw | Fill board with no line | Status "It's a draw!" | 🎭 E2E |
| 6.6 | New Game + Change Players | Win, New Game, then Change Players | Board clears & score kept; then setup form returns | 🎭 E2E |

**Browser-only cases not yet automated** (candidates for a fuller e2e pass):
keyboard play (Tab + Enter/Space), visible focus ring, X/O color-coding — see §5 and §2.6.

---

## Running the tests

```bash
npm run test        # unit + integration (Vitest + RTL, jsdom) — run once
npm run test:watch  # the above, in watch mode
npm run e2e         # real-browser end-to-end (Playwright, auto-builds & serves)
npm run e2e:ui      # Playwright UI mode for debugging
```

Automated coverage:
- `src/game/gameLogic.test.ts` — pure rule unit tests (win/draw/turn).
- `src/components/__tests__/PlayerSetup.test.tsx` — form validation & submit.
- `src/components/__tests__/Game.test.tsx` — integration UI flow in jsdom (setup → play → win → reset).
- `e2e/game.e2e.ts` — real-browser end-to-end (the 6 core flows above).
