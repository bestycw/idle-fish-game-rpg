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

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

/** 伙伴稀有度中性显示名（故事皮可后换） */
export const RARITY_LABELS: Record<Rarity, string> = {
  common: '凡品',
  rare: '良品',
  epic: '珍品',
  legendary: '绝品',
};

export type EquipSlot =
  | 'mainHand'
  | 'offHand'
  | 'head'
  | 'shoulder'
  | 'back'
  | 'chest'
  | 'wrist'
  | 'hands'
  | 'waist'
  | 'legs'
  | 'feet'
  | 'neck'
  | 'finger1'
  | 'finger2'
  | 'trinket1'
  | 'trinket2';

/** 正常阵容出战上限（九宫最多 9 格，V1 上限 5） */
export const MAX_PARTY_SIZE = 5;

/** 16 战斗槽全开（人物面板 2026-07-20 拍板） */
export const UNLOCKED_EQUIP_SLOTS: EquipSlot[] = [
  'mainHand',
  'offHand',
  'head',
  'shoulder',
  'back',
  'chest',
  'wrist',
  'hands',
  'waist',
  'legs',
  'feet',
  'neck',
  'finger1',
  'finger2',
  'trinket1',
  'trinket2',
];

/** 魔兽纸娃娃摆放：左列 / 右列 / 底栏双手 */
export const PAPER_DOLL_LEFT: EquipSlot[] = [
  'head',
  'neck',
  'shoulder',
  'back',
  'chest',
  'wrist',
  'hands',
  'waist',
];

export const PAPER_DOLL_RIGHT: EquipSlot[] = [
  'legs',
  'feet',
  'finger1',
  'finger2',
  'trinket1',
  'trinket2',
];

export const PAPER_DOLL_HANDS: EquipSlot[] = ['mainHand', 'offHand'];

export type ActionKind = 'attack' | 'skill' | 'defend';

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
  targetPattern: TargetPattern;
  tags: string[];
  multiplier: number;
  qiCost: number;
  applyStatus: ApplyStatusDef[];
  effects?: SkillEffect[];
  followUp?: FollowUpDef;
  /** 技能施放时覆盖焦点策略；缺省回落单位/lane */
  focusPolicy?: FocusPolicyId;
  /** 伤害/治疗走力或灵；缺省见 combat.resolveDamageSchool */
  damageSchool?: DamageSchool;
  aiWeight: number;
}

/** 九宫格：1–3 前排，4–6 中排，7–9 后排（左→右） */
export type GridSlot = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type StatKey =
  | 'physAtk'
  | 'spiritAtk'
  | 'physDef'
  | 'spiritDef'
  /** @deprecated 旧档词缀；结算时并入 physAtk / physDef */
  | 'atk'
  | 'def'
  | 'maxHp'
  | 'spd'
  | 'critRating'
  | 'critDmgRating'
  | 'hasteRating'
  | 'versRating'
  | 'masteryRating'
  | 'finalDmgRating'
  | 'fortune'
  | 'dodge'
  | 'lifesteal'
  | 'critResist'
  | 'block';

export interface AffixDef {
  id: string;
  name: string;
  stat: StatKey;
  min: number;
  max: number;
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
  affixes: AffixInstance[];
  setId?: string;
}

export interface StatusInstance {
  statusId: StatusId;
  value?: number;
  layers?: number;
  /** 剩余行动次数（该单位即将行动时消耗） */
  remaining: number;
}

export interface UnitTemplate {
  id: string;
  name: string;
  role: Role;
  job: Job;
  /** 卡面稀有度：定框色；与装备 rarity 共用枚举 */
  rarity: Rarity;
  preferredSlot: GridSlot;
  isHero?: boolean;
  basePhysAtk: number;
  baseSpiritAtk: number;
  basePhysDef: number;
  baseSpiritDef: number;
  baseMaxHp: number;
  baseSpd: number;
  critRating: number;
  critDmgRating: number;
  hasteRating: number;
  versRating: number;
  masteryRating: number;
  finalDmgRating: number;
  fortune: number;
  maxQi: number;
  dodge?: number;
  lifesteal?: number;
  critResist?: number;
  block?: number;
  skillId: string;
  /** 普攻默认焦点策略；缺省 lane。技能可用 skill.focusPolicy 覆盖 */
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
  physAtk: number;
  spiritAtk: number;
  physDef: number;
  spiritDef: number;
  maxHp: number;
  hp: number;
  spd: number;
  critRating: number;
  critDmgRating: number;
  hasteRating: number;
  versRating: number;
  masteryRating: number;
  finalDmgRating: number;
  fortune: number;
  dodge: number;
  lifesteal: number;
  critResist: number;
  block: number;
  qi: number;
  maxQi: number;
  skill: SkillDef;
  defending: boolean;
  shield: number;
  statuses: StatusInstance[];
  rank: UnitRank;
  /** 硬控 DR：按桶 id 独立衰减（见 StatusDef.ccDrBucket） */
  ccDr: Partial<Record<string, CcDrEntry>>;
  /** 本场各 statusId 成功挂上次数（配合 StatusDef.maxBattleApplies） */
  statusApplyCounts: Record<string, number>;
  /** 普攻焦点策略；缺省 lane */
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
  /** 角色当前经验（升级消耗） */
  exp: number;
  breakthroughTier: number;
  star: number;
  /** 是否已拥有（抽卡解锁；未拥有不可上阵） */
  owned: boolean;
  /** 重复卡碎片；升星优先消耗 */
  cardShards: number;
}

/** 账号级货币；可继续往 currencies 里加键 */
export interface PlayerCurrencies {
  xiuwei: number;
  stardust: number;
  /** 抽卡券（免费闭环） */
  ticket: number;
  /** 开放扩展：任意 CurrencyId */
  [currencyId: string]: number;
}

export interface PlayerState {
  version: 9;
  gold: number;
  inventory: Equipment[];
  equipped: Partial<Record<EquipSlot, string>>;
  formation: Partial<Record<string, GridSlot>>;
  heroManual: boolean;
  wins: number;
  seed: number;
  encounterIndex: number;
  currencies: PlayerCurrencies;
  /** 持有卡成长进度；缺省的模板在读写时补齐 */
  roster: Record<string, CharacterProgress>;
  /** 爬塔当前层（下一层要打的层号，从 1 起） */
  towerFloor: number;
  /** 距上次「新卡或保底」的抽数（软保底） */
  gachaPity: number;
  /** 当前体力 */
  stamina: number;
  /** 体力时钟锚点（ms）；用于自然恢复 */
  staminaUpdatedAt: number;
  /** 已通关最高章节 order；0=尚未通关第 1 章 */
  chapterCleared: number;
  /** 当前章内下一节点下标 */
  chapterNodeIndex: number;
  /** 上次领取摸鱼补给的本地日 YYYY-MM-DD；未领过为 undefined */
  lastDailyClaimDay?: string;
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
