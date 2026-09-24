import type { EquipmentBonuses } from './equipment.js';

export interface SetPieceBonus {
  /** 件数门槛：2 或 4 */
  pieces: 2 | 4;
  label: string;
  apply: (bonus: EquipmentBonuses) => void;
}

export interface SetDef {
  id: string;
  name: string;
  /** 短定位（装·风格） */
  blurb: string;
  bonuses: SetPieceBonus[];
}

/** V1 三套验证：破军（攻）/ 铁壁（防）/ 济世（续） */
export const SET_DEFS: SetDef[] = [
  {
    id: 'set_pojun',
    name: '破军',
    blurb: '终伤与会心，适合爆发点杀',
    bonuses: [
      {
        pieces: 2,
        label: '2件·破军锋',
        apply: (b) => {
          b.penRating += 8;
          b.atk += 3;
        },
      },
      {
        pieces: 4,
        label: '4件·破军势',
        apply: (b) => {
          b.critRating += 10;
          b.critDmgRating += 8;
        },
      },
    ],
  },
  {
    id: 'set_tiebi',
    name: '铁壁',
    blurb: '气血与格挡，适合扛速攻',
    bonuses: [
      {
        pieces: 2,
        label: '2件·铁壁骨',
        apply: (b) => {
          b.maxHp += 32;
          b.def += 7;
        },
      },
      {
        pieces: 4,
        label: '4件·铁壁心',
        apply: (b) => {
          b.block += 0.06;
          b.tenacityRating += 8;
        },
      },
    ],
  },
  {
    id: 'set_jishi',
    name: '济世',
    blurb: '精通与灵力，适合治疗/破甲辅助',
    bonuses: [
      {
        pieces: 2,
        label: '2件·济世脉',
        apply: (b) => {
          b.masteryRating += 10;
          b.atk += 3;
        },
      },
      {
        pieces: 4,
        label: '4件·济世元',
        apply: (b) => {
          b.tenacityRating += 10;
          b.res += 4;
        },
      },
    ],
  },
];

/** 旧 demo id → 新 id（读档/库存兼容） */
export const SET_ID_ALIASES: Record<string, string> = {
  set_demo_1: 'set_pojun',
  set_demo_2: 'set_tiebi',
};

export function resolveSetId(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return SET_ID_ALIASES[raw] ?? raw;
}

export function getSetDef(id: string): SetDef | undefined {
  const resolved = resolveSetId(id);
  return SET_DEFS.find((s) => s.id === resolved);
}

export function countEquippedSets(
  setIds: (string | undefined)[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const raw of setIds) {
    const id = resolveSetId(raw);
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

export function applyActiveSetBonuses(
  bonus: EquipmentBonuses,
  counts: Map<string, number>,
): { id: string; name: string; labels: string[] }[] {
  const active: { id: string; name: string; labels: string[] }[] = [];
  for (const def of SET_DEFS) {
    const n = counts.get(def.id) ?? 0;
    if (n < 2) continue;
    const labels: string[] = [];
    for (const piece of def.bonuses) {
      if (n >= piece.pieces) {
        piece.apply(bonus);
        labels.push(piece.label);
      }
    }
    if (labels.length > 0) active.push({ id: def.id, name: def.name, labels });
  }
  return active;
}

export function setDisplayName(raw: string | undefined): string | null {
  if (!raw) return null;
  const def = getSetDef(raw);
  return def ? def.name : raw;
}

/** 已穿戴套装进度 + 已激活件效（供 UI） */
export function listEquippedSetProgress(
  setIds: (string | undefined)[],
): { id: string; name: string; count: number; blurb: string; activeLabels: string[] }[] {
  const counts = countEquippedSets(setIds);
  const rows: {
    id: string;
    name: string;
    count: number;
    blurb: string;
    activeLabels: string[];
  }[] = [];
  for (const def of SET_DEFS) {
    const n = counts.get(def.id) ?? 0;
    if (n <= 0) continue;
    rows.push({
      id: def.id,
      name: def.name,
      count: n,
      blurb: def.blurb,
      activeLabels: def.bonuses.filter((b) => n >= b.pieces).map((b) => b.label),
    });
  }
  return rows;
}
