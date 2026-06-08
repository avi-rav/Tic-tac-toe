import { BOARD_SIZE, PLAYERS, WINNING_LINES } from './constants';
import type { BoardState, Player, WinResult } from './types';

/**
 * Pure game rules. No React, no mutable state — every function is a deterministic
 * mapping from inputs to outputs, which makes the rules trivial to unit-test and
 * keeps the single responsibility of "what does the board mean?" in one place.
 */

/** An empty board: BOARD_SIZE cells, all null. */
export function createEmptyBoard(): BoardState {
  return Array<null>(BOARD_SIZE).fill(null);
}

/**
 * Returns the winning player and line if the board contains a completed line,
 * otherwise null. Driven entirely by WINNING_LINES.
 */
export function calculateWinner(board: BoardState): WinResult | null {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Player, line };
    }
  }
  return null;
}

/** A draw is a full board with no winner. */
export function isDraw(board: BoardState): boolean {
  return calculateWinner(board) === null && board.every((cell) => cell !== null);
}

/** The player whose turn comes after the given one (wraps around PLAYERS). */
export function getNextPlayer(current: Player): Player {
  const index = PLAYERS.indexOf(current);
  return PLAYERS[(index + 1) % PLAYERS.length];
}
