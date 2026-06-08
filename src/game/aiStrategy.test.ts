import { describe, it, expect } from 'vitest';
import { chooseMove } from './aiStrategy';
import {
  calculateWinner,
  createEmptyBoard,
  getNextPlayer,
} from './gameLogic';
import type { BoardState, Player } from './types';

/** A deterministic rng that always returns 0 — picks the first empty cell. */
const firstCellRng = () => 0;

describe('chooseMove — common rules', () => {
  it('returns null when the board is full', () => {
    const board: BoardState = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
    expect(chooseMove(board, 'O', 'easy')).toBeNull();
  });

  it('returns null when the game is already won', () => {
    const board: BoardState = ['X', 'X', 'X', null, null, null, null, null, null];
    expect(chooseMove(board, 'O', 'hard')).toBeNull();
  });

  it('always returns a legal (empty) cell', () => {
    const board: BoardState = ['X', null, 'O', null, 'X', null, null, null, null];
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      const index = chooseMove(board, 'O', difficulty, firstCellRng);
      expect(index).not.toBeNull();
      expect(board[index as number]).toBeNull();
    }
  });
});

describe('chooseMove — easy', () => {
  it('picks the empty cell selected by the injected rng', () => {
    // Empty cells are [1, 3, 5, 6, 7, 8]; rng 0 -> first of those -> index 1.
    const board: BoardState = ['X', null, 'O', null, 'X', null, null, null, null];
    expect(chooseMove(board, 'O', 'easy', firstCellRng)).toBe(1);
  });
});

describe('chooseMove — medium', () => {
  it('takes an immediate win when available', () => {
    // O O _ on the top row: O completes at index 2.
    const board: BoardState = ['O', 'O', null, 'X', 'X', null, null, null, null];
    expect(chooseMove(board, 'O', 'medium', firstCellRng)).toBe(2);
  });

  it("blocks the opponent's immediate win when it has none of its own", () => {
    // X X _ on the top row: O must block at index 2.
    const board: BoardState = ['X', 'X', null, 'O', null, null, null, null, null];
    expect(chooseMove(board, 'O', 'medium', firstCellRng)).toBe(2);
  });

  it('prefers its own win over blocking the opponent', () => {
    // O can win on the top row (index 2); X threatens the left column (index 6).
    const board: BoardState = ['O', 'O', null, 'X', null, null, 'X', null, null];
    expect(chooseMove(board, 'O', 'medium', firstCellRng)).toBe(2);
  });
});

describe('chooseMove — hard (minimax)', () => {
  it('completes an immediate win', () => {
    const board: BoardState = ['O', 'O', null, 'X', 'X', null, null, null, null];
    expect(chooseMove(board, 'O', 'hard')).toBe(2);
  });

  it("blocks the opponent's immediate win", () => {
    const board: BoardState = ['X', 'X', null, 'O', null, null, null, null, null];
    expect(chooseMove(board, 'O', 'hard')).toBe(2);
  });

  // The defining property of perfect play: it can never be beaten. We pit the hard
  // AI (O) against an opponent (X) that also plays perfectly, and against one that
  // plays the first available cell — in neither case may O lose.
  it('never loses against any opponent', () => {
    const playFullGame = (xStrategy: 'optimal' | 'first'): Player | 'draw' => {
      let board = createEmptyBoard();
      let current: Player = 'X';
      while (true) {
        const win = calculateWinner(board);
        if (win) return win.winner;
        if (board.every((c) => c !== null)) return 'draw';

        let move: number | null;
        if (current === 'O') {
          move = chooseMove(board, 'O', 'hard');
        } else if (xStrategy === 'optimal') {
          move = chooseMove(board, 'X', 'hard');
        } else {
          move = board.findIndex((c) => c === null);
        }

        const next = [...board];
        next[move as number] = current;
        board = next;
        current = getNextPlayer(current);
      }
    };

    expect(playFullGame('optimal')).toBe('draw'); // perfect vs perfect always draws
    expect(playFullGame('first')).not.toBe('X'); // O (perfect) never loses
  });
});
