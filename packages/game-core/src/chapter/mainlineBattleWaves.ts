/**
 * 卷一主线 battle 节点结构：
 * - **单元** = 2 波剧情生态小怪 + 1 波八题精锐/首领
 * - **一节 battle** = 串联多个单元；单元数随章序递增
 */
import { MAINLINE_CAP_BLEND_IDS } from '../dungeon/mainlineCapBlendEncounters.js';
import { mainlineBiomeSkirmishPair } from './mainlineBiome.js';
import type { BattleWaveDef } from './defs.js';

export const MAINLINE_WAVES_PER_UNIT = 3;

export type MainlineBattleCap =
  | 'wall'
  | 'archers'
  | 'raiders'
  | 'spirit_wall'
  | 'chaos_rite'
  | 'oil_cask'
  | 'shield_stack'
  | 'boss_warden';

const RECIPE_CAP: Record<Exclude<MainlineBattleCap, 'boss_warden'>, string> = {
  wall: 'wall',
  archers: 'archers',
  raiders: 'raiders',
  spirit_wall: 'spirit_wall',
  chaos_rite: 'chaos_rite',
  oil_cask: 'oil_cask',
  shield_stack: 'shield_stack',
};

const BOSS_CAP: Record<Exclude<MainlineBattleCap, 'boss_warden'>, string> = {
  wall: 'boss_wall',
  archers: 'boss_archers',
  raiders: 'boss_raiders',
  spirit_wall: 'boss_spirit_wall',
  chaos_rite: 'boss_chaos_rite',
  oil_cask: 'boss_oil',
  shield_stack: 'boss_shield_stack',
};

/** 卷末守门战：前几阵轮换八题，最后一阵 boss_warden */
const WARDEN_PRELUDE_CAPS: MainlineBattleCap[] = [
  'spirit_wall',
  'oil_cask',
  'shield_stack',
  'chaos_rite',
  'raiders',
];

/**
 * 单节 battle 阵数：慢推进、逼刷装/改阵（对齐「新的开始」节奏）。
 * 开篇 3 阵，每章 +1 阵，封顶 9 阵（27 场/节）。
 */
export const MAINLINE_MAX_UNITS = 9;

export function mainlineBattleUnitCount(chapterOrder: number): number {
  const o = Math.max(1, Math.min(10, Math.round(chapterOrder)));
  return Math.min(MAINLINE_MAX_UNITS, 2 + o);
}

function unitLabel(unitIndex: number): string {
  return `第 ${unitIndex + 1} 阵`;
}

function capEncounterForUnit(
  chapterOrder: number,
  cap: MainlineBattleCap,
  unitIndex: number,
  unitTotal: number,
  planOffset: number,
): { encounterId: string; label: string } {
  const isLastUnit = unitIndex === unitTotal - 1;
  if (cap === 'boss_warden') {
    return { encounterId: 'boss_warden', label: '守门' };
  }
  const useBoss = chapterOrder >= 5 && isLastUnit;
  if (useBoss) {
    return { encounterId: BOSS_CAP[cap], label: '首领' };
  }
  if (isLastUnit) {
    return { encounterId: RECIPE_CAP[cap], label: '精锐' };
  }
  const blends = MAINLINE_CAP_BLEND_IDS[cap];
  const pick = blends?.[(unitIndex + planOffset) % blends.length] ?? RECIPE_CAP[cap];
  return { encounterId: pick, label: '精锐' };
}

/** 单个三连战单元 → 3 条 wave */
export function mainlineBattleUnitWaves(
  chapterOrder: number,
  cap: MainlineBattleCap,
  unitIndex: number,
  unitTotal: number,
  planOffset: number,
): BattleWaveDef[] {
  const uLabel = unitLabel(unitIndex);
  const [e1, l1, e2, l2] = mainlineBiomeSkirmishPair(chapterOrder, unitIndex, planOffset);
  const fin = capEncounterForUnit(chapterOrder, cap, unitIndex, unitTotal, planOffset);
  const tag = { unitIndex, unitLabel: uLabel };
  return [
    { encounterId: e1, label: l1, ...tag },
    { encounterId: e2, label: l2, ...tag },
    { encounterId: fin.encounterId, label: fin.label, ...tag },
  ];
}

function capsForBattleNode(
  chapterOrder: number,
  primaryCap: MainlineBattleCap,
): MainlineBattleCap[] {
  const n = mainlineBattleUnitCount(chapterOrder);
  if (primaryCap === 'boss_warden') {
    const prelude: MainlineBattleCap[] = [];
    for (let u = 0; u < n - 1; u++) {
      prelude.push(WARDEN_PRELUDE_CAPS[u % WARDEN_PRELUDE_CAPS.length]!);
    }
    return [...prelude, 'boss_warden'];
  }
  return Array.from({ length: n }, () => primaryCap);
}

/** 整节 battle 节点的全部波次（单元数 × 3） */
/** @param planOffset 同章不同 battle 节点错开生态轮换（通常用 node 序号） */
export function mainlineBattleWaves(
  chapterOrder: number,
  primaryCap: MainlineBattleCap,
  planOffset = 0,
): BattleWaveDef[] {
  const unitTotal = mainlineBattleUnitCount(chapterOrder);
  const caps = capsForBattleNode(chapterOrder, primaryCap);
  const waves: BattleWaveDef[] = [];
  for (let u = 0; u < unitTotal; u++) {
    waves.push(
      ...mainlineBattleUnitWaves(
        chapterOrder,
        caps[u] ?? primaryCap,
        u,
        unitTotal,
        planOffset,
      ),
    );
  }
  return waves;
}

export function mainlinePlanOffsetFromNodeId(nodeId: string): number {
  const m = /_n(\d+)$/.exec(nodeId);
  return m ? Math.max(0, parseInt(m[1], 10) - 1) : 0;
}

export function chapterOrderFromNodeId(nodeId: string): number {
  const m = /^ch(\d+)_/.exec(nodeId);
  return m ? parseInt(m[1], 10) : 1;
}

/** battle 节点最后一波 encounterId（战前 prepHint / 校验用） */
export function mainlineCapEncounterId(
  chapterOrder: number,
  cap: MainlineBattleCap,
): string {
  const waves = mainlineBattleWaves(chapterOrder, cap);
  return waves[waves.length - 1]!.encounterId;
}
