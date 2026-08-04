import type { StatusId, UnitRank } from '../shared/types.js';

export type RankGate = 'ok' | 'halve' | 'immune';

/**
 * 状态定义（数据驱动）。新 Buff/Debuff/CC：先登记再挂技能，禁止只在战斗主循环写死 id。
 * 行为只认本表 flag；主循环读 flag，不读具体 statusId（叠层/护盾等少数机制除外，亦由本表声明）。
 */
export interface StatusDef {
  id: StatusId;
  /** 中性默认短名；显示随皮 */
  defaultLabel: string;
  kind: 'buff' | 'debuff' | 'cc';
  /** 跳过行动 */
  blocksAct?: boolean;
  /** 不能放技能（仍可普攻） */
  blocksSkill?: boolean;
  /** 混乱/狂乱：索敌全场随机 */
  forceRandomTarget?: boolean;
  /** 狂乱：强制普攻 */
  forceBasicAttack?: boolean;
  /** 受伤解除（沉眠） */
  wakeOnDamage?: boolean;
  /** 治疗无效 */
  healBlocked?: boolean;
  /** 驱散（清敌方增益）可选中 */
  purgeable?: boolean;
  /** 净化（清我方减益）可选中 */
  cleanseable?: boolean;
  /**
   * 硬控 DR 桶 id；有则参与同桶衰减。
   * 通常等于自身 id；多个状态可共用一桶。
   */
  ccDrBucket?: string;
  /** 回合开始跳字 id；见 tickRegistry.registerStatusTick */
  tickKind?: string;
  /** 造伤倍率（如狂乱） */
  outgoingDamageMult?: number;
  /** 若 true，用 instance.value 乘目标防御（如破甲 value=0.7） */
  incomingDefMultFromValue?: boolean;
  /** 固定额外承伤倍率（如 1.15） */
  incomingDamageTakenMult?: number;
  /** 若 true，用 instance.value 作额外承伤倍率（猎印） */
  incomingDamageTakenFromValue?: boolean;
  /** 行动权重倍率（如迟缓） */
  actionWeightMult?: number;
  /** 本场同一目标成功挂上上限 */
  maxBattleApplies?: number;
  /** 叠层；缺省 replace 同 id */
  stack?: 'replace' | 'layers';
  maxLayers?: number;
  /** 挂上时转为护盾值，不进 statuses 列表 */
  appliesAsShield?: boolean;
  /**
   * 对敌必中（跳过抵抗检定）。铺垫类：破甲/流血/迟缓/猎印等。
   * 硬控与强扰乱（晕/睡/沉默/混乱/狂乱）不设，仍走命中率。
   */
  guaranteedLand?: boolean;
  /**
   * 抵抗检定基础命中（缺省用全局 0.75）。
   * 强扰乱应明显更低，避免动辄改写战局。
   */
  landBase?: number;
  /** 精英 / Boss 抗性；缺省 ok */
  rankGate?: Partial<Record<'elite' | 'boss', RankGate>>;
}

const defs = new Map<StatusId, StatusDef>();

function register(def: StatusDef): void {
  defs.set(def.id, def);
}

/** 内置状态；后续内容只 registerStatus，不改战斗主循环 */
register({
  id: 'shield',
  defaultLabel: '护盾',
  kind: 'buff',
  purgeable: true,
  appliesAsShield: true,
});
register({
  id: 'shred',
  defaultLabel: '破甲',
  kind: 'debuff',
  cleanseable: true,
  incomingDefMultFromValue: true,
  guaranteedLand: true,
});
register({
  id: 'stun',
  defaultLabel: '眩晕',
  kind: 'cc',
  blocksAct: true,
  cleanseable: false,
  ccDrBucket: 'stun',
  landBase: 0.4,
  rankGate: { boss: 'immune' },
});
register({
  id: 'sleep',
  defaultLabel: '沉眠',
  kind: 'cc',
  blocksAct: true,
  wakeOnDamage: true,
  cleanseable: false,
  ccDrBucket: 'sleep',
  landBase: 0.3,
  rankGate: { elite: 'halve', boss: 'immune' },
});
register({
  id: 'silence',
  defaultLabel: '沉默',
  kind: 'cc',
  blocksSkill: true,
  cleanseable: false,
  ccDrBucket: 'silence',
  landBase: 0.4,
  rankGate: { boss: 'halve' },
});
register({
  id: 'heal_block',
  defaultLabel: '禁疗',
  kind: 'debuff',
  healBlocked: true,
  cleanseable: true,
  guaranteedLand: true,
});
register({
  id: 'havoc',
  defaultLabel: '混乱',
  kind: 'debuff',
  forceRandomTarget: true,
  cleanseable: true,
  maxBattleApplies: 2,
  landBase: 0.25,
  rankGate: { elite: 'halve', boss: 'immune' },
});
register({
  id: 'bleed',
  defaultLabel: '流血',
  kind: 'debuff',
  cleanseable: true,
  tickKind: 'bleed_hp_pct',
  stack: 'layers',
  maxLayers: 3,
  guaranteedLand: true,
});
register({
  id: 'slow',
  defaultLabel: '迟缓',
  kind: 'debuff',
  cleanseable: true,
  actionWeightMult: 0.75,
  guaranteedLand: true,
});
register({
  id: 'berserk',
  defaultLabel: '狂乱',
  kind: 'debuff',
  forceRandomTarget: true,
  forceBasicAttack: true,
  outgoingDamageMult: 1.3,
  cleanseable: true,
  landBase: 0.25,
  rankGate: { boss: 'immune' },
});
/** 猎印：被攻击额外承伤；value 为倍率（如 1.18） */
register({
  id: 'mark_prey',
  defaultLabel: '猎印',
  kind: 'debuff',
  cleanseable: true,
  incomingDamageTakenFromValue: true,
  stack: 'replace',
  guaranteedLand: true,
});

export function registerStatus(def: StatusDef): void {
  defs.set(def.id, def);
}

export function getStatusDef(id: StatusId): StatusDef | undefined {
  return defs.get(id);
}

export function statusLabel(id: StatusId): string {
  return defs.get(id)?.defaultLabel ?? id;
}

/** 是否参与硬控 DR（有桶） */
export function statusCcDrBucket(id: StatusId): string | undefined {
  return defs.get(id)?.ccDrBucket;
}

export function rankGate(rank: UnitRank, statusId: StatusId): RankGate {
  if (rank === 'normal') return 'ok';
  const def = defs.get(statusId);
  return def?.rankGate?.[rank] ?? 'ok';
}

/** 单单位同时不同 statusId 软顶；超出挤最早非硬控 */
export const STATUS_SOFT_CAP = 6;

/** 硬控优先保留：有 blocksAct 或 ccDrBucket */
export function enforceStatusSoftCap(unit: { statuses: { statusId: StatusId; remaining: number }[] }): void {
  const living = () => unit.statuses.filter((s) => s.remaining > 0);
  while (living().length > STATUS_SOFT_CAP) {
    const dropIdx = unit.statuses.findIndex((s) => {
      if (s.remaining <= 0) return false;
      const def = defs.get(s.statusId);
      return !def?.blocksAct && !def?.ccDrBucket;
    });
    if (dropIdx >= 0) {
      unit.statuses.splice(dropIdx, 1);
    } else {
      const oldest = unit.statuses.findIndex((s) => s.remaining > 0);
      if (oldest < 0) break;
      unit.statuses.splice(oldest, 1);
    }
  }
}
