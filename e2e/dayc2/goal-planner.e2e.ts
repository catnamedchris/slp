/**
 * E2E Tests for Targets (Reverse Lookup)
 *
 * Tests target percentile input and viewing required raw scores
 */

import { test, expect, Page } from '@playwright/test';

// Helper to seed DOB + test date via localStorage (fixed dates for deterministic tests)
const seedDates = async (page: Page, dob: string, testDate: string) => {
  await page.evaluate(
    ([dobIso, testIso]) => {
      localStorage.setItem('slp:dayc2:dob', JSON.stringify(dobIso));
      localStorage.setItem('slp:dayc2:testDate', JSON.stringify(testIso));
    },
    [dob, testDate],
  );
  await page.reload();
};

test.describe('Targets / Reverse Lookup', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1024, height: 768 });
  });

  test('shows Targets section when age is valid', async ({ page }) => {
    await seedDates(page, '2023-06-15', '2025-06-15');

    await expect(page.getByText('Targets')).toBeVisible();
    await expect(page.locator('#targetPercentile')).toBeVisible();
  });

  test('hides Targets section when no valid age', async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await expect(page.locator('#targetPercentile')).not.toBeVisible();
  });

  test('default target percentile is 6', async ({ page }) => {
    await seedDates(page, '2023-06-15', '2025-06-15');

    await expect(page.locator('#targetPercentile')).toHaveValue('6');
  });

  test('shows exact target values for default 6th percentile', async ({ page }) => {
    await seedDates(page, '2023-06-15', '2025-06-15');

    // At 24mo, 6th percentile targets are: RL=12, EL=11, SE=19
    // The target cells are clickable divs with title="Click to view calculation details"
    const targetCells = page.locator('[title="Click to view calculation details"]');
    await expect(targetCells.nth(0)).toHaveText('12');
    await expect(targetCells.nth(1)).toHaveText('11');
    await expect(targetCells.nth(2)).toHaveText('19');
  });

  test('changing percentile updates target values', async ({ page }) => {
    await seedDates(page, '2023-06-15', '2025-06-15');

    // Default targets at 6th percentile
    const targetCells = page.locator('[title="Click to view calculation details"]');
    await expect(targetCells.nth(0)).toHaveText('12');

    // Change to 50th percentile — values should change
    await page.locator('#targetPercentile').fill('50');
    await expect(targetCells.nth(0)).not.toHaveText('12');
  });

  test('target cells are clickable with provenance', async ({ page }) => {
    await seedDates(page, '2023-06-15', '2025-06-15');

    const cell = page.locator('[title="Click to view calculation details"]').first();
    await cell.click();

    await expect(page.getByText('How was this calculated?')).toBeVisible();
  });
});

test.describe('Targets Sticky Bar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Use a short viewport so scrolling reliably triggers the sticky state
    await page.setViewportSize({ width: 1024, height: 500 });
  });

  // Helper: scroll to bottom and wait for intersection observer
  const scrollToSticky = async (page: Page) => {
    await page.evaluate(async () => {
      window.scrollTo(0, document.body.scrollHeight);
      // Allow intersection observer callback to fire
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
  };

  test('shows sticky bar with target values when scrolled', async ({ page }) => {
    await seedDates(page, '2023-06-15', '2025-06-15');

    // Enter some raw scores so page has content to scroll
    await page.locator('#raw-receptiveLanguage').fill('10');
    await page.locator('#raw-expressiveLanguage').fill('10');
    await page.locator('#raw-socialEmotional').fill('10');

    await scrollToSticky(page);

    // When stuck, targets are rendered as <button> elements (not divs)
    await expect(page.locator('button[title="Click to view calculation details"]').first()).toBeVisible({ timeout: 10000 });

    // Verify age appears in sticky bar
    await expect(page.getByText('24 mo', { exact: true }).first()).toBeVisible();
  });

  test('sticky bar targets are clickable for provenance', async ({ page }) => {
    await seedDates(page, '2023-06-15', '2025-06-15');

    await page.locator('#raw-receptiveLanguage').fill('10');
    await page.locator('#raw-expressiveLanguage').fill('10');
    await page.locator('#raw-socialEmotional').fill('10');

    await scrollToSticky(page);

    const stickyButton = page.locator('button[title="Click to view calculation details"]').first();
    await expect(stickyButton).toBeVisible({ timeout: 10000 });
    await stickyButton.click({ force: true });

    await expect(page.getByText('How was this calculated?')).toBeVisible();
  });
});
