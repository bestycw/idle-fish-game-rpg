/**
 * Story Gen 质量报告 · 三份 official overlay
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { storyGenQualityReport } from '../dist/narrative/validateNodeSkin.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dir = join(root, 'src/narrative/officialPacks');

let exit = 0;
for (const preset of ['wuxia', 'xianxia', 'cyberpunk']) {
  const path = join(dir, `${preset}.overlay.json`);
  const overlay = JSON.parse(readFileSync(path, 'utf8'));
  const { errors, storyDialogueMissing } = storyGenQualityReport(overlay, preset);
  console.log(`\n=== ${preset} ===`);
  console.log('errors:', errors.length ? errors : 'none');
  console.log(
    'story without dialogue:',
    storyDialogueMissing.length ? storyDialogueMissing : 'none',
  );
  if (errors.length) exit = 1;
}
process.exit(exit);
