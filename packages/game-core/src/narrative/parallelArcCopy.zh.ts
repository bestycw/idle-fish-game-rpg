/**
 * 平行原世界 · 弧末简报文案（arc × tier 固定表 · 运行时注入轴/称呼/章 beat）
 */

import type { ParallelArcId, ParallelTier } from '../shared/types.js';

export const PARALLEL_TIER_LABEL: Record<ParallelTier, string> = {
  1: '仍被拿捏',
  2: '稍稍还手',
  3: '原身硬气',
};

export interface ParallelArcCopyBlock {
  workstation: string;
  syncNote: string;
  nextHint: string;
}

/** 弧末四块之三（pressure 由引擎按班味轴拼条） */
export const PARALLEL_ARC_COPY: Record<
  ParallelArcId,
  Record<ParallelTier, ParallelArcCopyBlock>
> = {
  arc1: {
    1: {
      workstation:
        '{{heroName}} 仍在工位。异世界刚走过「{{beatTitle}}」，这边被拉进临时对齐会，会议号自动生成。',
      syncNote: '同步偏弱：你破了阵，原身还在对齐 KPI 口径。',
      nextHint: '多招几人上名册，再通两章，班压才肯掉一截。',
    },
    2: {
      workstation:
        '{{heroName}} 会议里静音，摄像头贴了便利贴：「网络调试」。裂隙把迷瘴林的阵脚，映成晚半拍回消息。',
      syncNote: '「{{beatTitle}}」过关：原身第一次敢在会后不跟「收到」。',
      nextHint: '继续推章、提战力，试剑台的远锋会写成那边的边界感。',
    },
    3: {
      workstation:
        '{{heroName}} 会议里打了句「我这边阻塞了」——然后真的去倒了杯水。席次之争在异世界，关屏权在原世界。',
      syncNote: '碾压档：「{{beatTitle}}」的决断，映射成原身敢留语音不回文字。',
      nextHint: '灵墟坊在前；后排压力会翻译成「推掉无效会议」。',
    },
  },
  arc2: {
    1: {
      workstation:
        '{{heroName}} 被塞了「小组长」虚衔，活多了，钱没变。异世界在灵石营整备，这边在整锅。',
      syncNote: '同步一般：名册还不够厚，原身仍接所有@。',
      nextHint: '换装、刷猎装；「{{beatTitle}}」稳了，同步会转成学会甩活。',
    },
    2: {
      workstation:
        '{{heroName}} 把虚衔写进签名档：「不含 24h 响应」。异世界名册投影亮起，这边开始对不合理需求回「需排期」。',
      syncNote: '「{{beatTitle}}」过关：小比式磨合换来原身一句排期。',
      nextHint: '天阙城劫灰原在前；高压会烧掉最后一层「随便加一下」。',
    },
    3: {
      workstation:
        '{{heroName}} 把小组长头衔从群公告里撤了，老板私信未读。阵法定型，工位上最难@的人出现了。',
      syncNote: '战力与名册进窗：「{{beatTitle}}」验完的构筑，变成原身最难拿捏的档期。',
      nextHint: '再通两章，看你在高压里阵脚会不会散。',
    },
  },
  arc3: {
    1: {
      workstation:
        '{{heroName}} 仍在工位。异世界到了「{{beatTitle}}」，望劫亭风很硬，这边风是空调直吹后颈。',
      syncNote: '同步刚抬头：你撑过劫灰原，原身还在扛周五。',
      nextHint: '再提一档输出，映射成「敢按时走」还要等半卷。',
    },
    2: {
      workstation:
        '{{heroName}} 咖啡换成 decaf，群聊状态：「专注模式」。半程歇脚写在异世界，这边第一次对「今晚能不能出」答「不能」。',
      syncNote: '「{{beatTitle}}」落定：原身把老板语音转文字后再回。',
      nextHint: '二重天阙将开；旧法不够时，别在原世界硬撑加班。',
    },
    3: {
      workstation:
        '{{heroName}} 准点提交「今日已完成」，然后真的下线。卷途尚半，但原身已经敢关显示器。',
      syncNote: '高压段碾压：异世界守心二字，写成原身准点下班权。',
      nextHint: '开门、暗线在后头；同步会继续叠，别在亭前耗干力气。',
    },
  },
  arc4: {
    1: {
      workstation:
        '{{heroName}} 工位多了一块屏：「合规提醒」。异世界「{{beatTitle}}」里影子比剑多，这边消息比活多。',
      syncNote: '同步受阻：心诀来路不明，原身也只敢把疑问写在备忘录。',
      nextHint: '阵脚稳了，原身才配在群聊里少回一个「好的」。',
    },
    2: {
      workstation:
        '{{heroName}} 把合规屏亮度调到最低。秘径里试心镜，这边试的是「已读不回会不会被记过」。',
      syncNote: '「{{beatTitle}}」过关：疑线暂存，原身开始对甩锅说「不在我排期」。',
      nextHint: '传功殿集结在前；不齐不出殿，工位也要齐心态。',
    },
    3: {
      workstation:
        '{{heroName}} 删了合规快捷方式，工单理由：「误触」。异世界不揭底，原世界先揭「无效加班」。',
      syncNote: 'tier 高：暗线没乱你的阵，原身第一次准时关电脑。',
      nextHint: '劫域门在望；卷末会把双线收成一句称号。',
    },
  },
  arc5: {
    1: {
      workstation:
        '{{heroName}} 还在工位，但裂隙常亮。异世界「{{beatTitle}}」门前，这边群聊仍@不停。',
      syncNote: '卷一将终而同步未满：破门在即，原身还在回「收到」。',
      nextHint: '守门战前再整阵；名册与战力会写成最后的底气。',
    },
    2: {
      workstation:
        '{{heroName}} 请了半天假，理由填：「异世界同步维护」。HR 通过，老板表情未通过。',
      syncNote: '「{{beatTitle}}」集结后：原身敢把集结当成不加班的借口。',
      nextHint: '卷终一战；胜了，工位线也会收束一档。',
    },
    3: {
      workstation:
        '{{heroName}} 工位空了。显示器贴条：「设备已归还 · 另谋发展（同步完成）」。卷一破门，原世界那扇门也开了缝。',
      syncNote: '双线打工人：位面劫域门与工位离职函，同一枚硬币的两面。',
      nextHint: '卷一暂歇；猎装、塔仍可精进，工位线下一卷再续。',
    },
  },
};

export function parallelArcBeatTitle(arcId: ParallelArcId): string {
  const n = Number(arcId.replace('arc', ''));
  const order = n * 2;
  const titles: Record<number, string> = {
    2: '初规',
    4: '整备',
    6: '半程',
    8: '暗线',
    10: '卷终',
  };
  return titles[order] ?? '异世界';
}

export function getParallelArcCopyBlock(
  arcId: ParallelArcId,
  tier: ParallelTier,
): ParallelArcCopyBlock {
  return PARALLEL_ARC_COPY[arcId][tier];
}
