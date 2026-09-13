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

test('SERP snippet preview adapts its pixel budget to mobile', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/fr/categories/dev/seo/serp-snippet-preview');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Prévisualiseur de snippet Google');
  await expect(page.getByText('580 px', { exact: false })).toBeVisible();

  await page.getByRole('button', { name: 'Mobile' }).click();

  await expect(page.getByText('520 px', { exact: false })).toBeVisible();
  await expect(page.getByTestId('serp-preview')).toHaveClass(/browser-frame--mobile/);
  await expect.poll(async () => {
    const grid = await page.locator('.workspace-grid').boundingBox();
    const editor = await page.locator('.editor').boundingBox();
    return grid && editor ? editor.width <= grid.width + 1 : false;
  }).toBe(true);
  await expect.poll(async () => {
    const card = await page.locator('.workspace-card').boundingBox();
    const preview = await page.getByTestId('serp-preview').boundingBox();
    return card && preview
      ? preview.x >= card.x && preview.x + preview.width <= card.x + card.width + 1
      : false;
  }).toBe(true);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('robots.txt builder validates and simulates a blocking rule locally', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/fr/categories/dev/seo/robots-txt-builder');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Générateur et validateur robots.txt');
  await expect(page.getByText('Aucun problème détecté')).toBeVisible();

  await page.locator('#robots-content').fill('User-agent: *\nDisallow: /');
  await expect(page.getByTestId('robots-decision')).toContainText('Exploration bloquée');

  await page.locator('#robots-test-url').fill('/robots.txt');
  await expect(page.getByTestId('robots-decision')).toContainText('Exploration autorisée');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('sitemap XML builder generates, validates and remains responsive', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/fr/categories/dev/seo/sitemap-xml-builder');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Générateur et validateur sitemap XML');
  await expect(page.getByText('Aucun problème détecté')).toBeVisible();

  await page.locator('#sitemap-source-lines').fill('/produits/café?tri=nom&ordre=asc | 2026-09-01');
  await page.getByRole('button', { name: 'Générer et remplacer l’éditeur' }).click();

  await expect(page.locator('#sitemap-content')).toHaveValue(/caf%C3%A9\?tri=nom&amp;ordre=asc/);
  await expect(page.getByTestId('sitemap-analysis')).toContainText('1');

  await page.locator('#sitemap-content').fill('<urlset>');
  await expect(page.getByText('Le document XML est mal formé', { exact: false })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
