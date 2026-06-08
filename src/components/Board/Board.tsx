import { Square } from '../Square/Square';
import type { BoardState } from '../../game/types';
import styles from './Board.module.css';

interface BoardProps {
  board: BoardState;
  winningLine: number[] | null;
  /** When true, no cell can be played (game over). */
  disabled: boolean;
  onCellClick: (index: number) => void;
}

/**
 * Pure presentational grid. It maps the board array onto Squares and flags the
 * winning cells — it owns no state and makes no rule decisions.
 */
export function Board({ board, winningLine, disabled, onCellClick }: BoardProps) {
  return (
    <div className={styles.board} role="grid" aria-label="Tic-tac-toe board">
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
