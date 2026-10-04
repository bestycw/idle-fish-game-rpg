import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createInitialPlayer } from '../save/player.js';
import { listReachableTownHubs, listTownHubNpcs } from './townHub.js';

describe('townHub', () => {
  it('ch0 外郭有接引与货郎壳', () => {
    const p = createInitialPlayer();
    const npcs = listTownHubNpcs(p, 'town_outer');
    assert.ok(npcs.some((n) => n.kind === 'story'));
    assert.ok(npcs.some((n) => n.kind === 'merchant' && n.merchantShell?.locked));
  });

  it('cleared3 中陆商棚出现', () => {
    let p = createInitialPlayer();
    p = { ...p, chapterCleared: 3 };
    const npcs = listTownHubNpcs(p, 'town_midland');
    assert.ok(npcs.some((n) => n.id === 'midland_merchant'));
  });
});
