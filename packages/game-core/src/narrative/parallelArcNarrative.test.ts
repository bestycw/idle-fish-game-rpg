import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { composeParallelArcBrief } from './parallelArcNarrative.zh.js';

const baseAxes = {
  grit: 30,
  officeGrind: 55,
  backup: 25,
  resonance: 35,
};

function snapshot(
  arcId: 'arc1' | 'arc2',
  axes: typeof baseAxes,
  tier: 1 | 2 | 3 = 2,
) {
  return {
    arcId,
    tier,
    axes,
    careerBeat: 'micro_rebel' as const,
    skinStatus: 'ready' as const,
    generatedAt: 0,
    workstation: '',
    pressure: '',
    syncNote: '',
    nextHint: '',
  };
}

describe('composeParallelArcBrief', () => {
  it('arc1 展示基线对照文案', () => {
    const brief = composeParallelArcBrief(snapshot('arc1', baseAxes));
    assert.ok(brief.deltaFromPrev?.body.includes('裂隙') || brief.deltaFromPrev?.body.includes('信道'));
    assert.ok(brief.lifeLeisure.body.length > 20);
    assert.ok(brief.workCareer.body.length > 30);
  });

  it('arc2 相对 arc1 轴差生成对比句', () => {
    const prev = snapshot('arc1', baseAxes, 1);
    const curr = snapshot(
      'arc2',
      { grit: 48, officeGrind: 40, backup: 40, resonance: 50 },
      2,
    );
    const brief = composeParallelArcBrief(curr, '测试', prev);
    assert.ok((brief.deltaFromPrev?.body.length ?? 0) > 8);
    assert.ok(brief.impulses.some((t) => t.trend === 'up'));
    assert.equal(brief.pages.length, 5);
  });

  it('同种子择句稳定', () => {
    const r = snapshot('arc1', baseAxes, 2);
    r.generatedAt = 42;
    const a = composeParallelArcBrief(r);
    const b = composeParallelArcBrief(r);
    assert.equal(a.lifeLeisure.body, b.lifeLeisure.body);
  });
});
