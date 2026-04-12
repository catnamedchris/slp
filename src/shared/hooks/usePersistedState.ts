import { useState, useEffect } from 'react';

const KEY_PREFIX = 'slp:';

export const usePersistedState = <T>(
  key: string,
  initialValue: T | (() => T),
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const prefixedKey = `${KEY_PREFIX}${key}`;

  const [state, setState] = useState<T>(() => {
    const stored = localStorage.getItem(prefixedKey);
    if (stored !== null) {
      try {
        return JSON.parse(stored) as T;
      } catch {
        // corrupt JSON — fall through to initialValue
      }
    }
    return initialValue instanceof Function ? initialValue() : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(prefixedKey, JSON.stringify(state));
  }, [prefixedKey, state]);

  return [state, setState];
};
