import { deriveGrowthStats, getProgress } from '../character/growth.js';
import { getTemplate } from '../character/templates.js';
import { normalizeFormation } from '../formation/formation.js';
import type { Equipment, PlayerState } from '../shared/types.js';
import {
  emptyBonuses,
  equippedItems,
  itemBonuses,
  sumEquipmentBonuses,
  type EquipmentBonuses,
} from './bonuses.js';
import { getT3Def } from './catalog/t3.js';

const W: Record<keyof EquipmentBonuses, number> = {
  atk: 8,
  def: 6,
  res: 6,
  maxHp: 1,
  spd: 12,
  critRating: 4,
  critDmgRating: 3,
  penRating: 4,
  masteryRating: 3,
  tenacityRating: 3,
  fortuneRating: 0.2,
  dodge: 80,
  lifesteal: 90,
  critResist: 40,
  block: 80,
  counter: 40,
  resilience: 0,
  echo: 90,
  thorns: 0,
  steal: 0,
  qiSiphon: 0,
  qiRefund: 0,
  finalDmgBonus: 200,
};

/** 条件词战斗仍按真实 %；战力读数勿再 ×12 抬成「一件顶半身」 */
const CONDITION_PER_PCT = 4;
const COMBAT_T3_SCORE = 80;

/**
 * 全队战力读数缩表（与 `CHAPTER_BANDS` 同倍率）。
 * 只影响展示 / 脊柱 / 门槛，不改战斗内属性。
 */
export const COMBAT_POWER_SCALE = 0.38;

export function powerFromBonuses(bonus: EquipmentBonuses, items: Equipment[]): number {
  let n = 0;
  for (const [k, w] of Object.entries(W) as [keyof EquipmentBonuses, number][]) {
    n += bonus[k] * w;
  }
  for (const item of items) {
    for (const c of item.conditions ?? []) {
      n += c.value * 100 * CONDITION_PER_PCT;
    }
    if (item.effectAffixId) {
      const def = getT3Def(item.effectAffixId);
      if (def?.scope === 'combat') n += COMBAT_T3_SCORE;
    }
  }
  return Math.max(0, Math.round(n * COMBAT_POWER_SCALE));
}

export function itemPower(item: Equipment): number {
  return powerFromBonuses(itemBonuses(item), [item]);
}

export function equippedPower(state: PlayerState, templateId: string): number {
  return powerFromBonuses(sumEquipmentBonuses(state, templateId), equippedItems(state, templateId));
}

function addBonuses(a: EquipmentBonuses, b: EquipmentBonuses): EquipmentBonuses {
  const out = emptyBonuses();
  for (const k of Object.keys(out) as (keyof EquipmentBonuses)[]) {
    out[k] = a[k] + b[k];
  }
  return out;
}

function growthToBonuses(state: PlayerState, templateId: string): EquipmentBonuses {
  const template = getTemplate(templateId);
  if (!template) return emptyBonuses();
  const g = deriveGrowthStats(template, getProgress(state, templateId));
  return {
    ...emptyBonuses(),
    atk: g.atk,
    def: g.def,
    res: g.res,
    maxHp: g.maxHp,
    spd: g.spd,
    critRating: g.critRating,
    critDmgRating: g.critDmgRating,
    penRating: g.penRating,
    masteryRating: g.masteryRating,
    tenacityRating: g.tenacityRating,
    fortuneRating: g.fortuneRating,
    dodge: g.dodge,
    lifesteal: g.lifesteal,
    critResist: g.critResist,
    block: g.block,
    counter: g.counter,
    resilience: g.resilience,
    echo: g.echo,
    thorns: g.thorns,
    steal: g.steal,
    finalDmgBonus: g.finalDmgBonus,
  };
}

/** 裸体面板加权。不含装备。 */
export function nakedPower(state: PlayerState, templateId: string): number {
  return powerFromBonuses(growthToBonuses(state, templateId), []);
}

/** 角色战力 = 裸体面板 + 装备（含套装 / 条件 / 战斗 T3）。 */
export function characterPower(state: PlayerState, templateId: string): number {
  const items = equippedItems(state, templateId);
  return powerFromBonuses(
    addBonuses(growthToBonuses(state, templateId), sumEquipmentBonuses(state, templateId)),
    items,
  );
}

export function partyPower(state: PlayerState, templateIds: string[]): number {
  return templateIds.reduce((s, id) => s + characterPower(state, id), 0);
}

/** 当前布阵出战五人（normalize 后）的队伍战力读数 */
export function deployedPartyPower(state: PlayerState): number {
  return partyPower(state, Object.keys(normalizeFormation(state.formation)));
}
