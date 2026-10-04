/**
 * Quest overlay 壳校验 · 引擎未接时仅保证 JSON 与基础约束
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MAX_TITLE = 16;
const MAX_LOGLINE = 40;
const MAX_BLURB = 280;
const MAX_LINE = 120;
const MAX_BEATS = 8;

function validateQuestFile(preset) {
  const path = join(root, 'src/narrative/officialPacks', `${preset}.quests.overlay.json`);
  const errors = [];
  let data;
  try {
    data = JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    return [`${preset}: invalid JSON — ${e.message}`];
  }
  if (data.schemaVersion !== 1) errors.push(`${preset}: schemaVersion must be 1`);
  if (data.preset !== preset) errors.push(`${preset}: preset mismatch`);
  if (!data.quests || typeof data.quests !== 'object') errors.push(`${preset}: missing quests object`);
  if (!Array.isArray(data.questIdRegistry)) errors.push(`${preset}: questIdRegistry must be array`);

  const registryIds = new Set((data.questIdRegistry ?? []).map((r) => r.questId));
  const questIds = Object.keys(data.quests ?? {});

  for (const id of questIds) {
    if (!registryIds.has(id)) {
      errors.push(`${id}: in quests but not in questIdRegistry`);
    }
    const q = data.quests[id];
    if (q.title && q.title.length > MAX_TITLE) errors.push(`${id}: title > ${MAX_TITLE}`);
    if (q.logline && q.logline.length > MAX_LOGLINE) errors.push(`${id}: logline > ${MAX_LOGLINE}`);
    for (const field of ['acceptBlurb', 'completeBlurb', 'discoverBlurb']) {
      if (q[field] && q[field].length > MAX_BLURB) errors.push(`${id}: ${field} > ${MAX_BLURB}`);
    }
    for (const beatKey of ['acceptBeats', 'completeBeats']) {
      const beats = q[beatKey];
      if (!beats) continue;
      if (beats.length > MAX_BEATS) errors.push(`${id}: ${beatKey} > ${MAX_BEATS}`);
      for (let i = 0; i < beats.length; i++) {
        const b = beats[i];
        if (b.kind === 'line') {
          if (!b.text || b.text.length > MAX_LINE) errors.push(`${id}: ${beatKey}[${i}] line invalid`);
        } else if (b.kind === 'choice') {
          if (!b.options || b.options.length < 2 || b.options.length > 3) {
            errors.push(`${id}: ${beatKey}[${i}] choice options 2–3`);
          }
        }
      }
    }
    if (q.kind === 'hidden' && !q.discover && !q.discoverBlurb) {
      errors.push(`${id}: hidden requires discover or discoverBlurb`);
    }
  }

  for (const r of data.questIdRegistry ?? []) {
    if (!data.quests[r.questId]) errors.push(`${r.questId}: in registry but missing quests entry`);
  }

  return errors;
}

let exit = 0;
for (const preset of ['wuxia', 'xianxia', 'cyberpunk']) {
  const errors = validateQuestFile(preset);
  console.log(`\n=== ${preset} quests ===`);
  console.log('errors:', errors.length ? errors : 'none');
  if (errors.length) exit = 1;
}
process.exit(exit);
