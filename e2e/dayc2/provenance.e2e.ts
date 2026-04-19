/**
 * E2E Tests for Provenance Panel
 *
 * Tests the provenance drill-down feature and PDF page accuracy
 */

import { test, expect, Page } from '@playwright/test';

// Helper: set child age by seeding localStorage with DOB/test date that produce the target age
const setAge = async (page: Page, ageMonths: number) => {
  const testDate = new Date();
  const dob = new Date(testDate);
  dob.setMonth(dob.getMonth() - ageMonths);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  await page.evaluate(
    ([dobIso, testIso]) => {
      localStorage.setItem('slp:dayc2:dob', JSON.stringify(dobIso));
      localStorage.setItem('slp:dayc2:testDate', JSON.stringify(testIso));
    },
    [fmt(dob), fmt(testDate)]
  );
  await page.reload();
};

// Helper to enter a raw score for a subtest
const enterRawScore = async (page: Page, subtestId: string, score: number) => {
  const input = page.locator(`#raw-${subtestId}`);
  await input.fill(score.toString());
};

// Helper: click a computed score cell to open provenance
const clickScore = async (page: Page, subtestId: string) => {
  const container = page.locator(`#raw-${subtestId}`).locator('..').locator('..');
  const scoreCell = container.locator('[title="Tap to view calculation"]').first();
  await scoreCell.click();
};

// Helper: get all PDF page numbers from provenance panel links
const getPdfPagesFromPanel = async (page: Page): Promise<number[]> => {
  const links = page.locator('a[href*="DAYC2-Scoring-Manual.pdf#page="]');
  const count = await links.count();
  const pages: number[] = [];
  for (let i = 0; i < count; i++) {
    const href = await links.nth(i).getAttribute('href');
    const match = href?.match(/#page=(\d+)/);
    if (match) pages.push(parseInt(match[1], 10));
  }
  return pages;
};

test.describe('Provenance Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1024, height: 768 });
  });

  test('opens provenance panel when clicking a score', async ({ page }) => {
    await setAge(page, 12);
    await enterRawScore(page, 'receptiveLanguage', 10);
    await clickScore(page, 'receptiveLanguage');

    await expect(page.getByText('How was this calculated?')).toBeVisible();
  });

  test('displays lookup steps with table reference', async ({ page }) => {
    await setAge(page, 12);
    await enterRawScore(page, 'receptiveLanguage', 10);
    await clickScore(page, 'receptiveLanguage');

    await expect(page.getByText(/Table B\.13/)).toBeVisible();
  });

  test('closes provenance panel when clicking backdrop', async ({ page }) => {
    await setAge(page, 12);
    await enterRawScore(page, 'receptiveLanguage', 10);
    await clickScore(page, 'receptiveLanguage');
    await expect(page.getByText('How was this calculated?')).toBeVisible();

    await page.locator('.fixed.inset-0').first().click();
    await expect(page.getByText('How was this calculated?')).not.toBeVisible();
  });

  test('closes provenance panel with Escape key', async ({ page }) => {
    await setAge(page, 12);
    await enterRawScore(page, 'receptiveLanguage', 10);
    await clickScore(page, 'receptiveLanguage');
    await expect(page.getByText('How was this calculated?')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByText('How was this calculated?')).not.toBeVisible();
  });
});

