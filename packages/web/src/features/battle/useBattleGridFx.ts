import { useEffect, useRef, useState } from 'react';
import type { BattleState } from '@moyu/game-core';
import {
  type BattleCellFloat,
  type BattleCellFx,
  fxFromNewEvents,
} from './battleGridFx';

const FX_HOLD_MS = 520;

export function useBattleGridFx(battle: BattleState, enabled: boolean) {
  const [fx, setFx] = useState<Record<string, BattleCellFx>>({});
  const [floats, setFloats] = useState<BattleCellFloat[]>([]);
  const eventLenRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      eventLenRef.current = battle.events.length;
      return;
    }

    const prevLen = eventLenRef.current;
    if (battle.events.length <= prevLen) {
      eventLenRef.current = battle.events.length;
      return;
    }

    const slice = battle.events.slice(prevLen);
    eventLenRef.current = battle.events.length;

    const next = fxFromNewEvents(slice, battle);
    if (Object.keys(next.fx).length === 0 && next.floats.length === 0) return;

    setFx(next.fx);
    setFloats(next.floats);

    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      setFx({});
      setFloats([]);
      timerRef.current = null;
    }, FX_HOLD_MS);

    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, [battle, battle.events.length, enabled]);

  useEffect(() => {
    eventLenRef.current = battle.events.length;
    setFx({});
    setFloats([]);
  }, [battle.encounterId]);

  return { fx, floats };
}
