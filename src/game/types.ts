import { PLAYERS } from './constants';
import type { Difficulty } from './aiStrategy';

/** A player marker. Derived from PLAYERS so adding markers never requires editing this type. */
export type Player = (typeof PLAYERS)[number];

/**
 * Who controls the O side. X is always the human who set up the game; this describes
 * the opponent — either a second human (hot-seat) or the computer at a difficulty.
 */
export type Opponent =
  | { kind: 'human' }
  | { kind: 'ai'; difficulty: Difficulty };

/** A single cell: either a player's marker or empty. */
export type CellValue = Player | null;

/** The board is a flat array of cells (index 0..8 for a 3x3 grid). */
export type BoardState = CellValue[];

/** The lifecycle of a game. */
export type GameStatus = 'playing' | 'won' | 'draw';

/** Human-readable names entered in the setup form, keyed by marker. */
export type Players = Record<Player, string>;

/** Win tally per player plus draws. */
export type Scores = Record<Player, number> & { draws: number };

/** Result of evaluating the board for a winner. */
export interface WinResult {
  winner: Player;
  /** The board indices that form the winning line (used to highlight cells). */
  line: number[];
}
