import { useEffect, useState } from 'react';

const CHAR_MS = 32;

export function PrologueTypewriter({
  text,
  active,
  instant,
  visible,
}: {
  text: string;
  /** 当前行刚被揭示 */
  active: boolean;
  /** 用户快进整页 */
  instant: boolean;
  visible: boolean;
}) {
  const [len, setLen] = useState(0);

  useEffect(() => {
    if (instant || (visible && !active)) {
      setLen(text.length);
      return;
    }
    if (!active) {
      setLen(0);
      return;
    }
    setLen(0);
  }, [text, active, instant, visible]);

  useEffect(() => {
    if (instant || !active || len >= text.length) return;
    const t = window.setTimeout(() => setLen((n) => n + 1), CHAR_MS);
    return () => window.clearTimeout(t);
  }, [active, instant, len, text.length]);

  const done = len >= text.length;

  return (
    <span className="inline">
      {text.slice(0, len)}
      {active && !instant && !done ? (
        <span className="prologue-cursor ml-px inline-block w-[2px] animate-pulse bg-primary align-middle" aria-hidden>
          {' '}
        </span>
      ) : null}
    </span>
  );
}
