import { PLAYERS } from '../../game/constants';
import type { Player, Players, Scores } from '../../game/types';
import styles from './ScoreBoard.module.css';

interface ScoreBoardProps {
  players: Players;
  scores: Scores;
  /** Highlights whose turn it is (only while the game is in progress). */
  activePlayer: Player | null;
}

/** Session tally: each player's wins by name, plus draws. Presentational. */
export function ScoreBoard({ players, scores, activePlayer }: ScoreBoardProps) {
  return (
    <ul className={styles.scoreboard} aria-label="Scoreboard">
      {PLAYERS.map((marker) => (
        <li
          key={marker}
          className={`${styles.entry} ${
            activePlayer === marker ? styles.active : ''
          }`}
        >
          <span className={styles.name}>
            {players[marker]} ({marker})
          </span>
          <span className={styles.value}>{scores[marker]}</span>
        </li>
      ))}
      <li className={styles.entry}>
        <span className={styles.name}>Draws</span>
        <span className={styles.value}>{scores.draws}</span>
      </li>
    </ul>
  );
}