test.describe('Provenance PDF page accuracy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1024, height: 768 });
  });

  // Helper: set age, enter raw score for a subtest, click its SS, return PDF page numbers
  const getProvenancePdfPages = async (
    page: Page,
    ageMonths: number,
    subtestId: string,
    rawScore: number,
  ): Promise<number[]> => {
    await setAge(page, ageMonths);
    await enterRawScore(page, subtestId, rawScore);
    await clickScore(page, subtestId);
    await expect(page.getByText('How was this calculated?')).toBeVisible();
    return getPdfPagesFromPanel(page);
  };

  // B17 (age 24mo), Social-Emotional subtest:
  //   raw 36 → csvRow 38, on page 12 (last row on page 1)
  //   raw 37 → csvRow 39, on page 13 (first row on page 2)
  test('B17 page 1: SE raw 36 links to page 12', async ({ page }) => {
    const pages = await getProvenancePdfPages(page, 24, 'socialEmotional', 36);
    expect(pages[0]).toBe(12);
  });

  test('B17 page 2: SE raw 37 links to page 13', async ({ page }) => {
    const pages = await getProvenancePdfPages(page, 24, 'socialEmotional', 37);
    expect(pages[0]).toBe(13);
  });

  // B13 (age 12mo), Social-Emotional subtest:
  //   raw 35 → csvRow 37, on page 4 (last row on page 1)
  //   raw 36 → csvRow 38, on page 5 (first row on page 2)
  test('B13 page 1: SE raw 35 links to page 4', async ({ page }) => {
    const pages = await getProvenancePdfPages(page, 12, 'socialEmotional', 35);
    expect(pages[0]).toBe(4);
  });

  test('B13 page 2: SE raw 36 links to page 5', async ({ page }) => {
    const pages = await getProvenancePdfPages(page, 12, 'socialEmotional', 36);
    expect(pages[0]).toBe(5);
  });

  // B29 (age 66mo), Social-Emotional subtest:
  //   raw 58 → csvRow 60, on page 36 (last row on page 1)
  //   raw 59 → csvRow 61, on page 37 (first row on page 2)
  test('B29 page 1: SE raw 58 links to page 36', async ({ page }) => {
    const pages = await getProvenancePdfPages(page, 66, 'socialEmotional', 58);
    expect(pages[0]).toBe(36);
  });

  test('B29 page 2: SE raw 59 links to page 37', async ({ page }) => {
    const pages = await getProvenancePdfPages(page, 66, 'socialEmotional', 59);
    expect(pages[0]).toBe(37);
  });

  // Percentile provenance shows 2 steps: B table + C1 (page 38)
  test('percentile provenance includes C1 page 38', async ({ page }) => {
    await setAge(page, 24);
    await enterRawScore(page, 'socialEmotional', 10);

    // Click the percentile score (2nd clickable score: SS, %ile, Age Eq)
    const container = page.locator('#raw-socialEmotional').locator('..').locator('..');
    const scoreCells = container.locator('[title="Tap to view calculation"]');
    await scoreCells.nth(1).click();
    await expect(page.getByText('How was this calculated?')).toBeVisible();

    const pages = await getPdfPagesFromPanel(page);
    expect(pages.length).toBeGreaterThanOrEqual(2);
    expect(pages).toContain(38);
  });

  // A1 (Age Equivalent) spans 3 pages: 1 (csvRow ≤27), 2 (28-53), 3 (>53)
  // SE raw 33 → ageMonths 25 (csvRow 27, page 1)
  // SE raw 34 → ageMonths 26 (csvRow 28, page 2)
  test('A1 page 1: SE age equivalent for raw 33 links to page 1', async ({ page }) => {
    await setAge(page, 24);
    await enterRawScore(page, 'socialEmotional', 33);

    const container = page.locator('#raw-socialEmotional').locator('..').locator('..');
    const scoreCells = container.locator('[title="Tap to view calculation"]');
    // Age Equivalent is the 3rd clickable score
    await scoreCells.nth(2).click();
    await expect(page.getByText('How was this calculated?')).toBeVisible();

    const pages = await getPdfPagesFromPanel(page);
    expect(pages[0]).toBe(1);
  });

  test('A1 page 2: SE age equivalent for raw 34 links to page 2', async ({ page }) => {
    await setAge(page, 24);
    await enterRawScore(page, 'socialEmotional', 34);

    const container = page.locator('#raw-socialEmotional').locator('..').locator('..');
    const scoreCells = container.locator('[title="Tap to view calculation"]');
    await scoreCells.nth(2).click();
    await expect(page.getByText('How was this calculated?')).toBeVisible();

    const pages = await getPdfPagesFromPanel(page);
    expect(pages[0]).toBe(2);
  });

  // EL raw 34 → ageMonths 51 (csvRow 53, page 2)
  // EL raw 35 → ageMonths 54 (csvRow 56, page 3)
  test('A1 page 2→3: EL age equivalent for raw 34 links to page 2', async ({ page }) => {
    await setAge(page, 66);
    await enterRawScore(page, 'expressiveLanguage', 34);

    const container = page.locator('#raw-expressiveLanguage').locator('..').locator('..');
    const scoreCells = container.locator('[title="Tap to view calculation"]');
    await scoreCells.nth(2).click();
    await expect(page.getByText('How was this calculated?')).toBeVisible();

    const pages = await getPdfPagesFromPanel(page);
    expect(pages[0]).toBe(2);
  });

  test('A1 page 3: EL age equivalent for raw 35 links to page 3', async ({ page }) => {
    await setAge(page, 66);
    await enterRawScore(page, 'expressiveLanguage', 35);

    const container = page.locator('#raw-expressiveLanguage').locator('..').locator('..');
    const scoreCells = container.locator('[title="Tap to view calculation"]');
    await scoreCells.nth(2).click();
    await expect(page.getByText('How was this calculated?')).toBeVisible();

    const pages = await getPdfPagesFromPanel(page);
    expect(pages[0]).toBe(3);
  });
});

test.describe('Reverse lookup provenance PDF page accuracy', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1024, height: 768 });
  });

  test('target provenance includes both C1 and B table pages', async ({ page }) => {
    await setAge(page, 24);

    // Click a target raw score value in the Targets section
    const targetCell = page.locator('[title="Click to view calculation details"]').first();
    await targetCell.click();
    await expect(page.getByText('How was this calculated?')).toBeVisible();

    const pages = await getPdfPagesFromPanel(page);
    // Should have C1 step (page 38) and B17 step (page 12 or 13)
    expect(pages).toContain(38);
    expect(pages.some((p) => p >= 12 && p <= 13)).toBe(true);
  });
});
