import type { GridSlot, Row } from '../shared/types.js';

export const ALL_SLOTS: GridSlot[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export function rowOf(slot: GridSlot): Row {
  if (slot <= 3) return 'front';
  if (slot <= 6) return 'mid';
  return 'back';
}

export function colOf(slot: GridSlot): number {
  return ((slot - 1) % 3) + 1;
}

/** 同速排序：前排优先，同排从左到右 */
export function rowRank(slot: GridSlot): number {
  const row = rowOf(slot);
  if (row === 'front') return 0;
  if (row === 'mid') return 1;
  return 2;
}

export function adjacentSlots(slot: GridSlot): GridSlot[] {
  const row = Math.floor((slot - 1) / 3);
  const col = (slot - 1) % 3;
  const out: GridSlot[] = [];
  if (row > 0) out.push((slot - 3) as GridSlot);
  if (row < 2) out.push((slot + 3) as GridSlot);
  if (col > 0) out.push((slot - 1) as GridSlot);
  if (col < 2) out.push((slot + 1) as GridSlot);
  return out;
}

export function isAdjacent(a: GridSlot, b: GridSlot): boolean {
  return adjacentSlots(a).includes(b);
}

export function rowLabel(row: Row): string {
  if (row === 'front') return '前排';
  if (row === 'mid') return '中排';
  return '后排';
}

/** 我方 UI / 布阵：前→中→后（前排朝交战方向，与战斗我方一致） */
export const ALLY_BATTLE_ROWS: { row: Row; slots: GridSlot[] }[] = [
  { row: 'front', slots: [1, 2, 3] },
  { row: 'mid', slots: [4, 5, 6] },
  { row: 'back', slots: [7, 8, 9] },
];

export const DISPLAY_ROWS = ALLY_BATTLE_ROWS;

/** 战斗敌方：后→中→前（前排贴交战线，与我方面对面） */
export const ENEMY_BATTLE_ROWS: { row: Row; slots: GridSlot[] }[] = [
  { row: 'back', slots: [7, 8, 9] },
  { row: 'mid', slots: [4, 5, 6] },
  { row: 'front', slots: [1, 2, 3] },
];
