/**
 * E2E Tests for the full scoring flow
 *
 * Tests the complete workflow: set age → enter raw scores → verify results
 */

import { test, expect, Page } from '@playwright/test';

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

const enterRawScore = async (page: Page, subtestId: string, score: number) => {
  const input = page.locator(`#raw-${subtestId}`);
  await input.fill(score.toString());
};

const getSubtestScores = async (page: Page, subtestId: string) => {
  const container = page.locator(`#raw-${subtestId}`).locator('..').locator('..');
  const scoreValues = container.locator('.score-value');
  return {
    standardScore: (await scoreValues.nth(0).textContent())?.trim() ?? '',
    percentile: (await scoreValues.nth(1).textContent())?.trim() ?? '',
    ageEquivalent: (await scoreValues.nth(2).textContent())?.trim() ?? '',
  };
};

test.describe('Score Entry and Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1024, height: 768 });
  });

  test('shows placeholder dashes before score entry', async ({ page }) => {
    await seedDates(page, '2023-06-15', '2025-06-15'); // 24mo

    for (const id of ['receptiveLanguage', 'expressiveLanguage', 'socialEmotional']) {
      const scores = await getSubtestScores(page, id);
      expect(scores.standardScore).toBe('—');
      expect(scores.percentile).toBe('—');
      expect(scores.ageEquivalent).toBe('—');
    }
  });

  test('enters raw score and displays calculated results', async ({ page }) => {
    await seedDates(page, '2024-06-15', '2025-06-15'); // 12mo
    await enterRawScore(page, 'receptiveLanguage', 10);

    const scores = await getSubtestScores(page, 'receptiveLanguage');
    expect(scores.standardScore).toBe('84');
    expect(scores.percentile).toBe('14%');
  });

  test('all three subtests show correct scores', async ({ page }) => {
    await seedDates(page, '2024-06-15', '2025-06-15'); // 12mo

    await enterRawScore(page, 'receptiveLanguage', 10);
    const rl = await getSubtestScores(page, 'receptiveLanguage');
    expect(rl.standardScore).toBe('84');
    expect(rl.percentile).toBe('14%');

    await enterRawScore(page, 'socialEmotional', 10);
    const se = await getSubtestScores(page, 'socialEmotional');
    expect(se.standardScore).toBe('65');

    await enterRawScore(page, 'expressiveLanguage', 10);
    const el = await getSubtestScores(page, 'expressiveLanguage');
    expect(el.standardScore).not.toBe('—');
  });

  test('handles lower boundary scores (<50)', async ({ page }) => {
    await seedDates(page, '2024-06-15', '2025-06-15'); // 12mo
    await enterRawScore(page, 'socialEmotional', 2);

    const scores = await getSubtestScores(page, 'socialEmotional');
    expect(scores.standardScore).toBe('<50');
  });

  test('handles upper boundary scores (>150)', async ({ page }) => {
    await seedDates(page, '2024-06-15', '2025-06-15'); // 12mo
    await enterRawScore(page, 'socialEmotional', 45);

    const scores = await getSubtestScores(page, 'socialEmotional');
    expect(scores.standardScore).toBe('>150');
  });

  test('updates results when raw score changes', async ({ page }) => {
    await seedDates(page, '2024-06-15', '2025-06-15'); // 12mo

    await enterRawScore(page, 'socialEmotional', 10);
    let scores = await getSubtestScores(page, 'socialEmotional');
    expect(scores.standardScore).toBe('65');

    await enterRawScore(page, 'socialEmotional', 15);
    scores = await getSubtestScores(page, 'socialEmotional');
    expect(scores.standardScore).toBe('79');
  });

  test('updates results when age changes', async ({ page }) => {
    await seedDates(page, '2024-06-15', '2025-06-15'); // 12mo
    await enterRawScore(page, 'receptiveLanguage', 10);

    const scoresAt12 = await getSubtestScores(page, 'receptiveLanguage');
    const ssAt12 = scoresAt12.standardScore;

    await seedDates(page, '2023-06-15', '2025-06-15'); // 24mo
    await enterRawScore(page, 'receptiveLanguage', 10);

    const scoresAt24 = await getSubtestScores(page, 'receptiveLanguage');
    const ssAt24 = scoresAt24.standardScore;

    expect(ssAt12).not.toBe(ssAt24);
  });

  test('clearing raw score returns to dashes', async ({ page }) => {
    await seedDates(page, '2024-06-15', '2025-06-15'); // 12mo
    await enterRawScore(page, 'receptiveLanguage', 10);

    const scores = await getSubtestScores(page, 'receptiveLanguage');
    expect(scores.standardScore).toBe('84');

    await page.locator('#raw-receptiveLanguage').fill('');

    const cleared = await getSubtestScores(page, 'receptiveLanguage');
    expect(cleared.standardScore).toBe('—');
    expect(cleared.percentile).toBe('—');
    expect(cleared.ageEquivalent).toBe('—');
  });
});

test.describe('Communication Composite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1024, height: 768 });
  });

  test('shows composite sum for RL + EL', async ({ page }) => {
    await seedDates(page, '2023-06-15', '2025-06-15'); // 24mo
    await enterRawScore(page, 'receptiveLanguage', 20);
    await enterRawScore(page, 'expressiveLanguage', 18);

    const compositeSection = page.getByText('Composite', { exact: true }).locator('..').locator('..').locator('..');
    const sumValue = compositeSection.locator('.score-value').first();
    await expect(sumValue).toHaveText('203');
  });

  test('shows composite standard score and percentile', async ({ page }) => {
    await seedDates(page, '2023-06-15', '2025-06-15'); // 24mo
    await enterRawScore(page, 'receptiveLanguage', 20);
    await enterRawScore(page, 'expressiveLanguage', 18);

    const compositeSection = page.getByText('Composite', { exact: true }).locator('..').locator('..').locator('..');
    const scoreValues = compositeSection.locator('.score-value');
    const ss = (await scoreValues.nth(1).textContent())?.trim() ?? '';
    const pct = (await scoreValues.nth(2).textContent())?.trim() ?? '';

    expect(ss).toBe('103');
    expect(pct).toBe('58%');
  });

  test('composite stays blank until both RL and EL entered', async ({ page }) => {
    await seedDates(page, '2023-06-15', '2025-06-15'); // 24mo
    await enterRawScore(page, 'receptiveLanguage', 20);

    const compositeSection = page.getByText('Composite', { exact: true }).locator('..').locator('..').locator('..');
    const sumValue = compositeSection.locator('.score-value').first();
    await expect(sumValue).toHaveText('—');

    await enterRawScore(page, 'expressiveLanguage', 18);
    await expect(sumValue).not.toHaveText('—');
  });
});

test.describe('Eligibility Highlighting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1024, height: 768 });
  });

  test('highlights raw input when score exceeds target', async ({ page }) => {
    await seedDates(page, '2024-06-15', '2025-06-15'); // 12mo
    await enterRawScore(page, 'socialEmotional', 30);

    const input = page.locator('#raw-socialEmotional');
    await expect(input).toHaveClass(/bg-red-50/);
  });

  test('eligibility highlight removed when score lowered', async ({ page }) => {
    await seedDates(page, '2024-06-15', '2025-06-15'); // 12mo
    await enterRawScore(page, 'socialEmotional', 30);

    const input = page.locator('#raw-socialEmotional');
    await expect(input).toHaveClass(/bg-red-50/);

    await input.fill('2');
    await expect(input).not.toHaveClass(/bg-red-50/);
  });
});
