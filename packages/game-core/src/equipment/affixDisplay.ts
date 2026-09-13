import type { AffixInstance, ConditionAffix, Equipment, StatKey } from '../shared/types.js';
import { PERCENT_RARE_STATS, getRandomAffixDef } from './catalog/index.js';
import { getRareAffixDef, isPercentRare } from './catalog/rares.js';
import { getConditionDef } from './catalog/conditions.js';
import { getGemDef } from './gems.js';
import { getT3Def } from './catalog/t3.js';
import { getSetDef } from './sets.js';

export const AFFIX_SENTENCE: Record<StatKey, string> = {
  atk: '攻击力',
  def: '力系减伤',
  res: '灵系减伤',
  maxHp: '生命',
  spd: '身法',
  critRating: '暴击几率',
  critDmgRating: '暴击伤害',
  penRating: '穿透（无视防御）',
  masteryRating: '技能与状态效果',
  tenacityRating: '受控缩短与受疗',
  fortuneRating: '气运（伤害与掉落）',
  dodge: '闪避',
  block: '格挡',
  lifesteal: '生命偷取',
  critResist: '抗暴击',
  counter: '反击',
  echo: '回响',
  thorns: '反伤',
  resilience: '韧性',
  steal: '偷取',
  qiSiphon: '锁息',
  qiRefund: '回元',
};

const BASE_STAT_ORDER: Array<'atk' | 'def' | 'res' | 'maxHp' | 'spd'> = [
  'atk',
  'def',
  'res',
  'maxHp',
  'spd',
];

export type RollQuality = 'min' | 'mid' | 'max' | 'unknown';

export type FormattedAffixLine = {
  valueText: string;
  sentence: string;
  rangeText: string;
  line: string;
  isPercent: boolean;
  rollQuality: RollQuality;
};

export function getAffixDef(defId: string) {
  return getRandomAffixDef(defId) ?? getRareAffixDef(defId);
}

function formatPercent(n: number): string {
  return n.toFixed(1);
}

function rollQualityOf(value: number, min: number, max: number): RollQuality {
  if (value >= max) return 'max';
  if (value <= min) return 'min';
  return 'mid';
}

export function formatAffixLine(affix: AffixInstance): FormattedAffixLine {
  const def = getAffixDef(affix.defId);
  const sentence = AFFIX_SENTENCE[affix.stat] ?? affix.name;
  const isPercent = isPercentRare(affix.stat);

  if (isPercent) {
    const rolled = Math.round(affix.value * 1000) / 10;
    const min = def?.min ?? rolled;
    const max = def?.max ?? rolled;
    const valueText = `+${formatPercent(rolled)}%`;
    const rangeText = `[${formatPercent(min)} - ${formatPercent(max)}]%`;
    return {
      valueText,
      sentence,
      rangeText,
      line: `${valueText} ${sentence} ${rangeText}`,
      isPercent: true,
      rollQuality: def ? rollQualityOf(rolled, min, max) : 'unknown',
    };
  }

  const rolled = affix.value;
  const min = def?.min ?? rolled;
  const max = def?.max ?? rolled;
  const valueText = `+${rolled}`;
  const rangeText = `[${min} - ${max}]`;
  return {
    valueText,
    sentence,
    rangeText,
    line: `${valueText} ${sentence} ${rangeText}`,
    isPercent: false,
    rollQuality: def ? rollQualityOf(rolled, min, max) : 'unknown',
  };
}

export function formatConditionLine(cond: ConditionAffix): FormattedAffixLine {
  const def = getConditionDef(cond.defId);
  const sentence = def?.sentence ?? cond.name;
  const rolled = Math.round(cond.value * 1000) / 10;
  const min = Math.round(cond.min * 1000) / 10;
  const max = Math.round(cond.max * 1000) / 10;
  const valueText = `+${formatPercent(rolled)}%`;
  const rangeText = `[${formatPercent(min)} - ${formatPercent(max)}]%`;
  return {
    valueText,
    sentence,
    rangeText,
    line: `${valueText} ${sentence} ${rangeText}`,
    isPercent: true,
    rollQuality: rollQualityOf(rolled, min, max),
  };
}

export type FormattedBaseStatLine = {
  stat: 'atk' | 'def' | 'res' | 'maxHp' | 'spd';
  sentence: string;
  displayed: number;
  raw: number;
  enhanceDelta: number;
  line: string;
};

export function listBaseStatLines(
  item: Pick<Equipment, 'baseStats' | 'enhanceLevel'>,
): FormattedBaseStatLine[] {
  const enhMult = 1 + (item.enhanceLevel ?? 0) * 0.05;
  const rows: FormattedBaseStatLine[] = [];
  for (const stat of BASE_STAT_ORDER) {
    const raw = item.baseStats[stat];
    if (raw == null || raw === 0) continue;
    const displayed = Math.round(raw * enhMult);
    const enhanceDelta = displayed - raw;
    const sentence = AFFIX_SENTENCE[stat];
    const line =
      enhanceDelta > 0
        ? `${sentence} ${displayed} (+${enhanceDelta})`
        : `${sentence} ${displayed}`;
    rows.push({ stat, sentence, displayed, raw, enhanceDelta, line });
  }
  return rows;
}

export function formatGemLine(gemId: string): string | undefined {
  const gem = getGemDef(gemId);
  if (!gem) return undefined;
  const sentence = AFFIX_SENTENCE[gem.stat] ?? gem.stat;
  const isPercent = PERCENT_RARE_STATS.includes(gem.stat);
  const valueText = isPercent
    ? `+${formatPercent(Math.round(gem.value * 1000) / 10)}%`
    : `+${gem.value}`;
  return `${gem.name}  ${valueText} ${sentence}`;
}

export function listEffectAffixLines(item: Equipment): { name: string; description: string }[] {
  if (!item.effectAffixId) return [];
  const def = getT3Def(item.effectAffixId);
  return def ? [{ name: def.name, description: def.description }] : [];
}

/**
 * 格子上用来辨认「同槽同品级」的短名：T3 > 条件 > 稀有 > 第一条随机。
 * 白装没有这些，格子只靠装等区分。
 */
export function bagCellSignature(item: Equipment): string {
  if (item.effectAffixId) {
    const t3 = getT3Def(item.effectAffixId);
    if (t3?.name) return t3.name;
  }
  const cond = item.conditions?.[0];
  if (cond) {
    const def = getConditionDef(cond.defId);
    return def?.name ?? cond.name;
  }
  const rare = item.rareAffixes?.[0];
  if (rare?.name) return rare.name;
  const affix = item.affixes?.[0];
  if (affix?.name) return affix.name;
  return '';
}

export function describeSetOnItem(item: Equipment, pieceCount?: number) {
  if (!item.setId) return undefined;
  const def = getSetDef(item.setId);
  if (!def) return undefined;
  const count = pieceCount ?? 0;
  return {
    name: def.name,
    blurb: def.blurb,
    count,
    bonuses: def.bonuses.map((b) => ({
      pieces: b.pieces,
      label: b.label,
      active: count >= b.pieces,
    })),
  };
}
