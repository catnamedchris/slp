// useDayc2App: State and handlers for the main DAYC-2 calculator

import { useState, useCallback } from 'react';
import { calculateAgeInfo } from '../lib/age';
import { createEmptyRawScores } from '../lib/rawScores';
import type { RawScores } from '../lib/rawScores';
import { useCalculation } from './useCalculation';
import type { SubtestKey } from '../types';
import { DEFAULT_VISIBLE_SUBTESTS, DEFAULT_VISIBLE_DOMAINS, type DomainKey } from '../lib/scoresDisplay';
import type { ProvenanceStep } from '@/shared/lib/types';

export const useDayc2App = () => {
  const [dob, setDob] = useState('');
  const [testDate, setTestDate] = useState('');
  const [rawScores, setRawScores] = useState<RawScores>(createEmptyRawScores);
  const [visibleSubtests, setVisibleSubtests] = useState<Set<SubtestKey>>(
    () => new Set(DEFAULT_VISIBLE_SUBTESTS)
  );
  const [visibleDomains, setVisibleDomains] = useState<Set<DomainKey>>(
    () => new Set(DEFAULT_VISIBLE_DOMAINS)
  );
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

  const handleSubtestToggle = useCallback((subtest: SubtestKey) => {
    setVisibleSubtests((prev) => {
      const next = new Set(prev);
      if (next.has(subtest)) {
        next.delete(subtest);
      } else {
        next.add(subtest);
      }
      return next;
    });
  }, []);

  const handleDomainToggle = useCallback((domain: DomainKey) => {
    setVisibleDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) {
        next.delete(domain);
      } else {
        next.add(domain);
      }
      return next;
    });
  }, []);

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

  const isPanelOpen = selectedProvenance !== null && selectedProvenance.length > 0;

  return {
    dob,
    setDob,
    testDate,
    setTestDate,
    rawScores,
    result,
    ageMonths,
    visibleSubtests,
    visibleDomains,
    targetPercentile,
    setTargetPercentile,
    selectedProvenance,
    provenanceAnchor,
    provenanceTitle,
    isPanelOpen,
    handleRawScoreChange,
    handleSubtestToggle,
    handleDomainToggle,
    handleProvenanceClick,
    handleProvenanceClose,
  };
};
