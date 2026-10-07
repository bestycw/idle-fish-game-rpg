#!/usr/bin/env node
/**
 * 战力脊柱校验：章里程碑、猎装解锁与建议战力、首领威胁读数。
 *   npm run power-spine-check
 */
import { loadOrCreatePlayer } from '../dist/save/player.js';
import { deployedPartyPower } from '../dist/equipment/power.js';
import { GEAR_DUNGEON_DEFS } from '../dist/dungeon/gearDungeons.js';
import {
  PLAYER_MILESTONES,
  gearDungeonCombatReadout,
  storyCombatScaleBrief,
} from '../dist/chapter/powerSpine.js';

const memAdapter = {
  load: () => null,
  save() {},
  clear() {},
};
const starterState = loadOrCreatePlayer(memAdapter);
const starter = deployedPartyPower(starterState);

console.log('=== 玩家里程碑（章初 / 章末目标）===');
for (const m of PLAYER_MILESTONES) {
  console.log(
    `第${m.chapterOrder}章  进章 ${m.powerEnterLow}～${m.powerEnterTarget}  清章 ${m.powerClearMin}～${m.powerClearTarget}（碾 ${m.powerClearStretch}）`,
  );
}
console.log(`开局实测战力: ${starter}\n`);

console.log('=== 剧情刻度（章序 → 压迫档）===');
for (let o = 1; o <= 10; o += 1) {
  const b = storyCombatScaleBrief(o);
  console.log(`ch${o}  tier=${b.narrativePressureTier}  ${b.combatScaleLabel}  enemyMult=${b.enemyMultAtChapter}`);
}

console.log('\n=== 猎装本（解锁章 / 建议战力 / 首领威胁）===');
for (const def of GEAR_DUNGEON_DEFS) {
  const ro = gearDungeonCombatReadout(def.id, 5);
  if (!ro) continue;
  const warn =
    ro.playerTargetAtUnlock < ro.unlockBand.recommendedPower * 0.85
      ? ' ⚠ 解锁建议偏低'
      : '';
  console.log(
    `${def.id} [${def.tier}] unlock@${ro.unlockAtChapterCleared}  解锁建议${ro.playerTargetAtUnlock}  现进度(清5)建议${gearDungeonCombatReadout(def.id, 5)?.playerTargetNow}  威胁≈${ro.bossThreatNow ?? '—'}${warn}`,
  );
}

console.log('\n（威胁值为 encounterThreatSum × pressure 粗算，仅作表间对齐参考）');
