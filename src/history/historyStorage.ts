import type { GameRecord } from './types';

/**
 * The single place that talks to `localStorage`. Components and hooks depend on
 * these functions, never on `window.localStorage` directly (Dependency Inversion).
 * Every access is wrapped so a disabled/full/corrupt store degrades to an empty
 * list instead of crashing the app (Single Responsibility: persistence only).
 */

const STORAGE_KEY = 'ttt:history';

/** Keep history bounded so localStorage can't grow without limit. */
export const MAX_HISTORY = 20;

/** Reads the saved history, newest-first. Returns [] on any failure. */
export function loadHistory(): GameRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as GameRecord[]) : [];
  } catch {
    return [];
  }
}

/**
 * Prepends a record (newest-first), caps the list at MAX_HISTORY, persists it,
 * and returns the new list. On a write failure the returned list is still
 * correct in-memory so the UI stays consistent for the session.
 */
export function saveRecord(record: GameRecord): GameRecord[] {
  const next = [record, ...loadHistory()].slice(0, MAX_HISTORY);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Quota exceeded or storage unavailable — keep going with the in-memory list.
  }
  return next;
}

/** Clears all saved history. */
export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing more we can do; the caller will reset its in-memory state.
  }
}
