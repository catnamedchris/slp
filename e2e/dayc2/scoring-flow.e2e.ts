/**
 * E2E Tests for the full scoring flow
 *
 * Tests the complete workflow: set age → enter raw scores → verify results
 */

import { test, expect, Page } from '@playwright/test';

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
    await setAge(page, 24);

    for (const id of ['receptiveLanguage', 'expressiveLanguage', 'socialEmotional']) {
      const scores = await getSubtestScores(page, id);
      expect(scores.standardScore).toBe('—');
      expect(scores.percentile).toBe('—');
      expect(scores.ageEquivalent).toBe('—');
    }
  });

  test('enters raw score and displays calculated results', async ({ page }) => {
    await setAge(page, 12);
    await enterRawScore(page, 'receptiveLanguage', 10);

    const scores = await getSubtestScores(page, 'receptiveLanguage');
    expect(scores.standardScore).toBe('84');
    expect(scores.percentile).toBe('14%');
  });

  test('all three subtests can be scored', async ({ page }) => {
    await setAge(page, 12);

    for (const id of ['receptiveLanguage', 'expressiveLanguage', 'socialEmotional']) {
      await enterRawScore(page, id, 10);
      const scores = await getSubtestScores(page, id);
      expect(scores.standardScore).not.toBe('—');
    }
  });

  test('handles lower boundary scores (<50)', async ({ page }) => {
    await setAge(page, 12);
    await enterRawScore(page, 'socialEmotional', 2);

    const scores = await getSubtestScores(page, 'socialEmotional');
    expect(scores.standardScore).toBe('<50');
  });

  test('handles upper boundary scores (>150)', async ({ page }) => {
    await setAge(page, 12);
    await enterRawScore(page, 'socialEmotional', 45);

    const scores = await getSubtestScores(page, 'socialEmotional');
    expect(scores.standardScore).toBe('>150');
  });

  test('updates results when raw score changes', async ({ page }) => {
    await setAge(page, 12);

    await enterRawScore(page, 'socialEmotional', 10);
    let scores = await getSubtestScores(page, 'socialEmotional');
    expect(scores.standardScore).toBe('65');

    await enterRawScore(page, 'socialEmotional', 15);
    scores = await getSubtestScores(page, 'socialEmotional');
    expect(scores.standardScore).toBe('79');
  });

  test('updates results when age changes', async ({ page }) => {
    await setAge(page, 12);
    await enterRawScore(page, 'receptiveLanguage', 10);

    const scoresAt12 = await getSubtestScores(page, 'receptiveLanguage');
    const ssAt12 = scoresAt12.standardScore;

    await setAge(page, 24);
    await enterRawScore(page, 'receptiveLanguage', 10);

    const scoresAt24 = await getSubtestScores(page, 'receptiveLanguage');
    const ssAt24 = scoresAt24.standardScore;

    expect(ssAt12).not.toBe(ssAt24);
  });
});

test.describe('Communication Composite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1024, height: 768 });
  });

  test('shows composite sum for RL + EL', async ({ page }) => {
    await setAge(page, 12);
    await enterRawScore(page, 'receptiveLanguage', 10);
    await enterRawScore(page, 'expressiveLanguage', 10);

    // Navigate from the unique "Composite" badge up to CompositeFooter root
    // Badge(span) → header(div) → left column(div) → root(div)
    const compositeSection = page.getByText('Composite', { exact: true }).locator('..').locator('..').locator('..');
    const sumValue = compositeSection.locator('.score-value').first();
    await expect(sumValue).toHaveText('174');
  });

  test('shows composite standard score and percentile', async ({ page }) => {
    await setAge(page, 12);
    await enterRawScore(page, 'receptiveLanguage', 10);
    await enterRawScore(page, 'expressiveLanguage', 10);

    const compositeSection = page.getByText('Composite', { exact: true }).locator('..').locator('..').locator('..');
    const scoreValues = compositeSection.locator('.score-value');
    const ss = (await scoreValues.nth(1).textContent())?.trim() ?? '';
    const pct = (await scoreValues.nth(2).textContent())?.trim() ?? '';

    expect(ss).not.toBe('—');
    expect(pct).not.toBe('—');
  });
});

test.describe('Eligibility Highlighting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.setViewportSize({ width: 1024, height: 768 });
  });

  test('highlights raw input when score exceeds target', async ({ page }) => {
    await setAge(page, 12);
    await enterRawScore(page, 'socialEmotional', 30);

    const input = page.locator('#raw-socialEmotional');
    await expect(input).toHaveClass(/bg-red-50/);
  });
});
