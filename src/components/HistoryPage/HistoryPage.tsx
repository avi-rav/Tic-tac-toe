import { HistoryEntry } from '../HistoryEntry/HistoryEntry';
import type { GameRecord } from '../../history/types';
import styles from './HistoryPage.module.css';

interface HistoryPageProps {
  history: GameRecord[];
  onBack: () => void;
  onClear: () => void;
}

/**
 * The History view: a newest-first list of finished games, each shown as a
 * reconstructed mini-board with its result. Presentational — it receives the
 * list and emits intents, owning no persistence logic itself.
 */
export function HistoryPage({ history, onBack, onClear }: HistoryPageProps) {
  const isEmpty = history.length === 0;

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Game History</h1>
        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={onBack}>
            Back
          </button>
          <button
            type="button"
            className={styles.secondary}
            onClick={onClear}
            disabled={isEmpty}
          >
            Clear
          </button>
        </div>
      </header>

      {isEmpty ? (
        <p className={styles.empty}>No games played yet. Finish a game to see it here.</p>
      ) : (
        <ul className={styles.list} aria-label="Past games">
          {history.map((record) => (
            <HistoryEntry key={record.id} record={record} />
          ))}
        </ul>
      )}
    </section>
  );
}
