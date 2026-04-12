// useDayc2App: State and handlers for the main DAYC-2 calculator

import { useState, useCallback, useMemo } from 'react';
import { calculateAgeInfo } from '../lib/age';
import { createEmptyRawScores } from '../lib/rawScores';
import type { RawScores } from '../lib/rawScores';
import { useCalculation } from './useCalculation';
import type { SubtestKey } from '../types';
import type { ActiveSubtestKey } from '../lib/metadata';
import type { ProvenanceStep } from '@/shared/lib/types';
import { createEmptySkillItems, type AllSkillItems } from '../lib/skills';
import { usePersistedState } from '@/shared/hooks/usePersistedState';

const DEFAULT_TARGET_PERCENTILE = 6;

export const useDayc2App = () => {
  const [dob, setDob] = usePersistedState('dayc2:dob', '');
  const [testDate, setTestDate] = usePersistedState('dayc2:testDate', '');
  const [rawScores, setRawScores] = usePersistedState<RawScores>('dayc2:rawScores', createEmptyRawScores);
  const [skillItems, setSkillItems] = usePersistedState<AllSkillItems>('dayc2:skillItems', createEmptySkillItems);
  const [targetPercentile, setTargetPercentile] = usePersistedState('dayc2:targetPercentile', DEFAULT_TARGET_PERCENTILE);
  const [selectedProvenance, setSelectedProvenance] = useState<ProvenanceStep[] | null>(null);
  const [provenanceAnchor, setProvenanceAnchor] = useState<HTMLElement | null>(null);
  const [provenanceTitle, setProvenanceTitle] = useState<string | null>(null);

  const ageInfo = useMemo(() => calculateAgeInfo(dob, testDate), [dob, testDate]);
  const ageMonths = ageInfo?.error ? null : ageInfo?.ageMonths ?? null;

  const { result } = useCalculation({ ageMonths, rawScores });

  const handleRawScoreChange = useCallback((subtest: SubtestKey, value: number | null) => {
    setRawScores((prev) => ({ ...prev, [subtest]: value }));
  }, []);

  const handleSkillItemsChange = useCallback(
    (subtest: ActiveSubtestKey, list: 'able' | 'unable', items: number[]) => {
      setSkillItems((prev) => ({
        ...prev,
        [subtest]: { ...prev[subtest], [list]: items },
      }));
    },
    []
  );

  const handleProvenanceClick = useCallback((steps: ProvenanceStep[], anchorElement: HTMLElement, title?: string) => {
    setSelectedProvenance(steps);
    setProvenanceAnchor(anchorElement);
    setProvenanceTitle(title ?? null);
  }, []);

  const handleProvenanceClose = useCallback(() => {
    setSelectedProvenance(null);
    setProvenanceAnchor(null);
    setProvenanceTitle(null);
  }, []);

  const handleClear = useCallback(() => {
    setDob('');
    setTestDate('');
    setRawScores(createEmptyRawScores());
    setSkillItems(createEmptySkillItems());
    setTargetPercentile(DEFAULT_TARGET_PERCENTILE);
    setSelectedProvenance(null);
    setProvenanceAnchor(null);
    setProvenanceTitle(null);
  }, []);

  const isPanelOpen = selectedProvenance !== null && selectedProvenance.length > 0;

  return {
    dob,
    setDob,
    testDate,
    setTestDate,
    handleClear,
    rawScores,
    skillItems,
    result,
    ageInfo,
    ageMonths,
    targetPercentile,
    setTargetPercentile,
    selectedProvenance,
    provenanceAnchor,
    provenanceTitle,
    isPanelOpen,
    handleRawScoreChange,
    handleSkillItemsChange,
    handleProvenanceClick,
    handleProvenanceClose,
  };
};
