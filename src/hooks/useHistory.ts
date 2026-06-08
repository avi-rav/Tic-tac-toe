import { useCallback, useState } from 'react';
import {
  clearHistory,
  loadHistory,
  saveRecord,
} from '../history/historyStorage';
import type { GameRecord } from '../history/types';

export interface UseHistoryResult {
  history: GameRecord[];
  /** Persists a finished game and updates the in-memory list. */
  addRecord: (record: GameRecord) => void;
  /** Removes all saved games. */
  clear: () => void;
}

/**
 * Owns the in-memory history list, seeded once from storage. It delegates all
 * persistence to `historyStorage`, so this hook depends on that abstraction
 * rather than on `localStorage` directly (Dependency Inversion).
 */
export function useHistory(): UseHistoryResult {
  // Lazy initializer: read storage exactly once on mount.
  const [history, setHistory] = useState<GameRecord[]>(loadHistory);

  const addRecord = useCallback((record: GameRecord) => {
    setHistory(saveRecord(record));
  }, []);

  const clear = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  return { history, addRecord, clear };
}
