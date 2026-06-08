import { describe, it, expect } from 'vitest';
import {
  calculateWinner,
  createEmptyBoard,
  getNextPlayer,
  isDraw,
} from './gameLogic';
import type { BoardState } from './types';

describe('createEmptyBoard', () => {
  it('creates a board of 9 null cells', () => {
    const board = createEmptyBoard();
    expect(board).toHaveLength(9);
    expect(board.every((cell) => cell === null)).toBe(true);
  });
});

describe('calculateWinner', () => {
  it('detects a row win and returns the winning line', () => {
    // X X X / . . . / . . .
    const board: BoardState = ['X', 'X', 'X', null, null, null, null, null, null];
    expect(calculateWinner(board)).toEqual({ winner: 'X', line: [0, 1, 2] });
  });

  it('detects a diagonal win', () => {
    // O . . / . O . / . . O
    const board: BoardState = ['O', null, null, null, 'O', null, null, null, 'O'];
    expect(calculateWinner(board)).toEqual({ winner: 'O', line: [0, 4, 8] });
  });

  it('detects a column win', () => {
    const board: BoardState = ['X', null, null, 'X', null, null, 'X', null, null];
    expect(calculateWinner(board)).toEqual({ winner: 'X', line: [0, 3, 6] });
  });

  it('returns null for an empty board', () => {
    expect(calculateWinner(createEmptyBoard())).toBeNull();
  });

  it('returns null for a partial board with no completed line', () => {
    const board: BoardState = ['X', 'O', 'X', null, null, null, null, null, null];
    expect(calculateWinner(board)).toBeNull();
  });
});

describe('isDraw', () => {
  it('is true for a full board with no winner', () => {
    // X O X / X O O / O X X  -> no three-in-a-row
    const board: BoardState = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
    expect(isDraw(board)).toBe(true);
  });

  it('is false when there is a winner even if the board is full', () => {
    const board: BoardState = ['X', 'X', 'X', 'O', 'O', null, null, null, null];
    expect(isDraw(board)).toBe(false);
  });

  it('is false for an incomplete board', () => {
    expect(isDraw(createEmptyBoard())).toBe(false);
  });
});

describe('getNextPlayer', () => {
  it('alternates between X and O', () => {
    expect(getNextPlayer('X')).toBe('O');
    expect(getNextPlayer('O')).toBe('X');
  });
});
