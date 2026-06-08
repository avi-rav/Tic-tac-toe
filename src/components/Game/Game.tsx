import { useGame } from '../../hooks/useGame';
import type { Players } from '../../game/types';
import { Board } from '../Board/Board';
import { StatusBar } from '../StatusBar/StatusBar';
import { ScoreBoard } from '../ScoreBoard/ScoreBoard';
import { GameControls } from '../GameControls/GameControls';
import styles from './Game.module.css';

interface GameProps {
  players: Players;
  /** Returns to the player-setup form. */
  onChangePlayers: () => void;
}

/**
 * Composition root for a game session. It pulls state from `useGame` and wires it
 * to presentational children — depending on the hook's abstraction rather than the
 * rules themselves (Dependency Inversion). It contains no rule logic of its own.
 */
export function Game({ players, onChangePlayers }: GameProps) {
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
      />
    </section>
  );
}
