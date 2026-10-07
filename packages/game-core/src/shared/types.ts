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
  | 'legs'
  | 'neck'
  | 'ring1'
  | 'ring2'
  | 'trinket1'
  | 'trinket2';

/** 正常阵容出战上限（九宫最多 9 格，V1 上限 5） */
export const MAX_PARTY_SIZE = 5;

/** 12 装备槽位列表 */
export const EQUIP_SLOTS: EquipSlot[] = [
  'weapon', 'offhand', 'head', 'chest', 'hands',
  'feet', 'legs', 'neck', 'ring1', 'ring2', 'trinket1', 'trinket2',
];

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
  /** 触发率 0～1；省略或 1 = 必发。自己掷骰，不吃精通/幸运。 */
  chance?: number;
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

/** 软模式：同一 skillId 随战场条件变招（见 legendary-signature-kit） */
export type SoftModeWhen =
  | { kind: 'target_has_status'; statusId: StatusId }
  | { kind: 'target_under_cc' }
  | { kind: 'self_hp_below'; value: number }
  | { kind: 'target_hp_below'; value: number }
  | { kind: 'first_cast' }
  | { kind: 'target_has_shield' }
  | { kind: 'ally_downed' };

export interface SoftModeThen {
  multiplierDelta?: number;
  effectPatches?: SkillEffect[];
  statusPatches?: ApplyStatusDef[];
  followUp?: FollowUpDef;
  /** 等价追加 revive_ally 效果 */
  reviveAlly?: { hpRatio: number };
}

