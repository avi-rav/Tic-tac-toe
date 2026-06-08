import { Board } from '../Board/Board';
import type { GameRecord } from '../../history/types';
import styles from './HistoryEntry.module.css';

interface HistoryEntryProps {
  record: GameRecord;
}

function describeResult(record: GameRecord): string {
  if (record.result === 'draw') return 'Draw';
  const name = record.players[record.result];
  return `${name} (${record.result}) won`;
}

/**
 * One past game: a small read-only reconstruction of the final board (the
 * "screenshot") plus the result and player names. It reuses the same `Board`
 * the live game uses — disabled, with the winning line still highlighted — so
 * the visual is guaranteed to match the real board.
 */
export function HistoryEntry({ record }: HistoryEntryProps) {
  const result = describeResult(record);

  return (
    <li className={styles.entry}>
      <Board
        board={record.board}
        winningLine={record.winningLine}
        disabled
        onCellClick={() => {}}
        className={styles.miniBoard}
        label={`Final board: ${result}`}
      />
      <div className={styles.meta}>
        <span className={styles.result}>{result}</span>
        <span className={styles.players}>
          {record.players.X} vs {record.players.O}
        </span>
      </div>
    </li>
  );
}
