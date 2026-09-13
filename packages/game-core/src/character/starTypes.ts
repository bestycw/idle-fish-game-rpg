/**
 * 升星效果类型（扩展口）。
 * 新 kind：在此加联合成员 → deriveGrowthStats / skillCompose / summarizeStarEffect 各加一支。
 */
import { ratingToPct } from '../combat/ratings.js';
import { getStatusDef, statusLabel } from '../combat/statusFx.js';
import type { ApplyStatusDef, SkillEffect } from '../shared/types.js';

export type StarRareStat = 'lifesteal' | 'dodge' | 'block' | 'counter' | 'resilience' | 'echo' | 'thorns' | 'steal' | 'critResist';

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
  | { kind: 'effect_unlock'; effect: SkillEffect }
  /** 本场一次：致死后按比例起身（区别于不屈的概率 1 血） */
  | { kind: 'nirvana'; hpRatio?: number }
  /** 仅生命/攻/防/抗/速 分拆（底子微幅的拆条） */
  | { kind: 'split_stat'; stat: 'hp' | 'atk' | 'def' | 'res' | 'spd'; pct: number }
  /** 终伤加算（如 +0.03） */
  | { kind: 'final_dmg'; value: number }
  /** 开战/受击/普攻回能 */
  | { kind: 'qi_passive'; start?: number; onHit?: number; basic?: number }
  /** 技能带某 tag 时倍率加算；tag=single 看 targetPattern */
  | { kind: 'tag_mult'; tag: string; delta: number }
  /** 改技能焦点（现网可配，默认仍不进职能轨） */
  | { kind: 'focus_policy'; policy: string }
  /** 改技能形状 */
  | { kind: 'pattern'; pattern: string }
  /** 技能追加 tag */
  | { kind: 'tag_add'; tag: string }
  /** 人物被动旗标（开战/受击钩子，不进技能 effects） */
  | { kind: 'unit_flag'; flag: 'secondWind' | 'counterFollow' | 'linkHeal' };

export interface StarBranchDef {
  id: string;
  label: string;
  effects: StarNodeEffect[];
  /** 分支短名（如 济世）；缺省从 label 取末段 */
  identityLabel?: string;
}

