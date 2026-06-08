import { StrictMode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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

/** Clicks a board cell by its 1-based position. */
function cell(position: number) {
  return screen.getByRole('button', { name: new RegExp(`^Cell ${position},`) });
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

describe('Game — history recording', () => {
  const PLAYERS: Players = { X: 'Alice', O: 'Bob' };

  function renderGame(strict = false) {
    const onGameEnd = vi.fn();
    const ui = (
      <Game
        players={PLAYERS}
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
