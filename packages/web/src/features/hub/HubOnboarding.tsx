import type { PlayerState } from '@moyu/game-core';
import { useMemo, useState } from 'react';

const STORAGE_DISMISS = 'moyu_hub_onboard_v2_dismiss';
const STORAGE_FORMATION = 'moyu_hub_tip_formation_done';
const STORAGE_GEAR = 'moyu_hub_tip_gear_done';

type HubTipId = 'mainline' | 'formation' | 'gear';

type HubOnboardingProps = {
  player: PlayerState;
  /** 是否已进过猎装页（由 App/Hub 在打开时写入 localStorage 亦可） */
  gearVisited?: boolean;
};

function readFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1' || localStorage.getItem(key) === 'done';
  } catch {
    return false;
  }
}

function writeFlag(key: string) {
  try {
    localStorage.setItem(key, '1');
  } catch {
    /* ignore */
  }
}

function hasFought(player: PlayerState): boolean {
  return (player.wins ?? 0) > 0 || (player.chapterCleared ?? 0) > 0 || (player.chapterNodeIndex ?? 0) > 0;
}

function resolveTip(player: PlayerState): HubTipId | null {
  if (readFlag(STORAGE_DISMISS)) return null;
  if (!hasFought(player)) return 'mainline';
  if (!readFlag(STORAGE_FORMATION)) return 'formation';
  // 猎装通关第一章才开；未通关不提刷装
  if ((player.chapterCleared ?? 0) >= 1 && !readFlag(STORAGE_GEAR)) return 'gear';
  return null;
}

const TIP_COPY: Record<HubTipId, string> = {
  mainline:
    '先点主线「进入」。教学关两人即可，不必凑满五人。每阵是：两场小怪 → 一场精锐。',
  formation: '打完了？去伙伴页布阵：换人、调站位；前排满 3 格可触发铁壁共鸣。',
  gear: '第一章通关后已开猎装·盾鸣廊。卡关时去历练刷对症装，再推主线。',
};

export function HubOnboarding({ player }: HubOnboardingProps) {
  const [tick, setTick] = useState(0);
  const tip = useMemo(() => resolveTip(player), [player, tick]);

  if (!tip) return null;

  const dismissAll = () => {
    writeFlag(STORAGE_DISMISS);
    setTick((n) => n + 1);
  };

  const advance = () => {
    if (tip === 'mainline') {
      // 未开战也可跳过本句，进入下一未解锁句时仍按进度
      writeFlag('moyu_hub_tip_mainline_skip');
    }
    if (tip === 'formation') writeFlag(STORAGE_FORMATION);
    if (tip === 'gear') {
      writeFlag(STORAGE_GEAR);
      writeFlag(STORAGE_DISMISS);
    }
    setTick((n) => n + 1);
  };

  // 主线提示：点「下一步」若还没打过战，仍停在主线（避免空转），除非跳过全部
  const onNext = () => {
    if (tip === 'mainline' && !hasFought(player)) {
      dismissAll();
      return;
    }
    advance();
  };

  const label =
    tip === 'mainline' ? '1/3' : tip === 'formation' ? '2/3' : '3/3';

  return (
    <div className="rounded-xl border border-teal-500/35 bg-teal-950/40 px-3 py-3 sm:px-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-mono text-[10px] tracking-[0.14em] text-teal-300/90">
          新手上路 {label}
        </p>
        <button
          type="button"
          onClick={dismissAll}
          className="shrink-0 font-mono text-[10px] text-muted-foreground hover:text-foreground"
        >
          跳过
        </button>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground/90">{TIP_COPY[tip]}</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onNext}
          className="rounded-lg bg-teal-600/90 px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
        >
          {tip === 'gear' || (tip === 'mainline' && !hasFought(player)) ? '知道了' : '下一步'}
        </button>
      </div>
    </div>
  );
}

/** 打开布阵页时调用，推进 Hub 第二步 */
export function markHubFormationTipDone() {
  writeFlag(STORAGE_FORMATION);
}

/** 打开猎装页时调用，推进 Hub 第三步 */
export function markHubGearTipDone() {
  writeFlag(STORAGE_GEAR);
  writeFlag(STORAGE_DISMISS);
}
