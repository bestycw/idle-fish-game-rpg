/**
 * 生成 official overlay JSON（Skill 接入前的工程默认）
 * Skill 就绪后：用 story-gen 重新生成并覆盖同路径，再跑 validate。
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInitialPlayer } from '../dist/save/player.js';
import { buildOfficialOverlayFromBaseline } from '../dist/narrative/officialOverlay.js';
import { overlayPassesValidation } from '../dist/narrative/validateNodeSkin.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src/narrative/officialPacks');

mkdirSync(outDir, { recursive: true });

for (const preset of ['wuxia', 'xianxia', 'cyberpunk']) {
  let p = createInitialPlayer();
  p = {
    ...p,
    narrative: { phase: 'mainline', worldPreset: preset, heroName: '旅人', volumeId: 'vol1' },
  };
  const overlay = buildOfficialOverlayFromBaseline(p);
  if (!overlayPassesValidation(overlay, preset)) {
    console.warn(`[warn] ${preset} overlay 未通过 beat 校验，仍写入（请 Skill 重生成）`);
  }
  const path = join(outDir, `${preset}.overlay.json`);
  writeFileSync(path, JSON.stringify(overlay, null, 2), 'utf8');
  console.log(`wrote ${path} (${Object.keys(overlay.nodes).length} nodes)`);
}
