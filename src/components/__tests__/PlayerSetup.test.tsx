import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlayerSetup } from '../PlayerSetup/PlayerSetup';

function setup() {
  const onStart = vi.fn();
  render(<PlayerSetup onStart={onStart} />);
  return {
    onStart,
    user: userEvent.setup(),
    inputX: screen.getByLabelText(/player x/i),
    inputO: screen.getByLabelText(/player o/i),
    submit: screen.getByRole('button', { name: /start game/i }),
  };
}

describe('PlayerSetup', () => {
  it('disables submit until the form is valid', () => {
    const { submit } = setup();
    expect(submit).toBeDisabled();
  });

  it('shows an error for a too-short name', async () => {
    const { user, inputX } = setup();
    await user.type(inputX, 'A');
    await user.tab(); // blur to trigger onTouched validation
    expect(
      await screen.findByText(/at least 2 characters/i),
    ).toBeInTheDocument();
  });

  it('shows an error when both names are identical', async () => {
    const { user, inputX, inputO } = setup();
    await user.type(inputX, 'Sam');
    await user.type(inputO, 'sam'); // case-insensitive match
    await user.tab();
    expect(
      await screen.findByText(/must have different names/i),
    ).toBeInTheDocument();
  });

  it('calls onStart with trimmed names and a human opponent on valid submit', async () => {
    const { user, inputX, inputO, submit, onStart } = setup();
    await user.type(inputX, '  Alice  ');
    await user.type(inputO, 'Bob');
    await user.click(submit);
    expect(onStart).toHaveBeenCalledWith(
      { X: 'Alice', O: 'Bob' },
      { kind: 'human' },
    );
  });

  describe('vs Computer mode', () => {
    it('hides the Player O input and shows a difficulty selector', async () => {
      const { user } = setup();
      await user.click(screen.getByLabelText(/vs computer/i));
      expect(screen.queryByLabelText(/player o/i)).not.toBeInTheDocument();
      expect(screen.getByLabelText(/difficulty/i)).toBeInTheDocument();
      // Only the human name is required now.
      expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    });

    it('starts a game with an AI opponent at the chosen difficulty', async () => {
      const { user, onStart } = setup();
      await user.click(screen.getByLabelText(/vs computer/i));
      await user.type(screen.getByLabelText(/your name/i), 'Alice');
      await user.selectOptions(screen.getByLabelText(/difficulty/i), 'hard');
      await user.click(screen.getByRole('button', { name: /start game/i }));
      expect(onStart).toHaveBeenCalledWith(
        { X: 'Alice', O: 'Computer' },
        { kind: 'ai', difficulty: 'hard' },
      );
    });
  });
});
