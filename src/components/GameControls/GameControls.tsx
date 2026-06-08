import styles from './GameControls.module.css';

interface GameControlsProps {
  onNewGame: () => void;
  onResetScores: () => void;
  onChangePlayers: () => void;
}

/** Action buttons for the game session. Purely presentational — it just emits intents. */
export function GameControls({
  onNewGame,
  onResetScores,
  onChangePlayers,
}: GameControlsProps) {
  return (
    <div className={styles.controls}>
      <button type="button" className={styles.primary} onClick={onNewGame}>
        New Game
      </button>
      <button type="button" className={styles.secondary} onClick={onResetScores}>
        Reset Scores
      </button>
      <button
        type="button"
        className={styles.secondary}
        onClick={onChangePlayers}
      >
        Change Players
      </button>
    </div>
  );
}
