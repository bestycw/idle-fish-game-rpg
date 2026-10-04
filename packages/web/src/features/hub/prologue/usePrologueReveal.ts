import { useCallback, useEffect, useState } from 'react';

const DEFAULT_AUTO_MS = 480;

/** 逐行揭示：自动推进 + 点击快进至全部显示 */
export function usePrologueReveal(lineCount: number, stepKey: string, autoMs = DEFAULT_AUTO_MS) {
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    setRevealed(0);
  }, [stepKey]);

  useEffect(() => {
    if (revealed >= lineCount) return;
    const t = window.setTimeout(() => {
      setRevealed((n) => Math.min(n + 1, lineCount));
    }, autoMs);
    return () => window.clearTimeout(t);
  }, [revealed, lineCount, autoMs]);

  const revealAll = useCallback(() => {
    setRevealed(lineCount);
  }, [lineCount]);

  const revealNext = useCallback(() => {
    setRevealed((n) => Math.min(n + 1, lineCount));
  }, [lineCount]);

  const complete = revealed >= lineCount;

  return { revealed, revealAll, revealNext, complete };
}
