// useDayc2App: State and handlers for the main DAYC-2 calculator

import { useState, useCallback } from 'react';
import { calculateAgeInfo } from '../lib/age';
import { createEmptyRawScores } from '../lib/rawScores';
import type { RawScores } from '../lib/rawScores';
import { useCalculation } from './useCalculation';
import type { SubtestKey } from '../types';
import type { ActiveSubtestKey } from '../lib/metadata';
import type { ProvenanceStep } from '@/shared/lib/types';
import { createEmptySkillItems, type AllSkillItems } from '../lib/skills';

export const useDayc2App = () => {
  const [dob, setDob] = useState('');
  const [testDate, setTestDate] = useState('');
  const [rawScores, setRawScores] = useState<RawScores>(createEmptyRawScores);
  const [skillItems, setSkillItems] = useState<AllSkillItems>(createEmptySkillItems);
  const [targetPercentile, setTargetPercentile] = useState(6);
  const [selectedProvenance, setSelectedProvenance] = useState<ProvenanceStep[] | null>(null);
  const [provenanceAnchor, setProvenanceAnchor] = useState<HTMLElement | null>(null);
  const [provenanceTitle, setProvenanceTitle] = useState<string | null>(null);

  const ageInfo = calculateAgeInfo(dob, testDate);
  const ageMonths = ageInfo?.error ? null : ageInfo?.ageMonths ?? null;

  const { result } = useCalculation({ ageMonths, rawScores });

  const handleRawScoreChange = useCallback((subtest: SubtestKey, value: number | null) => {
    setRawScores((prev) => ({ ...prev, [subtest]: value }));
  }, []);

  const handleSkillItemsChange = useCallback(
    (subtest: ActiveSubtestKey, list: 'able' | 'unable', value: string) => {
      setSkillItems((prev) => ({
        ...prev,
        [subtest]: { ...prev[subtest], [list]: value },
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

  const hasData = dob !== '' || testDate !== '' ||
    Object.values(rawScores).some((v) => v !== null) ||
    Object.values(skillItems).some((s) => s.able !== '' || s.unable !== '');

  const handleClear = useCallback(() => {
    if (hasData && !window.confirm('Clear all data? This will reset dates, scores, and skills.')) {
      return;
    }
    setDob('');
    setTestDate('');
    setRawScores(createEmptyRawScores());
    setSkillItems(createEmptySkillItems());
  }, [hasData]);

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
