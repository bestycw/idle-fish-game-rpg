/**
 * 第二章碰壁：引导去已解锁的第一本猎装（通关 ch1 开启的 gear_break_wall）。
 * 不新开本；只弹对话 + CTA。
 */
import type { PlayerState } from '../shared/types.js';
import { isContentUnlocked } from './progress.js';

export type Ch2GearGuideBeat = {
  speaker: string;
  text: string;
};

export function ch2GearGuideDialogueBeats(): Ch2GearGuideBeat[] {
  return [
    {
      speaker: '系统',
      text: '又撞墙了？第二章可不吃「只靠抽卡」这一套。',
    },
    {
      speaker: '你',
      text: '……第一章那套不够用了？',
    },
    {
      speaker: '系统',
      text: '人补齐了，装还没跟上。历练里有猎装试炼——对症刷器纹，比干刚主线省事。',
    },
    {
      speaker: '系统',
      text: '第一本盾鸣廊通关第一章就开了。去刷两件破甲，再回来打主线。',
    },
  ];
}

export type Ch2GearGuideResult = {
  state: PlayerState;
  showDialogue: boolean;
};

/** 第二章（已通 ch1）主线首次战败：挂起猎装引导对话 */
export function applyCh2GearGuideOnDefeat(state: PlayerState): Ch2GearGuideResult {
  if ((state.chapterCleared ?? 0) !== 1) {
    return { state, showDialogue: false };
  }
  if (state.tutorialFlags?.ch2GearGuideSeen || state.tutorialFlags?.ch2GearGuidePending) {
    return { state, showDialogue: false };
  }
  // 第一章猎装应已开；未开则也不弹（避免空指）
  if (!isContentUnlocked(state, 'dungeon', 'gear_break_wall')) {
    return { state, showDialogue: false };
  }
  return {
    state: {
      ...state,
      tutorialFlags: {
        ...state.tutorialFlags,
        ch2GearGuidePending: true,
      },
    },
    showDialogue: true,
  };
}

export function markCh2GearGuideSeen(state: PlayerState): PlayerState {
  return {
    ...state,
    tutorialFlags: {
      ...state.tutorialFlags,
      ch2GearGuidePending: false,
      ch2GearGuideSeen: true,
    },
  };
}
