/**
 * Game configuration. Win detection and player turns are driven by this data,
 * not by hardcoded branches — so the rules can be extended (e.g. more players,
 * a different board) by editing data here rather than changing logic (Open/Closed).
 */

export const BOARD_SIZE = 9;

/** The ordered set of player markers. Turn order follows this array. */
export const PLAYERS = ['X', 'O'] as const;

/** Every line (by board index) that constitutes a win on a 3x3 grid. */
export const WINNING_LINES: readonly number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // columns
  [0, 4, 8],
  [2, 4, 6], // diagonals
];
