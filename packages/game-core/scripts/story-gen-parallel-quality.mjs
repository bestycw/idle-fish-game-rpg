#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const path = join(root, 'src/narrative/officialPacks/xianxia.parallel.overlay.json');
const BANDS = ['low', 'mid', 'high'];
const FORBIDDEN = /下一弧|本弧|弧末|回响/;

let errors = 0;
const data = JSON.parse(readFileSync(path, 'utf8'));
if (data.schemaVersion !== 1) {
  console.error('schemaVersion must be 1');
  errors++;
}
for (const [arcId, seg] of Object.entries(data.segments ?? {})) {
  const life = seg?.life;
  if (!life) continue;
  for (const b of BANDS) {
    const t = life[b];
    if (!t) continue;
    if (t.length < 20 || t.length > 200) {
      console.error(`${arcId}.life.${b}: length ${t.length}`);
      errors++;
    }
    if (FORBIDDEN.test(t)) {
      console.error(`${arcId}.life.${b}: forbidden 弧/回响 wording`);
      errors++;
    }
    if (!t.includes('{{heroName}}') && !/你|原世界|家|周末|群/.test(t)) {
      console.error(`${arcId}.life.${b}: need heroName or life anchor`);
      errors++;
    }
  }
}
if (errors) process.exit(1);
console.log('parallel overlay OK');
