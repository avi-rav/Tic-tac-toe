import type { BoardState, Player, Players } from '../game/types';

/** The outcome of a finished game: the winning marker, or a draw. */
export type GameResult = Player | 'draw';

/** A stable unique id for a record. Uses crypto.randomUUID where available. */
export function createRecordId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID.
  return `r-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
}

/**
 * An immutable snapshot of a finished game — enough to reconstruct the final
 * board visually (the "screenshot") without storing an actual image.
 */
export interface GameRecord {
  /** Stable unique id, used as the React list key. */
  id: string;
  /** The player names at the time the game was played. */
  players: Players;
  /** The final board state (9 cells). */
  board: BoardState;
  /** The winning line's indices, or null for a draw. */
  winningLine: number[] | null;
  /** Who won, or 'draw'. */
  result: GameResult;
}
