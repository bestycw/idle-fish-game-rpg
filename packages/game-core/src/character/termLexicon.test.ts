import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  firstTermIdIn,
  getTerm,
  splitByTermNames,
  takeLocalNote,
  TERM_FAMILY_LABELS,
  TERM_LEXICON,
  termIdByName,
  termsInFamily,
} from './termLexicon.js';

describe('term lexicon', () => {
  it('has unique ids and names', () => {
    const ids = new Set(TERM_LEXICON.map((e) => e.id));
    const names = new Set(TERM_LEXICON.map((e) => e.name));
    assert.equal(ids.size, TERM_LEXICON.length);
    assert.equal(names.size, TERM_LEXICON.length);
    for (const family of Object.keys(TERM_FAMILY_LABELS)) {
      assert.ok(termsInFamily(family as keyof typeof TERM_FAMILY_LABELS).length >= 2);
    }
  });

  it('splits 流血 and 猎印 out of a skill line', () => {
    const spans = splitByTermNames('附加流血2层4回（每回生命上限6%） · 70%附加猎印3回（承伤×115%）');
    const terms = spans.filter((s) => s.kind === 'term');
    assert.deepEqual(
      terms.map((s) => s.kind === 'term' && s.id),
      ['bleed', 'mark_prey'],
    );
    assert.equal(getTerm('bleed')?.family, 'setup');
  });

  it('looks up exact names and the first term in a line', () => {
    assert.equal(termIdByName('暴击'), 'crit');
    assert.equal(firstTermIdIn('附加流血2层4回（每回生命上限6%）'), 'bleed');
  });

  it('splits 暴击 without eating 暴伤', () => {
    const spans = splitByTermNames('主属性+3% · 暴击约+9% · 暴伤约+7%');
    const terms = spans.filter((s) => s.kind === 'term');
    assert.deepEqual(
      terms.map((s) => (s.kind === 'term' ? s.id : '')),
      ['main_stat', 'crit', 'crit_dmg'],
    );
  });

  it('covers skill-page verbs used in live copy', () => {
    for (const name of ['净化', '驱散', '招魂', '队友结界', '先声增伤', '合围', '格挡', '涅槃', '灌气']) {
      assert.ok(termIdByName(name), `missing term ${name}`);
    }
  });

  it('player glosses explain the effect, not production notes', () => {
    const surround = getTerm('surround')!;
    assert.match(surround.blurb, /相邻/);
    assert.doesNotMatch(surround.blurb, /更疼|注疏|写在词后面|缺省|通常|本卡/);
    const qi = getTerm('ally_qi')!;
    assert.match(qi.blurb, /灌/);
    assert.doesNotMatch(qi.blurb, /写在词后面|注疏|如 \+14|不是百分比|本卡|命中率/);
    for (const id of ['execute', 'vs_shield', 'first_cast', 'vs_rank', 'vs_cc', 'heal_low']) {
      const row = getTerm(id)!;
      assert.doesNotMatch(row.blurb, /更疼|抬得更多|技能养成|写在词后面|注疏|通常|本卡/, id);
      assert.match(row.blurb, /提高|加量/, id);
    }
  });

  it('takes 本卡 note after a term, keeping parens intact', () => {
    assert.equal(takeLocalNote(' ×1.2 · 加持 2回'), '×1.2');
    assert.equal(takeLocalNote(' 2回（行动权重×75%）'), '2回（行动权重×75%）');
    assert.equal(
      takeLocalNote(' （生命≤40% · 治疗×1.22） · 灌气 +56'),
      '（生命≤40% · 治疗×1.22）',
    );
  });
});
