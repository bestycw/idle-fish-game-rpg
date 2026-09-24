/**
 * 扩展卡招牌：按 kit 动词组装，禁止克隆 ROLE_PLACEHOLDER_SKILLS。
 * 破甲（shred）只允许 shred_trap / shred_guard（孙膑、公输班）。
 */
import type {
  ApplyStatusDef,
  DamageSchool,
  FocusPolicyId,
  Rarity,
  Role,
  SkillDef,
  SkillEffect,
  SoftModeDef,
  TargetPattern,
} from '../../shared/types.js';

export type KitId =
  | 'guard'
  | 'taunt'
  | 'earth'
  | 'first_guard'
  | 'team_wall'
  | 'hp_guard'
  | 'bleed_pierce'
  | 'execute'
  | 'hunt_back'
  | 'high_hp'
  | 'first_strike'
  | 'col_kill'
  | 'mark_hunt'
  | 'row_smash'
  | 'cross_hit'
  | 'col_wave'
  | 'surround_aoe'
  | 'first_wave'
  | 'stun'
  | 'silence'
  | 'heal_block'
  | 'sleep'
  | 'slow_pin'
  | 'havoc'
  | 'mass_slow'
  | 'mass_silence'
  | 'mass_sleep'
  | 'amp_atk'
  | 'amp_qi'
  | 'amp_spd'
  | 'qi_drought'
  | 'amp_def'
  | 'shred_trap'
  | 'shred_guard'
  | 'heal_cleanse'
  | 'heal_low'
  | 'team_heal'
  | 'team_aegis'
  | 'regen'
  | 'flex_purge'
  | 'flex_first'
  | 'flex_bleed'
  | 'flex_stun'
  | 'flex_qi';

export const KIT_IDS: readonly KitId[] = [
  'guard',
  'taunt',
  'earth',
  'first_guard',
  'team_wall',
  'hp_guard',
  'bleed_pierce',
  'execute',
  'hunt_back',
  'high_hp',
  'first_strike',
  'col_kill',
  'mark_hunt',
  'row_smash',
  'cross_hit',
  'col_wave',
  'surround_aoe',
  'first_wave',
  'stun',
  'silence',
  'heal_block',
  'sleep',
  'slow_pin',
  'havoc',
  'mass_slow',
  'mass_silence',
  'mass_sleep',
  'amp_atk',
  'amp_qi',
  'amp_spd',
  'qi_drought',
  'amp_def',
  'shred_trap',
  'shred_guard',
  'heal_cleanse',
  'heal_low',
  'team_heal',
  'team_aegis',
  'regen',
  'flex_purge',
  'flex_first',
  'flex_bleed',
  'flex_stun',
  'flex_qi',
] as const;

interface KitPatch {
  targetPattern?: TargetPattern;
  tags?: string[];
  multiplier?: number;
  qiCost?: number;
  applyStatus?: ApplyStatusDef[];
  effects?: SkillEffect[];
  damageSchool?: DamageSchool;
  focusPolicy?: FocusPolicyId;
  aiWeight?: number;
  blurb: string;
  softModes?: SoftModeDef[];
}

