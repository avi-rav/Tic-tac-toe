import { useCallback, useMemo, useState } from 'react';
import { PLAYERS } from '../game/constants';
import {
  calculateWinner,
  createEmptyBoard,
  getNextPlayer,
  isDraw,
} from '../game/gameLogic';
import type {
  BoardState,
  GameStatus,
  Player,
  Scores,
} from '../game/types';

const FIRST_PLAYER: Player = PLAYERS[0];

function createEmptyScores(): Scores {
  return { X: 0, O: 0, draws: 0 };
}

/** The complete game state plus the actions that mutate it. */
export interface UseGameResult {
  board: BoardState;
  currentPlayer: Player;
  status: GameStatus;
  winner: Player | null;
  winningLine: number[] | null;
  scores: Scores;
  /** Places the current player's mark at `index`, if the move is legal. */
  makeMove: (index: number) => void;
  /** Clears the board for a new round; keeps the scoreboard. */
  newGame: () => void;
  /** Zeroes the scoreboard. */
  resetScores: () => void;
}

/**
 * The single owner of all mutable game state. Components read from and act through
 * this abstraction rather than touching the pure rules directly — so presentation
 * depends on this interface, not on `gameLogic` (Dependency Inversion). Keeping the
 * state here (and only here) is the Single Responsibility of this hook.
 */
export function useGame(): UseGameResult {
  const [board, setBoard] = useState<BoardState>(createEmptyBoard);
  const [currentPlayer, setCurrentPlayer] = useState<Player>(FIRST_PLAYER);
  const [scores, setScores] = useState<Scores>(createEmptyScores);

  // Derived state — recomputed from the board, never stored separately, so it
  // can never fall out of sync with the source of truth.
  const winResult = useMemo(() => calculateWinner(board), [board]);
  const status: GameStatus = useMemo(() => {
    if (winResult) return 'won';
    if (isDraw(board)) return 'draw';
    return 'playing';
  }, [board, winResult]);

  const makeMove = useCallback(
    (index: number) => {
      // Guard illegal moves: out of range, occupied, or game already over.
      if (index < 0 || index >= board.length) return;
      if (board[index] !== null) return;
      if (calculateWinner(board) !== null) return;

      const next = [...board];
      next[index] = currentPlayer;

      // Each piece of state gets exactly one top-level setter call — no setter is
      // nested inside another updater (which React StrictMode would double-invoke,
      // flipping the turn back). The outcome is derived from the resulting board.
      setBoard(next);

      const win = calculateWinner(next);
      if (win) {
        setScores((s) => ({ ...s, [win.winner]: s[win.winner] + 1 }));
      } else if (isDraw(next)) {
        setScores((s) => ({ ...s, draws: s.draws + 1 }));
      } else {
        setCurrentPlayer(getNextPlayer(currentPlayer));
      }
    },
    [board, currentPlayer],
  );

  const newGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentPlayer(FIRST_PLAYER);
  }, []);

  const resetScores = useCallback(() => {
    setScores(createEmptyScores());
  }, []);

  return {
    board,
    currentPlayer,
    status,
    winner: winResult?.winner ?? null,
    winningLine: winResult?.line ?? null,
    scores,
    makeMove,
    newGame,
    resetScores,
  };
}
