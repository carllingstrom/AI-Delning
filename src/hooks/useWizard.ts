import { useState, useMemo } from 'react';

export default function useWizard(steps: string[], phase: string) {
  const [stepIdx, setStepIdx] = useState(0);

  const totalSteps = useMemo(() => {
    // Both 'idea' and other phases use the full flow now
    return steps.length;
  }, [steps]);

  const next = () => setStepIdx((i) => Math.min(i + 1, totalSteps - 1));
  const prev = () => setStepIdx((i) => Math.max(i - 1, 0));

  return { stepIdx, setStepIdx, totalSteps, next, prev };
} 