export interface StarNodeDef {
  star: number;
  label: string;
  effects: StarNodeEffect[];
  /** true：与共用节点 effects 叠加；默认 false = 整节点替换 */
  stack?: boolean;
  /** ★3 选定分支；★6 存该分支满星（玩家不再另选） */
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

function fmtPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function fmtTimes(n: number): string {
  return `×${Math.round(n * 100) / 100}`;
}

const TICK_HP_PCT: Record<string, number> = {
  bleed_hp_pct: 0.03,
  regen_hp_pct: 0.04,
};

/** 挂状一句：时长 / 强度 / 命中，给升星「解锁 XX」用 */
export function summarizeApplyStatus(s: ApplyStatusDef): string {
  const meta = getStatusDef(s.statusId);
  const name = statusLabel(s.statusId);
  const head: string[] = [name];
  if (s.layers != null && s.layers > 1) head.push(`${s.layers}层`);
  if (s.duration != null && !meta?.appliesAsShield) head.push(`${s.duration}回`);
  const potency: string[] = [];
  if (meta?.incomingDefMultFromValue && s.value != null) {
    potency.push(`防御×${Math.round(s.value * 100)}%`);
  }
  if (meta?.incomingDamageTakenFromValue && s.value != null) {
    potency.push(`承伤×${Math.round(s.value * 100)}%`);
  }
  if (meta?.tickKind && TICK_HP_PCT[meta.tickKind] != null) {
    const pct = s.value ?? TICK_HP_PCT[meta.tickKind]!;
    const layers = s.layers ?? 1;
    potency.push(`每回生命上限${Math.round(pct * layers * 100)}%`);
  }
  if (meta?.actionWeightMult != null && meta.actionWeightMult !== 1) {
    potency.push(`行动权重×${Math.round(meta.actionWeightMult * 100)}%`);
  }
  if (meta?.outgoingDamageMult != null && meta.outgoingDamageMult !== 1) {
    potency.push(`出手伤害×${Math.round(meta.outgoingDamageMult * 100)}%`);
  }
  if (meta?.deferIncomingRatio) {
    potency.push(`承伤推迟${fmtPct(meta.deferIncomingRatio)}`);
  }
  if (meta?.healOnTakenHit) {
    potency.push(`挨打回血${fmtPct(s.value ?? 0.05)}`);
  }
  if (meta?.backlashOnCleanse) {
    potency.push('驱则反噬');
  }
  let line = head.join(' ');
  if (potency.length) line += `（${potency.join('、')}）`;
  const isHostile = meta?.kind === 'debuff' || meta?.kind === 'cc';
  if (!isHostile) return line;
  if (meta?.guaranteedLand) {
    if (s.chance != null && s.chance < 1) return `${fmtPct(s.chance)}附加${line}`;
    return line;
  }
  const land = Math.round((meta?.landBase ?? 0.75) * 100);
  if (s.chance != null && s.chance < 1) {
    return `${fmtPct(s.chance)}附加${line} · 命中率${land}%`;
  }
  return `${line} · 命中率${land}%`;
}

/** 魔兽/新的开始式：效果写进条件句，给技能正文和升星说明共用 */
export function proseSkillEffect(e: SkillEffect): string {
  const m = e.multiplier;
  const v = e.value;
  const name = effectKindLabel(e.kind);
  let clause: string;
  switch (e.kind) {
    case 'vs_shield':
      clause = `若目标有护盾，对盾增伤至${fmtTimes(m ?? 1.25)}`;
      break;
    case 'first_cast':
      clause = `本场首次施放时，伤害提高至${fmtTimes(m ?? 1.3)}`;
      break;
    case 'execute':
      clause = `目标生命低于${fmtPct(v ?? 0.3)}时，斩杀至${fmtTimes(m ?? 1.4)}`;
      break;
    case 'heal_low_hp':
      clause = `目标生命低于${fmtPct(v ?? 0.4)}时，残血加疗至${fmtTimes(m ?? 1.4)}`;
      break;
    case 'self_low_hp':
      clause = `自身生命低于${fmtPct(v ?? 0.4)}时，伤害提高至${fmtTimes(m ?? 1.3)}`;
      break;
    case 'vs_high_hp':
      clause = `目标生命高于${fmtPct(v ?? 0.65)}时，伤害提高至${fmtTimes(m ?? 1.25)}`;
      break;
    case 'vs_cc':
      clause = `若目标已被硬控，伤害提高至${fmtTimes(m ?? 1.25)}`;
      break;
    case 'surround':
      clause = `目标身旁有人时，伤害提高至${fmtTimes(m ?? 1.2)}`;
      break;
    case 'vs_back':
      clause = `打中后排时，伤害提高至${fmtTimes(m ?? 1.18)}`;
      break;
    case 'vs_rank':
      clause = `对精英或首领，伤害提高至${fmtTimes(m ?? 1.22)}`;
      break;
    case 'purge':
      clause = '并驱散其1道增益';
      break;
    case 'cleanse':
    case 'team_cleanse':
      clause = `${name}（清1道减益）`;
      break;
    case 'cleanse_self':
      clause = `${name}（清自身1道减益）`;
      break;
    case 'ally_grant_qi':
      clause =
        e.chance != null && e.chance < 1
          ? `${Math.round(e.chance * 100)}% 灌气 +${v ?? 8}`
          : `${name} +${v ?? 8}`;
      break;
    case 'steal_qi':
      clause = `抽走${v ?? 8}点能量`;
      break;
    case 'team_shield':
      clause = `并为全队施加${name} ${fmtTimes(m ?? 0.4)}`;
      break;
    case 'self_shield':
      clause = `为自己施加护盾 ${fmtTimes(m ?? 0.4)}`;
      break;
    case 'revive_ally':
      clause = `${name}（起身${fmtPct(v ?? 0.35)}）`;
      break;
    case 'refund_qi_on_kill':
      clause = `${name}（返还耗能${fmtPct(v ?? 0.45)}）`;
      break;
    default:
      clause = summarizeSkillEffect(e);
  }
  if (e.kind !== 'ally_grant_qi' && e.chance != null && e.chance < 1) {
    return `有${Math.round(e.chance * 100)}%几率${clause}`;
  }
  return clause;
}

function fromTo(from: string, to: string, up: boolean): string {
  return `由${from}${up ? '提高' : '降低'}至${to}`;
}

/** 把「提高至×1.32」收成「由×1.25提高至×1.32」，避免叠两个「提高」 */
function spliceTimesDelta(line: string, afterTimes: string, change: string): string | null {
  const verbs = ['提高至', '增伤至', '斩杀至', '加疗至', '至'];
  for (const verb of verbs) {
    const needle = `${verb}${afterTimes}`;
    if (!line.includes(needle)) continue;
    if (verb === '提高至') return line.replace(needle, change);
    if (verb === '至') return line.replace(needle, change);
    return line.replace(needle, `${verb.slice(0, -1)}${change}`);
  }
  if (line.includes(afterTimes)) return line.replace(afterTimes, change);
  return null;
}

/** 同一效果升星后的变化：只写差额，不整句对打 */
export function proseSkillEffectDelta(before: SkillEffect, after: SkillEffect): string {
  const afterLine = proseSkillEffect(after);
  if (before.multiplier != null && after.multiplier != null && before.multiplier !== after.multiplier) {
    const a = fmtTimes(after.multiplier);
    const b = fmtTimes(before.multiplier);
    const change = fromTo(b, a, after.multiplier > before.multiplier);
    const spliced = spliceTimesDelta(afterLine, a, change);
    if (spliced) return spliced;
  }
  if (before.value != null && after.value != null && before.value !== after.value) {
    const a = before.value < 3 && after.value < 3 ? fmtPct(after.value) : String(after.value);
    const b = before.value < 3 && after.value < 3 ? fmtPct(before.value) : String(before.value);
    const change = fromTo(b, a, after.value > before.value);
    if (afterLine.includes(a)) return afterLine.replace(a, change);
  }
  if (before.chance != null && after.chance != null && before.chance !== after.chance) {
    const a = `${Math.round(after.chance * 100)}%`;
    const b = `${Math.round(before.chance * 100)}%`;
    return afterLine.replace(a, fromTo(b, a, after.chance > before.chance));
  }
  return afterLine;
}

/** 非状态效果一句：招魂起身%、斩杀阈值、结界倍率… */
export function summarizeSkillEffect(e: SkillEffect): string {
  const name = effectKindLabel(e.kind);
  const m = e.multiplier;
  const v = e.value;
  const body = summarizeSkillEffectBody(e, name, m, v);
  if (e.chance != null && e.chance < 1) {
    return `${Math.round(e.chance * 100)}% ${body}`;
  }
  return body;
}

function summarizeSkillEffectBody(
  e: SkillEffect,
  name: string,
  m: number | undefined,
  v: number | undefined,
): string {
  switch (e.kind) {
    case 'cleanse':
    case 'team_cleanse':
      return `${name}（清1道减益）`;
    case 'cleanse_self':
      return `${name}（清自身1道减益）`;
    case 'purge':
      return `${name}（剥1道增益）`;
    case 'purge_all':
      return `${name}（连剥2道增益）`;
    case 'first_cast':
      return `${name} ${fmtTimes(m ?? 1.3)}`;
    case 'vs_shield':
      return `${name} ${fmtTimes(m ?? 1.25)}`;
    case 'execute':
      return `${name}（生命≤${fmtPct(v ?? 0.3)} · 伤害${fmtTimes(m ?? 1.4)}）`;
    case 'heal_low_hp':
      return `${name}（生命≤${fmtPct(v ?? 0.4)} · 治疗${fmtTimes(m ?? 1.4)}）`;
    case 'vs_high_hp':
      return `${name}（生命≥${fmtPct(v ?? 0.65)} · 伤害${fmtTimes(m ?? 1.25)}）`;
    case 'self_low_hp':
      return `${name}（己方生命≤${fmtPct(v ?? 0.4)} · 伤害${fmtTimes(m ?? 1.3)}）`;
    case 'vs_cc':
      return `${name} ${fmtTimes(m ?? 1.25)}`;
    case 'vs_rank':
      return `${name} ${fmtTimes(m ?? 1.22)}`;
    case 'surround':
      return `${name} ${fmtTimes(m ?? 1.2)}`;
    case 'vs_back':
      return `${name} ${fmtTimes(m ?? 1.18)}`;
    case 'team_shield':
      return `${name} ${fmtTimes(m ?? 0.4)}`;
    case 'self_shield':
      return `${name} ${fmtTimes(m ?? 0.4)}`;
    case 'revive_ally':
      return `${name}（起身${fmtPct(v ?? 0.35)}）`;
    case 'refund_qi_on_kill':
      return `${name}（返还耗能${fmtPct(v ?? 0.45)}）`;
    case 'ally_grant_qi':
      return `${name} +${v ?? 8}`;
    case 'grant_qi':
      return `${name} +${v ?? 10}`;
    case 'steal_qi':
      return `${name} ${v ?? 8}`;
    case 'heal_on_kill':
      return `${name}（生命上限×${fmtPct(v ?? 0.12)}）`;
    case 'heal_on_skill':
      return `${name}（造伤×${fmtPct(v ?? 0.12)}）`;
    case 'follow_heal':
      return `${name}（治疗量×${fmtPct(v ?? 0.4)}）`;
    case 'extra_hit_front':
      return `${name} ${fmtTimes(m ?? 0.45)}`;
    case 'on_kill_follow':
      return `${name} ${fmtTimes(m ?? 0.5)}`;
    case 'clone_hit':
      return `${name} ${fmtTimes(m ?? 0.4)}`;
    case 'overkill_col':
      return `${name} ${fmtTimes(v ?? 0.25)}`;
    case 'atonement':
      return `${name}（造伤×${fmtPct(v ?? 0.22)}）`;
    case 'heal_from_taken':
      return `${name}（承伤×${fmtPct(v ?? 0.5)}）`;
    case 'focus_streak':
      return `${name}（每层伤害+${fmtPct(v ?? 0.08)}）`;
    case 'mark_pop':
      return `${name}（生命上限×${fmtPct(v ?? 0.08)}）`;
    case 'time_rewind':
      return `${name}（缺口×${fmtPct(v ?? 0.4)}）`;
    case 'self_dmg_cap':
      return `${name}（单次≤${fmtPct(v ?? 0.35)}）`;
    case 'self_regen':
      return `${name} 3回（每回生命上限${fmtPct(v ?? 0.04)}）`;
    case 'self_atk_up':
      return `${name} 2回`;
    case 'self_def_up':
      return `${name} 2回`;
    case 'self_spd_up':
      return `${name} 2回`;
    case 'self_crit_up':
      return `${name} 2回`;
    case 'self_stagger':
      return `${name} 3回`;
    case 'self_earth_shield':
      return `${name} 3回·3层`;
    case 'self_immortal':
      return `${name} 1回`;
    case 'self_stealth':
      return `${name} 2回`;
    case 'self_cover':
      return `${name} 3回`;
    case 'self_reflect_cc':
      return `${name} 2回`;
    case 'self_dao':
      return `${name}（最多5层）`;
    case 'share_oath':
      return `${name} 3回`;
    case 'blood_pact':
      return `${name} ${fmtTimes(m ?? 1.28)}`;
    case 'fortune_strike':
      return `${name} ${fmtTimes(m ?? 1.25)}`;
    case 'domain_lite':
      return `${name} 2回`;
    case 'transfer_debuff':
      return `${name}（移1道减益）`;
    case 'steal_buff':
      return `${name}（夺1道增益）`;
    default: {
      const bits: string[] = [];
      if (m != null) bits.push(fmtTimes(m));
      if (v != null) bits.push(v < 3 ? fmtPct(v) : `+${v}`);
      return bits.length ? `${name} ${bits.join(' · ')}` : name;
    }
  }
}

export type StarEffectSpeakCtx = {
  /** 这一星打磨的状态；有则「眩晕多1回」而不是「状态+1回」 */
  statusIds?: string[];
};

export function summarizeStarEffect(fx: StarNodeEffect, ctx?: StarEffectSpeakCtx): string {
  if (fx.kind === 'stat_pct') {
    return `主属性+${Math.round(fx.mainPct * 100)}%`;
  }
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
      critResist: '沉着',
    };
    return `${nameMap[fx.stat] ?? fx.stat}提高${Math.round(fx.value * 100)}%`;
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
    const pct = Math.round(ratingToPct(fx.value, fx.stat) * 100);
    return `${map[fx.stat]}约提高${pct}%`;
  }
  if (fx.kind === 'enable_follow_up') {
    return `有${Math.round(fx.chance * 100)}%几率追加一击（×${fx.multiplier ?? 1}）`;
  }
  if (fx.kind === 'skill_mult') {
    const d = `${fx.delta >= 0 ? '+' : ''}${fx.delta.toFixed(2)}`;
    return `伤害倍率${d}`;
  }
  if (fx.kind === 'qi_cost') {
    return fx.delta < 0 ? `耗能减少${-fx.delta}` : `耗能增加${fx.delta}`;
  }
  if (fx.kind === 'status_boost') {
    const names = [...new Set(ctx?.statusIds ?? [])].map((id) => statusLabel(id));
    const who = names.length === 1 ? names[0] : names.length ? names.join('、') : '状态';
    const bits: string[] = [];
    if (fx.duration) bits.push(`多${fx.duration}回`);
    if (fx.layers) bits.push(`多叠${fx.layers}层`);
    if (fx.valueMult != null && fx.valueMult !== 1) {
      bits.push(`强度提高至×${fx.valueMult}`);
    }
    return bits.length ? `${who}${bits.join('、')}` : `${who}加深`;
  }
  if (fx.kind === 'status_unlock') {
    return summarizeApplyStatus(fx.status);
  }
  if (fx.kind === 'effect_unlock') {
    return proseSkillEffect(fx.effect);
  }
  if (fx.kind === 'nirvana') {
    return `本场限一次，倒下后按${Math.round((fx.hpRatio ?? 0.3) * 100)}%生命起身`;
  }
  if (fx.kind === 'split_stat') {
    const map = { hp: '生命', atk: '攻击', def: '防御', res: '抗性', spd: '身法' };
    return `${map[fx.stat]}提高${Math.round(fx.pct * 100)}%`;
  }
  if (fx.kind === 'final_dmg') return `终伤提高${Math.round(fx.value * 100)}%`;
  if (fx.kind === 'qi_passive') {
    const bits: string[] = [];
    if (fx.start) bits.push(`开战能量+${fx.start}`);
    if (fx.onHit) bits.push(`受击回能+${fx.onHit}`);
    if (fx.basic) bits.push(`普攻回能+${fx.basic}`);
    return bits.join('，') || '回能加快';
  }
  if (fx.kind === 'tag_mult') return `${fx.tag}倍率${fx.delta >= 0 ? '+' : ''}${fx.delta.toFixed(2)}`;
  if (fx.kind === 'focus_policy') return `索敌改为${fx.policy}`;
  if (fx.kind === 'pattern') return `形状改为${fx.pattern}`;
  if (fx.kind === 'tag_add') return `追加${fx.tag}`;
  if (fx.kind === 'unit_flag') {
    const map = { secondWind: '残阳', counterFollow: '反击连', linkHeal: '同心' };
    return map[fx.flag];
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
  ally_grant_qi: '灌气',
  revive_ally: '招魂',
  grant_qi: '自回能',
  vs_cc: '乘乱增伤',
  vs_high_hp: '撼岳增伤',
  heal_on_kill: '击杀回血',
  self_atk_up: '加持',
  self_def_up: '铁壁咒',
  self_spd_up: '神行',
  self_regen: '回春',
  self_shield: '护体',
  self_low_hp: '残血狂',
  vs_rank: '镇煞',
  surround: '合围',
  focus_streak: '一鼓作气',
  atonement: '伤疗同源',
  heal_from_taken: '以伤回血',
  self_stagger: '卸力',
  self_earth_shield: '受击回春',
  vs_back: '袭后',
  follow_heal: '连济',
  extra_hit_front: '扫尾',
  on_kill_follow: '追亡',
  heal_on_skill: '战疗',
  team_cleanse: '群体涤',
  purge_all: '削灵',
  cleanse_self: '净己',
  steal_qi: '夺气',
  transfer_debuff: '移花接木',
  mark_pop: '印爆',
  domain_lite: '领域',
  overkill_col: '列贯余伤',
  time_rewind: '逆转',
  blood_pact: '血契',
  fortune_strike: '天眷',
  share_oath: '义护',
  dao_stack: '悟道叠层',
  self_crit_up: '开眼',
  self_immortal: '金身',
  self_stealth: '隐锋',
  self_dmg_cap: '金身限额',
  self_cover: '掩护',
  self_reflect_cc: '反制',
  self_dao: '悟道',
  steal_buff: '窃天',
  clone_hit: '影袭',
};

export function effectKindLabel(kind: string): string {
  return EFFECT_KIND_LABELS[kind] ?? kind;
}