export const KIT_PATCHES: Record<KitId, KitPatch> = {
  guard: {
    tags: ['guard'],
    applyStatus: [{ statusId: 'shield', duration: 99, value: 0.9 }],
    blurb: '为自己叠一层护盾。',
  },
  taunt: {
    applyStatus: [{ statusId: 'taunt', duration: 2 }],
    blurb: '嘲讽敌人，迫使对方打自己。',
  },
  earth: {
    effects: [{ kind: 'self_earth_shield' }],
    blurb: '挨打时回血。',
  },
  first_guard: {
    tags: ['guard'],
    applyStatus: [{ statusId: 'shield', duration: 99, value: 0.85 }],
    effects: [{ kind: 'first_cast', multiplier: 1.12 }],
    blurb: '为自己叠盾；本场第一道盾更厚（先声增伤）。',
  },
  team_wall: {
    tags: ['guard', 'aoe'],
    targetPattern: 'all',
    effects: [{ kind: 'team_shield', multiplier: 0.32 }],
    blurb: '为全队撑起队友结界。',
  },
  hp_guard: {
    tags: ['guard'],
    applyStatus: [{ statusId: 'shield', duration: 99, value: 0.8 }],
    effects: [{ kind: 'self_low_hp', value: 0.4, multiplier: 1.2 }],
    blurb: '为自己叠盾；自己残血时盾更硬。',
  },
  bleed_pierce: {
    tags: ['pierce', 'damage'],
    applyStatus: [{ statusId: 'bleed', duration: 3, layers: 1 }],
    blurb: '穿透点杀并附加流血。',
  },
  execute: {
    effects: [{ kind: 'execute', value: 0.35, multiplier: 1.3 }],
    focusPolicy: 'lowest_hp',
    blurb: '专打残血（斩杀）。',
  },
  hunt_back: {
    tags: ['pierce', 'damage'],
    focusPolicy: 'backline',
    effects: [{ kind: 'vs_back', multiplier: 1.22 }],
    blurb: '点后排；打中后排时本招伤害×袭后倍率。',
  },
  high_hp: {
    effects: [{ kind: 'vs_high_hp', value: 0.7, multiplier: 1.25 }],
    blurb: '目标生命≥门槛时，本招伤害×撼岳倍率。',
  },
  first_strike: {
    effects: [{ kind: 'first_cast', multiplier: 1.28 }],
    blurb: '本场首次施放伤害更高（先声增伤）。',
  },
  col_kill: {
    targetPattern: 'col_focus',
    tags: ['aoe', 'damage'],
    multiplier: 1.05,
    blurb: '沿列贯穿敌人。',
  },
  mark_hunt: {
    applyStatus: [{ statusId: 'mark_prey', duration: 2, value: 1.15 }],
    focusPolicy: 'backline',
    blurb: '给后排挂上猎印，被打额外承伤。',
  },
  row_smash: {
    targetPattern: 'row_front',
    tags: ['aoe', 'damage'],
    multiplier: 1.05,
    blurb: '横扫前排敌人。',
  },
  cross_hit: {
    targetPattern: 'cross',
    tags: ['aoe', 'damage'],
    multiplier: 1.08,
    blurb: '十字劈开焦点与邻格。',
  },
  col_wave: {
    targetPattern: 'col_focus',
    tags: ['aoe', 'damage'],
    multiplier: 1.02,
    blurb: '沿焦点所在列浪打。',
  },
  surround_aoe: {
    targetPattern: 'row_front',
    tags: ['aoe', 'damage'],
    effects: [{ kind: 'surround', multiplier: 1.18 }],
    blurb: '横扫前排；目标身旁有人时本招伤害×合围倍率。',
  },
  first_wave: {
    targetPattern: 'row_front',
    tags: ['aoe', 'damage'],
    effects: [{ kind: 'first_cast', multiplier: 1.22 }],
    blurb: '横扫前排；本场第一波更烈（先声增伤）。',
  },
  stun: {
    applyStatus: [{ statusId: 'stun', duration: 1 }],
    multiplier: 1.08,
    blurb: '令目标眩晕，无法行动。',
  },
  silence: {
    applyStatus: [{ statusId: 'silence', duration: 1 }],
    blurb: '令目标沉默，不能放技能。',
  },
  heal_block: {
    applyStatus: [{ statusId: 'heal_block', duration: 2 }],
    blurb: '令目标禁疗，治疗无效。',
  },
  sleep: {
    applyStatus: [{ statusId: 'sleep', duration: 1 }],
    blurb: '令目标沉眠；受伤会醒。',
  },
  slow_pin: {
    applyStatus: [{ statusId: 'slow', duration: 2 }],
    blurb: '令目标迟缓，出手更晚。',
  },
  havoc: {
    targetPattern: 'row_front',
    tags: ['aoe', 'damage'],
    applyStatus: [{ statusId: 'havoc', duration: 1 }],
    multiplier: 0.58,
    blurb: '横扫前排并扰乱心神（混乱）。',
  },
  mass_slow: {
    targetPattern: 'row_front',
    tags: ['aoe', 'damage'],
    applyStatus: [{ statusId: 'slow', duration: 2 }],
    multiplier: 0.6,
    blurb: '横扫前排并迟缓。',
  },
  mass_silence: {
    targetPattern: 'row_front',
    tags: ['aoe', 'damage'],
    applyStatus: [{ statusId: 'silence', duration: 1 }],
    multiplier: 0.55,
    blurb: '横扫前排并沉默，封住技能。',
  },
  mass_sleep: {
    targetPattern: 'all',
    tags: ['aoe', 'damage'],
    applyStatus: [{ statusId: 'sleep', duration: 1 }],
    multiplier: 0.42,
    blurb: '大范围令敌人沉眠。',
  },
  amp_atk: {
    effects: [{ kind: 'self_atk_up' }],
    blurb: '抬自身攻击（加持）。',
  },
  amp_qi: {
    effects: [{ kind: 'ally_grant_qi', value: 18 }],
    blurb: '给队友灌气。',
  },
  amp_spd: {
    effects: [{ kind: 'self_spd_up' }],
    blurb: '抬自身身法（神行）。',
  },
  qi_drought: {
    applyStatus: [{ statusId: 'qi_drought', duration: 2 }],
    blurb: '抽干敌人能量（闭气），使其难以回能。',
  },
  amp_def: {
    effects: [{ kind: 'self_def_up' }],
    blurb: '抬自身防御（铁壁咒）。',
  },
  shred_trap: {
    applyStatus: [
      { statusId: 'shred', duration: 2, value: 0.78 },
      { statusId: 'slow', duration: 2 },
    ],
    effects: [{ kind: 'surround', multiplier: 1.2 }],
    blurb: '点破护甲并迟缓；合围时本招伤害再×合围倍率。',
  },
  shred_guard: {
    tags: ['guard', 'damage'],
    applyStatus: [{ statusId: 'shred', duration: 2, value: 0.82 }],
    effects: [{ kind: 'self_earth_shield' }],
    blurb: '拆人护甲，并以械为城。',
  },
  heal_cleanse: {
    tags: ['heal'],
    effects: [{ kind: 'cleanse' }],
    blurb: '治疗并净化减益。',
  },
  heal_low: {
    tags: ['heal'],
    effects: [{ kind: 'heal_low_hp', value: 0.4, multiplier: 1.3 }],
    blurb: '治疗；目标残血时加疗。',
  },
  team_heal: {
    targetPattern: 'all',
    tags: ['heal', 'aoe'],
    multiplier: 0.68,
    blurb: '为全队抬血。',
  },
  team_aegis: {
    targetPattern: 'all',
    tags: ['heal', 'aoe', 'guard'],
    effects: [{ kind: 'team_shield', multiplier: 0.3 }, { kind: 'heal_low_hp', value: 0.35, multiplier: 1.15 }],
    blurb: '群疗并给全队叠一层薄盾（队友结界）。',
  },
  regen: {
    tags: ['heal'],
    effects: [{ kind: 'self_regen' }],
    blurb: '为自己挂上回春。',
  },
  flex_purge: {
    effects: [{ kind: 'purge' }],
    blurb: '驱散目标一道增益。',
  },
  flex_first: {
    effects: [{ kind: 'first_cast', multiplier: 1.2 }],
    blurb: '本场首次施放伤害更高（先声增伤）。',
  },
  flex_bleed: {
    applyStatus: [{ statusId: 'bleed', duration: 2, layers: 1 }],
    blurb: '附加流血。',
  },
  flex_stun: {
    applyStatus: [{ statusId: 'stun', duration: 1 }],
    multiplier: 1.05,
    blurb: '令目标眩晕，无法行动。',
  },
  flex_qi: {
    effects: [{ kind: 'grant_qi', value: 12 }],
    blurb: '为自己回气。',
  },
};

