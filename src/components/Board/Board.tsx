import { Square } from '../Square/Square';
import type { BoardState } from '../../game/types';
import styles from './Board.module.css';

interface BoardProps {
  board: BoardState;
  winningLine: number[] | null;
  /** When true, no cell can be played (game over). */
  disabled: boolean;
  onCellClick: (index: number) => void;
  /** Optional extra class for the grid (e.g. a compact mini-board in history). */
  className?: string;
  /** Accessible label for the grid; defaults to the playable board's label. */
  label?: string;
}

/**
 * Pure presentational grid. It maps the board array onto Squares and flags the
 * winning cells — it owns no state and makes no rule decisions. A `className`
 * lets callers re-skin it (e.g. a small read-only board) without changing it.
 */
export function Board({
  board,
  winningLine,
  disabled,
  onCellClick,
  className,
  label = 'Tic-tac-toe board',
}: BoardProps) {
  return (
    <div
      className={`${styles.board} ${className ?? ''}`}
      role="grid"
      aria-label={label}
    >
      {board.map((value, index) => (
        <Square
          key={index}
          value={value}
          position={index + 1}
          isWinning={winningLine?.includes(index) ?? false}
          disabled={disabled}
          onClick={() => onCellClick(index)}
        />
      ))}
    </div>
  );
}
