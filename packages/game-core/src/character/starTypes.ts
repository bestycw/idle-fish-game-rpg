/**
 * 升星效果类型（扩展口）。
 * 新 kind：在此加联合成员 → deriveGrowthStats / skillCompose / summarizeStarEffect 各加一支。
 */
import { statusLabel } from '../combat/statusFx.js';
import type { ApplyStatusDef, SkillEffect } from '../shared/types.js';

export type StarRareStat = 'lifesteal' | 'dodge' | 'block' | 'counter' | 'resilience' | 'echo' | 'thorns' | 'steal';

export type StarRatingStat =
  | 'critRating'
  | 'critDmgRating'
  | 'penRating'
  | 'masteryRating'
  | 'tenacityRating'
  | 'fortuneRating';

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

export interface StarBranchDef {
  id: string;
  label: string;
  effects: StarNodeEffect[];
}

export interface StarNodeDef {
  star: number;
  label: string;
  effects: StarNodeEffect[];
  /** true：与共用节点 effects 叠加；默认 false = 整节点替换 */
  stack?: boolean;
  /** 若存在：该星是岔路节点，玩家须二选一 */
  branches?: StarBranchDef[];
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
    const nameMap: Record<string, string> = {
      lifesteal: '吸血',
      dodge: '闪避',
      block: '格挡',
      counter: '反击',
      resilience: '不屈',
      echo: '回响',
      thorns: '反伤',
      steal: '偷取',
    };
    return `${nameMap[fx.stat] ?? fx.stat}+${Math.round(fx.value * 100)}%`;
  }
  if (fx.kind === 'rating') {
    const map: Record<StarRatingStat, string> = {
      critRating: '暴击',
      critDmgRating: '暴伤',
      penRating: '穿透',
      masteryRating: '精通',
      tenacityRating: '坚韧',
      fortuneRating: '气运',
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
    return `解锁${statusLabel(fx.status.statusId)}`;
  }
  if (fx.kind === 'effect_unlock') {
    return `解锁${effectKindLabel(fx.effect.kind)}`;
  }
  return '';
}

/** 技能效果 kind → 中文（UI / 升星摘要） */
export const EFFECT_KIND_LABELS: Record<string, string> = {
  purge: '驱散',
  cleanse: '净化',
  first_cast: '先声增伤',
  vs_shield: '对盾增伤',
  execute: '斩杀',
  heal_low_hp: '残血加疗',
  refund_qi_on_kill: '击杀还元',
  team_shield: '队友结界',
  ally_grant_qi: '济元回能',
};

export function effectKindLabel(kind: string): string {
  return EFFECT_KIND_LABELS[kind] ?? kind;
}
