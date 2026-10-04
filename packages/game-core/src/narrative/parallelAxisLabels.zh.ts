/**
 * 平行四轴 · 玩家向名称（引擎 id 稳定，UI/简报用 label）
 */

import type {
  ParallelArcReportSnapshot,
  ParallelCareerBeat,
  ParallelWorldAxes,
} from '../shared/types.js';

export type ParallelAxisKey = keyof ParallelWorldAxes;

export interface ParallelAxisMeta {
  /** 两字/三字口语名 */
  label: string;
  /** -tooltip 一句 */
  hint: string;
  /** true = 数值越低对玩家越有利（如班味） */
  lowerIsBetter?: boolean;
}

/** 显示顺序 */
export const PARALLEL_AXIS_ORDER: ParallelAxisKey[] = [
  'grit',
  'officeGrind',
  'backup',
  'resonance',
];

export const PARALLEL_AXIS_META: Record<ParallelAxisKey, ParallelAxisMeta> = {
  grit: {
    label: '硬气',
    hint: '敢关屏、敢晚回、敢说不——原世界腰杆有多硬。',
  },
  officeGrind: {
    label: '班味',
    hint: '老板、KPI、群聊催命叠出来的班味（越低越解脱）。',
    lowerIsBetter: true,
  },
  backup: {
    label: '后援',
    hint: '名册里兄弟/投影越多，那边越有底气。',
  },
  resonance: {
    label: '同频',
    hint: '异世界变强，原时间线能接收到多少。',
  },
};

/** @deprecated 仅调试/Skill；玩家 UI 用 describeParallelWorldShift */
export function formatParallelAxesLine(axes: ParallelWorldAxes): string {
  return PARALLEL_AXIS_ORDER.map((k) => {
    const m = PARALLEL_AXIS_META[k];
    return `${m.label} ${axes[k]}`;
  }).join(' · ');
}

function pressureBarForGrind(officeGrind: number): string {
  if (officeGrind >= 70) return '████████░░';
  if (officeGrind >= 45) return '█████░░░░░';
  return '███░░░░░░░';
}

function officeGrindQualitative(grind: number): string {
  if (grind >= 75) return '群聊红灯密得像呼吸灯，仍喘不过气';
  if (grind >= 55) return 'KPI 还压着，但偶尔能抬头换气';
  if (grind >= 35) return '压迫松了一扣，桌面没那么烫手';
  return '班味淡了，关电脑的借口多了起来';
}

/** 压迫块：条 + 人话，无百分数字 */
export function describeParallelPressure(axes: ParallelWorldAxes): string {
  const bar = pressureBarForGrind(axes.officeGrind);
  return `${bar} · ${officeGrindQualitative(axes.officeGrind)}`;
}

const CAREER_BEAT_SHIFT: Record<ParallelCareerBeat, string> = {
  endure: '原身还在「收到」和「。」之间来回。',
  micro_rebel: '免提敢关、消息敢晚半拍回。',
  boundary: '排期、请假、已读不回开始混用。',
  side_hustle: '副业试探冒头，工位更像中转站。',
  quit_or_boss: '离职或单干的窗口，在远处开了一条缝。',
};

function gritProse(grit: number): string {
  if (grit < 22) return '腰还弯着，关屏比关群聊难。';
  if (grit < 40) return '敢晚回消息，但还不肯跟老板顶一句。';
  if (grit < 58) return '边界话能说出口了，语气仍克制。';
  if (grit < 78) return '关屏与关群聊，终于能在同一天发生。';
  return '硬气写进习惯：准点下线不再像犯罪。';
}

function backupProse(backup: number): string {
  if (backup < 18) return '身后还冷清，像独自对齐会里硬撑。';
  if (backup < 38) return '名册渐厚，@ 不至于只打在你一个人头上。';
  if (backup < 58) return '投影够多，原身说话开始有人接腔。';
  return '战魂成排，连 HR 群发都要多想一秒。';
}

function resonanceProse(resonance: number): string {
  if (resonance < 28) return '裂隙反馈还弱，异世界的胜利像隔了毛玻璃。';
  if (resonance < 52) return '两边开始同频：你破阵，那边敢喘口气。';
  if (resonance < 72) return '劲道实打实叠到工位上，老板催命都慢半拍。';
  return '异世界每一步，原时间线都能听见回响。';
}

/** 同步块追加：四轴用人话，不出现轴名+数字 */
export function describeParallelWorldShift(
  axes: ParallelWorldAxes,
  careerBeat: ParallelCareerBeat,
): string {
  return [
    CAREER_BEAT_SHIFT[careerBeat],
    gritProse(axes.grit),
    backupProse(axes.backup),
    resonanceProse(axes.resonance),
  ].join('');
}

/** UI：压迫/同步一律从轴重算，并剥掉旧版「硬气 18 · …」数字尾巴 */
export function resolveParallelArcDisplay(report: ParallelArcReportSnapshot): {
  pressure: string;
  syncNote: string;
} {
  const pressure = describeParallelPressure(report.axes);
  const shift = describeParallelWorldShift(report.axes, report.careerBeat);
  const legacy = report.syncNote.search(/\s·\s*硬气\s+\d/);
  if (legacy >= 0) {
    return {
      pressure,
      syncNote: report.syncNote.slice(0, legacy).trim() + shift,
    };
  }
  return { pressure, syncNote: report.syncNote };
}
