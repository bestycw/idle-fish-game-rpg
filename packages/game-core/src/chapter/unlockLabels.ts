import { CIRCLE_LABELS } from '../character/roster/circles.js';
import { ZHONGTU_ROSTER } from '../character/roster/zhongtuRoster.js';
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

function summarizeGachaUnlocks(ids: string[]): string {
  if (ids.length === 0) return '';
  const byCircle = new Map<string, number>();
  for (const id of ids) {
    const entry = ZHONGTU_ROSTER.find((e) => e.id === id);
    const label = entry?.circleId ? CIRCLE_LABELS[entry.circleId] : '伙伴';
    byCircle.set(label, (byCircle.get(label) ?? 0) + 1);
  }
  const groups = [...byCircle.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([circle, n]) => `${circle} ${n} 人`);
  return `召唤入池 · ${groups.join('、')}`;
}

/** 通关 toast：副本/八题逐条，召唤按故事圈汇总 */
export function formatUnlockSummary(unlocks: ContentUnlock[]): string {
  if (unlocks.length === 0) return '';

  const parts: string[] = [];
  for (const u of unlocks) {
    if (u.kind === 'dungeon' || u.kind === 'encounter') {
      parts.push(formatContentUnlockLabel(u));
    }
  }
  const gachaIds = unlocks.filter((u) => u.kind === 'gacha_unit').map((u) => u.id);
  const gachaLine = summarizeGachaUnlocks(gachaIds);
  if (gachaLine) parts.push(gachaLine);

  return `解锁：${parts.join(' · ')}`;
}
