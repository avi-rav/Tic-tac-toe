import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistoryPage } from '../HistoryPage/HistoryPage';
import type { GameRecord } from '../../history/types';

function record(id: string, overrides: Partial<GameRecord> = {}): GameRecord {
  return {
    id,
    players: { X: 'Alice', O: 'Bob' },
    board: ['X', 'X', 'X', 'O', 'O', null, null, null, null],
    winningLine: [0, 1, 2],
    result: 'X',
    ...overrides,
  };
}

describe('HistoryPage', () => {
  it('shows an empty state when there is no history', () => {
    render(<HistoryPage history={[]} onBack={() => {}} onClear={() => {}} />);
    expect(screen.getByText(/no games played yet/i)).toBeInTheDocument();
    // Clear is disabled with nothing to clear.
    expect(screen.getByRole('button', { name: /clear/i })).toBeDisabled();
  });

  it('renders an entry with result and player names', () => {
    render(
      <HistoryPage history={[record('1')]} onBack={() => {}} onClear={() => {}} />,
    );
    const entry = screen.getByRole('listitem');
    expect(within(entry).getByText(/alice \(x\) won/i)).toBeInTheDocument();
    expect(within(entry).getByText(/alice vs bob/i)).toBeInTheDocument();
  });

  it('shows a draw result', () => {
    render(
      <HistoryPage
        history={[record('1', { result: 'draw', winningLine: null })]}
        onBack={() => {}}
        onClear={() => {}}
      />,
    );
    expect(screen.getByText(/^draw$/i)).toBeInTheDocument();
  });

  it('calls onClear when Clear is clicked', async () => {
    const onClear = vi.fn();
    const user = userEvent.setup();
    render(
      <HistoryPage history={[record('1')]} onBack={() => {}} onClear={onClear} />,
    );
    await user.click(screen.getByRole('button', { name: /clear/i }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('calls onBack when Back is clicked', async () => {
    const onBack = vi.fn();
    const user = userEvent.setup();
    render(
      <HistoryPage history={[]} onBack={onBack} onClear={() => {}} />,
    );
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });
});

// Verifies the localStorage-backed flow end to end at the component boundary.
describe('HistoryPage persistence (via useHistory through App)', () => {
  beforeEach(() => localStorage.clear());

  it('renders records that were already persisted', async () => {
    // Seed storage directly, then mount App and open History.
    localStorage.setItem('ttt:history', JSON.stringify([record('seeded')]));
    const { default: App } = await import('../../App');
    const user = userEvent.setup();
    render(<App />);
    // Start a game so the History button is reachable.
    await user.type(screen.getByLabelText(/player x/i), 'Alice');
    await user.type(screen.getByLabelText(/player o/i), 'Bob');
    await user.click(screen.getByRole('button', { name: /start game/i }));
    await user.click(screen.getByRole('button', { name: /history/i }));
    expect(screen.getByText(/alice \(x\) won/i)).toBeInTheDocument();
  });
});
