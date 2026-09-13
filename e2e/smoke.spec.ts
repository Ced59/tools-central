import { expect, test } from '@playwright/test';

test('home, locale and theme remain usable', async ({ page }) => {
  await page.goto('/fr/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Vos outils en ligne');
  await expect(page.locator('html')).toHaveAttribute('lang', 'fr');

  await page.locator('.theme-toggle').click();
  await expect(page.locator('html')).toHaveClass(/dark-mode/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('theme'))).toBe('dark');

  await page.locator('.locale-select').selectOption('en');
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('percentage calculator recomputes a real result', async ({ page }) => {
  await page.goto('/fr/categories/math/percentages/percentage-of-number');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pourcentage d’un nombre');
  await page.locator('#percent').fill('12.5');
  await page.locator('#base').fill('240');

  await expect(page.locator('.result-item.highlight .result-value')).toHaveText('30.00');
  await page.getByRole('button', { name: 'Réinitialiser' }).click();
  await expect(page.locator('.result-item.highlight .result-value')).toHaveText('16.00');
});

test('unknown routes return the localized 404 page', async ({ page }) => {
  const response = await page.goto('/fr/route-inconnue');

  expect(response?.status()).toBe(404);
  await expect(page).toHaveURL(/\/fr\/route-inconnue$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cette page est introuvable');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
});