const ROLE_BASE: Record<
  Role,
  Pick<SkillDef, 'targetPattern' | 'tags' | 'multiplier' | 'qiCost' | 'damageSchool' | 'aiWeight'>
> = {
  tank: {
    targetPattern: 'single',
    tags: ['guard'],
    multiplier: 1.18,
    qiCost: 48,
    damageSchool: 'phys',
    aiWeight: 0.45,
  },
  st_burst: {
    targetPattern: 'single',
    tags: ['damage'],
    multiplier: 1.68,
    qiCost: 52,
    damageSchool: 'phys',
    aiWeight: 0.6,
  },
  aoe_dps: {
    targetPattern: 'row_front',
    tags: ['aoe', 'damage'],
    multiplier: 1.02,
    qiCost: 54,
    damageSchool: 'phys',
    aiWeight: 0.55,
  },
  st_ctrl: {
    targetPattern: 'single',
    tags: ['damage'],
    multiplier: 0.62,
    qiCost: 50,
    damageSchool: 'spirit',
    aiWeight: 0.5,
  },
  aoe_ctrl: {
    targetPattern: 'row_front',
    tags: ['aoe', 'damage'],
    multiplier: 0.58,
    qiCost: 52,
    damageSchool: 'spirit',
    aiWeight: 0.5,
  },
  group_amp: {
    targetPattern: 'single',
    tags: ['damage'],
    multiplier: 0.52,
    qiCost: 48,
    damageSchool: 'spirit',
    aiWeight: 0.5,
  },
  st_heal: {
    targetPattern: 'single',
    tags: ['heal'],
    multiplier: 1.22,
    qiCost: 45,
    damageSchool: 'spirit',
    aiWeight: 0.7,
  },
  aoe_heal: {
    targetPattern: 'all',
    tags: ['heal', 'aoe'],
    multiplier: 0.66,
    qiCost: 50,
    damageSchool: 'spirit',
    aiWeight: 0.65,
  },
  flex: {
    targetPattern: 'single',
    tags: ['damage'],
    multiplier: 1.48,
    qiCost: 50,
    damageSchool: 'phys',
    aiWeight: 0.55,
  },
};

