export type Row = 'front' | 'mid' | 'back';

export type Role =
  | 'flex'
  | 'tank'
  | 'st_burst'
  | 'aoe_dps'
  | 'st_ctrl'
  | 'aoe_ctrl'
  | 'group_amp'
  | 'st_heal'
  | 'aoe_heal';

export type Job =
  | 'vanguard'
  | 'assassin'
  | 'ranger'
  | 'mage'
  | 'warlock'
  | 'support'
  | 'healer'
  | 'adept';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/** 伙伴稀有度中性显示名（故事皮可后换） */
export const RARITY_LABELS: Record<Rarity, string> = {
  common: '凡品',
  uncommon: '精良',
  rare: '良品',
  epic: '珍品',
  legendary: '绝品',
};

export type EquipSlot =
  | 'weapon'
  | 'offhand'
  | 'head'
  | 'chest'
  | 'hands'
  | 'feet'
  | 'back'
  | 'neck'
  | 'ring'
  | 'trinket';

/** 正常阵容出战上限（九宫最多 9 格，V1 上限 5） */
export const MAX_PARTY_SIZE = 5;

/** 10 装备槽位列表 */
export const EQUIP_SLOTS: EquipSlot[] = [
  'weapon', 'offhand', 'head', 'chest', 'hands',
  'feet', 'back', 'neck', 'ring', 'trinket',
];

/** @deprecated 用 EQUIP_SLOTS */
export { EQUIP_SLOTS as UNLOCKED_EQUIP_SLOTS };

/** 战中可选行动：普攻 + 招牌技能（无通用防御；承伤由坦克技能/站位负责） */
export type ActionKind = 'attack' | 'skill';

/** 力系 / 灵系（仙剑向双轴；显示名随皮） */
export type DamageSchool = 'phys' | 'spirit';

/**
 * 九宫目标形状 id（数据驱动，可扩展）。
 * 内置见 targeting 注册表；新形状用 `registerTargetPattern`，不必改战斗主循环。
 */
export type TargetPattern = string;

/**
 * 单体伤害焦点策略 id（数据驱动）。
 * 内置：`lane`（默认对位）| `lowest_hp` | `front_row` | `backline` | `random`
 * 可用 `registerFocusPolicy` 注册新 id，无需改战斗主循环。
 */
export type FocusPolicyId = string;

export type StatusId = string;

/** 敌方抗控分级；玩家单位固定 normal */
export type UnitRank = 'normal' | 'elite' | 'boss';

export interface CcDrEntry {
  /** 本窗口内已成功挂上次数 */
  applications: number;
  /** 目标再行动几次后窗口结束 */
  actsLeft: number;
}

/** 非状态类效果 kind（字符串可扩；内置见下） */
export type SkillEffectKind = string;

export interface SkillEffect {
  kind: SkillEffectKind;
  multiplier?: number;
  value?: number;
}

export interface FollowUpDef {
  chance: number;
  multiplier?: number;
  targetPattern?: TargetPattern;
}

export interface ApplyStatusDef {
  statusId: StatusId;
  chance?: number;
  duration?: number;
  value?: number;
  layers?: number;
}

export interface SkillDef {
  id: string;
  name: string;
  nameKey?: string;
  blurb?: string;
  targetPattern: TargetPattern;
  tags: string[];
  multiplier: number;
  qiCost: number;
  applyStatus: ApplyStatusDef[];
  effects?: SkillEffect[];
  followUp?: FollowUpDef;
  focusPolicy?: FocusPolicyId;
  damageSchool?: DamageSchool;
  aiWeight: number;
}

/** 九宫格：1–3 前排，4–6 中排，7–9 后排（左→右） */
export type GridSlot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type StatKey =
  | 'atk'
  | 'def'
  | 'res'
  | 'maxHp'
  | 'spd'
  | 'critRating'
  | 'critDmgRating'
  | 'penRating'
  | 'masteryRating'
  | 'tenacityRating'
  | 'fortuneRating'
  | 'dodge'
  | 'lifesteal'
  | 'critResist'
  | 'block'
  | 'counter'
  | 'resilience'
  | 'echo'
  | 'thorns'
  | 'steal';

export interface AffixDef {
  id: string;
  name: string;
  stat: StatKey;
  min: number;
  max: number;
  /** 权重层：high=10, mid=6, low=3, verylow=1 */
  weight: number;
}

export interface AffixInstance {
  defId: string;
  name: string;
  stat: StatKey;
  value: number;
}

export interface Equipment {
  id: string;
  name: string;
  slot: EquipSlot;
  rarity: Rarity;
  /** 基础属性（固定，按槽位+品级） */
  baseStats: Partial<Record<'atk' | 'def' | 'res' | 'maxHp' | 'spd', number>>;
  /** 随机词缀（统一池） */
  affixes: AffixInstance[];
  /** 稀有词缀（额外独立判定） */
  rareAffixes?: AffixInstance[];
  /** T3 效果 #1 */
  effectAffixId?: string;
  /** T3 效果 #2（传说才可能） */
  effectAffixId2?: string;
  /** 套装 */
  setId?: string;
  /** 孔位 */
  socketCount: 0 | 1;
  /** 已镶宝石 */
  gemId?: string;
  /** 强化等级 */
  enhanceLevel: number;
}

