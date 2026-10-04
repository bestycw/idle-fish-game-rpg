import type { WorldPreset } from '../shared/types.js';

type Lines = Record<string, readonly string[]>;

const BY_PRESET: Record<WorldPreset, Lines> = {
  xianxia: {
    outer_guard: ['坊门登记不过夜，有事白天来。'],
    midland_inn: ['柴床五文，不收灵石赊账。'],
    marches_scout: ['边庭风硬，别在乱战原落单。'],
    fortress_whisper: ['有些话只能在这里说，别带回营帐。'],
  },
  wuxia: {
    outer_guard: ['客栈只留过路客，别在门口耍剑。'],
    midland_inn: ['热水管够，酒另算。'],
    marches_scout: ['关外镖旗换了三面，小心认人。'],
    fortress_whisper: ['茶凉了，话才能热。'],
  },
  cyberpunk: {
    outer_guard: ['闸机记录保留七十二小时，别问删档。'],
    midland_inn: ['胶囊仓按分钟计费，睡眠不含早餐。'],
    marches_scout: ['灰区信号不稳，别单独下线。'],
    fortress_whisper: ['监控盲区只有这一角，快说。'],
  },
};

export function townHubFlavorLines(
  preset: WorldPreset,
  npcId: string,
  heroName: string,
): string[] {
  const pool = BY_PRESET[preset][npcId] ?? ['……'];
  const line = pool[0]!;
  return [line.replace(/\{\{heroName\}\}/g, heroName)];
}