/** 已有条件效果的 kit 不再叠同条件软模式，避免正文说两遍 */
const KIT_HOOKS: Partial<Record<KitId, SoftModeDef[]>> = {
  guard: [
    {
      when: { kind: 'self_hp_below', value: 0.4 },
      then: { multiplierDelta: 0.08 },
      copy: '自己残血：盾更硬',
    },
  ],
  taunt: [
    {
      when: { kind: 'first_cast' },
      then: { statusPatches: [{ statusId: 'taunt', duration: 3 }] },
      copy: '本场第一喝：锁敌更死',
    },
  ],
  earth: [
    {
      when: { kind: 'self_hp_below', value: 0.4 },
      then: { multiplierDelta: 0.1 },
      copy: '自己残血：回春更深',
    },
  ],
  team_wall: [
    {
      when: { kind: 'first_cast' },
      then: { effectPatches: [{ kind: 'team_shield', multiplier: 0.4 }] },
      copy: '本场第一道：结界更厚',
    },
  ],
  bleed_pierce: [
    {
      when: { kind: 'target_has_status', statusId: 'bleed' },
      then: { multiplierDelta: 0.12 },
      copy: '已流血：穿透加码',
    },
  ],
  col_kill: [
    {
      when: { kind: 'first_cast' },
      then: { multiplierDelta: 0.1 },
      copy: '本场第一贯：贯穿更深',
    },
  ],
  mark_hunt: [
    {
      when: { kind: 'target_has_status', statusId: 'mark_prey' },
      then: { multiplierDelta: 0.12 },
      copy: '猎印目标：印记咬得更死',
    },
  ],
  row_smash: [
    {
      when: { kind: 'first_cast' },
      then: { multiplierDelta: 0.1 },
      copy: '本场第一扫：排面更开',
    },
  ],
  cross_hit: [
    {
      when: { kind: 'first_cast' },
      then: { multiplierDelta: 0.08 },
      copy: '本场第一劈：十字更深',
    },
  ],
  col_wave: [
    {
      when: { kind: 'first_cast' },
      then: { multiplierDelta: 0.08 },
      copy: '本场第一浪：沿列加码',
    },
  ],
  stun: [
    {
      when: { kind: 'target_under_cc' },
      then: { multiplierDelta: 0.1 },
      copy: '已被硬控：这一晕砸实',
    },
  ],
  silence: [
    {
      when: { kind: 'target_has_status', statusId: 'silence' },
      then: { statusPatches: [{ statusId: 'silence', duration: 1 }] },
      copy: '已封口：再封一拍',
    },
  ],
  heal_block: [
    {
      when: { kind: 'target_hp_below', value: 0.45 },
      then: { multiplierDelta: 0.1 },
      copy: '残血目标：禁疗咬死',
    },
  ],
  sleep: [
    {
      when: { kind: 'target_has_status', statusId: 'sleep' },
      then: { multiplierDelta: 0.1 },
      copy: '沉眠中：再压一记',
    },
  ],
  slow_pin: [
    {
      when: { kind: 'target_has_status', statusId: 'slow' },
      then: { multiplierDelta: 0.08 },
      copy: '已迟缓：钉死脚步',
    },
  ],
  havoc: [
    {
      when: { kind: 'target_has_status', statusId: 'havoc' },
      then: { multiplierDelta: 0.1 },
      copy: '已乱：心神再碎',
    },
  ],
  mass_slow: [
    {
      when: { kind: 'target_has_status', statusId: 'slow' },
      then: { multiplierDelta: 0.08 },
      copy: '已迟缓：一片钉死',
    },
  ],
  mass_silence: [
    {
      when: { kind: 'target_has_status', statusId: 'silence' },
      then: { multiplierDelta: 0.08 },
      copy: '已封口：一片再封',
    },
  ],
  mass_sleep: [
    {
      when: { kind: 'target_has_status', statusId: 'sleep' },
      then: { multiplierDelta: 0.08 },
      copy: '沉眠中：大范围再压',
    },
  ],
  amp_atk: [
    {
      when: { kind: 'first_cast' },
      then: { multiplierDelta: 0.08 },
      copy: '本场第一咒：加持更深',
    },
  ],
  amp_qi: [
    {
      when: { kind: 'first_cast' },
      then: { effectPatches: [{ kind: 'ally_grant_qi', value: 24 }] },
      copy: '本场第一灌：气更足',
    },
  ],
  amp_spd: [
    {
      when: { kind: 'first_cast' },
      then: { multiplierDelta: 0.08 },
      copy: '本场第一身法：更快',
    },
  ],
  qi_drought: [
    {
      when: { kind: 'target_has_status', statusId: 'qi_drought' },
      then: { multiplierDelta: 0.08 },
      copy: '已闭气：再抽一把',
    },
  ],
  amp_def: [
    {
      when: { kind: 'self_hp_below', value: 0.4 },
      then: { multiplierDelta: 0.08 },
      copy: '自己残血：铁壁更深',
    },
  ],
  shred_trap: [
    {
      when: { kind: 'target_has_status', statusId: 'shred' },
      then: { multiplierDelta: 0.1 },
      copy: '已破甲：陷阱咬合',
    },
  ],
  shred_guard: [
    {
      when: { kind: 'target_has_status', statusId: 'shred' },
      then: { multiplierDelta: 0.08 },
      copy: '已破甲：以械压城',
    },
  ],
  heal_cleanse: [
    {
      when: { kind: 'first_cast' },
      then: { effectPatches: [{ kind: 'cleanse' }] },
      copy: '本场第一剂：净化更净',
    },
  ],
  team_heal: [
    {
      when: { kind: 'first_cast' },
      then: { multiplierDelta: 0.08 },
      copy: '本场第一济：全队抬得更高',
    },
  ],
  team_aegis: [
    {
      when: { kind: 'first_cast' },
      then: { effectPatches: [{ kind: 'team_shield', multiplier: 0.38 }] },
      copy: '本场第一幕：结界更厚',
    },
  ],
  regen: [
    {
      when: { kind: 'self_hp_below', value: 0.4 },
      then: { multiplierDelta: 0.1 },
      copy: '自己残血：再生加快',
    },
  ],
  flex_purge: [
    {
      when: { kind: 'first_cast' },
      then: { effectPatches: [{ kind: 'purge' }] },
      copy: '本场第一驱：剥一层',
    },
  ],
  flex_bleed: [
    {
      when: { kind: 'target_has_status', statusId: 'bleed' },
      then: { multiplierDelta: 0.1 },
      copy: '已流血：再撕一口',
    },
  ],
  flex_stun: [
    {
      when: { kind: 'target_under_cc' },
      then: { multiplierDelta: 0.08 },
      copy: '已被硬控：这一下砸实',
    },
  ],
  flex_qi: [
    {
      when: { kind: 'first_cast' },
      then: { effectPatches: [{ kind: 'ally_grant_qi', value: 22 }] },
      copy: '本场第一灌：气更足',
    },
  ],
};

