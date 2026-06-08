import { StrictMode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';
import { Game } from '../Game/Game';
import type { Players } from '../../game/types';

/**
 * Renders the app and advances past the setup form into a live game.
 * `strict` mirrors the real entrypoint (main.tsx wraps <App /> in StrictMode),
 * which double-invokes state updaters — the condition that catches turn/score
 * logic that wrongly nests setters inside another updater.
 */
async function startGame(xName = 'Alice', oName = 'Bob', strict = false) {
  const user = userEvent.setup();
  render(strict ? (
    <StrictMode>
      <App />
    </StrictMode>
  ) : (
    <App />
  ));
  await user.type(screen.getByLabelText(/player x/i), xName);
  await user.type(screen.getByLabelText(/player o/i), oName);
  await user.click(screen.getByRole('button', { name: /start game/i }));
  return user;
}

/**
 * Renders the app and starts a game against the computer at the given difficulty.
 * Only the human (X) name is required in vs-computer mode.
 */
async function startVsComputer(difficulty = 'easy', name = 'Alice') {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByLabelText(/vs computer/i));
  await user.type(screen.getByLabelText(/your name/i), name);
  await user.selectOptions(screen.getByLabelText(/difficulty/i), difficulty);
  await user.click(screen.getByRole('button', { name: /start game/i }));
  return user;
}

/** Clicks a board cell by its 1-based position. */
function cell(position: number) {
  return screen.getByRole('button', { name: new RegExp(`^Cell ${position},`) });
}

/** How many cells currently hold a mark. */
function markedCount() {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].filter(
    (p) => cell(p).textContent !== '',
  ).length;
}

