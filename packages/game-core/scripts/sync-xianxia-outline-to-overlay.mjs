/**
 * outline 真源 → overlay 顶栏 worldSkinNames（仙侠卷一）
 * 节点正文由 detail Skill 维护；本脚本只同步名表 + 校验
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { storyGenQualityReport } from '../dist/narrative/validateNodeSkin.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const packDir = join(root, 'src/narrative/officialPacks');
const outlinePath = join(packDir, 'xianxia.volume1.outline.json');
const overlayPath = join(packDir, 'xianxia.overlay.json');

const outline = JSON.parse(readFileSync(outlinePath, 'utf8'));
const overlay = JSON.parse(readFileSync(overlayPath, 'utf8'));

overlay.worldSkinNames = outline.worldSkinNames;
writeFileSync(
  overlayPath,
  JSON.stringify({ worldSkinNames: overlay.worldSkinNames, nodes: overlay.nodes }, null, 2) + '\n',
);

const { errors, storyDialogueMissing } = storyGenQualityReport(overlay, 'xianxia');
console.log('synced worldSkinNames from outline');
console.log('errors:', errors.length ? errors : 'none');
console.log('story without dialogue:', storyDialogueMissing.length ? storyDialogueMissing : 'none');
process.exit(errors.length ? 1 : 0);
