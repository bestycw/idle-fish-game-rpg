import { type UnlockBatch } from './circles.js';
import { ZHONGTU_ROSTER, type ZhongtuEntry } from './zhongtuRoster.js';

export type { UnlockBatch };

export const HAND_TEMPLATE_IDS = [
  'hero',
  'zhangfei',
  'zhaoyun',
  'wukong',
  'huatuo',
  'houyi',
  'zhuge',
  'baigujing',
  'guanyu',
  'lvbu',
  'dianwei',
  'nezha',
  'daji',
  'yangjian',
  'change',
  'xishi',
  'sunbin',
] as const;

const HAND = new Set<string>(HAND_TEMPLATE_IDS);

export type ExpandEntry = ZhongtuEntry;

/** 非手填模板的扩展卡（占位底板 + kit 招牌；深做仍可覆盖） */
export const EXPAND_ROSTER: ExpandEntry[] = ZHONGTU_ROSTER.filter((e) => !HAND.has(e.id));

export function expandIdsByUnlock(batch: UnlockBatch): string[] {
  return ZHONGTU_ROSTER.filter((e) => e.unlock === batch).map((e) => e.id);
}
