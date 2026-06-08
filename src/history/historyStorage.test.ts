import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  loadHistory,
  saveRecord,
  clearHistory,
  MAX_HISTORY,
} from './historyStorage';
import type { GameRecord } from './types';

const STORAGE_KEY = 'ttt:history';

function makeRecord(id: string): GameRecord {
  return {
    id,
    players: { X: 'Alice', O: 'Bob' },
    board: ['X', 'X', 'X', 'O', 'O', null, null, null, null],
    winningLine: [0, 1, 2],
    result: 'X',
  };
}

describe('historyStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns an empty list when nothing is stored', () => {
    expect(loadHistory()).toEqual([]);
  });

  it('saves a record and reads it back', () => {
    saveRecord(makeRecord('1'));
    const history = loadHistory();
    expect(history).toHaveLength(1);
    expect(history[0].id).toBe('1');
  });

  it('stores newest-first', () => {
    saveRecord(makeRecord('1'));
    saveRecord(makeRecord('2'));
    expect(loadHistory().map((r) => r.id)).toEqual(['2', '1']);
  });

  it('caps the list at MAX_HISTORY', () => {
    for (let i = 0; i < MAX_HISTORY + 5; i++) {
      saveRecord(makeRecord(`r${i}`));
    }
    expect(loadHistory()).toHaveLength(MAX_HISTORY);
  });

  it('clears the history', () => {
    saveRecord(makeRecord('1'));
    clearHistory();
    expect(loadHistory()).toEqual([]);
  });

  it('degrades to an empty list on corrupt JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json');
    expect(loadHistory()).toEqual([]);
  });

  it('degrades to an empty list when stored value is not an array', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: 'bar' }));
    expect(loadHistory()).toEqual([]);
  });

  it('does not throw when localStorage.getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(loadHistory()).toEqual([]);
  });

  it('still returns the new list when setItem throws (quota)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded');
    });
    const result = saveRecord(makeRecord('1'));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });
});
