import type { GameStatus, Player, Players } from '../../game/types';
import styles from './StatusBar.module.css';

interface StatusBarProps {
  status: GameStatus;
  currentPlayer: Player;
  winner: Player | null;
  players: Players;
}

function buildMessage(
  status: GameStatus,
  currentPlayer: Player,
  winner: Player | null,
  players: Players,
): string {
  if (status === 'won' && winner) {
    return `${players[winner]} (${winner}) wins!`;
  }
  if (status === 'draw') {
    return "It's a draw!";
  }
  return `${players[currentPlayer]}'s turn (${currentPlayer})`;
}

/**
 * Announces game state. Presentational and screen-reader friendly: the message is
 * derived from props and exposed via `aria-live` so assistive tech reads updates.
 */
export function StatusBar({
  status,
  currentPlayer,
  winner,
  players,
}: StatusBarProps) {
  const message = buildMessage(status, currentPlayer, winner, players);
  const isOver = status !== 'playing';

  return (
    <p
      className={`${styles.status} ${isOver ? styles.over : ''}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </p>
  );
}
