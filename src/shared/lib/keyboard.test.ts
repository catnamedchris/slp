import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { advanceFocus } from './keyboard';

describe('advanceFocus', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.innerHTML = `
      <input id="dob" />
      <input id="testDate" />
      <input id="targetPercentile" />
      <input id="raw-receptiveLanguage" />
      <input id="raw-expressiveLanguage" />
      <input id="raw-socialEmotional" />
      <input aria-label="receptiveLanguage able items" />
      <input aria-label="receptiveLanguage unable items" />
      <input aria-label="expressiveLanguage able items" />
      <input aria-label="expressiveLanguage unable items" />
      <input aria-label="socialEmotional able items" />
      <input aria-label="socialEmotional unable items" />
    `;
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('advances from dob to testDate', () => {
    const dob = document.getElementById('dob')!;
    dob.focus();
    const moved = advanceFocus(dob);
    expect(moved).toBe(true);
    expect(document.activeElement).toBe(document.getElementById('testDate'));
  });

  it('advances from testDate to targetPercentile', () => {
    const testDate = document.getElementById('testDate')!;
    const moved = advanceFocus(testDate);
    expect(moved).toBe(true);
    expect(document.activeElement).toBe(document.getElementById('targetPercentile'));
  });

  it('advances from targetPercentile to raw-receptiveLanguage', () => {
    const el = document.getElementById('targetPercentile')!;
    const moved = advanceFocus(el);
    expect(moved).toBe(true);
    expect(document.activeElement).toBe(document.getElementById('raw-receptiveLanguage'));
  });

  it('advances from raw-socialEmotional to RL able items', () => {
    const el = document.getElementById('raw-socialEmotional')!;
    const moved = advanceFocus(el);
    expect(moved).toBe(true);
    expect(document.activeElement).toBe(
      document.querySelector('[aria-label="receptiveLanguage able items"]')
    );
  });

  it('advances through skills inputs in order', () => {
    const rlAble = document.querySelector<HTMLElement>('[aria-label="receptiveLanguage able items"]')!;
    advanceFocus(rlAble);
    expect(document.activeElement).toBe(
      document.querySelector('[aria-label="receptiveLanguage unable items"]')
    );
  });

  it('returns false at the last input', () => {
    const last = document.querySelector<HTMLElement>('[aria-label="socialEmotional unable items"]')!;
    const moved = advanceFocus(last);
    expect(moved).toBe(false);
  });

  it('returns false for unknown elements', () => {
    const unknown = document.createElement('input');
    document.body.appendChild(unknown);
    const moved = advanceFocus(unknown);
    expect(moved).toBe(false);
    document.body.removeChild(unknown);
  });
});