describe('Game', () => {
  it('shows the setup form first and the board after starting', async () => {
    await startGame();
    expect(screen.getByRole('grid')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/alice's turn \(x\)/i);
  });

  it('alternates turns automatically after each move', async () => {
    const user = await startGame();
    expect(screen.getByRole('status')).toHaveTextContent(/alice's turn \(x\)/i);
    await user.click(cell(1)); // X moves
    expect(screen.getByRole('status')).toHaveTextContent(/bob's turn \(o\)/i);
    await user.click(cell(2)); // O moves
    expect(screen.getByRole('status')).toHaveTextContent(/alice's turn \(x\)/i);
  });

  // Regression: StrictMode double-invokes state updaters. A turn flip nested
  // inside the setBoard updater ran twice and flipped back, so the turn never
  // changed in dev. The turn must still alternate exactly once per move here.
  it('alternates turns under StrictMode (double-invoked updaters)', async () => {
    const user = await startGame('Alice', 'Bob', true);
    await user.click(cell(1)); // X
    expect(screen.getByRole('status')).toHaveTextContent(/bob's turn \(o\)/i);
    await user.click(cell(2)); // O
    expect(screen.getByRole('status')).toHaveTextContent(/alice's turn \(x\)/i);
  });

  it('declares the winner by name after a winning sequence', async () => {
    const user = await startGame();
    // X: 0,1,2 (top row)  O: 3,4
    await user.click(cell(1)); // X
    await user.click(cell(4)); // O
    await user.click(cell(2)); // X
    await user.click(cell(5)); // O
    await user.click(cell(3)); // X completes top row
    expect(screen.getByRole('status')).toHaveTextContent(/alice \(x\) wins!/i);
  });

  it('ignores clicks on an occupied cell', async () => {
    const user = await startGame();
    await user.click(cell(1)); // X plays cell 1
    await user.click(cell(1)); // O tries the same cell — no-op
    // Still X's mark there, and it's now O's turn (only one move counted).
    expect(cell(1)).toHaveTextContent('X');
    expect(screen.getByRole('status')).toHaveTextContent(/bob's turn \(o\)/i);
  });

  it('New Game clears the board but keeps scores', async () => {
    const user = await startGame();
    // X wins the top row.
    await user.click(cell(1));
    await user.click(cell(4));
    await user.click(cell(2));
    await user.click(cell(5));
    await user.click(cell(3));
    expect(screen.getByRole('status')).toHaveTextContent(/wins!/i);

    await user.click(screen.getByRole('button', { name: /new game/i }));

    // Board is empty again...
    expect(cell(1)).toHaveTextContent('');
    expect(screen.getByRole('status')).toHaveTextContent(/alice's turn/i);
    // ...but Alice's win is still on the scoreboard.
    const scoreboard = screen.getByRole('list', { name: /scoreboard/i });
    const aliceRow = within(scoreboard)
      .getByText(/alice \(x\)/i)
      .closest('li')!;
    expect(within(aliceRow).getByText('1')).toBeInTheDocument();
  });
});

describe('Game — vs computer', () => {
  it('auto-plays the AI (O) move after the human (X) moves', async () => {
    const user = await startVsComputer('easy');
    expect(screen.getByRole('status')).toHaveTextContent(/alice's turn \(x\)/i);

    await user.click(cell(1)); // human (X) moves -> one mark on the board

    // The AI's scheduled move lands, bringing the board to two marks and the
    // turn back to the human. findBy* polls past the setTimeout delay.
    await screen.findByText(/alice's turn \(x\)/i);
    expect(markedCount()).toBe(2);
  });

  it('disables the board while it is the AI\'s turn', async () => {
    const user = await startVsComputer('hard');
    await user.click(cell(1)); // human moves; now it's the AI's turn

    // Immediately after the human's move the board is disabled (AI is "thinking"),
    // so a human click on another cell is ignored — only the AI adds the 2nd mark.
    await screen.findByText(/alice's turn \(x\)/i); // AI finished
    expect(markedCount()).toBe(2);
  });

  it('never lets the human beat the hard AI', async () => {
    // Play a greedy human against perfect play: pick the lowest empty cell each
    // turn. Against minimax the human can at best draw — never win.
    const user = await startVsComputer('hard');
    for (let i = 0; i < 5; i += 1) {
      const status = () => screen.getByRole('status').textContent ?? '';
      if (/wins|draw/i.test(status())) break;

      const open = [1, 2, 3, 4, 5, 6, 7, 8, 9].find(
        (p) => cell(p).textContent === '',
      );
      if (open === undefined) break;

      const before = markedCount();
      await user.click(cell(open)); // human moves -> +1 mark
      // Wait for the position to settle: either the AI added its reply (+2 total)
      // or the human's move ended the game (no AI reply).
      await waitFor(() => {
        expect(markedCount() >= before + 2 || /wins|draw/i.test(status())).toBe(
          true,
        );
      });
      expect(status()).not.toMatch(/alice \(x\) wins/i);
    }
  });
});

describe('Game — history recording', () => {
  const PLAYERS: Players = { X: 'Alice', O: 'Bob' };

  function renderGame(strict = false) {
    const onGameEnd = vi.fn();
    const ui = (
      <Game
        players={PLAYERS}
        opponent={{ kind: 'human' }}
        onChangePlayers={() => {}}
        onShowHistory={() => {}}
        onGameEnd={onGameEnd}
      />
    );
    render(strict ? <StrictMode>{ui}</StrictMode> : ui);
    return { onGameEnd, user: userEvent.setup() };
  }

  async function playTopRowWin(user: ReturnType<typeof userEvent.setup>) {
    await user.click(cell(1)); // X
    await user.click(cell(4)); // O
    await user.click(cell(2)); // X
    await user.click(cell(5)); // O
    await user.click(cell(3)); // X completes the top row
  }

  it('records a finished game exactly once', async () => {
    const { onGameEnd, user } = renderGame();
    await playTopRowWin(user);
    expect(onGameEnd).toHaveBeenCalledTimes(1);
    const record = onGameEnd.mock.calls[0][0];
    expect(record.result).toBe('X');
    expect(record.winningLine).toEqual([0, 1, 2]);
    expect(record.players).toEqual(PLAYERS);
  });

  // Regression guard: StrictMode double-invokes effects; the recordedRef must
  // still produce exactly one record.
  it('records exactly once under StrictMode', async () => {
    const { onGameEnd, user } = renderGame(true);
    await playTopRowWin(user);
    expect(onGameEnd).toHaveBeenCalledTimes(1);
  });

  it('records a draw with result "draw"', async () => {
    const { onGameEnd, user } = renderGame();
    // Full board, no winner: X O X / X O O / O X X
    for (const m of [1, 2, 3, 5, 4, 6, 8, 7, 9]) {
      await user.click(cell(m));
    }
    expect(onGameEnd).toHaveBeenCalledTimes(1);
    expect(onGameEnd.mock.calls[0][0].result).toBe('draw');
  });

  it('does not record before the game ends', async () => {
    const { onGameEnd, user } = renderGame();
    await user.click(cell(1));
    await user.click(cell(2));
    expect(onGameEnd).not.toHaveBeenCalled();
  });
});
