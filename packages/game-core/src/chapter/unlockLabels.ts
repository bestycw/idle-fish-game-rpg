import { ENCOUNTERS } from '../dungeon/encounters.js';
import type { ContentUnlock } from './defs.js';

const DUNGEON_LABELS: Record<string, string> = {
  gear_trial: '猎装试炼（刷装量）',
  abyss_mirror: '镜渊试炼（对症 T3）',
  tower: '修炼塔',
  stardust_realm: '星尘秘境',
};

/** 玩家可读的解锁一句（Hub / 通关 toast） */
export function formatContentUnlockLabel(u: ContentUnlock): string {
  if (u.kind === 'dungeon') {
    return DUNGEON_LABELS[u.id] ?? `副本·${u.id}`;
  }
  if (u.kind === 'encounter') {
    const enc = ENCOUNTERS.find((e) => e.id === u.id);
    return enc ? `八题·${enc.name}` : `遭遇·${u.id}`;
  }
  if (u.kind === 'gacha_unit') {
    return `召唤池·${u.id}`;
  }
  return `${u.kind}:${u.id}`;
}

export function formatUnlockSummary(unlocks: ContentUnlock[]): string {
  const labels = unlocks.map(formatContentUnlockLabel);
  if (labels.length === 0) return '';
  return `解锁：${labels.join('、')}`;
}
