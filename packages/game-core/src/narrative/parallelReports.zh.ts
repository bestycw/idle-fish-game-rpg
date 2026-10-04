/**
 * 平行原世界 · 章后简报（现代工位线 · 每章 3 档）
 */

import type { ParallelChapterId, ParallelTier } from '../shared/types.js';

export interface ParallelChapterReport {
  tierLabel: string;
  workstation: string;
  pressure: string;
  syncNote: string;
  nextHint: string;
}

/** @deprecated 弧末报告 · 现网用 parallelArcReports；章级表仅 ch1–ch6 满表 */
export const PARALLEL_CHAPTER_REPORTS: Partial<
  Record<ParallelChapterId, Record<ParallelTier, ParallelChapterReport>>
> = {
  ch1: {
    1: {
      tierLabel: '仍被拿捏',
      workstation: '你仍在工位。屏幕亮度被调成「奋斗模式」。',
      pressure: '老板压迫 · ████████░░ 82%',
      syncNote: '裂隙反馈微弱：原身只敢在备忘录里写「再忍忍」。',
      nextHint: '再推一章、多锚定几位投影，那边也许能第一次关免提。',
    },
    2: {
      tierLabel: '稍稍还手',
      workstation: '你仍在工位，但回消息的速度慢了半拍——像有人替你喘了口气。',
      pressure: '老板压迫 · ██████░░░░ 61%',
      syncNote: '同步指数上来：原身今天把「好的收到」改成了「收到，排期中」。',
      nextHint: '继续变强；ch2 后，群聊里可能出现第一次已读不回。',
    },
    3: {
      tierLabel: '原身硬气',
      workstation: '你仍在工位，却把显示器转了个角度——不再正对摄像头。',
      pressure: '老板压迫 · ████░░░░░░ 38%',
      syncNote: '名分与战力双高：原身下班点直接关屏，群聊里你的头像暗了。',
      nextHint: '别停；乱阵林那边还有东西要拿，同步才会叠层。',
    },
  },
  ch2: {
    1: {
      tierLabel: '仍被拿捏',
      workstation: '原身被拉进「临时对齐会」，会议号自动生成，无法拒绝。',
      pressure: '老板压迫 · ███████░░░ 78%',
      syncNote: '你这边刚破阵，那边还在对齐 KPI 口径。',
      nextHint: '多招几人上名册，锚点够了，会议里才有人替你说话（心理上）。',
    },
    2: {
      tierLabel: '稍稍还手',
      workstation: '原身会议中静音，摄像头盖了张便利贴：「网络调试」。',
      pressure: '老板压迫 · █████░░░░░ 52%',
      syncNote: '镜渊试炼的收获回填：原身第一次敢在会后不跟「收到」。',
      nextHint: 'ch3 远矢台通关后，压迫条有望再掉一截。',
    },
    3: {
      tierLabel: '原身硬气',
      workstation: '原身会议里打了句「我这边阻塞了」——然后真的去倒了杯水。',
      pressure: '老板压迫 · ███░░░░░░░ 31%',
      syncNote: '战力碾压档：裂隙把「破阵」的决断映射成原身的边界感。',
      nextHint: '后排压力还在原世界加班；你切后排的战术，会写成那边的「拒绝背锅」。',
    },
  },
  ch3: {
    1: {
      tierLabel: '仍被拿捏',
      workstation: '原身工位被加了第二块屏：「实时看板」。',
      pressure: '老板压迫 · ████████░░ 85%',
      syncNote: '箭雨没白挨——至少原身还分得清哪块屏更烦。',
      nextHint: '提战力穿透后排，同步会把「远程压力」翻译成「推掉无效会议」。',
    },
    2: {
      tierLabel: '稍稍还手',
      workstation: '原身把看板屏亮度调到最低，像给世界加了层雾。',
      pressure: '老板压迫 · ██████░░░░ 58%',
      syncNote: '名册渐满：原身开始用「在忙」挡飞书。',
      nextHint: 'ch4 磨合关后，原身可能对排期说「不保证」。',
    },
    3: {
      tierLabel: '原身硬气',
      workstation: '原身删了看板快捷方式。IT 工单：「误删」。',
      pressure: '老板压迫 · ████░░░░░░ 35%',
      syncNote: '远矢台通关 + 阵容成型：原身第一次准时关电脑。',
      nextHint: '劫火原在前方；原世界的「燃尽」和这边的速攻是同一枚硬币。',
    },
  },
  ch4: {
    1: {
      tierLabel: '仍被拿捏',
      workstation: '原身被塞了「小组长」虚衔，活多了，钱没变。',
      pressure: '老板压迫 · ███████░░░ 80%',
      syncNote: '你这边还在磨合阵，那边已在磨合锅。',
      nextHint: '换装试炼多刷几手，同步会转成「学会甩活」。',
    },
    2: {
      tierLabel: '稍稍还手',
      workstation: '原身把虚衔写进签名档：「不含 24h 响应」。',
      pressure: '老板压迫 · █████░░░░░ 55%',
      syncNote: '小比过关：原身开始对不合理需求回「需排期」。',
      nextHint: 'ch5 高压关，适合把同步推到「敢留语音不回文字」。',
    },
    3: {
      tierLabel: '原身硬气',
      workstation: '原身把小组长头衔退群公告了，老板私信未读。',
      pressure: '老板压迫 · ███░░░░░░░ 28%',
      syncNote: '阵法定型 + 战力进窗上沿：原身成了组里最难@的人。',
      nextHint: '劫火原会烧掉最后一层「随便加一下」。',
    },
  },
  ch5: {
    1: {
      tierLabel: '仍被拿捏',
      workstation: '原身连续 third 杯咖啡，心跳和消息提醒同频。',
      pressure: '老板压迫 · ████████░░ 88%',
      syncNote: '速攻再临你扛住了；原身还在扛周五。',
      nextHint: '再提一档输出，同步才能映射成「敢按时走」。',
    },
    2: {
      tierLabel: '稍稍还手',
      workstation: '原身咖啡换成 decaf，群聊状态：「专注模式」。',
      pressure: '老板压迫 · ██████░░░░ 60%',
      syncNote: '高压章过关：原身对「今晚能不能出」答「不能」。',
      nextHint: '镇守门在前；门后通常是原世界的「流程」二字。',
    },
    3: {
      tierLabel: '原身硬气',
      workstation: '原身准点提交「今日已完成」，然后——真的下线。',
      pressure: '老板压迫 · ████░░░░░░ 32%',
      syncNote: '劫火原碾压：裂隙把速胜写成原身的准点下班权。',
      nextHint: '终阵之后，评定会换一张「双线」结算脸。',
    },
  },
  ch6: {
    1: {
      tierLabel: '仍被拿捏',
      workstation: '原身还在。门开了条缝，风是凉的，脚没动。',
      pressure: '老板压迫 · ███████░░░ 75%',
      syncNote: '你推开了位面终阵；原身还在推心理建设。',
      nextHint: '补名册、提战力，让同步把「脚」也挪过去。',
    },
    2: {
      tierLabel: '稍稍还手',
      workstation: '原身请了半天假，理由：「身体同步维护」。HR 通过。',
      pressure: '老板压迫 · █████░░░░░ 48%',
      syncNote: '六章将尽：原身第一次把老板语音转文字后再回。',
      nextHint: '若冲 tier3，终局称号会落在 Hub。',
    },
    3: {
      tierLabel: '原身硬气',
      workstation: '原身工位空了。显示器贴条：「设备已归还 · 另谋发展（同步完成）」。',
      pressure: '老板压迫 · ██░░░░░░░░ 18%',
      syncNote: '双线打工人：位面镇守门倒了，原世界的那扇门也开了。',
      nextHint: 'V1 主线暂歇；裂隙仍营业，刷本继续回填（flavor 后置）。',
    },
  },
};

const FALLBACK_REPORT: ParallelChapterReport = {
  tierLabel: '同步中',
  workstation: '原身仍在工位，裂隙反馈照常。',
  pressure: '老板压迫 · ██████░░░░ 55%',
  syncNote: '本章弧简报请读 parallelArcReports。',
  nextHint: '继续推章，偶数章弧末有完整四段。',
};

export function getParallelChapterReport(
  chapterId: ParallelChapterId,
  tier: ParallelTier,
): ParallelChapterReport {
  const byChapter = PARALLEL_CHAPTER_REPORTS[chapterId];
  if (byChapter) {
    const row = byChapter[tier];
    if (row) return row;
  }
  return FALLBACK_REPORT;
}
