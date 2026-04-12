// Keyboard navigation utilities

/** Ordered list of input identifiers for Enter-to-advance navigation */
const FOCUS_ORDER = [
  { type: 'id', value: 'targetPercentile' },
  { type: 'id', value: 'raw-receptiveLanguage' },
  { type: 'id', value: 'raw-expressiveLanguage' },
  { type: 'id', value: 'raw-socialEmotional' },
  { type: 'aria-label', value: 'receptiveLanguage able items' },
  { type: 'aria-label', value: 'receptiveLanguage unable items' },
  { type: 'aria-label', value: 'expressiveLanguage able items' },
  { type: 'aria-label', value: 'expressiveLanguage unable items' },
  { type: 'aria-label', value: 'socialEmotional able items' },
  { type: 'aria-label', value: 'socialEmotional unable items' },
] as const;

const findElement = (entry: (typeof FOCUS_ORDER)[number]): HTMLElement | null => {
  if (entry.type === 'id') {
    return document.getElementById(entry.value);
  }
  return document.querySelector<HTMLElement>(`[aria-label="${entry.value}"]`);
};

/**
 * Advance focus to the next input in the focus chain.
 * Call this on Enter keydown from any input.
 * Returns true if focus was moved, false if at the end.
 */
export const advanceFocus = (currentElement: HTMLElement): boolean => {
  const currentIndex = FOCUS_ORDER.findIndex((entry) => {
    const el = findElement(entry);
    return el === currentElement;
  });

  if (currentIndex === -1 || currentIndex >= FOCUS_ORDER.length - 1) {
    return false;
  }

  const nextEl = findElement(FOCUS_ORDER[currentIndex + 1]);
  if (nextEl) {
    nextEl.focus();
    return true;
  }
  return false;
};

/**
 * KeyDown handler for Enter-to-advance.
 * Attach to onKeyDown on inputs that should participate.
 */
export const handleEnterAdvance = (e: React.KeyboardEvent<HTMLElement>) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    advanceFocus(e.currentTarget);
  }
};
