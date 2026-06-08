import { PLAYERS } from './constants';

/** A player marker. Derived from PLAYERS so adding markers never requires editing this type. */
export type Player = (typeof PLAYERS)[number];

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