export interface StatusInstance {
  statusId: StatusId;
  value?: number;
  layers?: number;
  remaining: number;
}

export interface UnitTemplate {
  id: string;
  name: string;
  role: Role;
  job: Job;
  rarity: Rarity;
  preferredSlot: GridSlot;
  isHero?: boolean;
  damageSchool: DamageSchool;
  baseAtk: number;
  baseDef: number;
  baseRes: number;
  baseMaxHp: number;
  baseSpd: number;
  critRating: number;
  critDmgRating: number;
  penRating: number;
  masteryRating: number;
  tenacityRating: number;
  fortuneRating: number;
  maxQi: number;
  dodge?: number;
  lifesteal?: number;
  critResist?: number;
  block?: number;
  skillId: string;
  focusPolicy?: FocusPolicyId;
}

export interface UnitRuntime {
  uid: string;
  templateId: string;
  name: string;
  role: Role;
  job: Job;
  slot: GridSlot;
  isHero: boolean;
  dead: boolean;
  damageSchool: DamageSchool;
  atk: number;
  def: number;
  res: number;
  maxHp: number;
  hp: number;
  spd: number;
  critRating: number;
  critDmgRating: number;
  penRating: number;
  masteryRating: number;
  tenacityRating: number;
  fortuneRating: number;
  dodge: number;
  lifesteal: number;
  critResist: number;
  block: number;
  counter: number;
  resilience: number;
  echo: number;
  thorns: number;
  steal: number;
  finalDmgBonus: number;
  qi: number;
  maxQi: number;
  skill: SkillDef;
  shield: number;
  statuses: StatusInstance[];
  rank: UnitRank;
  ccDr: Partial<Record<string, CcDrEntry>>;
  statusApplyCounts: Record<string, number>;
  skillCastCount?: number;
  focusPolicy?: FocusPolicyId;
}

export interface BattleSide {
  units: UnitRuntime[];
}

export type BattleEventCode =
  | 'turn_start'
  | 'action'
  | 'hit'
  | 'crit'
  | 'resist'
  | 'status_apply'
  | 'status_block'
  | 'status_remove'
  | 'unit_down'
  | 'unit_revive'
  | 'block'
  | 'dodge'
  | 'heal'
  | 'shield_gain'
  | 'qi_gain'
  | 'follow_up'
  | 'battle_end';

export interface BattleEvent {
  code: BattleEventCode;
  turn: number;
  payload: Record<string, unknown>;
}

export interface BattleState {
  turn: number;
  player: BattleSide;
  enemy: BattleSide;
  events: BattleEvent[];
  log: string[];
  status: 'ongoing' | 'won' | 'lost';
  actedUids: string[];
  awaitingHeroAction: boolean;
  pendingHeroUid: string | null;
  encounterId: string;
  defeatHint: string | null;
}

export interface CharacterProgress {
  templateId: string;
  level: number;
  exp: number;
  breakthroughTier: number;
  cultivationNodes?: number;
  star: number;
  owned: boolean;
  cardShards: number;
  starBranch?: Record<number, string>;
}

/** 账号级货币 */
export interface PlayerCurrencies {
  xiuwei: number;
  stardust: number;
  ticket: number;
  [currencyId: string]: number;
}

export interface PlayerState {
  version: number;
  gold: number;
  inventory: Equipment[];
  /** @deprecated 旧共享衣柜；迁移后不再使用 */
  equipped: Partial<Record<EquipSlot, string>>;
  formation: Partial<Record<string, GridSlot>>;
  heroManual: boolean;
  wins: number;
  seed: number;
  encounterIndex: number;
  currencies: PlayerCurrencies;
  roster: Record<string, CharacterProgress>;
  towerFloor: number;
  gachaPity: number;
  stamina: number;
  staminaUpdatedAt: number;
  chapterCleared: number;
  chapterNodeIndex: number;
  lastDailyClaimDay?: string;
  stardustExchangeDay?: string;
  stardustExchangesToday?: number;
  starBranchRespecDay?: string;
  starBranchRespecToday?: number;
  /** 每角色独立装备：{ templateId: { slotId: equipmentId } } */
  characterEquip?: Record<string, Partial<Record<EquipSlot, string>>>;
  /** T4 形态石绑角色：{ templateId: morphId } */
  characterMorphs?: Record<string, string>;
  /** T4 形态石背包 */
  morphStones?: string[];
  /** 强化石数量 */
  enhanceStones?: number;
  /** 宝石背包 */
  gems?: { gemId: string; count: number }[];
  /** 今日已挖矿次数 */
  mineCountToday?: number;
  /** 挖矿计数日 */
  mineDay?: string;
  /** VIP 额外挖矿上限 */
  mineExtraLimit?: number;
}

export interface SaveAdapter {
  load(): PlayerState | null;
  save(state: PlayerState): void;
  clear(): void;
}

export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
}

export interface StepOptions {
  heroManual?: boolean;
  heroAction?: ActionKind;
}
