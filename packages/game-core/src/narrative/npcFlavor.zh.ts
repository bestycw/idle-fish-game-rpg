/**
 * 地图/场间 · NPC 闲聊（不改进度 · 非 overlay 主线）
 */

import type { WorldPreset } from '../shared/types.js';
import type { SpineNpcSlot } from './volumeBeats.js';

type FlavorFn = (heroName: string) => string[];

const BY_PRESET: Record<WorldPreset, Partial<Record<SpineNpcSlot, FlavorFn>>> = {
  xianxia: {
    npc_handler: (h) => [
      '关隘的灵雾认符不认嘴硬。你若有问，先问阵，再问席次。',
      `${h}，迷瘴林的风专吹心乱的人——别在关前耗干力气。`,
    ],
    npc_rival: (h) => [
      '席次之争，从林道就算硬场。你跟不跟得上，阵上见。',
      `${h}，别指望我会等你慢慢悟。`,
    ],
    npc_elder: () => [
      '远锋要破，近阵要稳。猎装不够，别跟铁壁赌气。',
      '阶段目标只有一句：能站稳，再谈深入。',
    ],
    npc_merchant: () => [
      '丹药不卖通关，只卖底气。缺装去猎装，缺对症去镜渊。',
      '行囊满了？商会里还能翻一翻。',
    ],
    npc_turncoat: () => [
      '……你认错人了。',
      '内府的事，别在关外大声问。',
    ],
  },
  wuxia: {
    npc_handler: (h) => [`${h}，关前先看战前提示，再动阵。`, '江渡墟来的风，到青石关会硬三分。'],
    npc_rival: () => ['同辈压力？那是让你阵脚更稳。', '速攻来了就换位，别逞英雄。'],
    npc_elder: () => ['整备不是偷懒，是下一阵的底气。'],
    npc_merchant: () => ['货不救阵，但能补缺口。'],
    npc_turncoat: () => ['……路过。'],
  },
  cyberpunk: {
    npc_handler: () => ['下层规则：先读词缀，再开战。', '关口协议不认侥幸。'],
    npc_rival: () => ['节奏跟丢，整队崩盘。', '别在日志里找借口。'],
    npc_elder: () => ['阶段 KPI：破阵，不是刷分。'],
    npc_merchant: () => ['芯片不包赢，包少踩坑。'],
    npc_turncoat: () => ['信号干扰……算了。'],
  },
};

export function npcFlavorDialogue(
  preset: WorldPreset,
  slot: SpineNpcSlot,
  heroName: string,
): string[] {
  const fn = BY_PRESET[preset][slot] ?? BY_PRESET.xianxia[slot];
  if (fn) return fn(heroName.trim() || '旅人');
  return ['……'];
}
