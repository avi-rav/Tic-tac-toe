import { test, expect } from '@playwright/test';
import { startGame, cell, status } from './helpers';

test.describe('Tic-Tac-Toe — core flows (real browser)', () => {
  test('setup → play: board appears and shows the first turn', async ({ page }) => {
    await startGame(page);
    await expect(page.getByRole('grid')).toBeVisible();
    await expect(status(page)).toHaveText(/alice's turn \(x\)/i);
  });

  test('declares the winner by name after a winning line', async ({ page }) => {
    await startGame(page);
    // X takes the top row (1,2,3); O plays 4,5.
    await cell(page, 1).click(); // X
    await cell(page, 4).click(); // O
    await cell(page, 2).click(); // X
    await cell(page, 5).click(); // O
    await cell(page, 3).click(); // X completes 1-2-3
    await expect(status(page)).toHaveText(/alice \(x\) wins!/i);
  });

  test('highlights the winning line (real CSS)', async ({ page }) => {
    await startGame(page);
    await cell(page, 1).click();
    await cell(page, 4).click();
    await cell(page, 2).click();
    await cell(page, 5).click();
    await cell(page, 3).click();
    // The three winning cells carry the CSS-module "winning" class.
    await expect(cell(page, 1)).toHaveClass(/winning/);
    await expect(cell(page, 2)).toHaveClass(/winning/);
    await expect(cell(page, 3)).toHaveClass(/winning/);
    // A non-winning cell does not.
    await expect(cell(page, 5)).not.toHaveClass(/winning/);
  });

  test('a played cell is disabled and cannot be re-clicked', async ({ page }) => {
    await startGame(page);
    await cell(page, 1).click(); // X plays cell 1
    // The cell is now a disabled button — the UI prevents re-playing it.
    await expect(cell(page, 1)).toBeDisabled();
    // Force a click past the disabled guard to prove it still has no effect.
    await cell(page, 1).click({ force: true });
    await expect(cell(page, 1)).toHaveText('X');
    await expect(status(page)).toHaveText(/bob's turn \(o\)/i);
  });

  test('detects a draw when the board fills with no winner', async ({ page }) => {
    await startGame(page);
    // A full board with no three-in-a-row.
    // Final: X O X / X O O / O X X
    const moves = [1, 2, 3, 5, 4, 6, 8, 7, 9];
    for (const m of moves) {
      await cell(page, m).click();
    }
    await expect(status(page)).toHaveText(/it's a draw!/i);
  });

  test('New Game keeps scores; Change Players returns to the form', async ({ page }) => {
    await startGame(page);
    // Alice (X) wins once.
    await cell(page, 1).click();
    await cell(page, 4).click();
    await cell(page, 2).click();
    await cell(page, 5).click();
    await cell(page, 3).click();
    await expect(status(page)).toHaveText(/wins!/i);

    await page.getByRole('button', { name: /new game/i }).click();
    // Board cleared, back to Alice's turn...
    await expect(cell(page, 1)).toHaveText('');
    await expect(status(page)).toHaveText(/alice's turn/i);
    // ...but the win is still on the scoreboard.
    const scoreboard = page.getByRole('list', { name: /scoreboard/i });
    const aliceEntry = scoreboard.locator('li', { hasText: /alice \(x\)/i });
    await expect(aliceEntry).toContainText('1');

    // Change Players returns to the setup form.
    await page.getByRole('button', { name: /change players/i }).click();
    await expect(page.getByLabel(/player x/i)).toBeVisible();
  });
});
