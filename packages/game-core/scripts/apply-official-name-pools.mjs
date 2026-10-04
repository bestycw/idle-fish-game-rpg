/**
 * 将 official 名池（城镇/地点/人名）同步进三份 overlay，并替换旧称谓文案
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHAPTERS } from '../dist/chapter/defs.js';
import {
  LEGACY_NPC_LABELS,
  OFFICIAL_NAME_PICK,
  officialWorldSkinNames,
} from '../dist/narrative/officialNamePools.zh.js';
import { volumeBeatForChapterId } from '../dist/narrative/volumeBeats.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'src/narrative/officialPacks');

const LEGACY_LOC_REPLACE = {
  wuxia: [
    ['青石关', '西郊青石关'],
    ['关外营', '关外营盘'],
  ],
  xianxia: [['界域关', '界域关隘']],
  cyberpunk: [],
};

function replaceAll(text, pairs) {
  let out = text;
  for (const [from, to] of pairs) {
    out = out.split(from).join(to);
  }
  return out;
}

function patchNodeCopy(copy, preset, chapterId, skin) {
  const beat = volumeBeatForChapterId(chapterId);
  if (!beat) return copy;
  const town = skin.towns[beat.primaryTown];
  const loc = skin.locations[beat.primaryLocation];
  const next = { ...copy };
  next.place = loc.slice(0, 16);

  const npcPairs = Object.entries(LEGACY_NPC_LABELS[preset]).map(([slot, legacy]) => [
    legacy,
    skin.npcs[slot],
  ]);

  const locPairs = LEGACY_LOC_REPLACE[preset] ?? [];

  const patchText = (s) => replaceAll(replaceAll(s, npcPairs), locPairs);

  if (next.blurb) {
    let blurb = patchText(next.blurb);
    if (town && !blurb.includes(town)) {
      const lead = `${town}一带，`;
      blurb = lead + blurb;
    }
    if (blurb.length > 280) blurb = blurb.slice(0, 279) + '…';
    next.blurb = blurb;
  }

  if (next.dialogue) {
    next.dialogue = next.dialogue.map((line) => ({
      speaker: patchText(line.speaker),
      text: patchText(line.text),
    }));
  }

  if (next.title) next.title = patchText(next.title);

  return next;
}

for (const preset of ['wuxia', 'xianxia', 'cyberpunk']) {
  const path = join(dir, `${preset}.overlay.json`);
  const overlay = JSON.parse(readFileSync(path, 'utf8'));
  const pick = OFFICIAL_NAME_PICK[preset];
  overlay.worldSkinNames = officialWorldSkinNames(preset);

  const nodes = {};
  for (const ch of CHAPTERS) {
    for (const n of ch.nodes) {
      const raw = overlay.nodes[n.id];
      if (!raw) continue;
      nodes[n.id] = patchNodeCopy(raw, preset, ch.id, pick);
    }
  }
  overlay.nodes = nodes;
  writeFileSync(path, JSON.stringify({ worldSkinNames: overlay.worldSkinNames, nodes }, null, 2) + '\n');
  console.log('patched', preset);
}
