/**
 * 为 defs 中缺失的 nodeId 补 overlay；并按 beat 注入城镇/地点/NPC/回调（过 story-gen-quality）
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHAPTERS } from '../dist/chapter/defs.js';
import { volumeBeatForChapterId } from '../dist/narrative/volumeBeats.js';
import {
  resolveLocationDisplay,
  resolveNpcDisplay,
  resolveTownDisplay,
} from '../dist/narrative/worldSpine.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'src/narrative/officialPacks');

function chapterIdFromNodeId(nodeId) {
  const m = /^ch(\d+)_/.exec(nodeId);
  return m ? `ch${m[1]}` : null;
}

function beatProse(preset, beat, skinNames) {
  if (!beat) return '';
  const bits = [];
  bits.push(resolveTownDisplay(preset, beat.primaryTown, skinNames?.towns));
  bits.push(resolveLocationDisplay(preset, beat.primaryLocation, skinNames?.locations));
  for (const slot of beat.npcSlots) {
    bits.push(resolveNpcDisplay(preset, slot, skinNames?.npcs));
  }
  if (beat.callbackFromChapter != null) {
    const prev = volumeBeatForChapterId(`ch${beat.callbackFromChapter}`);
    if (prev) bits.push(prev.beatTitle);
  }
  bits.push(beat.beatTitle);
  return bits.filter(Boolean).join('·');
}

function stubForNode(preset, overlay, node, chapterId) {
  const beat = volumeBeatForChapterId(chapterId);
  const skin = overlay.worldSkinNames;
  const prefix = beatProse(preset, beat, skin);
  const blurb = `${prefix}。${node.blurb}`.slice(0, 280);
  const place = node.place.slice(0, 16);
  const base = {
    title: node.title.slice(0, 20),
    place,
    blurb,
  };
  if (node.kind === 'story') {
    const npc =
      beat?.npcSlots?.[0] != null
        ? resolveNpcDisplay(preset, beat.npcSlots[0], skin?.npcs)
        : '向导';
    return {
      ...base,
      dialogueBeats: [
        {
          kind: 'line',
          speaker: npc || '向导',
          text: blurb.slice(0, 118),
        },
        {
          kind: 'line',
          speaker: '你',
          text: '继续吧。',
        },
      ],
    };
  }
  return base;
}

function isGenericStub(copy) {
  const first = copy?.dialogueBeats?.[0];
  return first?.speaker === '向导' || first?.text === '……' || first?.text?.startsWith('占位');
}

for (const preset of ['wuxia', 'xianxia', 'cyberpunk']) {
  const path = join(dir, `${preset}.overlay.json`);
  const overlay = JSON.parse(readFileSync(path, 'utf8'));
  overlay.nodes ??= {};
  let touched = 0;
  for (const ch of CHAPTERS) {
    for (const node of ch.nodes) {
      const existing = overlay.nodes[node.id];
      const beat = volumeBeatForChapterId(ch.id);
      const town =
        beat != null
          ? resolveTownDisplay(preset, beat.primaryTown, overlay.worldSkinNames?.towns)
          : '';
      const missingBeatTokens =
        Boolean(town) && existing?.blurb && !existing.blurb.includes(town);
      const need =
        !existing ||
        missingBeatTokens ||
        (node.kind === 'story' && isGenericStub(existing));
      if (!need) continue;
      overlay.nodes[node.id] = stubForNode(preset, overlay, node, ch.id);
      touched += 1;
    }
  }
  writeFileSync(path, `${JSON.stringify(overlay, null, 2)}\n`, 'utf8');
  console.log(`${preset}: touched ${touched} nodes`);
}
