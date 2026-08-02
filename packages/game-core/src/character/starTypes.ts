/**
 * 升星效果类型（扩展口）。
 * 新 kind：在此加联合成员 → deriveGrowthStats / skillCompose / summarizeStarEffect 各加一支。
 */
import type { ApplyStatusDef, SkillEffect } from '../shared/types.js';

export type StarRareStat = 'lifesteal' | 'dodge' | 'block';

export type StarRatingStat =
  | 'critRating'
  | 'critDmgRating'
  | 'hasteRating'
  | 'masteryRating'
  | 'finalDmgRating'
  | 'versRating'
  | 'fortune';

export type StarNodeEffect =
  | { kind: 'stat_pct'; mainPct: number }
  | { kind: 'rare_stat'; stat: StarRareStat; value: number }
  | { kind: 'rating'; stat: StarRatingStat; value: number }
  | { kind: 'enable_follow_up'; chance: number; multiplier?: number }
  /** 技能倍率加算（如 +0.15） */
  | { kind: 'skill_mult'; delta: number }
  /** 技能耗能加算（负=更便宜） */
  | { kind: 'qi_cost'; delta: number }
  /** 强化技能挂状：时长/层数/破甲 value 乘算 */
  | { kind: 'status_boost'; duration?: number; layers?: number; valueMult?: number }
  /** 追加挂状（升星质变；走 compose statusPatches） */
  | { kind: 'status_unlock'; status: ApplyStatusDef }
  /** 追加非状态效果（purge/cleanse/…） */
  | { kind: 'effect_unlock'; effect: SkillEffect };

export interface StarNodeDef {
  star: number;
  label: string;
  effects: StarNodeEffect[];
  /** true：与共用节点 effects 叠加；默认 false = 整节点替换 */
  stack?: boolean;
}

export interface SkillGrowthMods {
  multiplierDelta: number;
  qiCostDelta: number;
  statusDurationBonus: number;
  statusLayersBonus: number;
  statusValueMult: number;
}

export function emptySkillMods(): SkillGrowthMods {
  return {
    multiplierDelta: 0,
    qiCostDelta: 0,
    statusDurationBonus: 0,
    statusLayersBonus: 0,
    statusValueMult: 1,
  };
}

/** 由若干节点效果累出技能修正 */
export function accumulateSkillMods(effects: StarNodeEffect[]): SkillGrowthMods {
  const mods = emptySkillMods();
  for (const fx of effects) {
    if (fx.kind === 'skill_mult') mods.multiplierDelta += fx.delta;
    if (fx.kind === 'qi_cost') mods.qiCostDelta += fx.delta;
    if (fx.kind === 'status_boost') {
      mods.statusDurationBonus += fx.duration ?? 0;
      mods.statusLayersBonus += fx.layers ?? 0;
      if (fx.valueMult != null) mods.statusValueMult *= fx.valueMult;
    }
  }
  return mods;
}

export function summarizeStarEffect(fx: StarNodeEffect): string {
  if (fx.kind === 'stat_pct') return `主属性+${Math.round(fx.mainPct * 100)}%`;
  if (fx.kind === 'rare_stat') {
    const name =
      fx.stat === 'lifesteal' ? '吸血' : fx.stat === 'dodge' ? '闪避' : '格挡';
    return `${name}+${Math.round(fx.value * 100)}%`;
  }
  if (fx.kind === 'rating') {
    const map: Record<StarRatingStat, string> = {
      critRating: '暴击',
      critDmgRating: '暴伤',
      hasteRating: '急速',
      masteryRating: '精通',
      finalDmgRating: '终伤',
      versRating: '均衡',
      fortune: '幸运',
    };
    return `${map[fx.stat]}+${fx.value}`;
  }
  if (fx.kind === 'enable_follow_up') {
    return `连击${Math.round(fx.chance * 100)}%×${fx.multiplier ?? 1}`;
  }
  if (fx.kind === 'skill_mult') {
    return `技能倍率${fx.delta >= 0 ? '+' : ''}${fx.delta.toFixed(2)}`;
  }
  if (fx.kind === 'qi_cost') {
    return `耗能${fx.delta >= 0 ? '+' : ''}${fx.delta}`;
  }
  if (fx.kind === 'status_boost') {
    const bits: string[] = [];
    if (fx.duration) bits.push(`状态+${fx.duration}回合`);
    if (fx.layers) bits.push(`叠层+${fx.layers}`);
    if (fx.valueMult != null && fx.valueMult !== 1) {
      bits.push(`状态强度×${fx.valueMult}`);
    }
    return bits.join('·') || '状态强化';
  }
  if (fx.kind === 'status_unlock') {
    return `解锁状态 ${fx.status.statusId}`;
  }
  if (fx.kind === 'effect_unlock') {
    return `解锁效果 ${fx.effect.kind}`;
  }
  return '';
}
