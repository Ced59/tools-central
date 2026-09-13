import { expect, test } from '@playwright/test';

type PerformanceSnapshot = {
  cls: number;
  domContentLoaded: number;
  lcp: number;
};

declare global {
  interface Window {
    __toolsCentralPerformance?: { cls: number; lcp: number };
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.__toolsCentralPerformance = { cls: 0, lcp: 0 };

    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries.at(-1);
      if (last && window.__toolsCentralPerformance) {
        window.__toolsCentralPerformance.lcp = last.startTime;
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & {
          hadRecentInput: boolean;
          value: number;
        };
        if (!shift.hadRecentInput && window.__toolsCentralPerformance) {
          window.__toolsCentralPerformance.cls += shift.value;
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
});

test('mobile home stays within the laboratory Web Vitals guardrails', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/fr/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.waitForLoadState('networkidle');
  await expect
    .poll(
      () => page.evaluate(() => window.__toolsCentralPerformance?.lcp ?? 0),
      { message: 'Chromium doit publier une mesure LCP', timeout: 3_000 },
    )
    .toBeGreaterThan(0);

  const snapshot = await page.evaluate<PerformanceSnapshot>(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return {
      cls: window.__toolsCentralPerformance?.cls ?? 0,
      domContentLoaded: navigation.domContentLoadedEventEnd,
      lcp: window.__toolsCentralPerformance?.lcp ?? 0,
    };
  });

  console.info(`[perf] ${JSON.stringify(snapshot)}`);
  expect(snapshot.lcp).toBeGreaterThan(0);
  expect(snapshot.lcp).toBeLessThanOrEqual(2_500);
  expect(snapshot.cls).toBeLessThanOrEqual(0.1);
  expect(snapshot.domContentLoaded).toBeLessThanOrEqual(3_000);

  const interactionStartedAt = performance.now();
  await page.locator('.theme-toggle').click();
  await expect(page.locator('html')).toHaveClass(/dark-mode/);
  const interactionLatency = performance.now() - interactionStartedAt;
  console.info(`[perf] theme interaction ${interactionLatency.toFixed(1)} ms`);
  expect(interactionLatency).toBeLessThan(500);
});
