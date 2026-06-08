import { type Page, type Locator, expect } from '@playwright/test';

/** Loads the app and advances past the setup form into a live game. */
export async function startGame(page: Page, xName = 'Alice', oName = 'Bob') {
  await page.goto('/');
  await page.getByLabel(/player x/i).fill(xName);
  await page.getByLabel(/player o/i).fill(oName);
  await page.getByRole('button', { name: /start game/i }).click();
  await expect(page.getByRole('grid')).toBeVisible();
}

/** Returns the board cell button at the given 1-based position. */
export function cell(page: Page, position: number): Locator {
  return page.getByRole('button', {
    name: new RegExp(`^Cell ${position},`),
  });
}

/** The live status region (turn / win / draw message). */
export function status(page: Page): Locator {
  return page.getByRole('status');
}
