import { memo } from 'react';
import type { CellValue } from '../../game/types';
import styles from './Square.module.css';

interface SquareProps {
  value: CellValue;
  /** 1-based position, used only for the accessible label. */
  position: number;
  isWinning: boolean;
  disabled: boolean;
  onClick: () => void;
}

/**
 * A single, interchangeable board cell. It receives only what it needs to render
 * itself (Interface Segregation) and holds no game knowledge — every Square is
 * substitutable for any other (Liskov). Memoized since most cells don't change
 * between renders.
 */
function SquareComponent({
  value,
  position,
  isWinning,
  disabled,
  onClick,
}: SquareProps) {
  const label = value
    ? `Cell ${position}, ${value}`
    : `Cell ${position}, empty`;

  return (
    <button
      type="button"
      className={`${styles.square} ${isWinning ? styles.winning : ''}`}
      onClick={onClick}
      disabled={disabled || value !== null}
      aria-label={label}
      data-value={value ?? undefined}
    >
      {value}
    </button>
  );
}

export const Square = memo(SquareComponent);
