import { useEffect, useRef } from 'react';
import { useGame } from '../../hooks/useGame';
import { chooseMove } from '../../game/aiStrategy';
import { PLAYERS } from '../../game/constants';
import type { Opponent, Players } from '../../game/types';
import { createRecordId, type GameRecord } from '../../history/types';

/** The AI controls the O side; X is always the human who set up the game. */
const AI_PLAYER = PLAYERS[1];

/** Delay before the AI plays, so its move feels deliberate rather than instant. */
const AI_MOVE_DELAY_MS = 400;
import { Board } from '../Board/Board';
import { StatusBar } from '../StatusBar/StatusBar';
import { ScoreBoard } from '../ScoreBoard/ScoreBoard';
import { GameControls } from '../GameControls/GameControls';
import styles from './Game.module.css';

interface GameProps {
  players: Players;
  /** Who controls O — a second human or the computer at a difficulty. */
  opponent: Opponent;
  /** Returns to the player-setup form. */
  onChangePlayers: () => void;
  /** Opens the history view. */
  onShowHistory: () => void;
  /** Called once per finished game with its final-state record. */
  onGameEnd: (record: GameRecord) => void;
}

/**
 * Composition root for a game session. It pulls state from `useGame` and wires it
 * to presentational children — depending on the hook's abstraction rather than the
 * rules themselves (Dependency Inversion). It contains no rule logic of its own.
 */
export function Game({
  players,
  opponent,
  onChangePlayers,
  onShowHistory,
  onGameEnd,
}: GameProps) {
  const {
    board,
    currentPlayer,
    status,
    winner,
    winningLine,
    scores,
    makeMove,
    newGame,
    resetScores,
  } = useGame();

  const isOver = status !== 'playing';

  // It's the computer's turn when an AI opponent is set, the game is live, and the
  // current side is the AI's. The board is disabled then so the human can't move for O.
  const isAiTurn =
    opponent.kind === 'ai' && !isOver && currentPlayer === AI_PLAYER;

  // Drive the AI's move. A short timeout makes the move feel deliberate; the cleanup
  // cancels it on unmount or before re-running — which also neutralises StrictMode's
  // double-invoked effect (the first timer is cleared before it can fire, so the AI
  // never moves twice). `makeMove` already ignores illegal indices, so a stale call
  // after the board changes is harmless.
  useEffect(() => {
    if (!isAiTurn || opponent.kind !== 'ai') return;
    const index = chooseMove(board, AI_PLAYER, opponent.difficulty);
    if (index === null) return;
    const timer = setTimeout(() => makeMove(index), AI_MOVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isAiTurn, opponent, board, makeMove]);

  // Record each finished game exactly once. The ref guards against StrictMode's
  // double-invoked effects and any re-render while the game stays in a terminal
  // state — without it, a single win could be saved twice. Reset on newGame.
  const recordedRef = useRef(false);
  useEffect(() => {
    if (status === 'playing') {
      recordedRef.current = false;
      return;
    }
    if (recordedRef.current) return;
    recordedRef.current = true;
    onGameEnd({
      id: createRecordId(),
      players,
      board,
      winningLine,
      result: status === 'won' && winner ? winner : 'draw',
    });
  }, [status, board, winningLine, winner, players, onGameEnd]);

  return (
    <section className={styles.game}>
      <ScoreBoard
        players={players}
        scores={scores}
        activePlayer={isOver ? null : currentPlayer}
      />
      <StatusBar
        status={status}
        currentPlayer={currentPlayer}
        winner={winner}
        players={players}
      />
      <Board
        board={board}
        winningLine={winningLine}
        disabled={isOver || isAiTurn}
        onCellClick={makeMove}
      />
      <GameControls
        onNewGame={newGame}
        onResetScores={resetScores}
        onChangePlayers={onChangePlayers}
        onShowHistory={onShowHistory}
      />
    </section>
  );
}
