/**
 * 角色升星轨（★1–★6）。新卡：registerStarTrack 或往 STAR_OVERRIDES 加一行。
 * 缺省回落 SHARED_STAR_NODES。
 */
import type { StarNodeDef, StarNodeEffect } from './starTypes.js';

type TrackEntry = {
  label: string;
  effects: StarNodeEffect[];
  stack?: boolean;
};

function track(entries: TrackEntry[]): Partial<Record<number, StarNodeDef>> {
  const out: Partial<Record<number, StarNodeDef>> = {};
  entries.forEach((e, i) => {
    const star = i + 1;
    out[star] = { star, label: e.label, effects: e.effects, stack: e.stack };
  });
  return out;
}

/** 共用缺省阶梯（无个性轨时） */
export const SHARED_STAR_NODES: StarNodeDef[] = [
  { star: 1, label: '主属性强化', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
  { star: 2, label: '吸血微光', effects: [{ kind: 'rare_stat', stat: 'lifesteal', value: 0.03 }] },
  {
    star: 3,
    label: '连击契机',
    effects: [{ kind: 'enable_follow_up', chance: 0.25, multiplier: 0.55 }],
  },
  { star: 4, label: '主属性强化', effects: [{ kind: 'stat_pct', mainPct: 0.04 }] },
  {
    star: 5,
    label: '连击强化',
    effects: [{ kind: 'enable_follow_up', chance: 0.35, multiplier: 0.7 }],
  },
  {
    star: 6,
    label: '锋芒圆满',
    effects: [
      { kind: 'stat_pct', mainPct: 0.05 },
      { kind: 'skill_mult', delta: 0.1 },
    ],
  },
];

export const MAX_STAR = Math.max(...SHARED_STAR_NODES.map((n) => n.star));

/** 每卡完整个性轨（尽量 ★1–★6 全覆盖） */
export const STAR_OVERRIDES: Record<string, Partial<Record<number, StarNodeDef>>> = {
  hero: track([
    { label: '斩意', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '驱散锋', effects: [{ kind: 'qi_cost', delta: -5 }] },
    {
      label: '连斩',
      effects: [{ kind: 'enable_follow_up', chance: 0.28, multiplier: 0.6 }],
    },
    { label: '斩意加深', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    {
      label: '连斩强化',
      effects: [{ kind: 'enable_follow_up', chance: 0.38, multiplier: 0.75 }],
    },
    {
      label: '破妄一击',
      effects: [
        { kind: 'rating', stat: 'finalDmgRating', value: 10 },
        { kind: 'skill_mult', delta: 0.12 },
      ],
    },
  ]),
  zhangfei: track([
    { label: '虎躯', effects: [{ kind: 'stat_pct', mainPct: 0.04 }] },
    { label: '铁壁', effects: [{ kind: 'rare_stat', stat: 'block', value: 0.04 }] },
    {
      label: '咆哮延长',
      effects: [{ kind: 'status_boost', duration: 1 }],
    },
    { label: '当阳骨', effects: [{ kind: 'rating', stat: 'versRating', value: 10 }] },
    {
      label: '震喝',
      effects: [
        { kind: 'skill_mult', delta: 0.1 },
        { kind: 'rare_stat', stat: 'block', value: 0.03 },
      ],
    },
    {
      label: '万人敌',
      effects: [
        { kind: 'stat_pct', mainPct: 0.05 },
        { kind: 'status_boost', duration: 1 },
      ],
    },
  ]),
  zhaoyun: track([
    { label: '银枪', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '会心', effects: [{ kind: 'rating', stat: 'critRating', value: 8 }] },
    {
      label: '七进七出',
      effects: [{ kind: 'enable_follow_up', chance: 0.34, multiplier: 0.68 }],
    },
    { label: '流血加深', effects: [{ kind: 'status_boost', layers: 1, duration: 1 }] },
    {
      label: '龙胆连刺',
      effects: [{ kind: 'enable_follow_up', chance: 0.42, multiplier: 0.8 }],
    },
    {
      label: '单骑救主',
      effects: [
        { kind: 'rating', stat: 'critDmgRating', value: 12 },
        { kind: 'skill_mult', delta: 0.15 },
        {
          kind: 'status_unlock',
          status: { statusId: 'shred', duration: 2, value: 0.9, chance: 0.6 },
        },
      ],
    },
  ]),
  wukong: track([
    { label: '金箍', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '筋斗影', effects: [{ kind: 'rare_stat', stat: 'dodge', value: 0.04 }] },
    {
      label: '筋斗',
      stack: true,
      effects: [{ kind: 'rare_stat', stat: 'dodge', value: 0.05 }],
    },
    {
      label: '破甲扫',
      effects: [{ kind: 'status_boost', valueMult: 0.9, duration: 1 }],
    },
    {
      label: '连扫',
      effects: [{ kind: 'enable_follow_up', chance: 0.3, multiplier: 0.5 }],
    },
    {
      label: '大圣',
      effects: [
        { kind: 'skill_mult', delta: 0.18 },
        { kind: 'rare_stat', stat: 'dodge', value: 0.04 },
      ],
    },
  ]),
  huatuo: track([
    { label: '医道', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '妙手', effects: [{ kind: 'skill_mult', delta: 0.12 }] },
    { label: '省息', effects: [{ kind: 'qi_cost', delta: -8 }] },
    { label: '青囊精通', effects: [{ kind: 'rating', stat: 'masteryRating', value: 12 }] },
    {
      label: '回春',
      effects: [
        { kind: 'skill_mult', delta: 0.15 },
        { kind: 'rare_stat', stat: 'lifesteal', value: 0.03 },
      ],
    },
    {
      label: '悬壶',
      effects: [
        { kind: 'qi_cost', delta: -5 },
        { kind: 'skill_mult', delta: 0.12 },
      ],
    },
  ]),
  houyi: track([
    { label: '神射', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '穿杨', effects: [{ kind: 'rating', stat: 'critDmgRating', value: 10 }] },
    {
      label: '落日血痕',
      effects: [{ kind: 'status_boost', layers: 1, duration: 1 }],
    },
    { label: '猎神', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    {
      label: '连射',
      effects: [{ kind: 'enable_follow_up', chance: 0.3, multiplier: 0.55 }],
    },
    {
      label: '九日尽',
      effects: [
        { kind: 'rating', stat: 'finalDmgRating', value: 12 },
        { kind: 'qi_cost', delta: -5 },
      ],
    },
  ]),
  heracles: track([
    { label: '狮躯', effects: [{ kind: 'stat_pct', mainPct: 0.04 }] },
    { label: '厚皮', effects: [{ kind: 'rare_stat', stat: 'block', value: 0.05 }] },
    { label: '狮皮加厚', effects: [{ kind: 'skill_mult', delta: 0.2 }] },
    { label: '不屈', effects: [{ kind: 'rating', stat: 'versRating', value: 12 }] },
    { label: '省力护体', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '十二功业',
      effects: [
        { kind: 'rare_stat', stat: 'block', value: 0.04 },
        { kind: 'skill_mult', delta: 0.15 },
      ],
    },
  ]),
  zhuge: track([
    { label: '星算', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '奇门精通', effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }] },
    {
      label: '破甲更深',
      effects: [{ kind: 'status_boost', valueMult: 0.88 }],
    },
    { label: '借东风', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '连策',
      effects: [{ kind: 'enable_follow_up', chance: 0.25, multiplier: 0.4 }],
    },
    {
      label: '卧龙',
      effects: [
        { kind: 'status_boost', duration: 1, valueMult: 0.9 },
        { kind: 'rating', stat: 'masteryRating', value: 10 },
      ],
    },
  ]),
  baigujing: track([
    { label: '白骨', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '惑心', effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }] },
    {
      label: '化骨延长',
      effects: [{ kind: 'status_boost', duration: 1 }],
    },
    { label: '群魇', effects: [{ kind: 'skill_mult', delta: 0.12 }] },
    { label: '省咒', effects: [{ kind: 'qi_cost', delta: -5 }] },
    {
      label: '白骨夫人',
      effects: [
        { kind: 'status_boost', duration: 1 },
        { kind: 'skill_mult', delta: 0.1 },
      ],
    },
  ]),
  medusa: track([
    { label: '蛇瞳', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '石化锋', effects: [{ kind: 'skill_mult', delta: 0.1 }] },
    {
      label: '石化延长',
      effects: [{ kind: 'status_boost', duration: 1 }],
    },
    { label: '凝视', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '连视',
      effects: [{ kind: 'enable_follow_up', chance: 0.22, multiplier: 0.45 }],
    },
    {
      label: '戈耳工',
      effects: [
        { kind: 'status_boost', duration: 1 },
        { kind: 'rating', stat: 'masteryRating', value: 12 },
      ],
    },
  ]),
  athena: track([
    { label: '神恩', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '群愈', effects: [{ kind: 'skill_mult', delta: 0.12 }] },
    { label: '守护', effects: [{ kind: 'rare_stat', stat: 'block', value: 0.03 }] },
    { label: '智慧', effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }] },
    { label: '省恩', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '雅典娜之盾',
      effects: [
        { kind: 'skill_mult', delta: 0.15 },
        { kind: 'rating', stat: 'versRating', value: 10 },
      ],
    },
  ]),

  // —— +10 公版 ——
  guanyu: track([
    { label: '青龙', effects: [{ kind: 'stat_pct', mainPct: 0.035 }] },
    { label: '义斩', effects: [{ kind: 'rating', stat: 'finalDmgRating', value: 8 }] },
    {
      label: '拖刀血痕',
      effects: [{ kind: 'status_boost', layers: 1, duration: 1 }],
    },
    { label: '武圣锋', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    {
      label: '连斩',
      effects: [{ kind: 'enable_follow_up', chance: 0.28, multiplier: 0.6 }],
    },
    {
      label: '温酒斩',
      effects: [
        { kind: 'rating', stat: 'critDmgRating', value: 10 },
        { kind: 'skill_mult', delta: 0.12 },
      ],
    },
  ]),
  lvbu: track([
    { label: '方天', effects: [{ kind: 'stat_pct', mainPct: 0.04 }] },
    { label: '暴戾', effects: [{ kind: 'rating', stat: 'critRating', value: 10 }] },
    {
      label: '无双连击',
      effects: [{ kind: 'enable_follow_up', chance: 0.3, multiplier: 0.7 }],
    },
    { label: '弑神', effects: [{ kind: 'skill_mult', delta: 0.2 }] },
    {
      label: '无双强化',
      effects: [{ kind: 'enable_follow_up', chance: 0.4, multiplier: 0.85 }],
    },
    {
      label: '人中吕布',
      effects: [
        { kind: 'rating', stat: 'finalDmgRating', value: 14 },
        { kind: 'qi_cost', delta: -5 },
      ],
    },
  ]),
  dianwei: track([
    { label: '恶来', effects: [{ kind: 'stat_pct', mainPct: 0.04 }] },
    { label: '死守', effects: [{ kind: 'rare_stat', stat: 'block', value: 0.05 }] },
    { label: '护主盾', effects: [{ kind: 'skill_mult', delta: 0.18 }] },
    { label: '厚血', effects: [{ kind: 'rating', stat: 'versRating', value: 10 }] },
    { label: '省力', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '古之恶来',
      effects: [
        { kind: 'rare_stat', stat: 'block', value: 0.04 },
        { kind: 'stat_pct', mainPct: 0.05 },
      ],
    },
  ]),
  nezha: track([
    { label: '莲华', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '风火', effects: [{ kind: 'rating', stat: 'hasteRating', value: 10 }] },
    {
      label: '三头六臂',
      effects: [{ kind: 'enable_follow_up', chance: 0.35, multiplier: 0.55 }],
    },
    { label: '火尖', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    {
      label: '六臂连打',
      effects: [{ kind: 'enable_follow_up', chance: 0.45, multiplier: 0.7 }],
    },
    {
      label: '哪吒闹海',
      effects: [
        { kind: 'rare_stat', stat: 'dodge', value: 0.05 },
        { kind: 'skill_mult', delta: 0.12 },
      ],
    },
  ]),
  daji: track([
    { label: '狐媚', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '惑阵', effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }] },
    {
      label: '魅惑延长',
      effects: [{ kind: 'status_boost', duration: 1 }],
    },
    { label: '群惑', effects: [{ kind: 'skill_mult', delta: 0.1 }] },
    { label: '低语', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '九尾',
      effects: [
        { kind: 'status_boost', duration: 1 },
        { kind: 'rating', stat: 'masteryRating', value: 12 },
      ],
    },
  ]),
  yangjian: track([
    { label: '天眼', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '穿透', effects: [{ kind: 'rating', stat: 'finalDmgRating', value: 8 }] },
    {
      label: '三尖血痕',
      effects: [{ kind: 'status_boost', layers: 1 }],
    },
    { label: '梅山', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    {
      label: '连刺',
      effects: [{ kind: 'enable_follow_up', chance: 0.32, multiplier: 0.6 }],
    },
    {
      label: '二郎真君',
      effects: [
        { kind: 'rating', stat: 'critRating', value: 10 },
        { kind: 'qi_cost', delta: -5 },
      ],
    },
  ]),
  change: track([
    { label: '月华', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '清辉', effects: [{ kind: 'skill_mult', delta: 0.12 }] },
    { label: '护月', effects: [{ kind: 'rare_stat', stat: 'dodge', value: 0.03 }] },
    { label: '灵愈', effects: [{ kind: 'rating', stat: 'masteryRating', value: 12 }] },
    { label: '省息', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '广寒',
      effects: [
        { kind: 'skill_mult', delta: 0.15 },
        { kind: 'rating', stat: 'versRating', value: 8 },
      ],
    },
  ]),
  thor: track([
    { label: '雷锤', effects: [{ kind: 'stat_pct', mainPct: 0.035 }] },
    { label: '轰鸣', effects: [{ kind: 'rating', stat: 'critRating', value: 8 }] },
    {
      label: '眩雷',
      effects: [{ kind: 'status_boost', duration: 1 }],
    },
    { label: '雷殛', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    {
      label: '连雷',
      effects: [{ kind: 'enable_follow_up', chance: 0.28, multiplier: 0.5 }],
    },
    {
      label: '雷神',
      effects: [
        { kind: 'skill_mult', delta: 0.12 },
        { kind: 'rating', stat: 'finalDmgRating', value: 10 },
      ],
    },
  ]),
  robin: track([
    { label: '绿林', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '神射', effects: [{ kind: 'rating', stat: 'critDmgRating', value: 10 }] },
    {
      label: '穿林',
      effects: [{ kind: 'status_boost', layers: 1 }],
    },
    { label: '冷箭', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    {
      label: '连矢',
      effects: [{ kind: 'enable_follow_up', chance: 0.33, multiplier: 0.55 }],
    },
    {
      label: '侠盗',
      effects: [
        { kind: 'rare_stat', stat: 'dodge', value: 0.04 },
        { kind: 'qi_cost', delta: -5 },
      ],
    },
  ]),
  arthur: track([
    { label: '誓约', effects: [{ kind: 'stat_pct', mainPct: 0.035 }] },
    { label: '圆桌', effects: [{ kind: 'rare_stat', stat: 'block', value: 0.04 }] },
    { label: '王盾', effects: [{ kind: 'skill_mult', delta: 0.18 }] },
    { label: '王气', effects: [{ kind: 'rating', stat: 'versRating', value: 10 }] },
    { label: '省力', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '王者归来',
      effects: [
        { kind: 'rare_stat', stat: 'block', value: 0.03 },
        { kind: 'skill_mult', delta: 0.12 },
      ],
    },
  ]),
  xishi: track([
    { label: '浣纱', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '沉鱼', effects: [{ kind: 'rating', stat: 'masteryRating', value: 10 }] },
    {
      label: '长眠',
      effects: [{ kind: 'status_boost', duration: 1 }],
    },
    { label: '省息', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '连惑',
      effects: [{ kind: 'enable_follow_up', chance: 0.22, multiplier: 0.4 }],
    },
    {
      label: '西子',
      effects: [
        { kind: 'status_boost', duration: 1 },
        { kind: 'skill_mult', delta: 0.1 },
      ],
    },
  ]),
  sunbin: track([
    { label: '兵法', effects: [{ kind: 'stat_pct', mainPct: 0.03 }] },
    { label: '减灶', effects: [{ kind: 'rating', stat: 'masteryRating', value: 12 }] },
    {
      label: '破甲更深',
      effects: [{ kind: 'status_boost', valueMult: 0.9 }],
    },
    { label: '迟滞延长', effects: [{ kind: 'status_boost', duration: 1 }] },
    { label: '省策', effects: [{ kind: 'qi_cost', delta: -8 }] },
    {
      label: '膑脚智',
      effects: [
        { kind: 'status_boost', valueMult: 0.92, duration: 1 },
        { kind: 'rating', stat: 'masteryRating', value: 8 },
      ],
    },
  ]),
  beowulf: track([
    { label: '熊躯', effects: [{ kind: 'stat_pct', mainPct: 0.04 }] },
    { label: '硬握', effects: [{ kind: 'rare_stat', stat: 'block', value: 0.04 }] },
    {
      label: '震慑延长',
      effects: [{ kind: 'status_boost', duration: 1 }],
    },
    { label: '英雄锋', effects: [{ kind: 'skill_mult', delta: 0.15 }] },
    {
      label: '连握',
      effects: [{ kind: 'enable_follow_up', chance: 0.28, multiplier: 0.55 }],
    },
    {
      label: '屠龙',
      effects: [
        { kind: 'rating', stat: 'finalDmgRating', value: 10 },
        { kind: 'rare_stat', stat: 'block', value: 0.03 },
      ],
    },
  ]),
};

/** 解析某星节点：个性轨优先；stack 时与共用轨叠加 */
export function resolveStarNode(templateId: string, star: number): StarNodeDef | undefined {
  const shared = SHARED_STAR_NODES.find((n) => n.star === star);
  const override = STAR_OVERRIDES[templateId]?.[star];
  if (!override) return shared;
  if (override.stack && shared) {
    return {
      star,
      label: override.label,
      stack: true,
      effects: [...shared.effects, ...override.effects],
    };
  }
  return override;
}

export function unlockedStarNodes(templateId: string, star: number): StarNodeDef[] {
  const nodes: StarNodeDef[] = [];
  for (let s = 1; s <= star; s += 1) {
    const n = resolveStarNode(templateId, s);
    if (n) nodes.push(n);
  }
  return nodes;
}

/** 运行时注册（测试/模组）；正式内容仍写 STAR_OVERRIDES */
export function registerStarTrack(
  templateId: string,
  nodes: Partial<Record<number, StarNodeDef>>,
): void {
  STAR_OVERRIDES[templateId] = { ...STAR_OVERRIDES[templateId], ...nodes };
}
