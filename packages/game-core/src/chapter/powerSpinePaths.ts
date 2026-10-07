/**
 * 双路径战力边界：主线-only vs 主线+猎装（粗算，用于校 CHAPTER_BANDS）。
 */
import { grantCharacterExp, tryLevelUp } from '../character/growth.js';
import { deployedPartyPower } from '../equipment/power.js';
import { DEFAULT_DEPLOYED_IDS, defaultFormation } from '../formation/formation.js';
import { grantStarterEquipmentKit } from '../equipment/starterKit.js';
import { createInitialPlayer } from '../save/player.js';
import type { PlayerState } from '../shared/types.js';
import { getChapterBand, powerGate, type PowerGateKind } from './bands.js';
import { estimateMainlineExpThroughChapter } from '../reward/battleExp.js';

export type SpinePathId = 'mainline_only' | 'mainline_plus_gear';

export interface SpinePathStep {
  chapterCleared: number;
  label: string;
  partyPower: number;
  gate: PowerGateKind;
  bandRecommended: number;
  bandFloor: number;
}

export interface SpinePathSimResult {
  pathId: SpinePathId;
  steps: SpinePathStep[];
  firstBelowFloorAt: number | null;
  firstCrushAt: number | null;
}

const GEAR_POWER_PER_CHAPTER = 380;

function levelUpAll(state: PlayerState, templateId: string): PlayerState {
  let s = state;
  for (let i = 0; i < 40; i += 1) {
    const r = tryLevelUp(s, templateId);
    if (!r.ok) break;
    s = r.state;
  }
  return s;
}

function grantExpWithLevelUps(state: PlayerState, templateId: string, amount: number): PlayerState {
  let s = grantCharacterExp(state, templateId, amount);
  return levelUpAll(s, templateId);
}

/** 猎装等效：折算为经验并升级（粗估，非真实掉落） */
function applyPathPowerBonus(state: PlayerState, bonus: number): PlayerState {
  if (bonus <= 0) return state;
  const perChar = Math.max(40, Math.floor(bonus / 4));
  let s = state;
  for (const id of DEFAULT_DEPLOYED_IDS) {
    s = grantExpWithLevelUps(s, id, perChar);
  }
  return s;
}

function simulateRosterExp(state: PlayerState, chaptersCleared: number): PlayerState {
  const total = estimateMainlineExpThroughChapter(chaptersCleared);
  let s = state;
  for (const id of DEFAULT_DEPLOYED_IDS) {
    s = grantExpWithLevelUps(s, id, total);
  }
  return s;
}

function powerForPath(
  pathId: SpinePathId,
  chaptersCleared: number,
): number {
  let s = grantStarterEquipmentKit(createInitialPlayer(42));
  s = { ...s, formation: defaultFormation(), chapterCleared: chaptersCleared };
  s = simulateRosterExp(s, chaptersCleared);
  if (pathId === 'mainline_plus_gear') {
    s = applyPathPowerBonus(s, GEAR_POWER_PER_CHAPTER * chaptersCleared);
  }
  return deployedPartyPower(s);
}

export function simulateSpinePath(pathId: SpinePathId, maxCleared = 9): SpinePathSimResult {
  const steps: SpinePathStep[] = [];
  let firstBelowFloorAt: number | null = null;
  let firstCrushAt: number | null = null;

  for (let cleared = 0; cleared <= maxCleared; cleared += 1) {
    const band = getChapterBand(cleared);
    const power = powerForPath(pathId, cleared);
    const gate = powerGate(power, band);
    if (gate === 'below_floor' && firstBelowFloorAt == null) {
      firstBelowFloorAt = cleared;
    }
    if (gate === 'crush' && firstCrushAt == null) {
      firstCrushAt = cleared;
    }
    steps.push({
      chapterCleared: cleared,
      label: cleared === 0 ? '开局' : `清${cleared}章后`,
      partyPower: power,
      gate,
      bandRecommended: band.recommendedPower,
      bandFloor: band.floorPower,
    });
  }

  return { pathId, steps, firstBelowFloorAt, firstCrushAt };
}

export function formatSpinePathReport(): string {
  const lines: string[] = ['=== 战力脊柱 · 双路径边界（粗算）===', ''];
  for (const id of ['mainline_only', 'mainline_plus_gear'] as SpinePathId[]) {
    const r = simulateSpinePath(id);
    lines.push(`【${id === 'mainline_only' ? '下限·偏主线' : '标准·主线+猎装'}】`);
    lines.push(
      `  首次低于 floor：${r.firstBelowFloorAt == null ? '无（卷内）' : `chapterCleared=${r.firstBelowFloorAt}`}`,
    );
    lines.push(
      `  首次进入 crush：${r.firstCrushAt == null ? '无' : `chapterCleared=${r.firstCrushAt}`}`,
    );
    for (const s of r.steps.slice(0, 6)) {
      lines.push(
        `  ${s.label}  战力${s.partyPower}  gate=${s.gate}  floor${s.bandFloor}/rec${s.bandRecommended}`,
      );
    }
    lines.push('');
  }
  lines.push(`猎装路径假设：每清一章额外 +${GEAR_POWER_PER_CHAPTER} 等效战力（经验折算粗估）`);
  return lines.join('\n');
}