export interface SoftModeDef {
  when: SoftModeWhen;
  then: SoftModeThen;
  /** 玩家一句，如「猎印目标：斩杀加重」 */
  copy: string;
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
  /** 出手时按条件叠加的变招包；不改技能栏 */
  softModes?: SoftModeDef[];
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
  | 'steal'
  | 'qiSiphon'
  | 'qiRefund';

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

export type ConditionId =
  | 'skill_power'
  | 'basic_attack'
  | 'vs_front'
  | 'vs_back'
  | 'vs_healthy'
  | 'vs_wounded'
  | 'vs_status'
  | 'while_shielded'
  | 'dmg_taken_reduce'
  | 'dmg_taken_from_back';

export interface ConditionAffix {
  defId: ConditionId;
  name: string;
  /** 0.08 = 8% */
  value: number;
  min: number;
  max: number;
  extreme?: boolean;
}

export interface Equipment {
  id: string;
  name: string;
  slot: EquipSlot;
  rarity: Rarity;
  /** 装等：只抬底子 */
  itemLevel: number;
  /** 基础属性（固定，按槽位+品级+装等） */
  baseStats: Partial<Record<'atk' | 'def' | 'res' | 'maxHp' | 'spd', number>>;
  /** 随机词缀 */
  affixes: AffixInstance[];
  /** 条件词 0–2 */
  conditions?: ConditionAffix[];
  /** 稀有词缀（纯概率） */
  rareAffixes?: AffixInstance[];
  /** T3，最多 1 */
  effectAffixId?: string;
  setId?: string;
  socketCount: 0 | 1;
  gemId?: string;
  enhanceLevel: number;
  /** 锁定可洗的随机行下标；未选则第一次洗时选定 */
  rerollAffixIndex?: number;
  /** 锁定可洗的条件行下标 */
  rerollConditionIndex?: number;
}

export interface StatusInstance {
  statusId: StatusId;
  value?: number;
  layers?: number;
  remaining: number;
  /** 嘲讽/义护：施加者 uid */
  sourceUid?: string;
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
  /** 涅槃：致死后按该比例起身，本场 1 次；未点星则为 undefined */
  nirvanaHpRatio?: number;
  echo: number;
  thorns: number;
  steal: number;
  finalDmgBonus: number;
  qi: number;
  maxQi: number;
  skill: SkillDef;
  shield: number;
  /** 驱散只削该比例的盾（叠盾题）；缺省 1=整层驱散 */
  shieldPurgeFactor?: number;
  statuses: StatusInstance[];
  rank: UnitRank;
  ccDr: Partial<Record<string, CcDrEntry>>;
  statusApplyCounts: Record<string, number>;
  skillCastCount?: number;
  focusPolicy?: FocusPolicyId;
  /** T3 效果词缀 ID 列表（来自装备） */
  effectAffixIds?: string[];
  /** 进战条件词（乘区） */
  conditionAffixes?: ConditionAffix[];
  /** 锁息：行动削气，全身帽 6 */
  qiSiphon: number;
  /** 回元：大招后回气，全身帽 6 */
  qiRefund: number;
  /** T3 / 词缀本场状态（死亡保命、收势、每回合一次等） */
  t3State?: Record<string, number | boolean | string>;
  lastSkillTargetUid?: string;
  /** 连续技能打同一目标的层数（一鼓作气） */
  focusStreak?: number;
  /** 近期承伤，供以伤回血 */
  recentDamageTaken?: number;
  startQiBonus?: number;
  qiOnHit?: number;
  basicQiBonus?: number;
  secondWind?: boolean;
  counterFollow?: boolean;
  linkHeal?: boolean;
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
  | 'effect_miss'
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
  /** 本场允许的最大回合数（整轮） */
  maxTurns: number;
  defeatHint: string | null;
  /** E1 遭遇词缀 id（本场规则修饰） */
  encounterModifierIds?: string[];
  /** E2 阵位共鸣 id（开战布阵判定） */
  formationResonanceIds?: string[];
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
  /** 旧共享衣柜字段。读档后恒空；穿戴只认 characterEquip。 */
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
  /** 已领取首通包的章 order 列表 */
  chapterFirstClearClaimed?: number[];
  /** 当前 battle 节点内波次（0-based）；败场或换节点时归零 */
  chapterBattleWaveIndex?: number;
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
  /** 洗练尘 */
  rerollDust?: number;
  /** 堆叠材料袋（炼药/锻造预留；与 Item Registry 对齐） */
  materials?: Record<string, number>;
  /** 点开检视过的装备 id；不在此列的格子打「新」 */
  seenItemIds?: string[];
  /** 封存印（一条条件） */
  sealStamp?: {
    condition: ConditionAffix;
    sourceSlot: EquipSlot;
    wearTier: number;
    sourceRarity: Rarity;
  };
  /** 序章 / 世界选择 / 主线叙事进度 */
  narrative?: PlayerNarrativeState;
  /** 开局随机珍品伙伴 templateId（序章绑定点名；与 seed 一起决定） */
  starterCompanionId?: string;
  /** 主线教学 / 引导标记 */
  tutorialFlags?: {
    ch1EliteTicketGranted?: boolean;
    /** 结算页应弹出嘲讽→发券对话 */
    ch1EliteDialoguePending?: boolean;
    /** 已看过发券对话（之后不再弹长对话） */
    ch1EliteDialogueSeen?: boolean;
    /** 第二章碰壁：引导猎装对话待弹 */
    ch2GearGuidePending?: boolean;
    /** 已看过猎装引导 */
    ch2GearGuideSeen?: boolean;
  };
  /** 结算/Hub 一次性系统台词（读后清除） */
  pendingTutorialLine?: string;
}

export type WorldPreset = 'wuxia' | 'xianxia' | 'cyberpunk';

export type NarrativePhase = 'prologue' | 'mainline';

/** @deprecated 旧序章三选一；新档用 NarrativeDrive */
export type StoryThrust = 'thrust_sync' | 'thrust_break' | 'thrust_roster';

/** @deprecated 用 NovelFrameId + NarrativeControlPoints */
export type NarrativeDrive = 'drive_close' | 'drive_stand' | 'drive_square';

/** @deprecated 用 NarrativeHeroEdge */
export type NarrativeVoice = 'voice_banter' | 'voice_stoic' | 'voice_warm';

/** 内置小说类型 id · 见 novelFrames.zh */
export type NovelFrameId =
  | 'wuxia_escort'
  | 'wuxia_wanderer'
  | 'wuxia_sect_case'
  | 'wuxia_board_game'
  | 'wuxia_river_shed'
  | 'wuxia_forged_case'
  | 'wuxia_snow_letter'
  | 'wuxia_medicine_oath'
  | 'xianxia_trialheart'
  | 'xianxia_guardtown'
  | 'xianxia_swordhall'
  | 'xianxia_seat_fight'
  | 'xianxia_alchemy_oath'
  | 'xianxia_beast_register'
  | 'xianxia_cloud_convoy'
  | 'xianxia_mirror_trial'
  | 'cyber_runner'
  | 'cyber_team_contract'
  | 'cyber_dead_protocol'
  | 'cyber_pit_fame'
  | 'cyber_memory_pawn'
  | 'cyber_rail_commune'
  | 'cyber_synthetic_faces'
  | 'cyber_neon_sermon';

export type NarrativeBondLine = 'bond_solo' | 'bond_slow' | 'bond_warm';
export type NarrativeFortuneArc = 'fortune_uphill' | 'fortune_even' | 'fortune_roller';
export type NarrativeHeroEdge = 'edge_banter' | 'edge_stoic' | 'edge_warm';
/** 叙事镜头：句子更贴哪类画面（战斗/人情/谜团仍都会出现） */
export type NarrativeLens = 'lens_blade' | 'lens_bond' | 'lens_riddle';
/** 局内压力质感：这一局「赌的是什么」 */
export type NarrativePressureTone = 'pressure_life' | 'pressure_honor' | 'pressure_hush';

export interface NarrativeControlPoints {
  bondLine: NarrativeBondLine;
  fortuneArc: NarrativeFortuneArc;
  heroEdge: NarrativeHeroEdge;
  narrativeLens: NarrativeLens;
  pressureTone: NarrativePressureTone;
}

/** 主线章 id（平行评定用，与 Spine ch1–ch10 对齐） */
export type ParallelChapterId =
  | 'ch1'
  | 'ch2'
  | 'ch3'
  | 'ch4'
  | 'ch5'
  | 'ch6'
  | 'ch7'
  | 'ch8'
  | 'ch9'
  | 'ch10';

/** 章后原世界评定档（1 最低 · 3 最高） */
export type ParallelTier = 1 | 2 | 3;

/** 每 2 章一弧（十章 → arc1…arc5） */
export type ParallelArcId = 'arc1' | 'arc2' | 'arc3' | 'arc4' | 'arc5';

/** 平行原世界四轴（0–100，弧末更新；显示名见 parallelAxisLabels.zh） */
export interface ParallelWorldAxes {
  /** 硬气：敢拒、敢关屏、边界 */
  grit: number;
  /** 班味：职场压制（越低越好） */
  officeGrind: number;
  /** 后援：名册/投影带来的底气 */
  backup: number;
  /** 同频：与异世界进度耦合 */
  resonance: number;
}

/** 平行人生阶段（单调前进，Skill 润色具体情节） */
export type ParallelCareerBeat =
  | 'endure'
  | 'micro_rebel'
  | 'boundary'
  | 'side_hustle'
  | 'quit_or_boss';

/** 弧末推演快照（Skill 可替换四块正文，不得改轴与 tier 规则） */
export interface ParallelArcReportSnapshot {
  arcId: ParallelArcId;
  tier: ParallelTier;
  axes: ParallelWorldAxes;
  careerBeat: ParallelCareerBeat;
  skinStatus: SkinGenerationStatus;
  generatedAt: number;
  workstation: string;
  pressure: string;
  syncNote: string;
  nextHint: string;
}

export interface PlayerNarrativeState {
  phase: NarrativePhase;
  worldPreset?: WorldPreset;
  /** 平行原世界同步分 0–100（章末更新，展示用） */
  parallelSyncScore?: number;
  /** 四轴当前值 */
  parallelWorldAxes?: ParallelWorldAxes;
  /** 平行人生阶段 */
  parallelCareerBeat?: ParallelCareerBeat;
  /** 各弧末评定档 */
  parallelTierByArc?: Partial<Record<ParallelArcId, ParallelTier>>;
  /** 弧末推演文案（stub 或 Skill 缓存） */
  parallelArcReports?: Partial<Record<ParallelArcId, ParallelArcReportSnapshot>>;
  /** @deprecated 改 parallelTierByArc */
  parallelTierByChapter?: Partial<Record<ParallelChapterId, ParallelTier>>;
  /** 已展示推演的最大弧序 0–5 */
  parallelReportSeenUpToArc?: number;
  /** 主线战败后一行原世界反噬（结算/Hub 展示后清除） */
  parallelMainlineDefeatRipple?: string;
  /** 奇数章通关后 Hub 一行轻提示（下一段偶数章结算前保持） */
  parallelOddChapterRipple?: string;
  /** @deprecated */
  parallelReportSeenUpTo?: number;
  /** Hub 展示称号（flavor） */
  parallelFlavorTitle?: string;
  /** 玩家输入的主角称呼（Skin 用；战斗 id 仍为 hero） */
  heroName?: string;
  /** 序章末偏好问卷 */
  preferences?: NarrativePreferences;
  /** @deprecated 无自由输入定锚；Skill 读 novelFrame + control */
  playerPitch?: string;
  /** @deprecated 用 preferences */
  storyThrust?: StoryThrust;
  /** 十章槽位 + 生成状态（Skill 填充 overlay） */
  mainPlot?: MainPlotOutline;
  skinGenerationStatus?: SkinGenerationStatus;
  /** 节点 Skin · key = nodeId（如 ch1_n2） */
  overlay?: NarrativeOverlay;
  /** Phase A · bible 指纹 */
  bibleId?: string;
  /** Phase A · Skill 或 official 加载 */
  novelBible?: NovelBible;
  /** 批量 Skin 已写入 overlay 的最大章序（1–10） */
  skinChapterReady?: number;
  /** 续卷用滚动摘要 */
  manuscriptSummary?: string;
  /** 当前卷 id */
  volumeId?: 'vol1' | 'vol2';
}

export type SkinGenerationStatus = 'pending_skill' | 'stub' | 'ready';

export type WorldTextureId =
  | 'tex_wuxia_jianghu'
  | 'tex_wuxia_sect'
  | 'tex_wuxia_court'
  | 'tex_xianxia_mortal'
  | 'tex_xianxia_sect'
  | 'tex_xianxia_tribulation'
  | 'tex_cyber_street'
  | 'tex_cyber_corp'
  | 'tex_cyber_deadnet';

export type StoryMotifId = 'motif_escort' | 'motif_vindicate' | 'motif_rise' | 'motif_mystery';

export interface NarrativeVector {
  worldTexture: WorldTextureId;
  storyMotifs: StoryMotifId[];
}

export interface NarrativePreferences {
  /** 定参向量（主入口；不选则用 defaultNarrativePreferences） */
  vector: NarrativeVector;
  /** Skill official 包 / 风格 preset（可选；默认按 preset 首项） */
  novelFrameId?: NovelFrameId;
  /** 曲线控制点：感情 / 运势 / 口吻 */
  control: NarrativeControlPoints;
  tone: 'witty' | 'earnest';
  pace: 'slow_burn' | 'fast';
}

export interface MainPlotChapterOutline {
  order: number;
  title: string;
  blurb: string;
  fillStatus?: 'placeholder' | 'filled';
}

export interface MainPlotOutline {
  worldPreset: WorldPreset;
  heroName: string;
  preferences: NarrativePreferences;
  playerPitch?: string;
  skinStatus: SkinGenerationStatus;
  logline: string;
  chapters: MainPlotChapterOutline[];
  generatedAt: number;
}

/** 主线 story 节点对话行（speaker 为显示名；主角可用 {{heroName}}） */
export interface NarrativeDialogueLine {
  speaker: string;
  text: string;
}

/** 玩家选项（不改 Spine；选后插入主角 reply 再继续） */
export interface NarrativeDialogueChoiceOption {
  label: string;
  reply: string;
}

/** 有序对话 beat：台词或分支选项 */
export type NarrativeDialogueBeat =
  | { kind: 'line'; speaker: string; text: string }
  | {
      kind: 'choice';
      /** 选项前情境句（speaker 空则用上一条 NPC 名） */
      prompt: string;
      speaker?: string;
      options: NarrativeDialogueChoiceOption[];
    };

/** 单节点 display copy（overlay 片段） */
export interface NarrativeNodeSkinCopy {
  title?: string;
  place?: string;
  blurb?: string;
  /** 兼容旧包；与 dialogueBeats 二选一优先 beats */
  dialogue?: NarrativeDialogueLine[];
  /** 含 choice 时 Hub 展示选项（2–3 个） */
  dialogueBeats?: NarrativeDialogueBeat[];
}

/** 城镇 / 事发地点 / 剧情 NPC 显示名（Spine id 不变） */
export interface WorldSkinNames {
  towns?: Partial<Record<string, string>>;
  locations?: Partial<Record<string, string>>;
  npcs?: Partial<Record<string, string>>;
  /** 身份称谓 · 副标题；对话 speaker 用人名 `npcs` */
  npcEpithets?: Partial<Record<string, string>>;
}

/** 战斗 HUD/战前显示皮（Spine encounterId + 敌人下标不变） */
export interface BattleDisplaySkin {
  encounterTitles?: Partial<Record<string, string>>;
  enemyUnitNames?: Partial<Record<string, Partial<Record<number, string>>>>;
}

export interface NarrativeOverlay {
  nodes: Record<string, NarrativeNodeSkinCopy>;
  worldSkinNames?: WorldSkinNames;
  /** Skill 可选填充：覆盖 preset 遭遇标题 / 敌人名牌，不改 encounters 表 */
  battleDisplay?: BattleDisplaySkin;
}

/** 书级 Skin 真源（Phase A） */
export interface NovelBible {
  id: string;
  preset: WorldPreset;
  heroRole: string;
  worldDisplayName: string;
  lexicon: string[];
  forbidden: string[];
  rosterRule: string;
  chapterThesis: string[];
  worldSkinNames?: WorldSkinNames;
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
