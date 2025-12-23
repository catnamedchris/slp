import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCalculation } from './useCalculation';
import { createEmptyRawScores } from '../components/RawScoresForm';

describe('useCalculation', () => {
  it('returns null result when ageMonths is null', () => {
    const { result } = renderHook(() =>
      useCalculation({
        ageMonths: null,
        rawScores: createEmptyRawScores(),
      })
    );
    expect(result.current.result).toBeNull();
  });

  it('returns null result when ageMonths is below minimum', () => {
    const { result } = renderHook(() =>
      useCalculation({
        ageMonths: 6,
        rawScores: createEmptyRawScores(),
      })
    );
    expect(result.current.result).toBeNull();
  });

  it('returns null result when ageMonths is above maximum', () => {
    const { result } = renderHook(() =>
      useCalculation({
        ageMonths: 80,
        rawScores: createEmptyRawScores(),
      })
    );
    expect(result.current.result).toBeNull();
  });

  it('returns partial result when only some raw scores are filled', () => {
    const scores = {
      ...createEmptyRawScores(),
      cognitive: 25,
      receptiveLanguage: 20,
    };
    const { result } = renderHook(() =>
      useCalculation({
        ageMonths: 24,
        rawScores: scores,
      })
    );
    expect(result.current.result).not.toBeNull();
    expect(result.current.result?.subtests.cognitive.rawScore).toBe(25);
    expect(result.current.result?.subtests.cognitive.standardScore.value).not.toBeNull();
    expect(result.current.result?.subtests.expressiveLanguage.rawScore).toBeNull();
  });

  it('returns calculation result when all inputs are valid', () => {
    const scores = {
      cognitive: 25,
      receptiveLanguage: 20,
      expressiveLanguage: 18,
      socialEmotional: 22,
      grossMotor: 30,
      fineMotor: 28,
      adaptiveBehavior: 24,
    };
    const { result } = renderHook(() =>
      useCalculation({
        ageMonths: 24,
        rawScores: scores,
      })
    );
    expect(result.current.result).not.toBeNull();
    expect(result.current.result?.ageMonths).toBe(24);
    expect(result.current.result?.subtests.cognitive.rawScore).toBe(25);
  });

  it('memoizes result when inputs do not change', () => {
    const scores = {
      cognitive: 25,
      receptiveLanguage: 20,
      expressiveLanguage: 18,
      socialEmotional: 22,
      grossMotor: 30,
      fineMotor: 28,
      adaptiveBehavior: 24,
    };
    const { result, rerender } = renderHook(() =>
      useCalculation({
        ageMonths: 24,
        rawScores: scores,
      })
    );
    const firstResult = result.current.result;
    rerender();
    expect(result.current.result).toBe(firstResult);
  });
});
