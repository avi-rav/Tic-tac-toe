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

  it('calls onStart with trimmed names on valid submit', async () => {
    const { user, inputX, inputO, submit, onStart } = setup();
    await user.type(inputX, '  Alice  ');
    await user.type(inputO, 'Bob');
    await user.click(submit);
    expect(onStart).toHaveBeenCalledWith({ X: 'Alice', O: 'Bob' });
  });
});
