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
  /** 承伤按该比例推迟到行动跳字（卸力） */
  deferIncomingRatio?: number;
  /** 挨打时按 instance.value（缺省 0.05）回血 */
  healOnTakenHit?: boolean;
  /** 被净化/驱散时反噬驱散者 */
  backlashOnCleanse?: boolean;
  /** 禁普攻（缴械） */
  blocksBasic?: boolean;
  /** 禁止回能 */
  blocksQiGain?: boolean;
  /** 致死时留 1 血（金身 / 因果锁） */
  preventLethal?: boolean;
  /** 下一次技能必暴 */
  nextSkillCrit?: boolean;
  /** instance.value 为单次承伤上限（占 maxHp 比例） */
  maxHitRatioFromValue?: boolean;
  /** 焦点锁向 sourceUid（嘲讽） */
  forcesFocus?: boolean;
  /** 为 sourceUid 分摊承伤 */
  shareDamage?: boolean;
  /** 前排为后排挡伤 */
  coverFront?: boolean;
  /** 暴击率加算 */
  critChanceBonus?: number;
  /** 触发免死后消耗该状态（金身）；因果锁不消耗 */
  consumeOnPreventLethal?: boolean;
  /** 挨硬控时反弹给施加者 */
  reflectCc?: boolean;
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
register({
  id: 'atk_up',
  defaultLabel: '加持',
  kind: 'buff',
  purgeable: true,
  outgoingDamageMult: 1.15,
});
register({
  id: 'def_up',
  defaultLabel: '铁壁咒',
  kind: 'buff',
  purgeable: true,
  incomingDamageTakenMult: 0.88,
});
register({
  id: 'spd_up',
  defaultLabel: '神行',
  kind: 'buff',
  purgeable: true,
  actionWeightMult: 1.2,
});
register({
  id: 'regen',
  defaultLabel: '回春',
  kind: 'buff',
  purgeable: true,
  tickKind: 'regen_hp_pct',
});
register({
  id: 'stagger',
  defaultLabel: '卸力',
  kind: 'buff',
  purgeable: true,
  tickKind: 'stagger_hp',
  deferIncomingRatio: 0.4,
});
register({
  id: 'earth_shield',
  defaultLabel: '受击回春',
  kind: 'buff',
  purgeable: true,
  healOnTakenHit: true,
  stack: 'layers',
  maxLayers: 3,
});
register({
  id: 'unstable',
  defaultLabel: '反噬印',
  kind: 'debuff',
  cleanseable: true,
  guaranteedLand: true,
  backlashOnCleanse: true,
});
register({
  id: 'poison',
  defaultLabel: '毒雾',
  kind: 'debuff',
  cleanseable: true,
  tickKind: 'bleed_hp_pct',
  stack: 'layers',
  maxLayers: 3,
  guaranteedLand: true,
});
register({
  id: 'burn',
  defaultLabel: '灼魂',
  kind: 'debuff',
  cleanseable: true,
  tickKind: 'bleed_hp_pct',
  stack: 'layers',
  maxLayers: 3,
  guaranteedLand: true,
});
register({
  id: 'frostbite',
  defaultLabel: '霜噬',
  kind: 'debuff',
  cleanseable: true,
  tickKind: 'bleed_hp_pct',
  actionWeightMult: 0.8,
  guaranteedLand: true,
});
register({
  id: 'atk_down',
  defaultLabel: '丧锋',
  kind: 'debuff',
  cleanseable: true,
  outgoingDamageMult: 0.85,
  guaranteedLand: true,
});
register({
  id: 'freeze',
  defaultLabel: '凝冰',
  kind: 'cc',
  blocksAct: true,
  cleanseable: false,
  ccDrBucket: 'stun',
  landBase: 0.35,
  rankGate: { boss: 'immune' },
});
register({
  id: 'root',
  defaultLabel: '定身',
  kind: 'debuff',
  cleanseable: true,
  actionWeightMult: 0.5,
  guaranteedLand: true,
});
register({
  id: 'taunt',
  defaultLabel: '嘲讽',
  kind: 'debuff',
  cleanseable: true,
  forcesFocus: true,
  landBase: 0.55,
  rankGate: { boss: 'halve' },
});
register({
  id: 'disarm',
  defaultLabel: '缴械',
  kind: 'debuff',
  blocksBasic: true,
  cleanseable: true,
  landBase: 0.45,
  rankGate: { boss: 'halve' },
});
register({
  id: 'crit_up',
  defaultLabel: '开眼',
  kind: 'buff',
  purgeable: true,
  critChanceBonus: 0.15,
});
register({
  id: 'immortal',
  defaultLabel: '金身',
  kind: 'buff',
  purgeable: true,
  preventLethal: true,
  consumeOnPreventLethal: true,
});
register({
  id: 'stealth_next',
  defaultLabel: '隐锋',
  kind: 'buff',
  purgeable: true,
  nextSkillCrit: true,
});
register({
  id: 'oath',
  defaultLabel: '义护',
  kind: 'buff',
  purgeable: true,
  shareDamage: true,
});
register({
  id: 'cover',
  defaultLabel: '掩护',
  kind: 'buff',
  purgeable: true,
  coverFront: true,
});
register({
  id: 'qi_drought',
  defaultLabel: '闭气',
  kind: 'debuff',
  cleanseable: true,
  blocksQiGain: true,
  guaranteedLand: true,
});
register({
  id: 'fate_lock',
  defaultLabel: '因果锁',
  kind: 'debuff',
  healBlocked: true,
  preventLethal: true,
  cleanseable: true,
  guaranteedLand: true,
});
register({
  id: 'dmg_cap',
  defaultLabel: '金身限额',
  kind: 'buff',
  purgeable: true,
  maxHitRatioFromValue: true,
});
register({
  id: 'dao',
  defaultLabel: '道韵',
  kind: 'buff',
  purgeable: true,
  stack: 'layers',
  maxLayers: 5,
});
register({
  id: 'reflect_cc',
  defaultLabel: '反制',
  kind: 'buff',
  purgeable: true,
  reflectCc: true,
});
register({
  id: 'corruption',
  defaultLabel: '侵蚀',
  kind: 'debuff',
  cleanseable: true,
  tickKind: 'corruption_tick',
  stack: 'layers',
  maxLayers: 5,
  guaranteedLand: true,
});
register({
  id: 'cell_lock',
  defaultLabel: '画地',
  kind: 'debuff',
  cleanseable: true,
  actionWeightMult: 0.5,
  guaranteedLand: true,
});
register({
  id: 'domain',
  defaultLabel: '领域',
  kind: 'debuff',
  cleanseable: true,
  incomingDamageTakenMult: 1.12,
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
