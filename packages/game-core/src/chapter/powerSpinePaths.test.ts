import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { simulateSpinePath } from './powerSpinePaths.js';

describe('powerSpinePaths', () => {
  it('mainline-only should not crush at chapter 0', () => {
    const r = simulateSpinePath('mainline_only');
    const start = r.steps[0]!;
    assert.notEqual(start.gate, 'crush');
  });

  it('gear path reaches crush before mainline-only', () => {
    const a = simulateSpinePath('mainline_only');
    const b = simulateSpinePath('mainline_plus_gear');
    const crushA = a.firstCrushAt ?? 99;
    const crushB = b.firstCrushAt ?? 99;
    assert.ok(crushB <= crushA);
  });
});