export function kitsForRarity(all: KitId[], rarity: Rarity): KitId[] {
  const n = rarity === 'common' ? 1 : rarity === 'rare' ? 2 : 3;
  return all.slice(0, Math.max(1, n));
}

export function composeKitSkill(opts: {
  id: string;
  name: string;
  role: Role;
  rarity: Rarity;
  motif: string;
  kits: KitId[];
}): SkillDef {
  const used = kitsForRarity(opts.kits, opts.rarity);
  const base = ROLE_BASE[opts.role];
  let targetPattern = base.targetPattern;
  const tags = new Set(base.tags);
  let multiplier = base.multiplier;
  let qiCost = base.qiCost;
  let damageSchool = base.damageSchool;
  let aiWeight = base.aiWeight;
  let focusPolicy: FocusPolicyId | undefined;
  const applyStatus: ApplyStatusDef[] = [];
  const effects: SkillEffect[] = [];
  const softModes: SoftModeDef[] = [];
  const blurbs = [opts.motif.replace(/。$/, '')];

  for (const kitId of used) {
    const k = KIT_PATCHES[kitId];
    if (!k) continue;
    if (k.targetPattern) targetPattern = k.targetPattern;
    if (k.tags) for (const t of k.tags) tags.add(t);
    if (k.multiplier != null) multiplier = k.multiplier;
    if (k.qiCost != null) qiCost = k.qiCost;
    if (k.damageSchool) damageSchool = k.damageSchool;
    if (k.focusPolicy) focusPolicy = k.focusPolicy;
    if (k.aiWeight != null) aiWeight = k.aiWeight;
    if (k.applyStatus) applyStatus.push(...k.applyStatus.map((s) => ({ ...s })));
    if (k.effects) effects.push(...k.effects.map((e) => ({ ...e })));
    if (k.softModes) softModes.push(...k.softModes.map((m) => ({ ...m, when: { ...m.when }, then: { ...m.then } })));
    const hooks = KIT_HOOKS[kitId];
    if (hooks) softModes.push(...hooks.map((m) => ({ ...m, when: { ...m.when }, then: { ...m.then } })));
    blurbs.push(k.blurb.replace(/。$/, ''));
  }

  return {
    id: opts.id,
    name: opts.name,
    nameKey: `skill.${opts.id}`,
    blurb: `${blurbs.filter(Boolean).join('；')}。`,
    targetPattern,
    tags: [...tags],
    multiplier,
    qiCost,
    applyStatus,
    effects: effects.length ? effects : undefined,
    softModes: softModes.length ? softModes : undefined,
    damageSchool,
    focusPolicy,
    aiWeight,
  };
}

export function skillFingerprint(skill: Pick<SkillDef, 'targetPattern' | 'multiplier' | 'applyStatus' | 'effects' | 'focusPolicy'>): string {
  const st = [...(skill.applyStatus ?? [])].map((s) => s.statusId).sort().join(',');
  const ef = [...(skill.effects ?? [])].map((e) => e.kind).sort().join(',');
  return `${skill.targetPattern}|${skill.multiplier}|${st}|${ef}|${skill.focusPolicy ?? ''}`;
}
