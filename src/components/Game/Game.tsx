import { useEffect, useRef } from 'react';
import { useGame } from '../../hooks/useGame';
import type { Players } from '../../game/types';
import { createRecordId, type GameRecord } from '../../history/types';
import { Board } from '../Board/Board';
import { StatusBar } from '../StatusBar/StatusBar';
import { ScoreBoard } from '../ScoreBoard/ScoreBoard';
import { GameControls } from '../GameControls/GameControls';
import styles from './Game.module.css';

interface GameProps {
  players: Players;
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
        disabled={isOver}
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
