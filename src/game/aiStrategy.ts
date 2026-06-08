import { calculateWinner, getNextPlayer } from './gameLogic';
import type { BoardState, Player } from './types';

/**
 * AI move selection. Pure, like `gameLogic` — no React, no mutable state. Tic-tac-toe
 * is a solved game, so difficulty is not about search depth but about how often the AI
 * deliberately plays a sub-optimal move:
 *
 *   easy   — random legal move.
 *   medium — take an immediate win, else block the opponent's immediate win, else random.
 *   hard   — minimax: perfect play, unbeatable (best the human can do is force a draw).
 *
 * The chosen index is fed through the same `makeMove` seam a human uses, so the rules
 * never need to know who is playing.
 */
export type Difficulty = 'easy' | 'medium' | 'hard';

/** A source of randomness; injectable so tests can be deterministic. */
export type Rng = () => number;

/** The board indices that are still empty. */
function emptyIndices(board: BoardState): number[] {
  const cells: number[] = [];
  for (let i = 0; i < board.length; i += 1) {
    if (board[i] === null) cells.push(i);
  }
  return cells;
}

/** The board after `player` plays `index` (does not mutate the input). */
function play(board: BoardState, index: number, player: Player): BoardState {
  const next = [...board];
  next[index] = player;
  return next;
}

/** A random element of `cells`, or null if empty. */
function pickRandom(cells: number[], rng: Rng): number | null {
  if (cells.length === 0) return null;
  return cells[Math.floor(rng() * cells.length)];
}

/** The first move that immediately wins the game for `player`, or null. */
function findWinningMove(
  board: BoardState,
  player: Player,
  cells: number[],
): number | null {
  for (const index of cells) {
    if (calculateWinner(play(board, index, player))?.winner === player) {
      return index;
    }
  }
  return null;
}

/**
 * Minimax with depth-aware scoring: prefer faster wins and slower losses so the AI
 * plays the most resilient line. `aiPlayer` is the side we are optimising for.
 */
function minimax(
  board: BoardState,
  current: Player,
  aiPlayer: Player,
  depth: number,
): { score: number; index: number | null } {
  const win = calculateWinner(board);
  if (win) {
    // Sooner wins score higher; sooner losses score less negative.
    const score = win.winner === aiPlayer ? 10 - depth : depth - 10;
    return { score, index: null };
  }

  const cells = emptyIndices(board);
  if (cells.length === 0) return { score: 0, index: null }; // draw

  const maximizing = current === aiPlayer;
  let best = {
    score: maximizing ? -Infinity : Infinity,
    index: null as number | null,
  };

  for (const index of cells) {
    const result = minimax(
      play(board, index, current),
      getNextPlayer(current),
      aiPlayer,
      depth + 1,
    );
    if (maximizing ? result.score > best.score : result.score < best.score) {
      best = { score: result.score, index };
    }
  }

  return best;
}

/**
 * Returns the cell index the AI should play for `player` at the given difficulty,
 * or null if the board is full or the game is already over.
 */
export function chooseMove(
  board: BoardState,
  player: Player,
  difficulty: Difficulty,
  rng: Rng = Math.random,
): number | null {
  if (calculateWinner(board) !== null) return null;
  const cells = emptyIndices(board);
  if (cells.length === 0) return null;

  if (difficulty === 'easy') {
    return pickRandom(cells, rng);
  }

  if (difficulty === 'medium') {
    const opponent = getNextPlayer(player);
    return (
      findWinningMove(board, player, cells) ??
      findWinningMove(board, opponent, cells) ?? // block the opponent's win
      pickRandom(cells, rng)
    );
  }

  // hard — perfect play.
  return minimax(board, player, player, 0).index ?? pickRandom(cells, rng);
}
